// ============================================================
// Aptner 서버 공통 타입 정의
// ============================================================

// ---- 공통 API 응답 형식 ----

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
  cached?: boolean;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ---- 아파트 실거래가 ----

export interface ApartmentTrade {
  /** 아파트 이름 */
  apartmentName: string;
  /** 전용 면적 (m²) */
  area: number;
  /** 층 */
  floor: number;
  /** 거래 금액 (만원) */
  price: number;
  /** 거래 일자 (YYYY-MM-DD) */
  dealDate: string;
  /** 거래 년도 */
  dealYear: number;
  /** 거래 월 */
  dealMonth: number;
  /** 거래 일 */
  dealDay: number;
  /** 법정동 코드 */
  lawdCd: string;
  /** 법정동 이름 */
  lawdNm: string;
  /** 도로명 주소 */
  roadNm?: string;
  /** 건축 년도 */
  buildYear?: number;
  /** 아파트 코드 */
  aptCode?: string;
}

export interface ApartmentTradeHistory {
  dealDate: string;
  price: number;
  area: number;
  floor: number;
}

export interface HotApartment {
  rank: number;
  aptCode: string;
  apartmentName: string;
  lawdNm: string;
  recentPrice: number;
  area: number;
  tradeCount: number;
  priceChange: number;
  priceChangeRate: number;
  /** 위도 (지도 마커용) */
  lat?: number | null;
  /** 경도 (지도 마커용) */
  lng?: number | null;
  /** 최근 거래가 역대 최고가 여부 */
  isRecordHigh?: boolean;
  /** HOT 랭킹 순위 (TOP 10이면 1~10, 나머지 undefined) */
  hotRank?: number;
  // ---- 아파트 상세 조회 시 추가 반환 필드 ----
  /** 총 세대수 */
  totalUnits?: number;
  /** 건축 연도 */
  buildYear?: number;
  /** 도로명 주소 */
  address?: string;
  /** 법정동 코드 (5자리) */
  lawdCd?: string;
  /** 건설사 */
  builder?: string;
  /** 면적별 대표 거래 히스토리 */
  areas?: ApartmentAreaSummary[];
  /** 최근 24개월 실거래가 시계열 데이터 (상세 조회 시 포함) */
  tradeHistory?: ApartmentTradeHistory[];
}

/** 단지 내 면적 유형별 요약 */
export interface ApartmentAreaSummary {
  /** 전용 면적 (m²) */
  area: number;
  /** 해당 면적 최근 거래가 (만원) */
  recentPrice: number;
}

/** 지도 뷰포트용 아파트 마커 데이터 */
export interface ApartmentMapMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  price: number;
  area: string;
  priceChangeType: 'up' | 'down' | 'flat';
  /** 세대수 */
  unitCount?: number;
  /** 브랜드 단지 여부 (래미안/자이/힐스테이트 등) */
  isBrand?: boolean;
  /** 역세권 여부 (500m 이내) */
  isWalkSubway?: boolean;
  /** 대단지 여부 (1000세대 이상) */
  isLargeComplex?: boolean;
  /** 신축 여부 (2020년 이후) */
  isNewBuild?: boolean;
  /** 평지 여부 */
  isFlat?: boolean;
  /** 초품아 여부 (초등학교 인접) */
  hasElementarySchool?: boolean;
  /** 신고가 여부 (지역 중앙값 대비 30% 이상 고가 거래) */
  isRecordHigh?: boolean;
}

/** 단지 필터 조건 */
export interface ComplexFilter {
  minUnit?: number;
  isBrand?: boolean;
  isWalkSubway?: boolean;
  isLargeComplex?: boolean;
  isNewBuild?: boolean;
  isFlat?: boolean;
  hasElementarySchool?: boolean;
}

// ---- 청약 정보 ----

export type SubscriptionStatus = 'upcoming' | 'ongoing' | 'closed';

export interface Subscription {
  id: string;
  /** 단지명 */
  name: string;
  /** 공급 지역 (시도 + 시군구, FE 계약 필드: location) */
  location: string;
  /** 건설사 */
  constructor: string;
  /** 위치 (시도) */
  sido: string;
  /** 위치 (시군구) */
  sigungu: string;
  /** 상세 주소 */
  address: string;
  /** 분양가 (원, FE 계약 필드: supplyPrice) — minPrice 기준, 미확정 시 undefined */
  supplyPrice?: number;
  /** 분양가 시작 (만원) */
  minPrice: number;
  /** 분양가 최대 (만원) */
  maxPrice: number;
  /** 총 공급 세대수 (FE 계약 필드: totalUnits) */
  totalUnits: number;
  /** 총 공급 세대수 (하위 호환 유지) */
  totalSupply: number;
  /** 청약 상태 */
  status: SubscriptionStatus;
  /** 접수 시작일 (YYYY-MM-DD, ISO 8601) */
  startDate: string;
  /** 접수 마감일 (YYYY-MM-DD, ISO 8601) */
  endDate: string;
  /** 당첨자 발표일 (YYYY-MM-DD) */
  announceDate: string;
  /** 청약 유형 (일반/특별/기관추천) */
  type: string;
  /** 마감까지 남은 일수 (음수면 마감) */
  dDay: number;
  /** 평형 목록 */
  areas: SubscriptionArea[];
  /** 위도 (지도 마커용) */
  lat?: number;
  /** 경도 (지도 마커용) */
  lng?: number;
}

export interface SubscriptionArea {
  /** 평형 이름 (예: 59A) */
  typeName: string;
  /** 전용 면적 (m²) */
  area: number;
  /** 공급 세대수 */
  supply: number;
  /** 분양가 (만원) */
  price: number;
}

export interface SubscriptionDetail extends Subscription {
  /** 청약 일정 상세 */
  schedule: SubscriptionSchedule;
  /** 주변 실거래가 평균 (만원/m²) */
  nearbyAvgPrice?: number;
  /** 특별 공급 세대수 */
  specialSupply?: number;
}

export interface SubscriptionSchedule {
  /** 특별공급 접수일 */
  specialStartDate?: string;
  specialEndDate?: string;
  /** 1순위 접수일 */
  firstPriorityDate?: string;
  /** 2순위 접수일 */
  secondPriorityDate?: string;
  /** 당첨자 발표 */
  announceDate: string;
  /** 계약일 */
  contractStartDate?: string;
  contractEndDate?: string;
}

// ---- 지역 트렌드 ----

export interface RegionTrend {
  regionCode: string;
  regionName: string;
  period: 'weekly' | 'monthly';
  avgPrice: number;
  priceChange: number;
  priceChangeRate: number;
  tradeCount: number;
  data: TrendDataPoint[];
}

export interface TrendDataPoint {
  date: string;
  avgPrice: number;
  tradeCount: number;
}

// ---- 지역 코드 ----

export interface SiDo {
  code: string;
  name: string;
}

export interface SiGunGu {
  code: string;
  name: string;
  siDoCode: string;
}

// ---- 국토부 API XML 응답 ----

export interface MolitApiResponse {
  response: {
    header: Array<{
      resultCode: string[];
      resultMsg: string[];
    }>;
    body: Array<{
      items: Array<{
        item?: MolitTradeItem[];
      }>;
      numOfRows: string[];
      pageNo: string[];
      totalCount: string[];
    }>;
  };
}

export interface MolitTradeItem {
  /** 아파트명 (신 API: aptNm) */
  aptNm?: string[];
  /** 전용면적 (신 API: excluUseAr) */
  excluUseAr?: string[];
  /** 층 (신 API: floor) */
  floor?: string[];
  /** 거래금액 (신 API: dealAmount) */
  dealAmount?: string[];
  /** 거래년 (신 API: dealYear) */
  dealYear?: string[];
  /** 거래월 (신 API: dealMonth) */
  dealMonth?: string[];
  /** 거래일 (신 API: dealDay) */
  dealDay?: string[];
  /** 읍면동명 (신 API: umdNm) */
  umdNm?: string[];
  /** 건축년도 (신 API: buildYear) */
  buildYear?: string[];
  /** 도로명 (신 API: roadNm) */
  roadNm?: string[];
  /** 단지일련번호 (신 API: aptSeq) */
  aptSeq?: string[];
  /** 시군구코드 (신 API: sggCd) */
  sggCd?: string[];
  /** 법정동코드 (신 API: umdCd) */
  umdCd?: string[];
}

// ---- 지도 뷰포트용 아파트 단지 (실 API 기반) ----

/**
 * 국토부 실거래가 API에서 집계한 아파트 단지 정보.
 * 좌표는 FE에서 Kakao JS Geocoder로 변환 예정이므로
 * 서버는 address(도로명 주소)만 제공합니다.
 */
export interface ApartmentComplex {
  /** 단지 식별자 (aptSeq 또는 aptNm+lawdCd 해시) */
  id: string;
  /** 단지명 */
  name: string;
  /** 도로명 주소 (Kakao Geocoder 입력용) */
  address: string;
  /** 법정동 코드 5자리 (시군구) */
  lawdCd: string;
  /** 읍면동명 */
  umdNm: string;
  /** 가장 최근 거래가 (만원) */
  latestPrice: number;
  /** 가장 최근 거래 일자 (YYYY-MM-DD) */
  latestDealDate: string;
  /** 최근 2개월 거래 건수 */
  tradeCount: number;
  /** 대표 전용면적 (m²) — 거래 건수 가장 많은 면적 */
  area: number;
  /** 건축 연도 (없으면 undefined) */
  buildYear?: number;
}

// ---- 핫 아파트 랭킹 (거래량 급등률 기반, FE 합의 계약) ----

export interface HotApartmentRanking {
  /** 현재 순위 */
  rank: number;
  /** 순위 변동: 양수=상승, 음수=하락, 0=유지, null=신규 진입 */
  rankChange: number | null;
  /** 단지 코드 */
  aptCode: string;
  /** 단지명 */
  name: string;
  /** 시군구 위치 */
  location: string;
  /** 최근 거래가 (원) */
  recentPrice: number;
  /** 이번 달 거래량 */
  tradeCount: number;
  /** 거래량 급등률 (%, 전월 대비) */
  tradeSurgeRate: number;
}

// ---- 거래량 급등 단지 ----

export interface HotTradeApartment {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  /** 이번 주 거래 수 */
  tradeCount: number;
  /** 지난 주 거래 수 */
  prevTradeCount: number;
  /** 변동률 % (예: 150 = 150% 증가) */
  changeRate: number;
  /** 최근 거래가 (만원) */
  recentPrice: number;
  priceChangeType: 'up' | 'down' | 'flat';
}

// ---- 지도 마커용 단지별 최근 거래가 요약 ----

export interface ApartmentPrice {
  /** 아파트명 (FE 카카오 Places 매칭 키) */
  aptName: string;
  /** 최근 거래가 (만원) */
  recentPrice: number;
  /** 거래일 (YYYY-MM-DD) */
  dealDate: string;
  /** 층 */
  floor: number;
  /** 전용면적 (m²) */
  area: number;
}

// ---- 요청 파라미터 ----

export interface TradeQueryParams {
  lawdCd: string;
  dealYmd: string;
  page?: number;
  limit?: number;
}

export interface HistoryQueryParams {
  months?: number;
  area?: number;
}

export interface SubscriptionQueryParams {
  page?: number;
  limit?: number;
  status?: SubscriptionStatus;
  sido?: string;
  sort?: 'dDay' | 'units' | 'price'; // MAJOR-04: dDay|units|price
  /** 월 필터 (YYYY-MM): 해당 월에 startDate 또는 endDate가 걸치는 청약만 반환 */
  month?: string;
}

export interface TrendQueryParams {
  regionCode: string;
  type?: 'weekly' | 'monthly';
}

// ---- 전국 시장 요약 ----

export interface MarketSummary {
  /** 집계 범위 (수도권 또는 전국) */
  scope: '수도권' | '전국';
  /** 평균 거래가 (만원) */
  avgPrice: number;
  /** 전월 대비 변동률 (%) */
  priceChange: number;
  /** 이번 달 거래량 (건) */
  tradeCount: number;
  /** 기준 년월 (YYYY-MM) */
  baseYearMonth: string;
  /** 데이터 갱신 시각 (ISO 8601) */
  updatedAt: string;
}
