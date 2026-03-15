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
  lat?: number;
  /** 경도 (지도 마커용) */
  lng?: number;
  /** 최근 거래가 역대 최고가 여부 */
  isRecordHigh?: boolean;
  /** HOT 랭킹 순위 (TOP 10이면 1~10, 나머지 undefined) */
  hotRank?: number;
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
}

// ---- 청약 정보 ----

export type SubscriptionStatus = 'upcoming' | 'ongoing' | 'closed';

export interface Subscription {
  id: string;
  /** 단지명 */
  name: string;
  /** 건설사 */
  constructor: string;
  /** 위치 (시도) */
  sido: string;
  /** 위치 (시군구) */
  sigungu: string;
  /** 상세 주소 */
  address: string;
  /** 분양가 시작 (만원) */
  minPrice: number;
  /** 분양가 최대 (만원) */
  maxPrice: number;
  /** 총 공급 세대수 */
  totalSupply: number;
  /** 청약 상태 */
  status: SubscriptionStatus;
  /** 접수 시작일 (YYYY-MM-DD) */
  startDate: string;
  /** 접수 마감일 (YYYY-MM-DD) */
  endDate: string;
  /** 당첨자 발표일 (YYYY-MM-DD) */
  announceDate: string;
  /** 청약 유형 (일반/특별/기관추천) */
  type: string;
  /** 마감까지 남은 일수 */
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
  /** 아파트명 */
  아파트?: string[];
  /** 전용면적 */
  전용면적?: string[];
  /** 층 */
  층?: string[];
  /** 거래금액 */
  거래금액?: string[];
  /** 년 */
  년?: string[];
  /** 월 */
  월?: string[];
  /** 일 */
  일?: string[];
  /** 법정동 */
  법정동?: string[];
  /** 법정동본번코드 */
  법정동본번코드?: string[];
  /** 법정동부번코드 */
  법정동부번코드?: string[];
  /** 건축년도 */
  건축년도?: string[];
  /** 도로명 */
  도로명?: string[];
  /** 단지코드 */
  단지코드?: string[];
  /** 지역코드 */
  지역코드?: string[];
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
  sort?: 'deadline' | 'price' | 'latest'; // MAJOR-04 추가
}

export interface TrendQueryParams {
  regionCode: string;
  type?: 'weekly' | 'monthly';
}
