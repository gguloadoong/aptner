import { create } from 'zustand';
import type { Apartment, PriceFilter, LayerFilters, AreaFilter } from '../types';

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
  // 레이어 필터 (HOT / 신고가 / 청약) — 다중 ON/OFF
  layerFilters: LayerFilters;
  // 평형 필터 — 단일 선택
  areaFilter: AreaFilter;

  // 액션
  setCenter: (lat: number, lng: number) => void;
  setZoomLevel: (level: number) => void;
  setSelectedApartment: (apt: Apartment | null) => void;
  openBottomSheet: () => void;
  closeBottomSheet: () => void;
  setPriceFilter: (filter: PriceFilter) => void;
  setLayerFilter: (key: keyof LayerFilters, value: boolean) => void;
  setAreaFilter: (filter: AreaFilter) => void;
}

export const useMapStore = create<MapState>((set) => ({
  // 기본값: 서울 시청
  centerLat: 37.5665,
  centerLng: 126.9780,
  zoomLevel: 7,
  selectedApartment: null,
  isBottomSheetOpen: false,
  priceFilter: 'all',
  layerFilters: { hot: false, allTimeHigh: false, subscription: false },
  areaFilter: 'all',

  setCenter: (lat, lng) => set({ centerLat: lat, centerLng: lng }),
  setZoomLevel: (level) => set({ zoomLevel: level }),
  setSelectedApartment: (apt) =>
    set({ selectedApartment: apt, isBottomSheetOpen: apt !== null }),
  openBottomSheet: () => set({ isBottomSheetOpen: true }),
  closeBottomSheet: () => set({ isBottomSheetOpen: false, selectedApartment: null }),
  setPriceFilter: (filter) => set({ priceFilter: filter }),
  // 레이어 필터 개별 토글
  setLayerFilter: (key, value) =>
    set((state) => ({
      layerFilters: { ...state.layerFilters, [key]: value },
    })),
  // 평형 필터 단일 선택
  setAreaFilter: (filter) => set({ areaFilter: filter }),
}));
