// 아파트 단지 기본 정보
export interface Apartment {
  id: string;
  name: string;
  address: string;
  district: string; // 시군구
  dong: string; // 동
  lat: number;
  lng: number;
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
}

// 실거래 내역
export interface TradeHistory {
  id: string;
  apartmentId: string;
  date: string; // YYYY-MM
  floor: number;
  area: string; // 면적 (예: '84')
  price: number; // 만원
}

// 청약 정보
export interface Subscription {
  id: string;
  name: string;
  location: string;
  district: string;
  startPrice: number; // 최저 분양가 (만원)
  maxPrice: number; // 최고 분양가 (만원)
  deadline: string; // YYYY-MM-DD
  startDate: string; // 청약 시작일
  status: 'ongoing' | 'upcoming' | 'closed';
  supplyUnits: number; // 공급 세대수
  type: 'general' | 'special'; // 일반/특별
  areas: SubscriptionArea[];
  lat?: number;
  lng?: number;
}

export interface SubscriptionArea {
  area: string;
  price: number; // 만원
  units: number;
  generalRatio: number; // 가점 비율 (%)
  lotteryRatio: number; // 추첨 비율 (%)
}

// 지역별 트렌드
export interface RegionTrend {
  region: string;
  avgPrice: number; // 평균 가격 (만원)
  priceChange: number; // 변동률 (%)
  tradeVolume: number; // 거래량
  hotApartments: Apartment[];
}

// 지도 마커용 데이터
export interface MapApartment {
  id: string;
  name: string;
  lat: number;
  lng: number;
  price: number; // 만원
  area: string;
  priceChangeType: 'up' | 'down' | 'flat';
}

// 카카오맵 타입 선언
declare global {
  interface Window {
    kakao: KakaoMaps;
  }
}

export interface KakaoMaps {
  maps: {
    load: (callback: () => void) => void;
    Map: new (container: HTMLElement, options: object) => KakaoMap;
    LatLng: new (lat: number, lng: number) => KakaoLatLng;
    CustomOverlay: new (options: object) => KakaoCustomOverlay;
    event: {
      addListener: (target: object, type: string, handler: () => void) => void;
    };
  };
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

// API 응답 공통 타입
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// 가격 필터 타입
export type PriceFilter = 'all' | 'under5' | '5to10' | 'over10';

// 청약 상태 탭 타입
export type SubscriptionStatus = 'ongoing' | 'upcoming' | 'closed';

// 정렬 기준 타입
export type SortOrder = 'deadline' | 'price' | 'latest';
