// 아파트 단지 기본 정보
export interface Apartment {
  id: string;
  name: string;
  address: string;
  district: string; // 시군구
  dong: string; // 동
  lat?: number; // Geocoder 변환 전엔 undefined일 수 있음
  lng?: number; // Geocoder 변환 전엔 undefined일 수 있음
  totalUnits: number;
  builtYear: number;
  builder: string;
  areas: string[]; // 면적 목록 (예: ['59', '84', '114'])
  recentPrice: number; // 최근 거래가 (만원)
  recentPriceArea: string; // 기준 면적
  priceChange: number; // 변동률 (%)
  priceChangeType: 'up' | 'down' | 'flat';
  weeklyRank?: number;
  weeklyRankChange?: number | 'new';
  isRecordHigh?: boolean;  // BE HotApartment: 역대 최고가 여부
  hotRank?: number;        // BE HotApartment: HOT 단지 순위
  features?: ComplexFeature[]; // 단지 특성 (브랜드/역세권/대단지/신축/평지/초품아)
  hotTags?: string[];          // HOT 이유 태그 (예: ['거래 급증', '최고가 경신'])
  rankChange?: number;         // 순위 변동: +2 = 2단계 상승, -1 = 하락, 0 = 유지
  lawdCd?: string;             // 법정동 코드 (5자리, 전세가율 조회용)
}

// 실거래 내역
export interface TradeHistory {
  id: string;
  apartmentId: string;
  dealDate: string; // YYYY-MM (MAJOR-07: BE dealDate 필드명 통일)
  floor: number;
  area: string; // 면적 (예: '84')
  price: number; // 만원
}

// 청약 일정 상세 (BE schedule 필드)
export interface SubscriptionSchedule {
  announceDate?: string;      // 당첨자 발표일 (YYYY-MM-DD)
  contractStartDate?: string; // 계약 시작일 (YYYY-MM-DD)
  contractEndDate?: string;   // 계약 종료일 (YYYY-MM-DD)
}

// 청약 정보 (BE 확정 타입 — CRIT-01)
export interface Subscription {
  id: string;
  name: string;           // 단지명
  location: string;       // 공급 지역
  status: 'ongoing' | 'upcoming' | 'closed';
  startDate: string;      // ISO 8601
  endDate: string;        // ISO 8601
  dDay: number;           // 음수면 마감
  totalUnits: number;
  supplyPrice?: number;   // 분양가 (만원), optional
  // FE 내부 확장 필드 (어댑터 레이어에서 채워짐)
  district?: string;
  areas: SubscriptionArea[];
  schedule?: SubscriptionSchedule; // BE 제공 일정 정보
  address?: string;   // 상세 주소 (Kakao Geocoder 입력용)
  lat?: number;
  lng?: number;
}

export interface SubscriptionArea {
  typeName?: string;  // 평형 이름 (예: 59A)
  area: string;       // 전용 면적 문자열 (m²)
  units: number;      // 공급 세대수
  price: number;      // 분양가 (만원)
  generalRatio?: number;
  lotteryRatio?: number;
}

// 지역별 트렌드
export interface RegionTrend {
  region: string;
  avgPrice: number; // 평균 가격 (만원)
  priceChange: number; // 변동률 (%)
  tradeVolume: number; // 거래량
  hotApartments: Apartment[];
}

// 마커 렌더링 타입 (5종)
export type MarkerType = 'price' | 'hot' | 'allTimeHigh' | 'subOngoing' | 'subUpcoming';

// 평형 필터 타입
export type AreaFilter = '59' | '74' | '84' | '109plus' | 'all';

// 레이어 필터 타입
export interface LayerFilters {
  hot: boolean;
  allTimeHigh: boolean;
  subscription: boolean;
}

// 지도 마커용 데이터
export interface MapApartment {
  id: string;
  name: string;
  lat: number;
  lng: number;
  price: number; // 만원
  area: string;
  areas?: string[];          // 평형 필터용 전체 평형 목록
  priceChangeType: 'up' | 'down' | 'flat';
  markerType?: MarkerType;   // 마커 렌더링 타입 결정
  subDeadline?: string;      // 청약 마감일 YYYY-MM-DD (청약 마커 전용)
  subStartDate?: string;     // 청약 시작일 YYYY-MM-DD (청약 마커 전용)
  subId?: string;            // 청약 ID (Subscription 테이블 FK)
  totalUnits?: number;       // 세대수 필터용
  features?: ComplexFeature[]; // 단지 특성 필터용
  volumeSurge?: boolean;     // 거래량 급등 여부
  volumeChangeRate?: number;  // 전주 대비 거래량 변화율 (%)
}

// 카카오맵 타입 선언
declare global {
  interface Window {
    kakao: KakaoMaps;
  }
}

// 카카오 Places 검색 결과 단건 타입
export interface KakaoPlaceResult {
  place_name: string;   // 장소명
  x: string;           // 경도 (lng)
  y: string;           // 위도 (lat)
  address_name: string; // 지번 주소
  road_address_name: string; // 도로명 주소
  id: string;
}

// 카카오 Places 검색 서비스 인터페이스
export interface KakaoPlacesService {
  categorySearch: (
    code: string,
    callback: (result: KakaoPlaceResult[], status: string) => void,
    options: {
      bounds?: unknown;
      size?: number;
    }
  ) => void;
}

export interface KakaoMaps {
  maps: {
    load: (callback: () => void) => void;
    Map: new (container: HTMLElement, options: object) => KakaoMap;
    LatLng: new (lat: number, lng: number) => KakaoLatLng;
    CustomOverlay: new (options: object) => KakaoCustomOverlay;
    // 거래량 히트맵 레이어용 원형 오버레이
    Circle: new (options: object) => KakaoCircle;
    event: {
      addListener: (target: object, type: string, handler: () => void) => void;
      removeListener: (target: object, type: string, handler: () => void) => void;
    };
    // Places 검색 서비스 (AT4: 아파트 카테고리)
    services: {
      Places: new () => KakaoPlacesService;
      Status: {
        OK: string;
        ZERO_RESULT: string;
        ERROR: string;
      };
    };
    // 현재 지도 뷰포트 bounds 조회용 (SW, NE 좌표로 bounds 생성 또는 빈 인스턴스)
    LatLngBounds: new (sw?: KakaoLatLng, ne?: KakaoLatLng) => unknown;
  };
}

// 카카오맵 Circle 오버레이 인터페이스
export interface KakaoCircle {
  setMap: (map: unknown) => void;
}

export interface KakaoMap {
  getCenter: () => KakaoLatLng;
  getLevel: () => number;
  getBounds: () => KakaoBounds;
  setCenter: (latlng: KakaoLatLng) => void;
  setLevel: (level: number) => void;
  relayout: () => void;
}

export interface KakaoLatLng {
  getLat: () => number;
  getLng: () => number;
}

export interface KakaoBounds {
  getSouthWest: () => KakaoLatLng;
  getNorthEast: () => KakaoLatLng;
}

export interface KakaoCustomOverlay {
  setMap: (map: KakaoMap | null) => void;
  getPosition: () => KakaoLatLng;
}

// 핫 아파트 랭킹 타입 (BE /api/apartments/hot 응답 — P1 HotRankingPage)
export interface HotApartment {
  rank: number;
  rankChange: number | null; // 양수=상승, 음수=하락, 0=유지, null=신규
  aptCode: string;
  name: string;
  location: string;
  recentPrice: number;       // 원 단위
  tradeCount: number;
  tradeSurgeRate: number;    // % (정수, e.g. 340)
}

// 신고가 경신 단지 타입 (홈 v2 RecordHighSection)
export interface RecordHighApartment {
  aptName: string;
  location: string;
  area: number;
  recentPrice: number;      // 만원
  previousPrice: number;    // 만원
  priceChangeRate: number;  // %
  dealDate: string;         // "YYYY-MM"
  lawdCd: string;
}

// API 응답 공통 타입
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// 가격 필터 타입
export type PriceFilter = 'all' | 'under5' | '5to10' | 'over10';

// 세대수 필터 (단일 선택)
export type UnitCountFilter = 'all' | '500plus' | '1000plus' | '2000plus';

// 단지 특성 (다중 선택)
export type ComplexFeature = 'brand' | 'station' | 'large' | 'new' | 'flat' | 'school';

// 청약 상태 탭 타입
export type SubscriptionStatus = 'ongoing' | 'upcoming' | 'closed';

// 정렬 기준 타입
export type SortOrder = 'deadline' | 'price' | 'latest';

// BE /api/apartments/complexes 응답 단지 타입
// lat/lng는 Geocoder 변환 후 채워짐
export interface ApartmentComplex {
  id: string;
  name: string;
  address: string;       // 도로명 주소
  lawdCd: string;        // 법정동 코드
  umdNm: string;         // 읍면동명
  latestPrice: number;   // 최근 거래가 (만원)
  latestDealDate: string; // 최근 거래일 YYYY-MM-DD
  tradeCount: number;    // 최근 거래횟수
  area: number;          // 기준 면적 (㎡)
  buildYear?: number;    // 준공연도
  lat?: number;          // Geocoder 변환 후 채워짐
  lng?: number;          // Geocoder 변환 후 채워짐
  priceChange?: number;           // 가격 변동률 (%) — BE 응답 시 채워짐
  priceChangeType?: 'up' | 'down' | 'flat'; // 가격 변동 방향 — BE 응답 시 채워짐
}
