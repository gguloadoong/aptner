import api from './api';

export interface MarketSummary {
  scope: string;          // 예: "서울/경기 등 8개 시도"
  avgPrice: number;       // 만원
  priceChange: number;    // BE 필드명 — 전월 대비 변동률 (%)
  tradeCount: number;     // 거래 건수
  baseYearMonth: string;  // 기준 연월 (YYYY-MM)
  updatedAt: string;      // ISO 날짜 문자열
}

const STALE_TIME = 6 * 60 * 60 * 1000;   // 6시간
const GC_TIME   = 12 * 60 * 60 * 1000;  // 12시간

export const MARKET_SUMMARY_QUERY_OPTIONS = {
  staleTime: STALE_TIME,
  gcTime:    GC_TIME,
} as const;

export async function getMarketSummary(): Promise<MarketSummary> {
  const response = await api.get<{ success: true; data: MarketSummary }>('/trends/summary');
  return response.data.data;
}
