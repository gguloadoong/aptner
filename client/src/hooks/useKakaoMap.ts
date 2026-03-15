import { useEffect, useRef, useState, useCallback } from 'react';
import type { MapApartment, MarkerType, LayerFilters, AreaFilter, PriceFilter } from '../types';

interface UseKakaoMapOptions {
  initialLat?: number;
  initialLng?: number;
  initialLevel?: number;
  onMarkerClick?: (apartment: MapApartment) => void;
  // M-4: async 핸들러 허용을 위해 반환 타입을 void | Promise<void>로 확장
  onBoundsChange?: (swLat: number, swLng: number, neLat: number, neLng: number) => void | Promise<void>;
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
  const overlaysRef = useRef<unknown[]>([]);
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

      // 지도 이동/줌 이벤트 리스너
      kakao.maps.event.addListener(map, 'idle', () => {
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

        onBoundsChange?.(sw.getLat(), sw.getLng(), ne.getLat(), ne.getLng());
      });

      setState((prev) => ({ ...prev, isLoaded: true }));
    } catch (err) {
      console.error('[KakaoMap] 초기화 실패:', err);
      setState((prev) => ({ ...prev, isError: true }));
    }
  }, [containerRef, initialLat, initialLng, initialLevel, onBoundsChange]);

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
      // 기존 오버레이 제거 (메모리 누수 방지)
      overlaysRef.current.forEach((overlay) => {
        (overlay as { setMap: (m: null) => void }).setMap(null);
      });
      overlaysRef.current = [];
    };
  }, [initMap]);

  // 마커 업데이트 (필터 옵션 적용)
  const updateMarkers = useCallback(
    (apartments: MapApartment[], filterOptions?: MarkerFilterOptions) => {
      if (!mapRef.current || !isKakaoAvailable()) return;

      const { kakao } = window;

      // 기존 마커 제거
      overlaysRef.current.forEach((overlay) => {
        (overlay as { setMap: (m: null) => void }).setMap(null);
      });
      overlaysRef.current = [];

      // 필터 적용하여 표시할 아파트만 추출
      const visibleApts = filterOptions
        ? apartments.filter((apt) => isVisible(apt, filterOptions))
        : apartments;

      // 새 마커 생성
      visibleApts.forEach((apt) => {
        const content = createMarkerElement(apt, onMarkerClick);

        const overlay = new kakao.maps.CustomOverlay({
          position: new kakao.maps.LatLng(apt.lat, apt.lng),
          content,
          yAnchor: 1,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        overlay.setMap(mapRef.current as any);
        overlaysRef.current.push(overlay);
      });
    },
    [onMarkerClick]
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

  return {
    map: mapRef.current,
    isLoaded: state.isLoaded,
    isError: state.isError,
    center: state.center,
    level: state.level,
    updateMarkers,
    moveToLocation,
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

// C. 신고가 마커 (type: allTimeHigh) — 2단 구조
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

  // 상단: 신고가 뱃지
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
  label.textContent = '▲ 신고가';
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
    'border: 2px solid #1B64DA',
    'box-shadow: 0 3px 12px rgba(27,100,218,0.35)',
    'z-index: 30',
    'overflow: hidden',
    'transition: transform 0.15s ease',
  ].join(';');

  // 상단: 청약중 + D-day
  const top = document.createElement('div');
  top.style.cssText = [
    'background-color: #1B64DA',
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
  priceText.style.cssText = 'font-size:11px; font-weight:700; color:#1B64DA;';
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
    passLayerFilter(apt, filters.layerFilters)
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
