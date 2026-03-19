// ============================================================
// [P1] 핫 아파트 랭킹 서비스 — 거래량 급등률 기반
// GET /api/apartments/hot?region=11&limit=10
//
// 급등률 계산: (이번달 - 전달) / 전달 * 100
// 전달 0건이면 신규 진입 (rankChange: null)
// 정렬: tradeSurgeRate 내림차순
// ============================================================
import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { HotApartmentRanking, MolitApiResponse, MolitTradeItem } from '../types';
import { cacheService } from './cache.service';

// TTL: 30분 (핫 랭킹은 실시간성보다 quota 보호 우선)
const HOT_RANKING_TTL = 60 * 30;

// 국토부 실거래가 API — Cloudflare Workers 프록시 경유 (MOLIT_PROXY_URL 환경변수 우선)
const MOLIT_API_BASE_URL = process.env.MOLIT_PROXY_URL ?? 'https://molit-proxy.bomzip.workers.dev/trade';
const API_TIMEOUT = 10_000;

// 지역별 대표 시군구 코드 (서울 주요 구, 경기 주요 시)
const REGION_SIGUNGU_MAP: Record<string, string[]> = {
  '11': ['11680', '11710', '11650', '11590', '11440', '11170'], // 강남구, 송파구, 서초구, 동작구, 마포구, 용산구
  '41': ['41135', '41281', '41460', '41390', '41363'],          // 성남 분당구, 고양 덕양구, 화성, 파주, 용인 기흥구
  '26': ['26350', '26290'],                                      // 부산 해운대구, 동래구
  'all': ['11680', '11710', '11650', '11440', '11170', '41135'], // 전국: 서울 주요 + 경기 주요
};

// ============================================================
// Fallback Mock 기준 데이터 (API 실패 시 사용)
// ============================================================
interface RankingBaseData {
  aptCode: string;
  name: string;
  location: string;       // 시군구
  regionCode: string;     // 시도 코드 2자리
  recentPrice: number;    // 원
  thisMonthCount: number; // 이번 달 거래량
  prevMonthCount: number; // 전달 거래량 (0이면 신규 진입)
  prevRank: number | null; // 지난 주기 순위 (null=신규)
}

const RANKING_BASE_DATA: RankingBaseData[] = [
  // 서울 단지
  {
    aptCode: 'APT001',
    name: '래미안 원베일리',
    location: '서울 서초구',
    regionCode: '11',
    recentPrice: 2_800_000_000,
    thisMonthCount: 42,
    prevMonthCount: 12,
    prevRank: 3,
  },
  {
    aptCode: 'APT002',
    name: '아크로리버파크',
    location: '서울 서초구',
    regionCode: '11',
    recentPrice: 3_100_000_000,
    thisMonthCount: 38,
    prevMonthCount: 8,
    prevRank: 6,
  },
  {
    aptCode: 'APT003',
    name: '헬리오시티',
    location: '서울 송파구',
    regionCode: '11',
    recentPrice: 1_450_000_000,
    thisMonthCount: 35,
    prevMonthCount: 15,
    prevRank: 2,
  },
  {
    aptCode: 'APT004',
    name: '은마아파트',
    location: '서울 강남구',
    regionCode: '11',
    recentPrice: 1_800_000_000,
    thisMonthCount: 31,
    prevMonthCount: 31,
    prevRank: 1,
  },
  {
    aptCode: 'APT005',
    name: '올림픽파크포레온',
    location: '서울 강동구',
    regionCode: '11',
    recentPrice: 1_350_000_000,
    thisMonthCount: 28,
    prevMonthCount: 0, // 신규 진입
    prevRank: null,
  },
  {
    aptCode: 'APT006',
    name: '래미안 대치팰리스',
    location: '서울 강남구',
    regionCode: '11',
    recentPrice: 2_200_000_000,
    thisMonthCount: 25,
    prevMonthCount: 20,
    prevRank: 4,
  },
  {
    aptCode: 'APT007',
    name: '도곡렉슬',
    location: '서울 강남구',
    regionCode: '11',
    recentPrice: 1_950_000_000,
    thisMonthCount: 22,
    prevMonthCount: 5,
    prevRank: 9,
  },
  {
    aptCode: 'APT008',
    name: '잠실주공5단지',
    location: '서울 송파구',
    regionCode: '11',
    recentPrice: 2_300_000_000,
    thisMonthCount: 20,
    prevMonthCount: 18,
    prevRank: 5,
  },
  {
    aptCode: 'APT009',
    name: '마포래미안푸르지오',
    location: '서울 마포구',
    regionCode: '11',
    recentPrice: 1_150_000_000,
    thisMonthCount: 18,
    prevMonthCount: 22,
    prevRank: 7,
  },
  {
    aptCode: 'APT010',
    name: '래미안 첼리투스',
    location: '서울 용산구',
    regionCode: '11',
    recentPrice: 2_600_000_000,
    thisMonthCount: 15,
    prevMonthCount: 3,
    prevRank: 10,
  },
  // 경기 단지
  {
    aptCode: 'APT011',
    name: '판교 알파리움',
    location: '경기 성남시',
    regionCode: '41',
    recentPrice: 1_200_000_000,
    thisMonthCount: 33,
    prevMonthCount: 9,
    prevRank: 5,
  },
  {
    aptCode: 'APT012',
    name: '힐스테이트 광교중앙역',
    location: '경기 수원시',
    regionCode: '41',
    recentPrice: 980_000_000,
    thisMonthCount: 29,
    prevMonthCount: 0, // 신규 진입
    prevRank: null,
  },
  {
    aptCode: 'APT013',
    name: '래미안 위브',
    location: '경기 용인시',
    regionCode: '41',
    recentPrice: 720_000_000,
    thisMonthCount: 24,
    prevMonthCount: 16,
    prevRank: 3,
  },
  // 부산 단지
  {
    aptCode: 'APT014',
    name: '더샵 센텀파크',
    location: '부산 해운대구',
    regionCode: '26',
    recentPrice: 850_000_000,
    thisMonthCount: 27,
    prevMonthCount: 6,
    prevRank: 8,
  },
  {
    aptCode: 'APT015',
    name: '엘시티 더샵',
    location: '부산 해운대구',
    regionCode: '26',
    recentPrice: 1_100_000_000,
    thisMonthCount: 19,
    prevMonthCount: 19,
    prevRank: 2,
  },
];

// ============================================================
// 유틸 함수
// ============================================================

/**
 * 거래량 급등률을 계산합니다.
 * 전달 거래량이 0이면 신규 진입으로 간주해 Infinity 반환 (정렬 최상위 처리용).
 */
function calcSurgeRate(thisMonth: number, prevMonth: number): number {
  if (prevMonth === 0) return Infinity;
  return Math.round(((thisMonth - prevMonth) / prevMonth) * 100 * 10) / 10;
}

/**
 * 순위 변동을 계산합니다.
 * - prevRank가 null이면 신규 진입 → rankChange: null
 * - prevRank가 있으면 prevRank - currentRank (양수=상승, 음수=하락, 0=유지)
 */
function calcRankChange(prevRank: number | null, currentRank: number): number | null {
  if (prevRank === null) return null;
  return prevRank - currentRank;
}

/**
 * YYYYMM 형식의 년월 문자열을 반환합니다.
 * offset이 음수면 과거 달, 0이면 현재 달.
 */
function getYearMonth(offset: number = 0): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}${month}`;
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
 * 실패 시 빈 배열을 반환합니다 (상위에서 Promise.allSettled 처리).
 */
async function fetchMolitForRanking(
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
// 집계 함수
// ============================================================

interface AggregatedComplex {
  key: string;        // aptNm + sggCd + umdNm 조합
  aptCode: string;
  name: string;
  location: string;
  sggCd: string;
  thisMonthCount: number;
  prevMonthCount: number;
  recentPrice: number; // 원 단위
}

/**
 * 이번달/이전달 RawItem 배열로 단지별 집계를 수행합니다.
 */
function aggregateComplexes(
  thisMonthItems: RawItem[],
  prevMonthItems: RawItem[],
  sggCdToLocation: Record<string, string>,
): AggregatedComplex[] {
  // 이번달 단지별 거래량 집계
  const thisMonthMap = new Map<string, { count: number; latestPrice: number; latestDay: number }>();
  for (const item of thisMonthItems) {
    if (!item.aptNm) continue;
    const key = `${item.aptNm}__${item.sggCd}__${item.umdNm}`;
    const existing = thisMonthMap.get(key);
    if (!existing) {
      thisMonthMap.set(key, { count: 1, latestPrice: item.dealAmount * 10_000, latestDay: item.dealDay });
    } else {
      existing.count += 1;
      // 더 최근 거래일(dealDay)인 경우에만 최신가 갱신
      if (item.dealDay > existing.latestDay) {
        existing.latestPrice = item.dealAmount * 10_000;
        existing.latestDay = item.dealDay;
      }
    }
  }

  // 전달 단지별 거래량 집계
  const prevMonthMap = new Map<string, number>();
  for (const item of prevMonthItems) {
    if (!item.aptNm) continue;
    const key = `${item.aptNm}__${item.sggCd}__${item.umdNm}`;
    prevMonthMap.set(key, (prevMonthMap.get(key) ?? 0) + 1);
  }

  const result: AggregatedComplex[] = [];
  for (const [key, thisData] of thisMonthMap.entries()) {
    const parts = key.split('__');
    const aptNm = parts[0];
    const sggCd = parts[1];
    const umdNm = parts[2];
    const location = sggCdToLocation[sggCd] ?? sggCd;

    result.push({
      key,
      aptCode: `REAL-${sggCd}-${aptNm.replace(/\s/g, '')}`,
      name: aptNm,
      location: umdNm ? `${location} ${umdNm}` : location,
      sggCd,
      thisMonthCount: thisData.count,
      prevMonthCount: prevMonthMap.get(key) ?? 0,
      recentPrice: thisData.latestPrice,
    });
  }

  return result;
}

// 시군구 코드 → 위치명 매핑
const SIGUNGU_LOCATION_MAP: Record<string, string> = {
  '11680': '서울 강남구',
  '11710': '서울 송파구',
  '11650': '서울 서초구',
  '11590': '서울 동작구',
  '11440': '서울 마포구',
  '11170': '서울 용산구',
  '11140': '서울 중구',
  '11110': '서울 종로구',
  '11200': '서울 성동구',
  '11215': '서울 광진구',
  '11230': '서울 동대문구',
  '11260': '서울 중랑구',
  '11290': '서울 성북구',
  '11305': '서울 강북구',
  '11320': '서울 도봉구',
  '11350': '서울 노원구',
  '11380': '서울 은평구',
  '11410': '서울 서대문구',
  '11470': '서울 양천구',
  '11500': '서울 강서구',
  '11530': '서울 구로구',
  '11545': '서울 금천구',
  '11560': '서울 영등포구',
  '11620': '서울 관악구',
  '11740': '서울 강동구',
  '41135': '경기 성남 분당구',
  '41281': '경기 고양 덕양구',
  '41460': '경기 화성시',
  '41390': '경기 파주시',
  '41363': '경기 용인 기흥구',
  '26350': '부산 해운대구',
  '26290': '부산 동래구',
};

// ============================================================
// Mock 기반 랭킹 계산 (fallback)
// ============================================================

function buildRankingFromMock(
  regionCode: string | undefined,
  limit: number,
): HotApartmentRanking[] {
  let pool = RANKING_BASE_DATA;
  if (regionCode) {
    pool = RANKING_BASE_DATA.filter((d) => d.regionCode === regionCode);
  }

  const withRate = pool.map((d) => ({
    ...d,
    surgeRate: calcSurgeRate(d.thisMonthCount, d.prevMonthCount),
  }));

  withRate.sort((a, b) => b.surgeRate - a.surgeRate);

  return withRate
    .slice(0, limit)
    .map((d, idx) => {
      const currentRank = idx + 1;
      const tradeSurgeRate =
        d.surgeRate === Infinity
          ? d.thisMonthCount * 100
          : d.surgeRate;
      return {
        rank: currentRank,
        rankChange: calcRankChange(d.prevRank, currentRank),
        aptCode: d.aptCode,
        name: d.name,
        location: d.location,
        recentPrice: d.recentPrice,
        tradeCount: d.thisMonthCount,
        tradeSurgeRate,
      };
    });
}

// ============================================================
// 실 API 기반 랭킹 계산
// ============================================================

async function buildRankingFromApi(
  regionCode: string | undefined,
  limit: number,
): Promise<HotApartmentRanking[]> {
  const apiKey = process.env.MOLIT_API_KEY;
  if (!apiKey || apiKey === 'demo_key_replace_with_real_key') {
    throw new Error('MOLIT_API_KEY 없음 — mock fallback 사용');
  }

  const regionKey = regionCode ?? 'all';
  const sigunguCodes = REGION_SIGUNGU_MAP[regionKey] ?? REGION_SIGUNGU_MAP['all'];

  const thisYm = getYearMonth(0);
  const prevYm = getYearMonth(-1);

  // 이번달 + 전달 데이터 병렬 조회
  const fetchTasks = sigunguCodes.flatMap((code) => [
    fetchMolitForRanking(apiKey, code, thisYm),
    fetchMolitForRanking(apiKey, code, prevYm),
  ]);

  const settled = await Promise.allSettled(fetchTasks);

  const thisMonthItems: RawItem[] = [];
  const prevMonthItems: RawItem[] = [];

  sigunguCodes.forEach((_, idx) => {
    const thisResult = settled[idx * 2];
    const prevResult = settled[idx * 2 + 1];

    if (thisResult.status === 'fulfilled') {
      thisMonthItems.push(...thisResult.value);
    } else {
      console.warn(`[HotRanking] 이번달 조회 실패: sigungu=${sigunguCodes[idx]}`, thisResult.reason);
    }
    if (prevResult.status === 'fulfilled') {
      prevMonthItems.push(...prevResult.value);
    } else {
      console.warn(`[HotRanking] 전달 조회 실패: sigungu=${sigunguCodes[idx]}`, prevResult.reason);
    }
  });

  if (thisMonthItems.length === 0) {
    throw new Error('이번달 데이터 0건 — mock fallback 사용');
  }

  const aggregated = aggregateComplexes(thisMonthItems, prevMonthItems, SIGUNGU_LOCATION_MAP);

  // 급등률 계산 후 내림차순 정렬
  const withRate = aggregated.map((d) => ({
    ...d,
    surgeRate: calcSurgeRate(d.thisMonthCount, d.prevMonthCount),
  }));
  withRate.sort((a, b) => b.surgeRate - a.surgeRate);

  return withRate
    .slice(0, limit)
    .map((d, idx) => {
      const currentRank = idx + 1;
      const tradeSurgeRate =
        d.surgeRate === Infinity
          ? d.thisMonthCount * 100
          : d.surgeRate;
      return {
        rank: currentRank,
        rankChange: null, // 실 API는 이전 순위 데이터 없으므로 null
        aptCode: d.aptCode,
        name: d.name,
        location: d.location,
        recentPrice: d.recentPrice,
        tradeCount: d.thisMonthCount,
        tradeSurgeRate,
      };
    });
}

// ============================================================
// Public API
// ============================================================

/**
 * 핫 아파트 랭킹을 반환합니다.
 *
 * 실 MOLIT API → 실패 시 Mock fallback 순서로 동작합니다.
 *
 * @param regionCode - 시도 코드 2자리 (예: '11' = 서울). undefined이면 전국.
 * @param limit - 반환 개수 (기본: 20, 최대: 50)
 */
export async function getHotApartmentRanking(
  regionCode: string | undefined,
  limit: number = 20,
): Promise<HotApartmentRanking[]> {
  const cacheKey = `hot-ranking:${regionCode ?? 'all'}:${limit}`;

  const cached = cacheService.get<HotApartmentRanking[]>(cacheKey);
  if (cached) {
    console.log(`[HotRanking] 캐시 히트: ${cacheKey}`);
    return cached;
  }

  console.log(`[HotRanking] 랭킹 계산: region=${regionCode ?? '전국'}, limit=${limit}`);

  let result: HotApartmentRanking[];

  try {
    result = await buildRankingFromApi(regionCode, limit);
    console.log(`[HotRanking] 실 API 성공: ${result.length}건`);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.warn(`[HotRanking] 실 API 실패 → Mock fallback 사용 (region=${regionCode ?? '전국'}): ${reason}`);
    result = buildRankingFromMock(regionCode, limit);
  }

  cacheService.set(cacheKey, result, HOT_RANKING_TTL);
  return result;
}
