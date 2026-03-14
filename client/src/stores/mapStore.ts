import { create } from 'zustand';
import type { Apartment, PriceFilter } from '../types';

interface MapState {
  // 지도 중심 좌표 (기본: 서울 시청)
  centerLat: number;
  centerLng: number;
  // 줌 레벨
  zoomLevel: number;
  // 선택된 아파트
  selectedApartment: Apartment | null;
  // 바텀시트 표시 여부
  isBottomSheetOpen: boolean;
  // 가격 필터
  priceFilter: PriceFilter;

  // 액션
  setCenter: (lat: number, lng: number) => void;
  setZoomLevel: (level: number) => void;
  setSelectedApartment: (apt: Apartment | null) => void;
  openBottomSheet: () => void;
  closeBottomSheet: () => void;
  setPriceFilter: (filter: PriceFilter) => void;
}

export const useMapStore = create<MapState>((set) => ({
  // 기본값: 서울 시청
  centerLat: 37.5665,
  centerLng: 126.9780,
  zoomLevel: 7,
  selectedApartment: null,
  isBottomSheetOpen: false,
  priceFilter: 'all',

  setCenter: (lat, lng) => set({ centerLat: lat, centerLng: lng }),
  setZoomLevel: (level) => set({ zoomLevel: level }),
  setSelectedApartment: (apt) =>
    set({ selectedApartment: apt, isBottomSheetOpen: apt !== null }),
  openBottomSheet: () => set({ isBottomSheetOpen: true }),
  closeBottomSheet: () => set({ isBottomSheetOpen: false, selectedApartment: null }),
  setPriceFilter: (filter) => set({ priceFilter: filter }),
}));
