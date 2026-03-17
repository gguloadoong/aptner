import { create } from 'zustand';
import type { Apartment, PriceFilter, LayerFilters, AreaFilter, UnitCountFilter, ComplexFeature } from '../types';

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
  // 레이어 필터 (HOT / 최고가 경신 / 청약) — 다중 ON/OFF
  layerFilters: LayerFilters;
  // 평형 필터 — 단일 선택
  areaFilter: AreaFilter;
  // 세대수 필터 — 단일 선택
  unitCountFilter: UnitCountFilter;
  // 단지 특성 필터 — 다중 선택
  complexFeatures: Set<ComplexFeature>;

  // 액션
  setCenter: (lat: number, lng: number) => void;
  setZoomLevel: (level: number) => void;
  setSelectedApartment: (apt: Apartment | null) => void;
  openBottomSheet: () => void;
  closeBottomSheet: () => void;
  setPriceFilter: (filter: PriceFilter) => void;
  setLayerFilter: (key: keyof LayerFilters, value: boolean) => void;
  setAreaFilter: (filter: AreaFilter) => void;
  setUnitCountFilter: (filter: UnitCountFilter) => void;
  toggleComplexFeature: (feature: ComplexFeature) => void;
  clearComplexFeatures: () => void;
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
  unitCountFilter: 'all',
  complexFeatures: new Set(),

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
  // 세대수 필터 단일 선택
  setUnitCountFilter: (filter) => set({ unitCountFilter: filter }),
  // 단지 특성 토글 — Zustand가 Set 변이를 추적 못하므로 new Set()으로 교체
  toggleComplexFeature: (feature) =>
    set((state) => {
      const next = new Set(state.complexFeatures);
      if (next.has(feature)) { next.delete(feature); } else { next.add(feature); }
      return { complexFeatures: next };
    }),
  // 단지 특성 전체 초기화
  clearComplexFeatures: () => set({ complexFeatures: new Set() }),
}));
