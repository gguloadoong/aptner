import api from './api';
import type { Apartment, TradeHistory, MapApartment, MarkerType, ComplexFeature, ApartmentComplex, HotApartment, RecordHighApartment } from '../types';
import { getSubscriptions } from './subscription.service';
import {
  MOCK_APARTMENTS,
  MOCK_TRADE_HISTORIES,
  MOCK_MAP_APARTMENTS,
  MOCK_HOT_APARTMENTS,
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

  // 단지명 정규화 (공백·괄호 제거, 소문자) 기준으로 hot 여부 및 최고가 경신 여부 조회
  // aptCode는 MOLIT 마커 id 포맷(11680-0)과 달라 이름 매칭을 사용
  const normalizeApt = (s: string) => s.replace(/\s+/g, '').replace(/[()（）]/g, '').toLowerCase();
  const hotMap = new Map(
    hotResponse?.data.data.map((h) => [normalizeApt(h.name ?? h.apartmentName ?? ''), h]) ?? []
  );

  const markers: MapApartment[] = mapResponse!.data.data.map((raw) => {
    const hotData = hotMap.get(normalizeApt(raw.name));
    let markerType: MarkerType = 'price';
    if (hotData?.isRecordHigh || raw.isRecordHigh) markerType = 'allTimeHigh';
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
      lawdNm: raw.lawdNm,
      umdNm: raw.umdNm,
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

// Kakao Geocoder 결과 캐시 (address → {lat, lng})
const _geocodeCache = new Map<string, { lat: number; lng: number } | null>();

// 주소 문자열 → 위경도 변환 (Kakao JS SDK Geocoder 사용)
function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (_geocodeCache.has(address)) {
    return Promise.resolve(_geocodeCache.get(address)!);
  }

  return new Promise((resolve) => {
    try {
      const kakao = (window as unknown as { kakao?: { maps?: { services?: { Geocoder?: new () => unknown } } } }).kakao;
      if (!kakao?.maps?.services?.Geocoder) {
        _geocodeCache.set(address, null);
        resolve(null);
        return;
      }
      type GeoResult = { x: string; y: string };
      type GeoStatus = string;
      interface GeocoderInstance {
        addressSearch(addr: string, cb: (result: GeoResult[], status: GeoStatus) => void): void;
      }
      const geocoder = new (kakao.maps.services.Geocoder as new () => GeocoderInstance)();
      geocoder.addressSearch(address, (result, status) => {
        if (status === 'OK' && result[0]) {
          const coords = { lat: parseFloat(result[0].y), lng: parseFloat(result[0].x) };
          _geocodeCache.set(address, coords);
          resolve(coords);
        } else {
          _geocodeCache.set(address, null);
          resolve(null);
        }
      });
    } catch {
      _geocodeCache.set(address, null);
      resolve(null);
    }
  });
}

// 청약 데이터를 MapApartment 배열로 변환 (TASK 7)
async function getSubscriptionMapApartments(): Promise<MapApartment[]> {
  try {
    const [ongoingRes, upcomingRes] = await Promise.all([
      getSubscriptions({ status: 'ongoing' }),
      getSubscriptions({ status: 'upcoming' }),
    ]);

    const allSubs = [
      ...ongoingRes.data.map((s) => ({ ...s, markerType: 'subOngoing' as MarkerType })),
      ...upcomingRes.data.map((s) => ({ ...s, markerType: 'subUpcoming' as MarkerType })),
    ];

    // lat/lng 없는 청약은 address로 지오코딩 (최대 10개, 카카오 부하 방지)
    const needGeocode = allSubs.filter((s) => (s.lat == null || s.lng == null) && s.address);
    const geocodeBatch = needGeocode.slice(0, 10);
    await Promise.all(
      geocodeBatch.map(async (s) => {
        const coords = await geocodeAddress(s.address!);
        if (coords) {
          s.lat = coords.lat;
          s.lng = coords.lng;
        }
      })
    );

    return allSubs
      .filter((sub) => sub.lat != null && sub.lng != null)
      .map((sub) => ({
        id: `sub-${sub.id}`,
        name: sub.name,
        lat: sub.lat!,
        lng: sub.lng!,
        price: sub.supplyPrice ?? 0,
        area: sub.areas?.[0]?.area ?? '84',
        areas: sub.areas?.map((a) => a.area) ?? [],
        priceChangeType: 'flat' as const,
        markerType: sub.markerType,
        subDeadline: sub.endDate,
        subStartDate: sub.startDate,
        subId: sub.id,
      }));
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
  lawdNm?: string;
  umdNm?: string;
  priceChangeType: 'up' | 'down' | 'flat';
  /** BE ApartmentMapMarker.unitCount → FE MapApartment.totalUnits */
  unitCount?: number;
  isBrand?: boolean;
  isWalkSubway?: boolean;
  isLargeComplex?: boolean;
  isNewBuild?: boolean;
  isFlat?: boolean;
  hasElementarySchool?: boolean;
  isRecordHigh?: boolean;
}

// BE HotApartment 타입 → FE Apartment 타입 변환 어댑터 (TASK 8)
// isRecordHigh, hotRank 필드 반영
interface RawHotApartment {
  aptCode: string;
  // BE hot-ranking 신규 필드
  name?: string;
  location?: string;
  tradeSurgeRate?: number;
  tradeCount?: number;
  rankChange?: number | null;
  // BE 구 필드 (하위 호환)
  apartmentName?: string;
  lawdNm?: string;
  lat?: number;
  lng?: number;
  area?: number;
  recentPrice: number;
  priceChangeRate?: number;
  priceChange?: number;
  rank?: number;
  isRecordHigh?: boolean;
  hotRank?: number;
  totalUnits?: number;
  buildYear?: number;
  builder?: string;
  address?: string;
  lawdCd?: string;
  areas?: Array<{ area: number; recentPrice: number }>;
}

function adaptHotApartment(raw: RawHotApartment, index: number): Apartment {
  // hot-ranking 신규 필드(name/location) 또는 구 필드(apartmentName/lawdNm) 모두 지원
  const aptName = raw.name ?? raw.apartmentName ?? '';
  const locationStr = raw.location ?? raw.lawdNm ?? '';

  // areas 배열: BE 상세 조회 시 면적별 요약 배열 제공, 없으면 기본 단일 면적
  const areaStrings: string[] =
    raw.areas && raw.areas.length > 0
      ? raw.areas.map((a) => String(Math.round(a.area)))
      : raw.area ? [String(raw.area)] : [];

  return {
    id: raw.aptCode,
    name: aptName,
    address: raw.address ?? locationStr,
    district: locationStr.split(' ').slice(0, 2).join(' '),
    dong: locationStr.split(' ')[2] || '',
    // M-3: || 연산자는 0이 falsy라 lat/lng=0인 경우 fallback으로 대체됨 → ?? 로 수정
    lat: raw.lat ?? 37.5665,
    lng: raw.lng ?? 126.978,
    // BE 상세 조회 시 totalUnits, buildYear, builder 제공
    totalUnits: raw.totalUnits ?? 0,
    builtYear: raw.buildYear ?? 0,
    builder: raw.builder ?? '',
    areas: areaStrings,
    recentPrice: raw.recentPrice ?? 0,
    recentPriceArea: String(raw.area ?? 0),
    priceChange: raw.priceChangeRate ?? 0,
    priceChangeType: (raw.priceChangeRate ?? 0) > 0 ? 'up' : (raw.priceChangeRate ?? 0) < 0 ? 'down' : 'flat',
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
      const [year, month] = t.dealDate.split('-').map(Number);
      return new Date(year, month - 1, 1) >= cutoff;
    });

    return data.sort((a, b) => a.dealDate.localeCompare(b.dealDate));
  }

  // MAJOR-07: BE는 ApartmentTradeHistory(dealDate, price, area, floor)를 반환하므로 FE TradeHistory로 변환
  // MAJOR-06: area 파라미터는 반드시 String() 변환 후 전송
  const response = await api.get<{ success: true; data: Array<{ dealDate: string; price: number; area: number; floor: number }> }>(
    `/apartments/${aptId}/history`,
    { params: { area: area != null ? String(area) : undefined, months } },
  );
  return response.data.data.map((raw, idx) => ({
    id: `${aptId}-${raw.dealDate}-${idx}`,
    apartmentId: aptId,
    dealDate: raw.dealDate.slice(0, 7), // YYYY-MM-DD → YYYY-MM
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

// 전세가율 조회 (ComparePage 사용 — BE 미구현 시 null 반환)
export async function getJeonseRate(aptId: string, lawdCd?: string): Promise<number | null> {
  if (USE_MOCK) {
    await delay(200);
    // Mock: 50~75% 랜덤 전세가율
    const seed = aptId.charCodeAt(aptId.length - 1);
    return 50 + (seed % 26);
  }
  if (!lawdCd) return null;
  try {
    const response = await api.get<{ success: true; data: { jeonseRate: number } }>(
      `/apartments/${aptId}/jeonse-rate`,
      { params: { lawdCd } }
    );
    return response.data.data.jeonseRate;
  } catch {
    return null;
  }
}

// 핫 아파트 랭킹 조회 (HotRankingPage 전용 — HotApartment[] 반환)
// 기존 getHotApartments()는 지도 마커용 Apartment[] 반환이라 별도 함수로 분리
export async function getHotApartmentRanking(
  region?: string,
  limit = 20
): Promise<HotApartment[]> {
  if (USE_MOCK) {
    await delay(300);
    let data = [...MOCK_HOT_APARTMENTS];
    if (region && region !== '전국') {
      data = data.filter((apt) => apt.location.includes(region));
    }
    return data.slice(0, limit);
  }

  const REGION_CODE_MAP: Record<string, string> = {
    '서울': '11', '부산': '26', '대구': '27', '인천': '28',
    '광주': '29', '대전': '30', '울산': '31', '세종': '36',
    '경기': '41', '강원': '42', '충북': '43', '충남': '44',
    '전북': '45', '전남': '46', '경북': '47', '경남': '48', '제주': '50',
  };
  const regionCode = region && region !== '전국' ? REGION_CODE_MAP[region] : undefined;

  const response = await api.get<{ success: true; data: HotApartment[] }>(
    '/apartments/hot',
    { params: { region: regionCode, limit } }
  );
  return response.data.data;
}

// ────────────────────────────────────────────────────────────
// 지도 가격 마커용 API (카카오 Places 연동)
// ────────────────────────────────────────────────────────────

// 단지별 최근 거래가 응답 타입
export interface ApartmentMapPrice {
  aptName: string;      // 단지명 (Places place_name과 매칭)
  recentPrice: number;  // 최근 거래가 (만원) — BE 필드명과 일치
  lawdCd: string;       // 법정동 코드
  dealDate: string;     // 최근 거래일 YYYY-MM
}

// 좌표 → lawdCd 응답 타입 (BE: { lawdCd, sigungu } 필드명 그대로)
export interface LawdCdResponse {
  lawdCd: string;   // 5자리 시군구 코드
  sigungu: string;  // 지역명 (예: 서울 강남구)
}

// 지역 내 단지별 최근 거래가 조회
// BE: GET /api/apartments/map-prices?lawdCd=11200
export async function getMapPrices(lawdCd: string): Promise<ApartmentMapPrice[]> {
  if (USE_MOCK) {
    await delay(200);
    return MOCK_MAP_PRICES;
  }

  const response = await api.get<{ success: true; data: ApartmentMapPrice[] }>(
    '/apartments/map-prices',
    { params: { lawdCd } }
  );
  return response.data.data;
}

// 좌표 → 법정동 코드(lawdCd) 조회
// BE: GET /api/regions/lawdCd?lat=37.5&lng=127.0
export async function getLawdCdByCoords(lat: number, lng: number): Promise<LawdCdResponse | null> {
  if (USE_MOCK) {
    await delay(100);
    // Mock: 서울 기본 반환
    return { lawdCd: '11200', sigungu: '서울 성동구' };
  }

  try {
    const response = await api.get<{ success: true; data: LawdCdResponse }>(
      '/regions/lawdCd',
      { params: { lat, lng } }
    );
    return response.data.data;
  } catch {
    return null;
  }
}

// Mock 가격 데이터 (Places 매칭 테스트용)
const MOCK_MAP_PRICES: ApartmentMapPrice[] = [
  { aptName: '래미안 대치팰리스', recentPrice: 290000, lawdCd: '11680', dealDate: '2024-02' },
  { aptName: '은마아파트', recentPrice: 195000, lawdCd: '11680', dealDate: '2024-02' },
  { aptName: '도곡렉슬', recentPrice: 260000, lawdCd: '11680', dealDate: '2024-02' },
  { aptName: '타워팰리스', recentPrice: 400000, lawdCd: '11680', dealDate: '2024-01' },
  { aptName: '압구정현대아파트', recentPrice: 520000, lawdCd: '11680', dealDate: '2024-01' },
  { aptName: '반포자이', recentPrice: 380000, lawdCd: '11650', dealDate: '2024-02' },
  { aptName: '아크로리버파크', recentPrice: 460000, lawdCd: '11650', dealDate: '2024-02' },
  { aptName: '헬리오시티', recentPrice: 185000, lawdCd: '11710', dealDate: '2024-02' },
  { aptName: '잠실엘스', recentPrice: 230000, lawdCd: '11710', dealDate: '2024-02' },
  { aptName: '롯데캐슬골드파크', recentPrice: 140000, lawdCd: '11500', dealDate: '2024-02' },
];

// 신고가 경신 단지 Mock 데이터 (홈 v2)
const MOCK_RECORD_HIGHS: RecordHighApartment[] = [
  { aptName: '아크로리버파크', location: '서울 서초구 반포동', area: 84, recentPrice: 460000, previousPrice: 430000, priceChangeRate: 6.98, dealDate: '2026-03', lawdCd: '11650' },
  { aptName: '래미안 대치팰리스', location: '서울 강남구 대치동', area: 84, recentPrice: 295000, previousPrice: 278000, priceChangeRate: 6.12, dealDate: '2026-03', lawdCd: '11680' },
  { aptName: '압구정현대아파트', location: '서울 강남구 압구정동', area: 176, recentPrice: 540000, previousPrice: 510000, priceChangeRate: 5.88, dealDate: '2026-03', lawdCd: '11680' },
  { aptName: '반포자이', location: '서울 서초구 반포동', area: 84, recentPrice: 390000, previousPrice: 370000, priceChangeRate: 5.41, dealDate: '2026-03', lawdCd: '11650' },
  { aptName: '타워팰리스', location: '서울 강남구 도곡동', area: 164, recentPrice: 415000, previousPrice: 395000, priceChangeRate: 5.06, dealDate: '2026-03', lawdCd: '11680' },
];

// 신고가 경신 단지 조회 (홈 v2 RecordHighSection)
// GET /api/apartments/record-highs?region=수도권&limit=5
// 실패 시 Mock 5건 반환
export async function getRecordHighs(region = '수도권', limit = 5): Promise<RecordHighApartment[]> {
  if (USE_MOCK) {
    await delay(250);
    return MOCK_RECORD_HIGHS.slice(0, limit);
  }

  try {
    const response = await api.get<{ success: true; data: RecordHighApartment[] }>(
      '/apartments/record-highs',
      { params: { region, limit } }
    );
    return response.data.data;
  } catch (err) {
    console.warn('[getRecordHighs] API 호출 실패, Mock 데이터로 폴백:', err);
    await delay(250);
    return MOCK_RECORD_HIGHS.slice(0, limit);
  }
}

// Mock 딜레이 헬퍼
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
