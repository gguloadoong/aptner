import { useEffect, useRef, useState, useCallback } from 'react';
import type { MapApartment, MarkerType, LayerFilters, AreaFilter, PriceFilter, UnitCountFilter, ComplexFeature, ApartmentComplex, KakaoCircle } from '../types';

// ────────────────────────────────────────────────────────────
// 서울 주요 구(區) 중심 좌표 상수 (히트맵 레이어용)
// ────────────────────────────────────────────────────────────
const SEOUL_DISTRICT_CENTERS: { name: string; lat: number; lng: number }[] = [
  { name: '강남구',   lat: 37.5172, lng: 127.0473 },
  { name: '서초구',   lat: 37.4837, lng: 127.0324 },
  { name: '송파구',   lat: 37.5145, lng: 127.1059 },
  { name: '강동구',   lat: 37.5301, lng: 127.1238 },
  { name: '마포구',   lat: 37.5663, lng: 126.9014 },
  { name: '용산구',   lat: 37.5324, lng: 126.9904 },
  { name: '성동구',   lat: 37.5634, lng: 127.0369 },
  { name: '광진구',   lat: 37.5385, lng: 127.0823 },
  { name: '동작구',   lat: 37.5124, lng: 126.9394 },
  { name: '관악구',   lat: 37.4784, lng: 126.9516 },
  { name: '영등포구', lat: 37.5264, lng: 126.8963 },
  { name: '강서구',   lat: 37.5509, lng: 126.8495 },
  { name: '양천구',   lat: 37.5171, lng: 126.8665 },
  { name: '구로구',   lat: 37.4955, lng: 126.8874 },
  { name: '금천구',   lat: 37.4601, lng: 126.9001 },
  { name: '노원구',   lat: 37.6542, lng: 127.0568 },
  { name: '도봉구',   lat: 37.6688, lng: 127.0472 },
  { name: '강북구',   lat: 37.6398, lng: 127.0254 },
  { name: '성북구',   lat: 37.5894, lng: 127.0167 },
  { name: '중랑구',   lat: 37.6063, lng: 127.0927 },
  { name: '동대문구', lat: 37.5744, lng: 127.0397 },
  { name: '중구',     lat: 37.5641, lng: 126.9979 },
  { name: '종로구',   lat: 37.5730, lng: 126.9794 },
  { name: '은평구',   lat: 37.6026, lng: 126.9291 },
  { name: '서대문구', lat: 37.5791, lng: 126.9368 },
];

// 위도·경도 두 점 간 거리 계산 (Haversine 공식, km 단위)
function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// 주어진 마커 좌표에서 가장 가까운 구(區) 이름 반환
function findNearestDistrict(lat: number, lng: number): string {
  let minDist = Infinity;
  let nearest = SEOUL_DISTRICT_CENTERS[0].name;
  for (const d of SEOUL_DISTRICT_CENTERS) {
    const dist = calcDistance(lat, lng, d.lat, d.lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = d.name;
    }
  }
  return nearest;
}

// 거래량 비율(0~1)에 따른 원형 오버레이 색상 반환
function getHeatmapColor(ratio: number): string {
  if (ratio >= 0.8) return 'rgba(249, 115, 22, 0.7)';  // 상위 20%: 진한 오렌지
  if (ratio >= 0.6) return 'rgba(249, 115, 22, 0.5)';  // 20~40%: 오렌지
  if (ratio >= 0.4) return 'rgba(251, 191, 36, 0.4)';  // 40~60%: 노랑
  if (ratio >= 0.2) return 'rgba(251, 191, 36, 0.2)';  // 60~80%: 연노랑
  return 'rgba(209, 213, 219, 0.2)';                    // 하위 20%: 회색
}

// 히트맵 구별 집계 결과 타입
export interface DistrictHeatmapData {
  name: string;
  lat: number;
  lng: number;
  count: number;   // 마커 개수
  ratio: number;   // 최대값 대비 비율 (0~1)
}

interface UseKakaoMapOptions {
  initialLat?: number;
  initialLng?: number;
  initialLevel?: number;
  onMarkerClick?: (apartment: MapApartment) => void;
  // M-4: async 핸들러 허용을 위해 반환 타입을 void | Promise<void>로 확장
  // 줌 레벨도 함께 전달 (레벨 기반 렌더링 전략용)
  onBoundsChange?: (swLat: number, swLng: number, neLat: number, neLng: number, zoom: number) => void | Promise<void>;
}

interface KakaoMapState {
  isLoaded: boolean;
  isError: boolean;
  center: { lat: number; lng: number };
  level: number;
}

// 마커 가시성 필터 옵션
export interface MarkerFilterOptions {
  priceFilter: PriceFilter;
  areaFilter: AreaFilter;
  layerFilters: LayerFilters;
  unitCountFilter: UnitCountFilter;
  complexFeatures: Set<ComplexFeature>;
}

// 카카오맵 초기화 및 마커 관리 훅
export function useKakaoMap(
  containerRef: React.RefObject<HTMLDivElement | null>,
  options: UseKakaoMapOptions = {}
) {
  const {
    initialLat = 37.5665,
    initialLng = 126.978,
    initialLevel = 7,
    onMarkerClick,
    onBoundsChange,
  } = options;

  const mapRef = useRef<unknown>(null);
  // onBoundsChange를 ref에 저장하여 initMap이 재생성되지 않도록 함
  const onBoundsChangeRef = useRef(onBoundsChange);
  // idle 핸들러 ref — cleanup 시 removeListener에 동일 참조 필요
  const idleHandlerRef = useRef<(() => void) | null>(null);
  useEffect(() => { onBoundsChangeRef.current = onBoundsChange; }, [onBoundsChange]);
  // 차분 업데이트를 위해 Map<id, overlay> 구조로 변경 (DOM 조작 최소화)
  const overlaysRef = useRef<Map<string, { setMap: (m: unknown) => void }>>(new Map());
  // 히트맵 원형 오버레이 목록 (구별 Circle 인스턴스)
  const heatmapCirclesRef = useRef<KakaoCircle[]>([]);
  // 구 단위 평균가 오버레이 목록 (줌아웃 시 표시)
  const districtOverlaysRef = useRef<{ setMap: (m: unknown) => void }[]>([]);
  // debounce 타이머 참조
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [state, setState] = useState<KakaoMapState>({
    isLoaded: false,
    isError: false,
    center: { lat: initialLat, lng: initialLng },
    level: initialLevel,
  });

  // 카카오맵 SDK 로드 확인
  const isKakaoAvailable = () => {
    return typeof window !== 'undefined' && window.kakao && window.kakao.maps;
  };

  // 지도 초기화
  const initMap = useCallback(() => {
    if (!containerRef.current || !isKakaoAvailable()) return;

    try {
      const { kakao } = window;
      const mapOptions = {
        center: new kakao.maps.LatLng(initialLat, initialLng),
        level: initialLevel,
      };

      const map = new kakao.maps.Map(containerRef.current, mapOptions);
      mapRef.current = map;

      // 지도 이동/줌 이벤트 리스너 (300ms debounce - 드래그 중 과도한 API 호출 방지)
      // 이름 있는 함수로 추출 — cleanup 시 removeListener에 동일 참조 전달을 위해
      const idleHandler = () => {
        if (!mapRef.current) return;

        // 기존 타이머 취소
        if (debounceTimerRef.current !== null) {
          clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
          if (!mapRef.current) return;
          const m = mapRef.current as {
            getCenter: () => { getLat: () => number; getLng: () => number };
            getLevel: () => number;
            getBounds: () => {
              getSouthWest: () => { getLat: () => number; getLng: () => number };
              getNorthEast: () => { getLat: () => number; getLng: () => number };
            };
          };
          const center = m.getCenter();
          const level = m.getLevel();
          const bounds = m.getBounds();
          const sw = bounds.getSouthWest();
          const ne = bounds.getNorthEast();

          setState((prev) => ({
            ...prev,
            center: { lat: center.getLat(), lng: center.getLng() },
            level,
          }));

          // 줌 레벨 기반 렌더링 전략
          // level <= 5: 너무 멀리 줌아웃 → 마커 표시 안 함 (향후 구별 클러스터)
          // level 6-14: 개별 단지 마커 표시
          if (level >= 6 && level <= 14) {
            onBoundsChangeRef.current?.(sw.getLat(), sw.getLng(), ne.getLat(), ne.getLng(), level);
          }
        }, 300);
      };
      idleHandlerRef.current = idleHandler;
      kakao.maps.event.addListener(map, 'idle', idleHandler);

      setState((prev) => ({ ...prev, isLoaded: true }));
    } catch (err) {
      console.error('[KakaoMap] 초기화 실패:', err);
      setState((prev) => ({ ...prev, isError: true }));
    }
  }, [containerRef, initialLat, initialLng, initialLevel]);

  // 카카오맵 SDK 로드 후 초기화
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;

    if (isKakaoAvailable()) {
      window.kakao.maps.load(initMap);
    } else {
      // SDK 로드 재시도 (script 태그 로드 완료 대기)
      // MINOR-06: 최대 10초(100번 × 100ms) 초과 시 에러 상태로 전환
      let attempts = 0;
      timer = setInterval(() => {
        attempts += 1;
        if (isKakaoAvailable()) {
          clearInterval(timer);
          window.kakao.maps.load(initMap);
        } else if (attempts >= 100) {
          clearInterval(timer);
          setState((prev) => ({ ...prev, isError: true }));
        }
      }, 100);
    }

    return () => {
      if (timer !== undefined) clearInterval(timer);
      // idle 리스너 제거 (누적 방지)
      if (mapRef.current && isKakaoAvailable() && idleHandlerRef.current) {
        window.kakao.maps.event.removeListener(mapRef.current, 'idle', idleHandlerRef.current);
        idleHandlerRef.current = null;
      }
      // debounce 타이머 정리
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
      }
      // 기존 오버레이 제거 (메모리 누수 방지)
      overlaysRef.current.forEach((overlay) => {
        overlay.setMap(null);
      });
      overlaysRef.current.clear();
      // 구 단위 오버레이 정리
      districtOverlaysRef.current.forEach((overlay) => overlay.setMap(null));
      districtOverlaysRef.current = [];
    };
  }, [initMap]);

  // 마커 업데이트 (필터 옵션 적용) — Map 기반 차분 업데이트로 DOM 조작 최소화
  const updateMarkers = useCallback(
    (apartments: MapApartment[], filterOptions?: MarkerFilterOptions) => {
      if (!mapRef.current || !isKakaoAvailable()) return;

      const { kakao } = window;

      // 필터 적용하여 표시할 아파트만 추출
      const visibleApts = filterOptions
        ? apartments.filter((apt) => isVisible(apt, filterOptions))
        : apartments;

      // 표시할 ID Set 생성
      const visibleIds = new Set(visibleApts.map((apt) => apt.id));

      // 차분 업데이트 1: 더 이상 필요 없는 마커 제거
      overlaysRef.current.forEach((overlay, id) => {
        if (!visibleIds.has(id)) {
          overlay.setMap(null);
          overlaysRef.current.delete(id);
        }
      });

      // 차분 업데이트 2: 새로 추가된 마커만 생성
      visibleApts.forEach((apt) => {
        if (overlaysRef.current.has(apt.id)) return; // 이미 존재하면 스킵

        const content = createMarkerElement(apt, onMarkerClick);
        const overlay = new kakao.maps.CustomOverlay({
          position: new kakao.maps.LatLng(apt.lat, apt.lng),
          content,
          yAnchor: 1,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        overlay.setMap(mapRef.current as any);
        overlaysRef.current.set(apt.id, overlay as unknown as { setMap: (m: unknown) => void });
      });
    },
    [onMarkerClick]
  );

  // 단지 마커 업데이트 (ApartmentComplex 배열용 — 호갱노노 스타일)
  // lat/lng가 있는 단지만 표시
  const updateComplexMarkers = useCallback(
    (complexes: ApartmentComplex[], onComplexClick?: (complex: ApartmentComplex) => void) => {
      if (!mapRef.current || !isKakaoAvailable()) return;

      const { kakao } = window;

      // 좌표가 있는 단지만 필터링
      const validComplexes = complexes.filter((c) => c.lat != null && c.lng != null);
      const validIds = new Set(validComplexes.map((c) => `complex-${c.id}`));

      // 기존 단지 마커 중 더 이상 필요 없는 것 제거
      overlaysRef.current.forEach((overlay, id) => {
        if (id.startsWith('complex-') && !validIds.has(id)) {
          overlay.setMap(null);
          overlaysRef.current.delete(id);
        }
      });

      // 새로 추가된 단지 마커 생성 (호갱노노 스타일 마커 사용)
      validComplexes.forEach((complex) => {
        const markerId = `complex-${complex.id}`;
        if (overlaysRef.current.has(markerId)) return;

        const content = createComplexMarkerElement(complex, onComplexClick);
        const overlay = new kakao.maps.CustomOverlay({
          position: new kakao.maps.LatLng(complex.lat!, complex.lng!),
          content,
          yAnchor: 1,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        overlay.setMap(mapRef.current as any);
        overlaysRef.current.set(markerId, overlay as unknown as { setMap: (m: unknown) => void });
      });
    },
    []
  );

  // 지도 중심 이동
  const moveToLocation = useCallback((lat: number, lng: number, level?: number) => {
    if (!mapRef.current || !isKakaoAvailable()) return;

    const { kakao } = window;
    const m = mapRef.current as {
      setCenter: (latlng: unknown) => void;
      setLevel: (level: number) => void;
    };
    m.setCenter(new kakao.maps.LatLng(lat, lng));
    if (level !== undefined) {
      m.setLevel(level);
    }
  }, []);

  // 히트맵 원형 오버레이 제거 (마커 모드 전환 시 호출)
  const clearHeatmapOverlays = useCallback(() => {
    heatmapCirclesRef.current.forEach((circle) => circle.setMap(null));
    heatmapCirclesRef.current = [];
  }, []);

  // 구 단위 평균가 오버레이 전체 제거
  const clearDistrictOverlays = useCallback(() => {
    districtOverlaysRef.current.forEach((overlay) => overlay.setMap(null));
    districtOverlaysRef.current = [];
  }, []);

  // 구 단위 평균가 오버레이 업데이트 (줌 레벨 <= 9 시 호출)
  // apartments 배열에서 구별 평균 가격을 계산하여 CustomOverlay로 표시 (호갱노노 스타일)
  const updateDistrictOverlays = useCallback(
    (apartments: MapApartment[], onDistrictClick?: (districtName: string) => void) => {
      if (!mapRef.current || !isKakaoAvailable()) return;
      const { kakao } = window;

      // 기존 구 오버레이 제거 후 재생성
      clearDistrictOverlays();

      if (apartments.length === 0) return;

      // 1) 구(區)별 평균가 집계
      const districtPriceMap = new Map<string, { lat: number; lng: number; totalPrice: number; count: number }>();
      for (const apt of apartments) {
        const districtName = findNearestDistrict(apt.lat, apt.lng);
        const center = SEOUL_DISTRICT_CENTERS.find((d) => d.name === districtName)!;
        const existing = districtPriceMap.get(districtName);
        if (existing) {
          existing.totalPrice += apt.price;
          existing.count += 1;
        } else {
          districtPriceMap.set(districtName, {
            lat: center.lat,
            lng: center.lng,
            totalPrice: apt.price,
            count: 1,
          });
        }
      }

      // 2) 각 구에 커스텀 오버레이 생성
      districtPriceMap.forEach((data, name) => {
        const avgPrice = Math.round(data.totalPrice / data.count);
        const avgEok = avgPrice / 10000;
        // 평균가 구간별 색상 (가격 마커와 동일한 기준)
        const color = getDistrictPriceColor(avgPrice);
        // 가격 텍스트 포맷 (억 단위)
        const priceText = avgEok >= 1
          ? `${avgEok % 1 === 0 ? avgEok : parseFloat(avgEok.toFixed(1))}억`
          : `${avgPrice.toLocaleString('ko-KR')}만`;

        const el = document.createElement('div');
        el.style.cssText = [
          'background: #FFFFFF',
          `border: 2px solid ${color}`,
          'border-radius: 8px',
          'padding: 6px 10px',
          'box-shadow: 0 2px 8px rgba(0,0,0,0.15)',
          'text-align: center',
          'font-size: 12px',
          'font-weight: 600',
          'cursor: pointer',
          'white-space: nowrap',
          'line-height: 1.4',
          'transition: transform 0.15s ease',
          'color: #191F28',
        ].join(';');
        // innerHTML 대신 DOM API 사용 (컨벤션 준수)
        const nameNode = document.createTextNode(name);
        const br = document.createElement('br');
        const priceSpan = document.createElement('span');
        priceSpan.style.cssText = `color:${color};font-weight:700`;
        priceSpan.textContent = priceText;
        el.appendChild(nameNode);
        el.appendChild(br);
        el.appendChild(priceSpan);

        // 호버 효과
        el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.06)'; });
        el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)'; });
        if (onDistrictClick) {
          el.addEventListener('click', () => onDistrictClick(name));
        }

        const overlay = new kakao.maps.CustomOverlay({
          position: new kakao.maps.LatLng(data.lat, data.lng),
          content: el,
          yAnchor: 0.5,
          zIndex: 10,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        overlay.setMap(mapRef.current as any);
        districtOverlaysRef.current.push(overlay as unknown as { setMap: (m: unknown) => void });
      });
    },
    [clearDistrictOverlays]
  );

  // 히트맵 원형 오버레이 업데이트
  // apartments 배열에서 구(區) 단위 집계 후 kakao.maps.Circle로 표시
  const updateHeatmapOverlays = useCallback((apartments: MapApartment[]) => {
    if (!mapRef.current || !isKakaoAvailable()) return;
    const { kakao } = window;

    // 기존 히트맵 오버레이 제거
    clearHeatmapOverlays();

    if (apartments.length === 0) return;

    // 1) 구(區)별 마커 개수 집계
    const districtMap = new Map<string, { lat: number; lng: number; count: number }>();
    for (const apt of apartments) {
      const districtName = findNearestDistrict(apt.lat, apt.lng);
      const existing = districtMap.get(districtName);
      // 구의 대표 좌표는 SEOUL_DISTRICT_CENTERS 중심값 사용
      const center = SEOUL_DISTRICT_CENTERS.find((d) => d.name === districtName)!;
      if (existing) {
        existing.count += 1;
      } else {
        districtMap.set(districtName, { lat: center.lat, lng: center.lng, count: 1 });
      }
    }

    // 2) 최대 거래량 계산 (비율 산출용)
    const maxCount = Math.max(...Array.from(districtMap.values()).map((d) => d.count));
    if (maxCount === 0) return;

    // 3) 각 구에 Circle 오버레이 생성 (반지름: 거래량에 비례, 최소 800m ~ 최대 2000m)
    districtMap.forEach((data, name) => {
      const ratio = data.count / maxCount;
      const fillColor = getHeatmapColor(ratio);
      const radius = 800 + ratio * 1200; // 800m ~ 2000m

      const circle = new kakao.maps.Circle({
        center: new kakao.maps.LatLng(data.lat, data.lng),
        radius,
        strokeWeight: 1,
        strokeColor: fillColor.replace(/[\d.]+\)$/, '0.9)'),
        strokeOpacity: 0.6,
        strokeStyle: 'solid',
        fillColor: fillColor,
        fillOpacity: 1,
        // 라벨 대신 CustomOverlay로 구 이름 표시 (접근성 고려)
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      circle.setMap(mapRef.current as any);
      heatmapCirclesRef.current.push(circle);

      // 구 이름 + 건수 레이블 (CustomOverlay)
      const labelEl = document.createElement('div');
      labelEl.style.cssText = [
        'background: rgba(255,255,255,0.85)',
        'border-radius: 6px',
        'padding: 3px 7px',
        'font-size: 11px',
        'font-weight: 700',
        'color: #191F28',
        'white-space: nowrap',
        'pointer-events: none',
        'box-shadow: 0 1px 4px rgba(0,0,0,0.15)',
      ].join(';');
      labelEl.textContent = `${name} ${data.count}건`;

      const labelOverlay = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(data.lat, data.lng),
        content: labelEl,
        yAnchor: 0.5,
        zIndex: 5,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      labelOverlay.setMap(mapRef.current as any);
      // CustomOverlay도 정리 대상에 포함 (setMap(null) 인터페이스 공유)
      heatmapCirclesRef.current.push(labelOverlay as unknown as KakaoCircle);
    });
  }, [clearHeatmapOverlays]);

  // Places AT4 검색 결과 마커 업데이트
  // PlaceMarkerData 배열을 받아 가격 pill 마커 또는 단지명 점 마커로 렌더링
  const updatePlaceMarkers = useCallback(
    (
      places: Array<{
        id: string;
        placeName: string;
        lat: number;
        lng: number;
        price: number | null;
        dealDate: string | null;
      }>,
      onPlaceClick?: (id: string, placeName: string) => void
    ) => {
      if (!mapRef.current || !isKakaoAvailable()) return;
      const { kakao } = window;

      const validIds = new Set(places.map((p) => `place-${p.id}`));

      // 기존 place 마커 중 더 이상 필요 없는 것 제거
      overlaysRef.current.forEach((overlay, id) => {
        if (id.startsWith('place-') && !validIds.has(id)) {
          overlay.setMap(null);
          overlaysRef.current.delete(id);
        }
      });

      // 신규 마커 생성
      places.forEach((place) => {
        const markerId = `place-${place.id}`;
        if (overlaysRef.current.has(markerId)) return;

        const content = createPlacePriceMarker(place, onPlaceClick);
        const overlay = new kakao.maps.CustomOverlay({
          position: new kakao.maps.LatLng(place.lat, place.lng),
          content,
          yAnchor: 1,
          zIndex: 15,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        overlay.setMap(mapRef.current as any);
        overlaysRef.current.set(
          markerId,
          overlay as unknown as { setMap: (m: unknown) => void }
        );
      });
    },
    []
  );

  return {
    // ESLint react-hooks/exhaustive-deps 규칙 준수:
    // ref.current를 렌더 중 직접 반환하지 않고 getter 함수로 감싸서 반환
    getMap: () => mapRef.current,
    isLoaded: state.isLoaded,
    isError: state.isError,
    center: state.center,
    level: state.level,
    updateMarkers,
    updateComplexMarkers,
    updatePlaceMarkers,
    moveToLocation,
    updateHeatmapOverlays,
    clearHeatmapOverlays,
    updateDistrictOverlays,
    clearDistrictOverlays,
  };
}

// ────────────────────────────────────────────────────────────
// 마커 팩토리 함수 — 타입별 DOM 엘리먼트 생성 (innerHTML 금지)
// ────────────────────────────────────────────────────────────

export function createMarkerElement(
  apt: MapApartment,
  onClick?: (apt: MapApartment) => void
): HTMLElement {
  const markerType: MarkerType = apt.markerType ?? 'price';

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:relative; display:inline-block; cursor:pointer;';

  // C-3: markerType별 z-index 명세 적용 (wrapper 레벨에서 통일)
  // price: 10 / hot: 20 / allTimeHigh: 20 / subUpcoming: 25 / subOngoing: 30
  const zIndexMap: Record<string, number> = {
    price: 10,
    hot: 20,
    allTimeHigh: 20,
    subUpcoming: 25,
    subOngoing: 30,
  };
  wrapper.style.zIndex = String(zIndexMap[markerType] ?? 10);

  if (markerType === 'subOngoing') {
    // N-1: inner 먼저 append, pulse ring을 그 뒤에 append (명세 준수)
    const inner = createSubOngoingMarker(apt);
    wrapper.appendChild(inner);
    const ring = document.createElement('div');
    ring.className = 'marker-pulse-ring';
    wrapper.appendChild(ring);
  } else {
    let inner: HTMLElement;
    switch (markerType) {
      case 'hot':
        inner = createHotMarker(apt);
        break;
      case 'allTimeHigh':
        inner = createAllTimeHighMarker(apt);
        break;
      case 'subUpcoming':
        inner = createSubUpcomingMarker(apt);
        break;
      default:
        inner = createPriceMarker(apt);
    }
    wrapper.appendChild(inner);
  }

  // 거래량 급등 마커인 경우 불꽃 배지 추가
  if (apt.volumeSurge) {
    const badge = document.createElement('span');
    badge.style.cssText = [
      'position: absolute',
      'top: -6px',
      'right: -6px',
      'font-size: 14px',
      'line-height: 1',
      'z-index: 40',
    ].join(';');
    badge.textContent = '🔥';
    wrapper.appendChild(badge);
  }

  wrapper.addEventListener('click', () => {
    onClick?.(apt);
  });

  return wrapper;
}

// A. 기본 가격 마커 (type: price)
// 가격 구간 4단계: 5억 미만/5~10억/10~20억/20억 이상
function createPriceMarker(apt: MapApartment): HTMLElement {
  const el = document.createElement('div');
  const bgColor = getPriceMarkerColor(apt.price);
  el.style.cssText = [
    'min-width: 56px',
    'height: 28px',
    'padding: 5px 12px',
    'border-radius: 14px',
    'font-size: 12px',
    'font-weight: 700',
    'white-space: nowrap',
    'color: #FFFFFF',
    'border: 2px solid #FFFFFF',
    'box-shadow: 0 2px 8px rgba(0,0,0,0.20)',
    'z-index: 10',
    'transition: transform 0.15s ease',
    'display: flex',
    'align-items: center',
    'justify-content: center',
    `background-color: ${bgColor}`,
  ].join(';');
  el.textContent = formatPriceForMarker(apt.price);
  return el;
}

// B. HOT 단지 마커 (type: hot) — 2단 구조
function createHotMarker(apt: MapApartment): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = [
    'min-width: 64px',
    'border-radius: 10px',
    'border: 2px solid #FF4136',
    'box-shadow: 0 3px 12px rgba(214,48,49,0.35)',
    'z-index: 20',
    'overflow: hidden',
    'transition: transform 0.15s ease',
  ].join(';');

  // 상단: HOT 뱃지
  const top = document.createElement('div');
  top.style.cssText = [
    'background-color: #FF4136',
    'padding: 3px 8px',
    'display: flex',
    'align-items: center',
    'justify-content: center',
    'gap: 3px',
  ].join(';');

  // SVG 불꽃 아이콘 (접근성용 DOM API)
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '10');
  svg.setAttribute('height', '10');
  svg.setAttribute('viewBox', '0 0 10 10');
  svg.setAttribute('fill', 'none');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M5 1 C5 1 8 4 8 6.5 C8 8.4 6.6 9.5 5 9.5 C3.4 9.5 2 8.4 2 6.5 C2 4 5 1 5 1Z');
  path.setAttribute('fill', '#FFD93D');
  svg.appendChild(path);

  const hotText = document.createElement('span');
  hotText.style.cssText = 'font-size:10px; font-weight:800; color:#FFFFFF; letter-spacing:0.5px;';
  hotText.textContent = 'HOT';

  top.appendChild(svg);
  top.appendChild(hotText);

  // 하단: 가격
  const bottom = document.createElement('div');
  bottom.style.cssText = [
    'background-color: #FFFFFF',
    'padding: 3px 8px',
    'display: flex',
    'align-items: center',
    'justify-content: center',
  ].join(';');

  const priceText = document.createElement('span');
  priceText.style.cssText = 'font-size:12px; font-weight:700; color:#D63031;';
  priceText.textContent = formatPriceForMarker(apt.price);
  bottom.appendChild(priceText);

  wrapper.appendChild(top);
  wrapper.appendChild(bottom);
  return wrapper;
}

// C. 최고가 경신 마커 (type: allTimeHigh) — 2단 구조
function createAllTimeHighMarker(apt: MapApartment): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = [
    'min-width: 64px',
    'border-radius: 10px',
    'border: 2px solid #F39C12',
    'box-shadow: 0 3px 12px rgba(243,156,18,0.35)',
    'z-index: 20',
    'overflow: hidden',
    'transition: transform 0.15s ease',
  ].join(';');

  // 상단: 최고가 뱃지
  const top = document.createElement('div');
  top.style.cssText = [
    'background-color: #F39C12',
    'padding: 3px 8px',
    'display: flex',
    'align-items: center',
    'justify-content: center',
  ].join(';');

  const label = document.createElement('span');
  label.style.cssText = 'font-size:10px; font-weight:800; color:#FFFFFF;';
  label.textContent = '▲ 최고가';
  top.appendChild(label);

  // 하단: 가격
  const bottom = document.createElement('div');
  bottom.style.cssText = [
    'background-color: #FFFBF0',
    'padding: 3px 8px',
    'display: flex',
    'align-items: center',
    'justify-content: center',
  ].join(';');

  const priceText = document.createElement('span');
  priceText.style.cssText = 'font-size:12px; font-weight:700; color:#E67E22;';
  priceText.textContent = formatPriceForMarker(apt.price);
  bottom.appendChild(priceText);

  wrapper.appendChild(top);
  wrapper.appendChild(bottom);
  return wrapper;
}

// D. 청약 진행중 마커 (type: subOngoing) — 2단 구조 + pulse ring
function createSubOngoingMarker(apt: MapApartment): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = [
    'min-width: 68px',
    'border-radius: 10px',
    'border: 2px solid #0066FF',
    'box-shadow: 0 3px 12px rgba(0,102,255,0.35)',
    'z-index: 30',
    'overflow: hidden',
    'transition: transform 0.15s ease',
  ].join(';');

  // 상단: 청약중 + D-day
  const top = document.createElement('div');
  top.style.cssText = [
    'background-color: #0066FF',
    'padding: 3px 8px',
    'display: flex',
    'align-items: center',
    'justify-content: center',
  ].join(';');

  const label = document.createElement('span');
  label.style.cssText = 'font-size:10px; font-weight:800; color:#FFFFFF;';
  // D-day 계산
  const dDay = apt.subDeadline ? calcDDay(apt.subDeadline) : null;
  const dDayText = dDay !== null ? ` D-${dDay}` : '';
  label.textContent = `청약중${dDayText}`;
  top.appendChild(label);

  // 하단: 분양가
  const bottom = document.createElement('div');
  bottom.style.cssText = [
    'background-color: #F0F6FF',
    'padding: 3px 8px',
    'display: flex',
    'align-items: center',
    'justify-content: center',
  ].join(';');

  const priceText = document.createElement('span');
  priceText.style.cssText = 'font-size:11px; font-weight:700; color:#0066FF;';
  priceText.textContent = formatPriceForMarker(apt.price);
  bottom.appendChild(priceText);

  wrapper.appendChild(top);
  wrapper.appendChild(bottom);
  return wrapper;
}

// E. 청약 예정 마커 (type: subUpcoming) — 2단 구조 + 점선 테두리
function createSubUpcomingMarker(apt: MapApartment): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = [
    'min-width: 68px',
    'border-radius: 10px',
    'border: 2px dashed #5B9BD5',
    'box-shadow: 0 2px 8px rgba(91,155,213,0.25)',
    'z-index: 25',
    'overflow: hidden',
    'transition: transform 0.15s ease',
  ].join(';');

  // 상단: 청약예정 + 날짜
  const top = document.createElement('div');
  top.style.cssText = [
    'background-color: #5B9BD5',
    'padding: 3px 8px',
    'display: flex',
    'align-items: center',
    'justify-content: center',
  ].join(';');

  const label = document.createElement('span');
  label.style.cssText = 'font-size:10px; font-weight:700; color:#FFFFFF;';
  // 시작일 M.D 포맷
  const startDateText = apt.subStartDate ? formatMonthDay(apt.subStartDate) : '';
  label.textContent = `청약예정${startDateText ? ` ${startDateText}` : ''}`;
  top.appendChild(label);

  // 하단: 분양가
  const bottom = document.createElement('div');
  bottom.style.cssText = [
    'background-color: #F5F9FF',
    'padding: 3px 8px',
    'display: flex',
    'align-items: center',
    'justify-content: center',
  ].join(';');

  const priceText = document.createElement('span');
  priceText.style.cssText = 'font-size:11px; font-weight:600; color:#5B9BD5;';
  priceText.textContent = formatPriceForMarker(apt.price);
  bottom.appendChild(priceText);

  wrapper.appendChild(top);
  wrapper.appendChild(bottom);
  return wrapper;
}

// ────────────────────────────────────────────────────────────
// 필터 표시 로직 (섹션 5)
// ────────────────────────────────────────────────────────────

export function isVisible(apt: MapApartment, filters: MarkerFilterOptions): boolean {
  return (
    passPriceFilter(apt, filters.priceFilter) &&
    passAreaFilter(apt, filters.areaFilter) &&
    passLayerFilter(apt, filters.layerFilters) &&
    passUnitCountFilter(apt, filters.unitCountFilter) &&
    passComplexFeaturesFilter(apt, filters.complexFeatures)
  );
}

// 가격대 필터 (만원 단위)
function passPriceFilter(apt: MapApartment, priceFilter: PriceFilter): boolean {
  if (priceFilter === 'all') return true;
  const eok = apt.price / 10000;
  if (priceFilter === 'under5') return eok < 5;
  if (priceFilter === '5to10') return eok >= 5 && eok < 10;
  if (priceFilter === 'over10') return eok >= 10;
  return true;
}

// 평형 필터
// areas 배열 우선, 없으면 area 단일 문자열로 폴백
function passAreaFilter(apt: MapApartment, areaFilter: AreaFilter): boolean {
  if (areaFilter === 'all') return true;
  const areaList = apt.areas ?? [apt.area];
  if (areaFilter === '59') return areaList.some((a) => a.startsWith('59'));
  if (areaFilter === '74') return areaList.some((a) => a.startsWith('74'));
  if (areaFilter === '84') return areaList.some((a) => a.startsWith('84'));
  if (areaFilter === '109plus') return areaList.some((a) => parseInt(a, 10) >= 109);
  return true;
}

// 세대수 필터
function passUnitCountFilter(apt: MapApartment, filter: UnitCountFilter): boolean {
  if (filter === 'all') return true;
  if (apt.totalUnits == null) return true; // 필드 없으면 통과
  if (filter === '500plus') return apt.totalUnits >= 500;
  if (filter === '1000plus') return apt.totalUnits >= 1000;
  if (filter === '2000plus') return apt.totalUnits >= 2000;
  return true;
}

// 단지 특성 필터 — OR 방식: 선택된 특성 중 하나라도 해당되면 통과
function passComplexFeaturesFilter(apt: MapApartment, selected: Set<ComplexFeature>): boolean {
  if (selected.size === 0) return true;
  if (!apt.features || apt.features.length === 0) return false;
  return [...selected].some((f) => apt.features!.includes(f));
}

// 레이어 필터
// 모두 OFF → 전체 표시 / 하나라도 ON → 해당 레이어 타입만 표시
function passLayerFilter(apt: MapApartment, layerFilters: LayerFilters): boolean {
  const anyOn = layerFilters.hot || layerFilters.allTimeHigh || layerFilters.subscription;
  if (!anyOn) return true; // 모두 OFF면 전체 표시

  const type = apt.markerType ?? 'price';

  if (layerFilters.hot && type === 'hot') return true;
  if (layerFilters.allTimeHigh && type === 'allTimeHigh') return true;
  if (layerFilters.subscription && (type === 'subOngoing' || type === 'subUpcoming')) return true;

  return false;
}

// ────────────────────────────────────────────────────────────
// 유틸 함수
// ────────────────────────────────────────────────────────────

// 가격을 마커용 텍스트로 변환
function formatPriceForMarker(manwon: number): string {
  const eok = manwon / 10000;
  if (eok >= 1) {
    return `${eok % 1 === 0 ? eok : eok.toFixed(1)}억`;
  }
  return `${manwon.toLocaleString('ko-KR')}만`;
}

// 가격 구간별 배경색 (4단계 개선 — 섹션 1-A)
// 5억 미만: #8B95A1 / 5~10억: #FF9500 / 10~20억: #FF4B4B / 20억 이상: #D63031
function getPriceMarkerColor(priceManwon: number): string {
  const eok = priceManwon / 10000;
  if (eok >= 20) return '#D63031';
  if (eok >= 10) return '#FF4B4B';
  if (eok >= 5) return '#FF9500';
  return '#8B95A1';
}

// 구 단위 평균가 오버레이용 색상 (가격 마커 색상과 동일한 기준 사용)
function getDistrictPriceColor(priceManwon: number): string {
  return getPriceMarkerColor(priceManwon);
}

// D-Day 계산 (마감일까지 남은 일수, 음수면 null)
function calcDDay(deadline: string): number | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dl = new Date(deadline);
  dl.setHours(0, 0, 0, 0);
  const diff = Math.ceil((dl.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff : null;
}

// 날짜를 M.D 포맷으로 변환
function formatMonthDay(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}.${d.getDate()}`;
}

// ────────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────
// Places AT4 검색 결과 가격 마커 팩토리
// 지수 디자인 스펙: 가격 pill + 삼각형 꼬리, 색상 #1B64DA(MVP 단색)
// 가격 없는 단지: 작은 점 마커(단지명 툴팁)
// ────────────────────────────────────────────────────────────

function createPlacePriceMarker(
  place: {
    id: string;
    placeName: string;
    lat: number;
    lng: number;
    price: number | null;
    dealDate: string | null;
  },
  onClick?: (id: string, placeName: string) => void
): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:relative; display:inline-block; cursor:pointer;';

  if (place.price !== null) {
    // 가격 pill 마커
    const pill = document.createElement('div');
    pill.style.cssText = [
      'display: inline-flex',
      'align-items: center',
      'justify-content: center',
      'padding: 5px 10px',
      'border-radius: 14px',
      'background-color: #1B64DA',
      'color: #FFFFFF',
      'border: 1px solid #FFFFFF',
      'box-shadow: 0 2px 6px rgba(0,0,0,0.2)',
      'font-size: 13px',
      'font-weight: 700',
      'white-space: nowrap',
      'font-family: "JetBrains Mono", "Nanum Gothic Coding", monospace',
      'transition: transform 0.15s ease',
    ].join(';');
    pill.textContent = formatPlacePrice(place.price);

    // 삼각형 꼬리
    const tail = document.createElement('div');
    tail.style.cssText = [
      'position: absolute',
      'bottom: -5px',
      'left: 50%',
      'transform: translateX(-50%)',
      'width: 0',
      'height: 0',
      'border-left: 5px solid transparent',
      'border-right: 5px solid transparent',
      'border-top: 5px solid #1B64DA',
    ].join(';');

    pill.appendChild(tail);
    wrapper.appendChild(pill);

    // 호버 효과
    wrapper.addEventListener('mouseenter', () => {
      pill.style.transform = 'scale(1.06)';
    });
    wrapper.addEventListener('mouseleave', () => {
      pill.style.transform = 'scale(1)';
    });
  } else {
    // 가격 없는 단지 — 작은 점 마커 + 단지명 표시
    const dot = document.createElement('div');
    dot.style.cssText = [
      'width: 8px',
      'height: 8px',
      'border-radius: 50%',
      'background-color: #8B95A1',
      'border: 1.5px solid #FFFFFF',
      'box-shadow: 0 1px 3px rgba(0,0,0,0.2)',
      'transition: transform 0.15s ease',
    ].join(';');

    // 단지명 레이블 (점 아래)
    const label = document.createElement('div');
    label.style.cssText = [
      'position: absolute',
      'top: 12px',
      'left: 50%',
      'transform: translateX(-50%)',
      'background: rgba(255,255,255,0.9)',
      'border-radius: 4px',
      'padding: 2px 5px',
      'font-size: 10px',
      'font-weight: 500',
      'color: #4E5968',
      'white-space: nowrap',
      'pointer-events: none',
      'box-shadow: 0 1px 3px rgba(0,0,0,0.12)',
    ].join(';');
    label.textContent = place.placeName;

    wrapper.appendChild(dot);
    wrapper.appendChild(label);

    wrapper.addEventListener('mouseenter', () => {
      dot.style.transform = 'scale(1.3)';
    });
    wrapper.addEventListener('mouseleave', () => {
      dot.style.transform = 'scale(1)';
    });
  }

  wrapper.addEventListener('click', () => {
    onClick?.(place.id, place.placeName);
  });

  return wrapper;
}

// 가격 pill 텍스트 포맷 (만원 단위 입력 → 억/만 표시)
function formatPlacePrice(manwon: number): string {
  const eok = manwon / 10000;
  if (eok >= 1) {
    const rounded = Math.round(eok * 10) / 10;
    return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}억`;
  }
  return `${manwon.toLocaleString('ko-KR')}만`;
}

// 호갱노노 스타일 단지 마커 팩토리 (ApartmentComplex용)
// ────────────────────────────────────────────────────────────

// 단지 가격 마커 텍스트 변환 (만원 단위 입력)
function formatComplexPrice(manwon: number): string {
  const eok = manwon / 10000;
  if (eok >= 1) {
    // 소수점 1자리 (예: 3.2억, 12.5억)
    return `${eok % 1 === 0 ? eok : parseFloat(eok.toFixed(1))}억`;
  }
  return `${manwon.toLocaleString('ko-KR')}만`;
}

// 거래횟수에 따른 마커 border opacity (거래 많을수록 진하게)
function getTradeCountOpacity(tradeCount: number): number {
  if (tradeCount >= 10) return 1.0;
  if (tradeCount >= 5) return 0.85;
  if (tradeCount >= 3) return 0.7;
  return 0.5;
}

// 호갱노노 스타일 단지 마커 DOM 엘리먼트 생성
// 디자인: 흰 배경 + 회색 테두리, 선택 시 봄집 초록 배경
// 거래 많을수록 테두리 진하게
export function createComplexMarkerElement(
  complex: ApartmentComplex,
  onClick?: (complex: ApartmentComplex) => void
): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:relative; display:inline-block; cursor:pointer;';

  const priceText = formatComplexPrice(complex.latestPrice);
  const borderOpacity = getTradeCountOpacity(complex.tradeCount);
  // 거래 많을수록 테두리 진하게
  const borderColor = `rgba(229, 232, 235, ${borderOpacity + 0.3})`;

  const el = document.createElement('div');
  el.className = 'apt-marker';
  el.style.cssText = [
    'display: inline-flex',
    'align-items: center',
    'justify-content: center',
    'padding: 5px 10px',
    'border-radius: 6px',
    'background: #FFFFFF',
    `border: 1.5px solid ${borderColor}`,
    'box-shadow: 0 1px 6px rgba(0,0,0,0.12)',
    'transition: transform 0.15s ease, background 0.15s ease',
    'position: relative',
    'white-space: nowrap',
  ].join(';');

  const priceSpan = document.createElement('span');
  priceSpan.className = 'price';
  priceSpan.style.cssText = [
    'font-size: 12px',
    'font-weight: 700',
    'line-height: 1',
    // 거래횟수 높을수록 더 진한 색 (최고가 단지는 빨간색)
    'color: #191F28',
  ].join(';');
  priceSpan.textContent = priceText;

  el.appendChild(priceSpan);

  // 말풍선 꼬리 (삼각형)
  const tail = document.createElement('div');
  tail.style.cssText = [
    'position: absolute',
    'bottom: -5px',
    'left: 50%',
    'transform: translateX(-50%)',
    'width: 0',
    'height: 0',
    'border-left: 4px solid transparent',
    'border-right: 4px solid transparent',
    'border-top: 5px solid #FFFFFF',
  ].join(';');

  const tailBorder = document.createElement('div');
  tailBorder.style.cssText = [
    'position: absolute',
    'bottom: -7px',
    'left: 50%',
    'transform: translateX(-50%)',
    'width: 0',
    'height: 0',
    'border-left: 5px solid transparent',
    'border-right: 5px solid transparent',
    `border-top: 6px solid ${borderColor}`,
    'z-index: -1',
  ].join(';');

  el.appendChild(tailBorder);
  el.appendChild(tail);
  wrapper.appendChild(el);

  // 마우스오버 호버 효과
  wrapper.addEventListener('mouseenter', () => {
    el.style.transform = 'scale(1.08)';
    el.style.zIndex = '100';
  });
  wrapper.addEventListener('mouseleave', () => {
    el.style.transform = 'scale(1)';
    el.style.zIndex = '';
  });

  wrapper.addEventListener('click', () => {
    onClick?.(complex);
  });

  return wrapper;
}
