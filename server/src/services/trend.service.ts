// ============================================================
// 지역별 가격 트렌드 계산 서비스
// 국토부 실거래가 데이터를 기반으로 주간/월간 트렌드를 집계합니다.
// ============================================================
import { RegionTrend, TrendDataPoint, TrendQueryParams } from '../types';
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
