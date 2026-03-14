import api from './api';
import type { Apartment, TradeHistory, MapApartment } from '../types';
import {
  MOCK_APARTMENTS,
  MOCK_TRADE_HISTORIES,
  MOCK_MAP_APARTMENTS,
} from '../mocks/apartments.mock';

// 개발 환경에서 Mock 데이터 사용 여부
const USE_MOCK = import.meta.env.VITE_KAKAO_MAP_KEY === 'demo_key_replace_with_real_key';

// 뷰포트 내 아파트 마커 조회 (지도용)
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

    return data;
  }

  const response = await api.get<MapApartment[]>('/apartments/map', {
    params: { swLat, swLng, neLat, neLng, priceFilter },
  });
  return response.data;
}

// BE HotApartment 타입 → FE Apartment 타입 변환 어댑터
function adaptHotApartment(raw: any, index: number): Apartment {
  return {
    id: raw.aptCode,
    name: raw.apartmentName,
    address: raw.lawdNm,
    district: raw.lawdNm.split(' ').slice(0, 2).join(' '),
    dong: raw.lawdNm.split(' ')[2] || '',
    lat: raw.lat || 37.5665,
    lng: raw.lng || 126.978,
    totalUnits: 0,
    builtYear: 0,
    builder: '',
    areas: [String(raw.area)],
    recentPrice: raw.recentPrice,
    recentPriceArea: String(raw.area),
    priceChange: raw.priceChangeRate,
    priceChangeType: raw.priceChange > 0 ? 'up' : raw.priceChange < 0 ? 'down' : 'flat',
    weeklyRank: raw.rank ?? index + 1,
    weeklyRankChange: 0,
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

  const response = await api.get<any[]>('/apartments/hot', {
    params: { region, limit },
  });
  // BE 응답이 HotApartment 배열인 경우 FE Apartment 타입으로 변환
  return response.data.map((raw, index) => adaptHotApartment(raw, index));
}

// 아파트 상세 정보 조회
export async function getApartmentDetail(id: string): Promise<Apartment | null> {
  if (USE_MOCK) {
    await delay(300);
    return MOCK_APARTMENTS.find((apt) => apt.id === id) ?? null;
  }

  const response = await api.get<Apartment>(`/apartments/${id}`);
  return response.data;
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

  const response = await api.get<Apartment[]>('/apartments/search', {
    params: { q: keyword },
  });
  return response.data;
}

// Mock 딜레이 헬퍼
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
