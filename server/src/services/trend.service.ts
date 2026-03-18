// ============================================================
// 지역별 가격 트렌드 계산 서비스
// 국토부 실거래가 데이터를 기반으로 주간/월간 트렌드를 집계합니다.
// ============================================================
import { RegionTrend, TrendDataPoint, TrendQueryParams, MarketSummary } from '../types';
import { cacheService, CACHE_TTL } from './cache.service';
import { fetchTradesForTrend } from './molit.service';

/**
 * 지역별 가격 트렌드를 계산합니다.
 */
export async function getRegionTrend(params: TrendQueryParams): Promise<RegionTrend> {
  const { regionCode, type = 'monthly' } = params;
  const cacheKey = `trend:${regionCode}:${type}`;

  const cached = cacheService.get<RegionTrend>(cacheKey);
  if (cached) {
    console.log(`[Trend] 캐시 히트: ${cacheKey}`);
    return cached;
  }

  console.log(`[Trend] 트렌드 계산 시작: regionCode=${regionCode}, type=${type}`);

  // 조회 기간 결정 (월간: 12개월, 주간: 3개월)
  const months = type === 'weekly' ? 3 : 12;

  // 실거래가 데이터 수집
  const trades = await fetchTradesForTrend(regionCode, months);

  // 기간별 그룹핑
  const groupMap = new Map<string, number[]>();

  trades.forEach((trade) => {
    let key: string;
    if (type === 'weekly') {
      // 주차 계산 (ISO 주차 기준)
      const d = new Date(trade.dealDate);
      const weekNum = getWeekNumber(d);
      key = `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
    } else {
      // 월별
      key = `${trade.dealYear}-${String(trade.dealMonth).padStart(2, '0')}`;
    }

    if (!groupMap.has(key)) {
      groupMap.set(key, []);
    }
    groupMap.get(key)!.push(trade.price);
  });

  // 기간별 평균 가격 계산
  const dataPoints: TrendDataPoint[] = Array.from(groupMap.entries())
    .map(([date, prices]) => ({
      date,
      avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      tradeCount: prices.length,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 전체 평균 가격
  const allPrices = trades.map((t) => t.price);
  const avgPrice =
    allPrices.length > 0
      ? Math.round(allPrices.reduce((a, b) => a + b, 0) / allPrices.length)
      : 0;

  // 가격 변동 계산 (최근 vs 직전 기간)
  let priceChange = 0;
  let priceChangeRate = 0;
  if (dataPoints.length >= 2) {
    const recent = dataPoints[dataPoints.length - 1].avgPrice;
    const prev = dataPoints[dataPoints.length - 2].avgPrice;
    priceChange = recent - prev;
    priceChangeRate = prev > 0 ? Math.round((priceChange / prev) * 1000) / 10 : 0;
  }

  const result: RegionTrend = {
    regionCode,
    regionName: getRegionName(regionCode),
    period: type,
    avgPrice,
    priceChange,
    priceChangeRate,
    tradeCount: trades.length,
    data: dataPoints,
  };

  cacheService.set(cacheKey, result, CACHE_TTL.TREND);

  return result;
}

/**
 * ISO 주차 번호를 계산합니다.
 */
function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// ============================================================
// 전국 시장 요약 집계
// 국토부 실거래가 API는 지역 코드 필수이므로,
// 주요 시도(서울/경기/인천/부산/대구/광주/대전/울산)를 병렬 조회 후 집계.
// API 키 없을 경우 Mock fallback 반환.
// ============================================================

/** 집계 대상 시도 코드 (거래량 상위 주요 지역) */
const SUMMARY_REGION_CODES = ['11', '41', '28', '26', '27', '29', '30', '31'];

/** Mock fallback — 실 API 키 없을 때 반환 */
const MARKET_SUMMARY_MOCK: Omit<MarketSummary, 'baseYearMonth' | 'updatedAt'> = {
  scope: '수도권',
  avgPrice: 87500,
  priceChange: 1.2,
  tradeCount: 23847,
};

/**
 * 이번 달 년월 문자열 반환 (YYYYMM)
 */
function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * 이번 달 기준 년월 문자열 반환 (YYYY-MM)
 */
function currentBaseYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * 전월 년월 문자열 반환 (YYYYMM)
 */
function prevYearMonth(): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * 전국(주요 시도) 시장 요약을 집계합니다.
 * - 실 API 키가 없으면 Mock fallback 반환
 * - 이번 달 + 전월 데이터를 병렬 조회하여 평균가/변동률/거래량 계산
 * - 캐시 TTL: 6시간
 */
export async function getMarketSummary(): Promise<MarketSummary> {
  const cacheKey = `trend:summary:${currentYearMonth()}`;

  const cached = cacheService.get<MarketSummary>(cacheKey);
  if (cached) {
    console.log('[Trend] 시장 요약 캐시 히트');
    return cached;
  }

  const baseYearMonth = currentBaseYearMonth();
  const updatedAt = new Date().toISOString();

  // API 키 없으면 즉시 Mock 반환
  const apiKey = process.env.MOLIT_API_KEY;
  if (!apiKey || apiKey === 'demo_key_replace_with_real_key') {
    console.warn('[Trend] API 키 없음 → 시장 요약 Mock 반환');
    const mock: MarketSummary = { ...MARKET_SUMMARY_MOCK, baseYearMonth, updatedAt };
    cacheService.set(cacheKey, mock, CACHE_TTL.APARTMENT_TRADE);
    return mock;
  }

  console.log('[Trend] 시장 요약 집계 시작: 주요 시도 병렬 조회');

  const thisYm = currentYearMonth();
  const prevYm = prevYearMonth();

  // 이번 달 + 전월을 주요 시도별 병렬 조회
  const [thisMonthResults, prevMonthResults] = await Promise.all([
    Promise.allSettled(SUMMARY_REGION_CODES.map((code) => fetchTradesForTrend(code, 1))),
    Promise.allSettled(SUMMARY_REGION_CODES.map((code) => fetchTradesForTrend(code, 2))),
  ]);

  // 이번 달 거래 집계
  const thisTrades: number[] = [];
  let thisTradeCount = 0;

  thisMonthResults.forEach((result) => {
    if (result.status === 'fulfilled') {
      // fetchTradesForTrend는 최근 N개월치를 반환 — 이번 달(thisYm)만 필터
      const monthTrades = result.value.filter((t) => {
        const ym = `${t.dealYear}${String(t.dealMonth).padStart(2, '0')}`;
        return ym === thisYm;
      });
      monthTrades.forEach((t) => thisTrades.push(t.price));
      thisTradeCount += monthTrades.length;
    }
  });

  // 전월 거래 평균가 집계 (변동률 계산용)
  const prevPrices: number[] = [];

  prevMonthResults.forEach((result) => {
    if (result.status === 'fulfilled') {
      const monthTrades = result.value.filter((t) => {
        const ym = `${t.dealYear}${String(t.dealMonth).padStart(2, '0')}`;
        return ym === prevYm;
      });
      monthTrades.forEach((t) => prevPrices.push(t.price));
    }
  });

  // 집계 결과가 비어있으면 Mock fallback
  if (thisTrades.length === 0) {
    console.warn('[Trend] 이번 달 거래 데이터 0건 → Mock fallback');
    const mock: MarketSummary = { ...MARKET_SUMMARY_MOCK, baseYearMonth, updatedAt };
    cacheService.set(cacheKey, mock, CACHE_TTL.APARTMENT_TRADE);
    return mock;
  }

  const avgPrice = Math.round(thisTrades.reduce((a, b) => a + b, 0) / thisTrades.length);

  let priceChange = 0;
  if (prevPrices.length > 0) {
    const prevAvg = Math.round(prevPrices.reduce((a, b) => a + b, 0) / prevPrices.length);
    priceChange = prevAvg > 0 ? Math.round(((avgPrice - prevAvg) / prevAvg) * 1000) / 10 : 0;
  }

  const result: MarketSummary = {
    scope: '수도권',
    avgPrice,
    priceChange,
    tradeCount: thisTradeCount,
    baseYearMonth,
    updatedAt,
  };

  cacheService.set(cacheKey, result, CACHE_TTL.APARTMENT_TRADE);
  console.log(`[Trend] 시장 요약 집계 완료: avgPrice=${avgPrice}, tradeCount=${thisTradeCount}`);

  return result;
}

/**
 * 지역 코드로 지역명을 반환합니다.
 */
function getRegionName(code: string): string {
  const regionMap: Record<string, string> = {
    '11': '서울특별시',
    '26': '부산광역시',
    '27': '대구광역시',
    '28': '인천광역시',
    '29': '광주광역시',
    '30': '대전광역시',
    '31': '울산광역시',
    '36': '세종특별자치시',
    '41': '경기도',
    '42': '강원특별자치도',
    '43': '충청북도',
    '44': '충청남도',
    '45': '전북특별자치도',
    '46': '전라남도',
    '47': '경상북도',
    '48': '경상남도',
    '50': '제주특별자치도',
  };
  return regionMap[code] ?? `지역코드 ${code}`;
}
