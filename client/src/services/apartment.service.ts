import api from './api';
import type { Apartment, TradeHistory, MapApartment, MarkerType, ComplexFeature, ApartmentComplex } from '../types';
import { getSubscriptions } from './subscription.service';
import {
  MOCK_APARTMENTS,
  MOCK_TRADE_HISTORIES,
  MOCK_MAP_APARTMENTS,
} from '../mocks/apartments.mock';

// 개발 환경에서 Mock 데이터 사용 여부 (VITE_USE_MOCK=true, demo key, 또는 API URL 없는 경우)
const USE_MOCK =
  import.meta.env.VITE_USE_MOCK === 'true' ||
  import.meta.env.VITE_KAKAO_MAP_KEY === 'demo_key_replace_with_real_key' ||
  !import.meta.env.VITE_API_BASE_URL; // API URL 없으면 자동 Mock

// 뷰포트 내 아파트 마커 조회 (지도용) — 청약 데이터 병합 포함
export async function getApartmentsByBounds(
  swLat: number,
  swLng: number,
  neLat: number,
  neLng: number,
  priceFilter?: string
): Promise<MapApartment[]> {
  if (USE_MOCK) {
    await delay(300);
    let data = MOCK_MAP_APARTMENTS.filter(
      (apt) =>
        apt.lat >= swLat &&
        apt.lat <= neLat &&
        apt.lng >= swLng &&
        apt.lng <= neLng
    );

    // 가격 필터 적용
    if (priceFilter && priceFilter !== 'all') {
      data = data.filter((apt) => {
        if (priceFilter === 'under5') return apt.price < 50000;
        if (priceFilter === '5to10') return apt.price >= 50000 && apt.price < 100000;
        if (priceFilter === 'over10') return apt.price >= 100000;
        return true;
      });
    }

    // 청약 데이터 병합 (Mock 환경에서는 간소화)
    const subApts = await getSubscriptionMapApartments();
    const subInBounds = subApts.filter(
      (apt) =>
        apt.lat >= swLat &&
        apt.lat <= neLat &&
        apt.lng >= swLng &&
        apt.lng <= neLng
    );

    return [...data, ...subInBounds];
  }

  // BE는 priceFilter 문자열('under5'|'5to10'|'over10') 그대로 수신
  // Promise.allSettled 사용: 핫 아파트 API 실패 시에도 지도 마커는 정상 표시
  const [mapResult, hotResult, subResult] = await Promise.allSettled([
    api.get<{ success: true; data: ApartmentMapMarker[] }>('/apartments/map', {
      params: { swLat, swLng, neLat, neLng, ...(priceFilter && priceFilter !== 'all' && { priceFilter }) },
    }),
    api.get<{ success: true; data: RawHotApartment[] }>('/apartments/hot', {
      params: { limit: 20 },
    }),
    getSubscriptionMapApartments(),
  ]);

  // 각 결과를 null/빈 배열로 처리 — 개별 API 실패가 전체 마커 렌더링을 막지 않음
  const mapResponse = mapResult.status === 'fulfilled' ? mapResult.value : null;
  const hotResponse = hotResult.status === 'fulfilled' ? hotResult.value : null;
  const subApts = subResult.status === 'fulfilled' ? subResult.value : [];

  if (mapResult.status === 'rejected') {
    console.warn('[getApartmentsByBounds] 지도 마커 API 실패:', mapResult.reason);
    return subApts;
  }
  if (hotResult.status === 'rejected') {
    console.warn('[getApartmentsByBounds] 핫 아파트 API 실패 (지도 마커는 정상 표시):', hotResult.reason);
  }

  // aptCode 기준으로 hot 여부 및 최고가 경신 여부를 빠르게 조회
  const hotMap = new Map(
    hotResponse?.data.data.map((h) => [h.aptCode, h]) ?? []
  );

  const markers: MapApartment[] = mapResponse!.data.data.map((raw) => {
    const hotData = hotMap.get(raw.id);
    let markerType: MarkerType = 'price';
    if (hotData?.isRecordHigh) markerType = 'allTimeHigh';
    else if (hotData?.hotRank != null) markerType = 'hot';

    // BE 불리언 특성 필드 → FE ComplexFeature[] 변환
    const features: ComplexFeature[] = [];
    if (raw.isBrand) features.push('brand');
    if (raw.isWalkSubway) features.push('station');
    if (raw.isLargeComplex) features.push('large');
    if (raw.isNewBuild) features.push('new');
    if (raw.isFlat) features.push('flat');
    if (raw.hasElementarySchool) features.push('school');

    return {
      id: raw.id,
      name: raw.name,
      lat: raw.lat,
      lng: raw.lng,
      price: raw.price,
      area: raw.area,
      priceChangeType: raw.priceChangeType,
      markerType,
      totalUnits: raw.unitCount,
      features: features.length > 0 ? features : undefined,
    };
  });

  // 뷰포트 내 청약 단지만 필터링하여 병합
  const subInBounds = subApts.filter(
    (apt) =>
      apt.lat >= swLat &&
      apt.lat <= neLat &&
      apt.lng >= swLng &&
      apt.lng <= neLng
  );

  return [...markers, ...subInBounds];
}

// 청약 데이터를 MapApartment 배열로 변환 (TASK 7)
async function getSubscriptionMapApartments(): Promise<MapApartment[]> {
  try {
    const [ongoingRes, upcomingRes] = await Promise.all([
      getSubscriptions({ status: 'ongoing' }),
      getSubscriptions({ status: 'upcoming' }),
    ]);

    const ongoingApts: MapApartment[] = ongoingRes.data
      .filter((sub) => sub.lat != null && sub.lng != null)
      .map((sub) => ({
        id: `sub-${sub.id}`,
        name: sub.name,
        lat: sub.lat!,
        lng: sub.lng!,
        price: sub.startPrice,
        area: sub.areas?.[0]?.area ?? '84',
        areas: sub.areas?.map((a) => a.area) ?? [],
        priceChangeType: 'flat' as const,
        markerType: 'subOngoing' as MarkerType,
        subDeadline: sub.deadline,
        subStartDate: sub.startDate,
        subId: sub.id,
      }));

    const upcomingApts: MapApartment[] = upcomingRes.data
      .filter((sub) => sub.lat != null && sub.lng != null)
      .map((sub) => ({
        id: `sub-${sub.id}`,
        name: sub.name,
        lat: sub.lat!,
        lng: sub.lng!,
        price: sub.startPrice,
        area: sub.areas?.[0]?.area ?? '84',
        areas: sub.areas?.map((a) => a.area) ?? [],
        priceChangeType: 'flat' as const,
        markerType: 'subUpcoming' as MarkerType,
        subDeadline: sub.deadline,
        subStartDate: sub.startDate,
        subId: sub.id,
      }));

    return [...ongoingApts, ...upcomingApts];
  } catch (err) {
    // 청약 데이터 실패해도 지도 마커는 정상 표시
    console.warn('[getSubscriptionMapApartments] 청약 데이터 로드 실패:', err);
    return [];
  }
}


// BE /apartments/map 응답 단건 타입 (markerType 없음)
interface ApartmentMapMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  price: number;
  area: string;
  priceChangeType: 'up' | 'down' | 'flat';
  /** BE ApartmentMapMarker.unitCount → FE MapApartment.totalUnits */
  unitCount?: number;
  isBrand?: boolean;
  isWalkSubway?: boolean;
  isLargeComplex?: boolean;
  isNewBuild?: boolean;
  isFlat?: boolean;
  hasElementarySchool?: boolean;
}

// BE HotApartment 타입 → FE Apartment 타입 변환 어댑터 (TASK 8)
// isRecordHigh, hotRank 필드 반영
interface RawHotApartment {
  aptCode: string;
  apartmentName: string;
  lawdNm: string;
  lat?: number;
  lng?: number;
  area: number;
  recentPrice: number;
  priceChangeRate: number;
  priceChange: number;
  rank?: number;
  isRecordHigh?: boolean;
  hotRank?: number;
  // 아파트 상세 조회 시 추가 반환 필드
  totalUnits?: number;
  buildYear?: number;
  builder?: string;
  address?: string;
  lawdCd?: string;
  areas?: Array<{ area: number; recentPrice: number }>;
}

function adaptHotApartment(raw: RawHotApartment, index: number): Apartment {
  // areas 배열: BE 상세 조회 시 면적별 요약 배열 제공, 없으면 기본 단일 면적
  const areaStrings: string[] =
    raw.areas && raw.areas.length > 0
      ? raw.areas.map((a) => String(Math.round(a.area)))
      : [String(raw.area)];

  return {
    id: raw.aptCode,
    name: raw.apartmentName,
    // BE 상세 조회 시 address 필드 존재, 없으면 lawdNm으로 fallback
    address: raw.address ?? raw.lawdNm,
    district: raw.lawdNm.split(' ').slice(0, 2).join(' '),
    dong: raw.lawdNm.split(' ')[2] || '',
    // M-3: || 연산자는 0이 falsy라 lat/lng=0인 경우 fallback으로 대체됨 → ?? 로 수정
    lat: raw.lat ?? 37.5665,
    lng: raw.lng ?? 126.978,
    // BE 상세 조회 시 totalUnits, buildYear, builder 제공
    totalUnits: raw.totalUnits ?? 0,
    builtYear: raw.buildYear ?? 0,
    builder: raw.builder ?? '',
    areas: areaStrings,
    recentPrice: raw.recentPrice,
    recentPriceArea: String(raw.area),
    priceChange: raw.priceChangeRate,
    priceChangeType: raw.priceChange > 0 ? 'up' : raw.priceChange < 0 ? 'down' : 'flat',
    weeklyRank: raw.rank ?? index + 1,
    weeklyRankChange: 0,
    // BE 추가 필드 매핑
    isRecordHigh: raw.isRecordHigh ?? false,
    hotRank: raw.hotRank ?? raw.rank ?? index + 1,
    hotTags: [],  // BE에서 태그 미제공 시 빈 배열
    rankChange: 0,
    // 전세가율 조회용 법정동 코드
    lawdCd: raw.lawdCd,
  };
}

// 핫한 아파트 목록 조회
export async function getHotApartments(region?: string, limit = 10): Promise<Apartment[]> {
  if (USE_MOCK) {
    await delay(200);
    let data = [...MOCK_APARTMENTS].sort(
      (a, b) => (a.weeklyRank ?? 999) - (b.weeklyRank ?? 999)
    );
    if (region && region !== '전국') {
      data = data.filter((apt) => apt.address.includes(region));
    }
    return data.slice(0, limit);
  }

  // 버그 1 수정: BE 응답은 { success: true, data: RawHotApartment[] } 구조
  // response.data 자체가 래퍼 객체이므로 .data.data 로 배열에 접근해야 함
  const response = await api.get<{ success: true; data: RawHotApartment[] }>('/apartments/hot', {
    params: { region, limit },
  });
  return response.data.data.map((raw, index) => adaptHotApartment(raw, index));
}

// 아파트 상세 정보 조회
export async function getApartmentDetail(id: string): Promise<Apartment | null> {
  if (USE_MOCK) {
    await delay(300);
    return MOCK_APARTMENTS.find((apt) => apt.id === id) ?? null;
  }

  // BE 응답은 { success: true, data: HotApartment } 래퍼 구조
  // HotApartment → Apartment 어댑터를 통해 FE 타입으로 변환
  const response = await api.get<{ success: true; data: RawHotApartment }>(`/apartments/${id}`);
  if (!response.data.data) return null;
  return adaptHotApartment(response.data.data, 0);
}

// 아파트 실거래가 히스토리 조회
export async function getApartmentHistory(
  aptId: string,
  area?: string,
  months = 24
): Promise<TradeHistory[]> {
  if (USE_MOCK) {
    await delay(400);
    let data = MOCK_TRADE_HISTORIES[aptId] ?? [];
    if (area) {
      data = data.filter((t) => t.area === area);
    }

    // months 기간으로 필터링
    const now = new Date();
    const cutoff = new Date(now.getFullYear(), now.getMonth() - months, 1);
    data = data.filter((t) => {
      const [year, month] = t.date.split('-').map(Number);
      return new Date(year, month - 1, 1) >= cutoff;
    });

    return data.sort((a, b) => a.date.localeCompare(b.date));
  }

  // MAJOR-07: BE는 ApartmentTradeHistory(dealDate, price, area, floor)를 반환하므로 FE TradeHistory로 변환
  const response = await api.get<{ success: true; data: Array<{ dealDate: string; price: number; area: number; floor: number }> }>(
    `/apartments/${aptId}/history`,
    { params: { area, months } },
  );
  return response.data.data.map((raw, idx) => ({
    id: `${aptId}-${raw.dealDate}-${idx}`,
    apartmentId: aptId,
    date: raw.dealDate.slice(0, 7), // YYYY-MM-DD → YYYY-MM
    floor: raw.floor,
    area: String(Math.round(raw.area)),
    price: raw.price,
  }));
}

// 아파트 검색
export async function searchApartments(keyword: string): Promise<Apartment[]> {
  if (USE_MOCK) {
    await delay(200);
      return MOCK_APARTMENTS.filter(
      (apt) =>
        apt.name.includes(keyword) ||
        apt.address.includes(keyword) ||
        apt.district.includes(keyword) ||
        apt.dong.includes(keyword)
    ).slice(0, 10);
  }

  // BE 응답은 { success: true, data: HotApartment[] } 래퍼 구조
  // HotApartment → Apartment 어댑터를 통해 FE 타입으로 변환
  const response = await api.get<{ success: true; data: RawHotApartment[] }>('/apartments/search', {
    params: { q: keyword },
  });
  return response.data.data.map((raw, idx) => adaptHotApartment(raw, idx));
}

// 뷰포트 기준 아파트 단지 목록 조회 (호갱노노 스타일 - 좌표 없음, Geocoder 필요)
// BE: GET /api/apartments/complexes?swLat=&swLng=&neLat=&neLng=&zoom=
export async function getComplexesByBounds(params: {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
  zoom: number;
}): Promise<ApartmentComplex[]> {
  if (USE_MOCK) {
    await delay(300);
    // Mock: 서울 강남구 일대 샘플 단지 데이터
    return MOCK_APARTMENT_COMPLEXES;
  }

  const response = await api.get<{ success: true; data: ApartmentComplex[] }>(
    '/apartments/complexes',
    { params }
  );
  return response.data.data;
}

// Mock 단지 데이터 (좌표 없음 - Geocoder가 채워줌)
const MOCK_APARTMENT_COMPLEXES: ApartmentComplex[] = [
  {
    id: 'c001',
    name: '래미안 대치팰리스',
    address: '서울 강남구 대치동 316',
    lawdCd: '1168010200',
    umdNm: '대치동',
    latestPrice: 290000,
    latestDealDate: '2024-02-15',
    tradeCount: 12,
    area: 84,
    buildYear: 2015,
  },
  {
    id: 'c002',
    name: '은마아파트',
    address: '서울 강남구 대치동 316-1',
    lawdCd: '1168010200',
    umdNm: '대치동',
    latestPrice: 195000,
    latestDealDate: '2024-02-10',
    tradeCount: 8,
    area: 76,
    buildYear: 1979,
  },
  {
    id: 'c003',
    name: '도곡렉슬',
    address: '서울 강남구 도곡동 467',
    lawdCd: '1168010700',
    umdNm: '도곡동',
    latestPrice: 260000,
    latestDealDate: '2024-02-08',
    tradeCount: 5,
    area: 84,
    buildYear: 2002,
  },
  {
    id: 'c004',
    name: '개포주공1단지',
    address: '서울 강남구 개포동 주공1단지',
    lawdCd: '1168010100',
    umdNm: '개포동',
    latestPrice: 175000,
    latestDealDate: '2024-02-05',
    tradeCount: 3,
    area: 59,
    buildYear: 1982,
  },
  {
    id: 'c005',
    name: '타워팰리스',
    address: '서울 강남구 도곡동 467-15',
    lawdCd: '1168010700',
    umdNm: '도곡동',
    latestPrice: 400000,
    latestDealDate: '2024-01-30',
    tradeCount: 2,
    area: 164,
    buildYear: 2002,
  },
  {
    id: 'c006',
    name: '압구정현대아파트',
    address: '서울 강남구 압구정동 현대아파트',
    lawdCd: '1168010300',
    umdNm: '압구정동',
    latestPrice: 520000,
    latestDealDate: '2024-01-25',
    tradeCount: 4,
    area: 176,
    buildYear: 1976,
  },
  {
    id: 'c007',
    name: '삼성래미안',
    address: '서울 강남구 삼성동 140',
    lawdCd: '1168010500',
    umdNm: '삼성동',
    latestPrice: 210000,
    latestDealDate: '2024-02-12',
    tradeCount: 6,
    area: 84,
    buildYear: 1998,
  },
  {
    id: 'c008',
    name: '청담자이',
    address: '서울 강남구 청담동 청담자이',
    lawdCd: '1168010600',
    umdNm: '청담동',
    latestPrice: 340000,
    latestDealDate: '2024-02-01',
    tradeCount: 3,
    area: 114,
    buildYear: 2010,
  },
  {
    id: 'c009',
    name: '반포자이',
    address: '서울 서초구 반포동 반포자이',
    lawdCd: '1165010100',
    umdNm: '반포동',
    latestPrice: 380000,
    latestDealDate: '2024-02-14',
    tradeCount: 9,
    area: 84,
    buildYear: 2009,
  },
  {
    id: 'c010',
    name: '아크로리버파크',
    address: '서울 서초구 반포동 아크로리버파크',
    lawdCd: '1165010100',
    umdNm: '반포동',
    latestPrice: 460000,
    latestDealDate: '2024-02-13',
    tradeCount: 7,
    area: 84,
    buildYear: 2016,
  },
];

// 입주 물량 예정 데이터 조회
export async function getSupplyData(
  region = '전국',
  months = 12
): Promise<SupplyDataPoint[]> {
  if (USE_MOCK) {
    await delay(200);
    return generateMockSupply(region, months);
  }
  const response = await api.get<{ success: true; data: SupplyDataPoint[] }>(
    '/trends/supply',
    { params: { region, months } }
  );
  return response.data.data;
}

export interface SupplyDataPoint {
  month: string;
  units: number;
  year: number;
  monthNum: number;
}

function generateMockSupply(region: string, months: number): SupplyDataPoint[] {
  const multiplier: Record<string, number> = {
    '서울': 0.6, '경기': 1.8, '인천': 0.9, '부산': 0.7, '전국': 3.0,
  };
  const mult = multiplier[region] ?? 1.0;
  const seasonal = [2200, 1800, 3100, 3600, 3900, 2400, 2100, 2000, 3500, 3800, 3300, 2600];
  const now = new Date();
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const base = seasonal[(month - 1) % 12];
    const variance = Math.floor((Math.sin(i * 1.7) * 0.2) * base);
    return {
      month: `${year}.${String(month).padStart(2, '0')}`,
      units: Math.max(500, Math.round((base + variance) * mult)),
      year,
      monthNum: month,
    };
  });
}

// Mock 딜레이 헬퍼
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
