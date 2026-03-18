import { useQuery } from '@tanstack/react-query';
import {
  getApartmentDetail,
  getApartmentHistory,
  getApartmentsByBounds,
  getHotApartments,
  getHotApartmentRanking,
  searchApartments,
  getSupplyData,
} from '../services/apartment.service';

// 핫 아파트 목록 조회 훅
export function useHotApartments(region?: string, limit = 10) {
  return useQuery({
    queryKey: ['apartments', 'hot', region, limit],
    queryFn: () => getHotApartments(region, limit),
    staleTime: 5 * 60 * 1000, // 5분 캐시
    gcTime: 10 * 60 * 1000,
  });
}

// 아파트 상세 조회 훅
export function useApartmentDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['apartment', id],
    queryFn: () => getApartmentDetail(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// 실거래가 히스토리 조회 훅
export function useApartmentHistory(
  aptId: string | undefined,
  area?: string,
  months = 24
) {
  return useQuery({
    queryKey: ['apartment', aptId, 'history', area, months],
    queryFn: () => getApartmentHistory(aptId!, area, months),
    enabled: !!aptId,
    staleTime: 10 * 60 * 1000, // 10분 캐시
  });
}

// 지도용 아파트 마커 조회 훅
export function useApartmentsByBounds(
  swLat: number,
  swLng: number,
  neLat: number,
  neLng: number,
  priceFilter?: string,
  enabled = true
) {
  return useQuery({
    queryKey: ['apartments', 'bounds', swLat, swLng, neLat, neLng, priceFilter],
    queryFn: () => getApartmentsByBounds(swLat, swLng, neLat, neLng, priceFilter),
    enabled: enabled && swLat !== 0 && swLng !== 0,
    staleTime: 3 * 60 * 1000,
  });
}

// 아파트 검색 훅
export function useApartmentSearch(keyword: string) {
  return useQuery({
    queryKey: ['apartments', 'search', keyword],
    queryFn: () => searchApartments(keyword),
    enabled: keyword.length >= 2,
    staleTime: 2 * 60 * 1000,
  });
}

// 입주 물량 예정 훅
export function useSupplyData(region = '전국', months = 12) {
  return useQuery({
    queryKey: ['supply', region, months],
    queryFn: () => getSupplyData(region, months),
    staleTime: 60 * 60 * 1000, // 1시간
  });
}

// HOT 아파트 랭킹 조회 훅 (HotApartment[] 반환 — HotApartmentSection 전용)
export function useHotRanking(region?: string, limit = 3) {
  return useQuery({
    queryKey: ['apartments', 'hotRanking', region, limit],
    queryFn: () => getHotApartmentRanking(region, limit),
    staleTime: 5 * 60 * 1000,
  });
}
