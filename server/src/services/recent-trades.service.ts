// ============================================================
// 최근 거래 피드 서비스 — 홈 화면 실거래 리스트용
// GET /api/apartments/recent-trades?region=11&limit=20
//
// MOLIT API에서 현재 달 데이터를 조회해 거래일 최신순 정렬 반환.
// 캐시 TTL: 10분 (실시간성 강조)
// MOLIT API 실패 시 빈 배열 반환 (홈 화면 크래시 방지)
// ============================================================
import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { MolitApiResponse, MolitTradeItem } from '../types';
import { cacheService } from './cache.service';

// 캐시 TTL: 10분
const RECENT_TRADES_TTL = 60 * 10;

// 국토부 실거래가 API — Cloudflare Workers 프록시 경유
const MOLIT_API_BASE_URL = 'https://molit-proxy.bomzip.workers.dev/trade';
const API_TIMEOUT = 10_000;

// 지역별 조회 대상 시군구 코드 (각 2~3개로 제한 — quota 보호)
const REGION_SIGUNGU_MAP: Record<string, string[]> = {
  '11': ['11680', '11710', '11650'], // 강남구, 송파구, 서초구
  '41': ['41135', '41281', '41460'], // 성남 분당구, 고양 덕양구, 화성시
  '26': ['26350', '26290'],          // 부산 해운대구, 동래구
  '28': ['28110', '28185'],          // 인천 중구, 남동구
  '30': ['30110'],                   // 대전 동구
  '27': ['27110', '27140'],          // 대구 중구, 동구
};

// 미등록 지역은 서울 주요 3개 구로 fallback
const DEFAULT_SIGUNGU_CODES = ['11680', '11710', '11650'];

export interface RecentTrade {
  id: string;         // `${lawdCd}-${aptNm}-${dealDate}` 조합
  aptNm: string;      // 아파트명
  umdNm: string;      // 읍면동명
  lawdCd: string;     // 시군구 코드
  area: number;       // 전용면적 (m²)
  price: number;      // 거래금액 (만원)
  dealDate: string;   // 거래일 YYYY-MM-DD
  buildYear?: number; // 건축연도
}

/**
 * YYYYMM 형식의 현재 년월 문자열을 반환합니다.
 */
function getCurrentYearMonth(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}${month}`;
}

/**
 * 실제 API 키인지 여부를 판별합니다.
 */
function isRealApiKey(key: string | undefined): boolean {
  return !!key && key !== 'demo_key_replace_with_real_key';
}

/**
 * MolitTradeItem을 RecentTrade로 변환합니다.
 */
function parseMolitItemToRecentTrade(
  item: MolitTradeItem,
  lawdCd: string,
): RecentTrade | null {
  const aptNm = item.aptNm?.[0]?.trim();
  if (!aptNm) return null;

  const dealYear = item.dealYear?.[0]?.trim() ?? '';
  const dealMonth = (item.dealMonth?.[0]?.trim() ?? '').padStart(2, '0');
  const dealDay = (item.dealDay?.[0]?.trim() ?? '').padStart(2, '0');
  if (!dealYear || !dealMonth || !dealDay) return null;

  const dealDate = `${dealYear}-${dealMonth}-${dealDay}`;
  const rawAmount = (item.dealAmount?.[0] ?? '').replace(/,/g, '');
  const price = parseInt(rawAmount, 10);
  if (isNaN(price) || price <= 0) return null;

  const rawArea = item.excluUseAr?.[0]?.trim() ?? '';
  const area = parseFloat(rawArea);
  if (isNaN(area) || area <= 0) return null;

  const umdNm = item.umdNm?.[0]?.trim() ?? '';
  const sggCd = item.sggCd?.[0]?.trim() ?? lawdCd;
  const buildYearRaw = item.buildYear?.[0]?.trim();
  const buildYear = buildYearRaw ? parseInt(buildYearRaw, 10) : undefined;

  const id = `${sggCd}-${aptNm.replace(/\s/g, '')}-${dealDate}`;

  return {
    id,
    aptNm,
    umdNm,
    lawdCd: sggCd,
    area: Math.round(area * 10) / 10,
    price,
    dealDate,
    buildYear: buildYear && !isNaN(buildYear) ? buildYear : undefined,
  };
}

/**
 * 단일 시군구·년월에 대해 MOLIT API를 호출합니다.
 * 실패 시 빈 배열을 반환합니다.
 */
async function fetchRecentTradesFromMolit(
  apiKey: string,
  lawdCd: string,
  dealYmd: string,
): Promise<RecentTrade[]> {
  const params = {
    serviceKey: apiKey,
    LAWD_CD: lawdCd,
    DEAL_YMD: dealYmd,
    pageNo: '1',
    numOfRows: '100',
  };

  let response;
  try {
    response = await axios.get<string>(MOLIT_API_BASE_URL, {
      params,
      timeout: API_TIMEOUT,
      responseType: 'text',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BomzipServer/1.0)' },
    });
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.warn(
        `[RecentTrades] API HTTP 에러 — lawdCd=${lawdCd}, status=${err.response?.status ?? 'N/A'}`,
      );
    } else {
      console.warn(`[RecentTrades] API 호출 실패 — lawdCd=${lawdCd}`, err);
    }
    return [];
  }

  let parsed: MolitApiResponse;
  try {
    parsed = (await parseStringPromise(response.data)) as MolitApiResponse;
  } catch {
    console.warn(
      `[RecentTrades] XML 파싱 실패 — lawdCd=${lawdCd}, 응답 앞 200자:`,
      response.data?.substring(0, 200),
    );
    return [];
  }

  const body = parsed.response?.body?.[0];
  const rawItems: MolitTradeItem[] = body?.items?.[0]?.item ?? [];

  const trades: RecentTrade[] = [];
  for (const item of rawItems) {
    const trade = parseMolitItemToRecentTrade(item, lawdCd);
    if (trade) trades.push(trade);
  }

  return trades;
}

/**
 * 최근 거래 피드를 반환합니다.
 *
 * MOLIT API에서 현재 달 데이터를 지역 내 주요 시군구 2~3개에서 조회하고,
 * 거래일 기준 최신순 정렬 후 limit 개를 반환합니다.
 *
 * API 실패 시 빈 배열을 반환합니다 (홈 화면 크래시 방지).
 *
 * @param regionCode - 시도 코드 2자리 (기본: '11' = 서울)
 * @param limit - 반환 개수 (기본: 20, 최대: 30)
 */
export async function getRecentTrades(
  regionCode: string = '11',
  limit: number = 20,
): Promise<RecentTrade[]> {
  const cacheKey = `recent-trades:${regionCode}:${limit}`;

  const cached = cacheService.get<RecentTrade[]>(cacheKey);
  if (cached) {
    console.log(`[RecentTrades] 캐시 히트: ${cacheKey}`);
    return cached;
  }

  const apiKey = process.env.MOLIT_API_KEY;
  if (!isRealApiKey(apiKey)) {
    console.warn('[RecentTrades] MOLIT_API_KEY 없음 → 빈 배열 반환');
    return [];
  }

  const sigunguCodes = REGION_SIGUNGU_MAP[regionCode] ?? DEFAULT_SIGUNGU_CODES;
  const dealYmd = getCurrentYearMonth();

  console.log(
    `[RecentTrades] 조회 시작: region=${regionCode}, dealYmd=${dealYmd}, sigungu=${sigunguCodes.join(',')}`,
  );

  // 병렬 조회
  const results = await Promise.allSettled(
    sigunguCodes.map((code) => fetchRecentTradesFromMolit(apiKey!, code, dealYmd)),
  );

  const allTrades: RecentTrade[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allTrades.push(...result.value);
    }
  }

  if (allTrades.length === 0) {
    console.warn('[RecentTrades] 조회 결과 0건 — 빈 배열 반환');
    return [];
  }

  // 거래일 기준 최신순 정렬 후 limit 슬라이스
  allTrades.sort((a, b) => b.dealDate.localeCompare(a.dealDate));
  const result = allTrades.slice(0, limit);

  console.log(`[RecentTrades] 완료: 총 ${allTrades.length}건 중 ${result.length}건 반환`);

  cacheService.set(cacheKey, result, RECENT_TRADES_TTL);
  return result;
}
