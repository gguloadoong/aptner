// ============================================================
// [P1-02] 거래량 급등 단지 서비스
// 실 API: hot-ranking.service.ts와 동일한 MOLIT API 데이터를 활용.
// 좌표는 sggCd → SIGUNGU_TABLE 바운딩박스 중심값으로 계산.
// API 실패 시 HOT_TRADE_BASE Mock fallback.
// 캐시 TTL: 30분
// ============================================================
import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { HotTradeApartment, MolitApiResponse, MolitTradeItem } from '../types';
import { cacheService } from './cache.service';
import { SIGUNGU_TABLE } from '../constants/region.constants';

const HOT_TRADE_TTL = 60 * 30; // 30분

// 국토부 실거래가 API — Cloudflare Workers 프록시 경유 (MOLIT_PROXY_URL 환경변수 우선)
const MOLIT_API_BASE_URL = process.env.MOLIT_PROXY_URL ?? 'https://molit-proxy.bomzip.workers.dev/trade';
const API_TIMEOUT = 10_000;

// 전국 주요 시군구 코드 (서울 주요 구 + 경기 주요 시)
const HOT_TRADE_SIGUNGU_CODES = [
  '11680', '11710', '11650', '11590', '11440', '11170', // 강남구, 송파구, 서초구, 동작구, 마포구, 용산구
  '11740', '11200', '11350', '11500',                   // 강동구, 성동구, 노원구, 강서구
  '41135', '41281', '41460', '41390', '41363',          // 성남 분당구, 고양 덕양구, 화성, 파주, 용인 기흥구
  '26350', '26260',                                      // 부산 해운대구, 동래구
];

// ============================================================
// Fallback Mock 기준 데이터 (API 실패 시 사용)
// ============================================================
interface HotTradeBaseData {
  aptCode: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  basePrice: number;
  priceChange: number;
}

const HOT_TRADE_BASE: HotTradeBaseData[] = [
  { aptCode: 'APT001', name: '래미안 원베일리',       address: '서울 서초구 반포동',     lat: 37.5068, lng: 127.0053, basePrice: 280000, priceChange:  15000 },
  { aptCode: 'APT002', name: '아크로리버파크',         address: '서울 서초구 반포동',     lat: 37.5075, lng: 126.9994, basePrice: 310000, priceChange:   8000 },
  { aptCode: 'APT003', name: '헬리오시티',             address: '서울 송파구 가락동',     lat: 37.4918, lng: 127.1239, basePrice: 145000, priceChange:   5000 },
  { aptCode: 'APT004', name: '은마아파트',             address: '서울 강남구 대치동',     lat: 37.4983, lng: 127.0622, basePrice: 180000, priceChange:  -2000 },
  { aptCode: 'APT005', name: '올림픽파크포레온',       address: '서울 강동구 둔촌동',     lat: 37.5211, lng: 127.1366, basePrice: 135000, priceChange:   7000 },
  { aptCode: 'APT006', name: '래미안 대치팰리스',      address: '서울 강남구 대치동',     lat: 37.4977, lng: 127.0631, basePrice: 220000, priceChange:   9000 },
  { aptCode: 'APT007', name: '도곡렉슬',               address: '서울 강남구 도곡동',     lat: 37.4847, lng: 127.0468, basePrice: 195000, priceChange:   5500 },
  { aptCode: 'APT008', name: '잠실주공5단지',          address: '서울 송파구 잠실동',     lat: 37.5109, lng: 127.0867, basePrice: 230000, priceChange:  12000 },
  { aptCode: 'APT009', name: '마포래미안푸르지오',     address: '서울 마포구 아현동',     lat: 37.5494, lng: 126.9541, basePrice: 115000, priceChange:   3000 },
  { aptCode: 'APT010', name: '래미안 첼리투스',        address: '서울 용산구 이촌동',     lat: 37.5225, lng: 126.9685, basePrice: 260000, priceChange:  11000 },
];

// ============================================================
// 유틸 함수
// ============================================================

/**
 * 날짜 기반 단순 시드 생성기 (Mock fallback 전용).
 */
function seededRandom(seed: number): () => number {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.floor(
    (now.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000),
  );
  let s = now.getFullYear() * 100 + weekNumber + seed * 997;

  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

/**
 * YYYYMM 형식의 년월 문자열을 반환합니다.
 */
function getYearMonth(offset: number = 0): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}${month}`;
}

/**
 * sggCd로 SIGUNGU_TABLE에서 바운딩박스 중심 좌표를 반환합니다.
 * 매핑되지 않는 코드는 null 반환.
 */
function getSigunguCenter(sggCd: string): { lat: number; lng: number } | null {
  const info = SIGUNGU_TABLE.find((sg) => sg.code === sggCd);
  if (!info) return null;
  return {
    lat: (info.swLat + info.neLat) / 2,
    lng: (info.swLng + info.neLng) / 2,
  };
}

// ============================================================
// MOLIT API 호출
// ============================================================

interface RawItem {
  aptNm: string;
  sggCd: string;
  umdNm: string;
  dealAmount: number; // 만원
  dealYear: number;
  dealMonth: number;
  dealDay: number;
}

/**
 * 국토부 실거래가 API에서 특정 시군구·년월 데이터를 조회합니다.
 */
async function fetchMolitForHotTrade(
  apiKey: string,
  lawdCd: string,
  dealYmd: string,
): Promise<RawItem[]> {
  const params = {
    serviceKey: apiKey,
    LAWD_CD: lawdCd,
    DEAL_YMD: dealYmd,
    pageNo: '1',
    numOfRows: '1000',
  };

  const response = await axios.get<string>(MOLIT_API_BASE_URL, {
    params,
    timeout: API_TIMEOUT,
    responseType: 'text',
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BomzipServer/1.0)' },
  });

  const parsed = (await parseStringPromise(response.data)) as MolitApiResponse;
  const body = parsed.response?.body?.[0];
  const rawItems: MolitTradeItem[] = body?.items?.[0]?.item ?? [];

  return rawItems.map((item) => ({
    aptNm: item.aptNm?.[0]?.trim() ?? '',
    sggCd: item.sggCd?.[0]?.trim() ?? lawdCd,
    umdNm: item.umdNm?.[0]?.trim() ?? '',
    dealAmount: parseInt((item.dealAmount?.[0] ?? '0').replace(/,/g, ''), 10),
    dealYear: parseInt(item.dealYear?.[0] ?? '0', 10),
    dealMonth: parseInt(item.dealMonth?.[0] ?? '0', 10),
    dealDay: parseInt(item.dealDay?.[0] ?? '0', 10),
  }));
}

// ============================================================
// 실 API 기반 거래량 급등 단지 계산
// ============================================================

interface AggregatedHotTrade {
  aptCode: string;
  name: string;
  address: string;
  sggCd: string;
  thisMonthCount: number;
  prevMonthCount: number;
  recentPrice: number; // 만원
  changeRate: number;
}

/**
 * 이번달/이전달 RawItem 배열로 단지별 집계를 수행합니다.
 */
function aggregateHotTrades(
  thisMonthItems: RawItem[],
  prevMonthItems: RawItem[],
): AggregatedHotTrade[] {
  // 이번달 단지별 집계
  const thisMap = new Map<string, { count: number; latestPrice: number; latestDay: number; sggCd: string; umdNm: string }>();
  for (const item of thisMonthItems) {
    if (!item.aptNm) continue;
    const key = `${item.aptNm}__${item.sggCd}__${item.umdNm}`;
    const existing = thisMap.get(key);
    if (!existing) {
      thisMap.set(key, {
        count: 1,
        latestPrice: item.dealAmount,
        latestDay: item.dealDay,
        sggCd: item.sggCd,
        umdNm: item.umdNm,
      });
    } else {
      existing.count += 1;
      if (item.dealDay > existing.latestDay) {
        existing.latestPrice = item.dealAmount;
        existing.latestDay = item.dealDay;
      }
    }
  }

  // 이전달 단지별 거래량 집계
  const prevMap = new Map<string, number>();
  for (const item of prevMonthItems) {
    if (!item.aptNm) continue;
    const key = `${item.aptNm}__${item.sggCd}__${item.umdNm}`;
    prevMap.set(key, (prevMap.get(key) ?? 0) + 1);
  }

  const result: AggregatedHotTrade[] = [];
  for (const [key, thisData] of thisMap.entries()) {
    const parts = key.split('__');
    const aptNm = parts[0];
    const sggCd = parts[1];
    const umdNm = parts[2];

    const prevCount = prevMap.get(key) ?? 0;

    // changeRate: 이전달 0건이면 thisMonthCount * 100 (신규 진입)
    const changeRate = prevCount === 0
      ? thisData.count * 100
      : Math.round(((thisData.count - prevCount) / prevCount) * 100 * 10) / 10;

    // 주소: 시군구명 + 읍면동명
    const sigunguInfo = SIGUNGU_TABLE.find((sg) => sg.code === sggCd);
    const sigunguName = sigunguInfo?.name ?? sggCd;
    const address = umdNm ? `${sigunguName} ${umdNm}` : sigunguName;

    result.push({
      aptCode: `REAL-${sggCd}-${aptNm.replace(/\s/g, '')}`,
      name: aptNm,
      address,
      sggCd,
      thisMonthCount: thisData.count,
      prevMonthCount: prevCount,
      recentPrice: thisData.latestPrice,
      changeRate,
    });
  }

  return result;
}

/**
 * 실 MOLIT API를 조회해 거래량 급등 Top 10을 반환합니다.
 */
async function buildHotTradeFromApi(): Promise<HotTradeApartment[]> {
  const apiKey = process.env.MOLIT_API_KEY;
  if (!apiKey || apiKey === 'demo_key_replace_with_real_key') {
    throw new Error('MOLIT_API_KEY 없음 — mock fallback 사용');
  }

  const thisYm = getYearMonth(0);
  const prevYm = getYearMonth(-1);

  // 이번달 + 전달 데이터 병렬 조회
  const fetchTasks = HOT_TRADE_SIGUNGU_CODES.flatMap((code) => [
    fetchMolitForHotTrade(apiKey, code, thisYm),
    fetchMolitForHotTrade(apiKey, code, prevYm),
  ]);

  const settled = await Promise.allSettled(fetchTasks);

  const thisMonthItems: RawItem[] = [];
  const prevMonthItems: RawItem[] = [];

  HOT_TRADE_SIGUNGU_CODES.forEach((code, idx) => {
    const thisResult = settled[idx * 2];
    const prevResult = settled[idx * 2 + 1];

    if (thisResult.status === 'fulfilled') {
      thisMonthItems.push(...thisResult.value);
    } else {
      console.warn(`[HotTrade] 이번달 조회 실패: sigungu=${code}`, thisResult.reason);
    }
    if (prevResult.status === 'fulfilled') {
      prevMonthItems.push(...prevResult.value);
    } else {
      console.warn(`[HotTrade] 전달 조회 실패: sigungu=${code}`, prevResult.reason);
    }
  });

  if (thisMonthItems.length === 0) {
    throw new Error('이번달 데이터 0건 — mock fallback 사용');
  }

  const aggregated = aggregateHotTrades(thisMonthItems, prevMonthItems);

  // changeRate 내림차순 정렬 후 상위 10건
  aggregated.sort((a, b) => b.changeRate - a.changeRate);
  const top10 = aggregated.slice(0, 10);

  return top10.map((d): HotTradeApartment => {
    const center = getSigunguCenter(d.sggCd);

    // priceChangeType: 이번달 거래량이 전달보다 많으면 up
    const priceChangeType: 'up' | 'down' | 'flat' =
      d.thisMonthCount > d.prevMonthCount ? 'up'
      : d.thisMonthCount < d.prevMonthCount ? 'down'
      : 'flat';

    return {
      id: d.aptCode,
      name: d.name,
      address: d.address,
      lat: center?.lat ?? 37.5665,   // 매핑 실패 시 서울 시청 기준
      lng: center?.lng ?? 126.9780,
      tradeCount: d.thisMonthCount,
      prevTradeCount: d.prevMonthCount,
      changeRate: d.changeRate,
      recentPrice: d.recentPrice,
      priceChangeType,
    };
  });
}

// ============================================================
// Mock fallback
// ============================================================

function buildHotTradeFromMock(): HotTradeApartment[] {
  return HOT_TRADE_BASE.map((apt, idx) => {
    const rand = seededRandom(idx);

    const prevTradeCount = Math.floor(rand() * 6) + 3;
    const changeRate = Math.floor(rand() * 351) + 150;
    const tradeCount = Math.round(prevTradeCount * (1 + changeRate / 100));

    const priceChangeType: 'up' | 'down' | 'flat' =
      apt.priceChange > 0 ? 'up' : apt.priceChange < 0 ? 'down' : 'flat';

    return {
      id: apt.aptCode,
      name: apt.name,
      address: apt.address,
      lat: apt.lat,
      lng: apt.lng,
      tradeCount,
      prevTradeCount,
      changeRate,
      recentPrice: apt.basePrice,
      priceChangeType,
    };
  });
}

// ============================================================
// Public API
// ============================================================

/**
 * 거래량 급등 단지 Top 10을 반환합니다.
 *
 * 실 MOLIT API → 실패 시 Mock fallback 순서로 동작합니다.
 * 캐시 TTL: 30분
 */
export async function getHotTradeApartments(): Promise<HotTradeApartment[]> {
  const cacheKey = 'hot-trade:top10';

  const cached = cacheService.get<HotTradeApartment[]>(cacheKey);
  if (cached) {
    console.log('[HotTrade] 캐시 히트');
    return cached;
  }

  let result: HotTradeApartment[];

  try {
    result = await buildHotTradeFromApi();
    console.log(`[HotTrade] 실 API 성공: ${result.length}건`);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.warn(`[HotTrade] 실 API 실패 → Mock fallback 사용: ${reason}`);
    result = buildHotTradeFromMock();
  }

  cacheService.set(cacheKey, result, HOT_TRADE_TTL);
  return result;
}
