import type { UnitCountFilter, ComplexFeature } from '../../types';

// 평형대 칩 옵션 (20/30/40/50평대 — 60~85/85~115/115~135/135㎡+ 범위)
export const PYEONG_FILTER_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: '20s', label: '20평대' },
  { value: '30s', label: '30평대' },
  { value: '40s', label: '40평대' },
  { value: '50plus', label: '50평대+' },
];

export const PRICE_FILTERS = [
  { value: 'all', label: '전체' },
  { value: 'under5', label: '5억 이하' },
  { value: '5to10', label: '5~10억' },
  { value: 'over10', label: '10억 이상' },
];

export const AREA_FILTERS = [
  { value: '59', label: '59㎡' },
  { value: '74', label: '74㎡' },
  { value: '84', label: '84㎡' },
  { value: '109plus', label: '109㎡+' },
];

export const UNIT_COUNT_OPTIONS = [
  { value: 'all' as UnitCountFilter, label: '전체' },
  { value: '500plus' as UnitCountFilter, label: '500세대+' },
  { value: '1000plus' as UnitCountFilter, label: '1000세대+' },
  { value: '2000plus' as UnitCountFilter, label: '2000세대+' },
];

export const COMPLEX_FEATURE_OPTIONS: { value: ComplexFeature; label: string }[] = [
  { value: 'brand', label: '브랜드' },
  { value: 'station', label: '역세권' },
  { value: 'large', label: '대단지' },
  { value: 'new', label: '신축' },
  { value: 'flat', label: '평지' },
  { value: 'school', label: '초품아' },
];

// 카카오맵 줌 레벨 (낮을수록 더 확대됨, 1=건물, 14=전국)
// getRegionOverlayLevel 기준: zoom >= 9 → sido, >= 7 → sigungu, >= 5 → gu, >= 4 → dong, < 4 → complex
//
// 레이어 계층 설계:
//  zoom 1-7  : 개별 단지 가격 마커 (mapApartments - 이미 좌표 포함, Geocoding 불필요)
//  zoom 1-4  : 실 MOLIT 단지 집계 마커 (complexes - Geocoding 필요, 더 정확한 대표가)
//  zoom 8-14 : 시/구 단위 평균가 오버레이 (지역 평균 요약)
export const MAP_ZOOM = {
  // 개별 가격 마커 표시 임계값: zoom 7 이하에서 표시 (기본 시티뷰에서도 마커 보임)
  INDIVIDUAL_MARKERS: 7,
  // 단지(complex) 집계 마커 표시 임계값: zoom 4 이하 (더 정확한 MOLIT 집계 단지)
  COMPLEX_MARKERS: 4,
  // 지역 평균가 오버레이 표시 임계값: zoom 8 이상 (광역 뷰에서만)
  DISTRICT_OVERLAYS: 8,
  // 단지 데이터 API 호출 임계값: zoom 5 이하
  COMPLEX_DATA_FETCH: 5,
} as const;

// 가격 범례 아이템 (마커 색상과 동일한 4단계 기준)
export const PRICE_LEGEND_ITEMS = [
  { color: '#8B95A1', label: '5억 미만' },
  { color: '#FF9500', label: '5~10억' },
  { color: '#FF4B4B', label: '10~20억' },
  { color: '#D63031', label: '20억+' },
];
