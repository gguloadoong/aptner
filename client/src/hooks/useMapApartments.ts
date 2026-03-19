import { useCallback, useRef } from 'react';
import { getMapPrices, getLawdCdByCoords } from '../services/apartment.service';
import type { ApartmentMapPrice } from '../services/apartment.service';
import type { KakaoPlaceResult } from '../types';

// Places AT4(아파트) 검색 결과에 거래가를 매칭한 마커 데이터
export interface PlaceMarkerData {
  id: string;          // Places 결과 id
  placeName: string;   // 장소명
  lat: number;
  lng: number;
  price: number | null; // 매칭된 거래가 (만원), 없으면 null
  area: number | null;  // 거래 기준 전용면적 (㎡), 없으면 null
  dealDate: string | null;
}

// 단지명 부분 일치 매칭 — 공백·특수문자 정규화 후 포함 여부 비교
// 완전 일치 우선, 포함 관계 차순
function matchAptName(placeName: string, prices: ApartmentMapPrice[]): ApartmentMapPrice | null {
  const normalize = (s: string) =>
    s.replace(/\s+/g, '').replace(/[()（）]/g, '').toLowerCase();

  const normalized = normalize(placeName);

  // 1차: 완전 일치
  const exact = prices.find((p) => normalize(p.aptName) === normalized);
  if (exact) return exact;

  // 2차: place_name이 aptName을 포함하거나 aptName이 place_name을 포함
  const partial = prices.find(
    (p) =>
      normalized.includes(normalize(p.aptName)) ||
      normalize(p.aptName).includes(normalized)
  );
  return partial ?? null;
}

interface UseMapApartmentsOptions {
  // kakao map 인스턴스 getter (useKakaoMap이 반환하는 getMap 함수)
  getMap: () => unknown;
}

export function useMapApartments({ getMap }: UseMapApartmentsOptions) {
  // 마지막 조회 lawdCd 캐시 (같은 지역 재진입 시 BE 요청 재사용)
  const pricesCacheRef = useRef<Map<string, ApartmentMapPrice[]>>(new Map());

  const fetchPlaceMarkers = useCallback(
    async (centerLat: number, centerLng: number): Promise<PlaceMarkerData[]> => {
      const map = getMap();
      if (!map) return [];

      // kakao.maps.services 로드 확인
      const kakao = window.kakao;
      if (
        !kakao?.maps?.services?.Places ||
        !kakao?.maps?.services?.Status
      ) {
        console.warn('[useMapApartments] kakao.maps.services 미로드 — Places 검색 불가');
        return [];
      }

      // 1) 좌표 → lawdCd 획득
      const lawdCdResult = await getLawdCdByCoords(centerLat, centerLng);
      if (!lawdCdResult) {
        console.warn('[useMapApartments] lawdCd 조회 실패');
        return [];
      }
      const { lawdCd } = lawdCdResult;

      // 2) 해당 지역 거래가 조회 (캐시 우선)
      let prices = pricesCacheRef.current.get(lawdCd);
      if (!prices) {
        try {
          prices = await getMapPrices(lawdCd);
          pricesCacheRef.current.set(lawdCd, prices);
        } catch (err) {
          console.warn('[useMapApartments] 거래가 조회 실패:', err);
          prices = [];
        }
      }

      // 3) 카카오 Places AT4(아파트) 카테고리 검색 — 현재 뷰포트 기준
      const placeResults = await searchApartmentPlaces(kakao, map);

      // 4) Places 결과 + 거래가 매칭
      return placeResults.map((place) => {
        const matched = matchAptName(place.place_name, prices!);
        return {
          id: place.id,
          placeName: place.place_name,
          lat: parseFloat(place.y),
          lng: parseFloat(place.x),
          price: matched?.recentPrice ?? null,
          area: matched?.area ?? null,
          dealDate: matched?.dealDate ?? null,
        };
      });
    },
    [getMap]
  );

  return { fetchPlaceMarkers };
}

// kakao Places AT4 단일 bounds 검색 — Promise 래퍼
function searchOneQuadrant(
  kakao: typeof window.kakao,
  bounds: unknown
): Promise<KakaoPlaceResult[]> {
  return new Promise((resolve) => {
    try {
      const ps = new kakao.maps.services.Places();
      ps.categorySearch(
        'AT4',
        (result, status) => {
          if (status === kakao.maps.services.Status.OK) {
            resolve(result);
          } else {
            resolve([]);
          }
        },
        { bounds, size: 15 }
      );
    } catch {
      resolve([]);
    }
  });
}

// kakao Places AT4 검색 — 뷰포트를 4분할해 최대 60개 수집, id 중복 제거
function searchApartmentPlaces(
  kakao: typeof window.kakao,
  map: unknown
): Promise<KakaoPlaceResult[]> {
  try {
    type BoundsLike = {
      getSouthWest: () => { getLat: () => number; getLng: () => number };
      getNorthEast: () => { getLat: () => number; getLng: () => number };
    };
    const mapObj = map as { getBounds: () => BoundsLike };
    const bounds = mapObj.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    const swLat = sw.getLat();
    const swLng = sw.getLng();
    const neLat = ne.getLat();
    const neLng = ne.getLng();
    const midLat = (swLat + neLat) / 2;
    const midLng = (swLng + neLng) / 2;

    // 4분할 bounds 생성 헬퍼
    const makeBounds = (s1: number, w1: number, n1: number, e1: number) =>
      new kakao.maps.LatLngBounds(
        new kakao.maps.LatLng(s1, w1),
        new kakao.maps.LatLng(n1, e1)
      );

    const quadrants = [
      makeBounds(swLat, swLng, midLat, midLng), // SW
      makeBounds(swLat, midLng, midLat, neLng), // SE
      makeBounds(midLat, swLng, neLat, midLng), // NW
      makeBounds(midLat, midLng, neLat, neLng), // NE
    ];

    return Promise.all(quadrants.map((q) => searchOneQuadrant(kakao, q))).then((results) => {
      // id 기준 중복 제거
      const seen = new Set<string>();
      const merged: KakaoPlaceResult[] = [];
      for (const batch of results) {
        for (const place of batch) {
          if (!seen.has(place.id)) {
            seen.add(place.id);
            merged.push(place);
          }
        }
      }
      return merged;
    });
  } catch (err) {
    console.warn('[useMapApartments] Places 검색 예외:', err);
    return Promise.resolve([]);
  }
}
