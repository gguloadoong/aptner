import { useEffect, useRef, useState, useCallback } from 'react';
import type { MapApartment } from '../types';

interface UseKakaoMapOptions {
  initialLat?: number;
  initialLng?: number;
  initialLevel?: number;
  onMarkerClick?: (apartment: MapApartment) => void;
  onBoundsChange?: (swLat: number, swLng: number, neLat: number, neLng: number) => void;
}

interface KakaoMapState {
  isLoaded: boolean;
  isError: boolean;
  center: { lat: number; lng: number };
  level: number;
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
      const options = {
        center: new kakao.maps.LatLng(initialLat, initialLng),
        level: initialLevel,
      };

      const map = new kakao.maps.Map(containerRef.current, options);
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

  // 마커 업데이트
  const updateMarkers = useCallback(
    (apartments: MapApartment[]) => {
      if (!mapRef.current || !isKakaoAvailable()) return;

      const { kakao } = window;

      // 기존 마커 제거
      overlaysRef.current.forEach((overlay) => {
        (overlay as { setMap: (m: null) => void }).setMap(null);
      });
      overlaysRef.current = [];

      // 새 마커 생성
      apartments.forEach((apt) => {
        const priceLabel = formatPriceForMarker(apt.price);
        // 가격 기준 마커 색상: 5억 미만=회색, 5~15억=주황, 15억 이상=레드
        const bgColor = getPriceMarkerColor(apt.price);

        // MINOR-02: innerHTML 대신 DOM API 사용 (XSS 방어)
        const content = document.createElement('div');
        content.className = 'marker-wrapper';

        const inner = document.createElement('div');
        inner.className = 'apt-marker';
        inner.style.cssText = [
          'padding: 5px 10px',
          'border-radius: 20px',
          'font-size: 12px',
          'font-weight: 700',
          'white-space: nowrap',
          'cursor: pointer',
          'box-shadow: 0 2px 8px rgba(0,0,0,0.25)',
          'border: 2px solid white',
          'color: white',
          'transition: transform 0.15s ease',
          `background-color: ${bgColor}`,
        ].join(';');
        inner.textContent = priceLabel; // textContent로 XSS 차단
        content.appendChild(inner);

        content.addEventListener('click', () => {
          onMarkerClick?.(apt);
        });

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

// 가격을 마커용 텍스트로 변환
function formatPriceForMarker(manwon: number): string {
  const eok = manwon / 10000;
  if (eok >= 1) {
    return `${eok % 1 === 0 ? eok : eok.toFixed(1)}억`;
  }
  return `${manwon.toLocaleString('ko-KR')}만`;
}

// 가격 기준 마커 배경색 (만원 단위)
// 5억 미만: 회색, 5~15억: 주황, 15억 이상: 레드
function getPriceMarkerColor(priceManwon: number): string {
  const eok = priceManwon / 10000;
  if (eok >= 15) return '#FF4B4B';
  if (eok >= 5) return '#FF9500';
  return '#8B95A1';
}
