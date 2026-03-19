import { useCallback } from 'react';
import type { ApartmentComplex } from '../types';

// localStorage 캐시 키
const CACHE_KEY = 'bomzip-geocache';

// 캐시 항목 타입
interface GeoCache {
  [address: string]: {
    lat: number;
    lng: number;
    ts: number; // 저장 시각 (milliseconds)
  };
}

// 캐시 TTL: 30일 (자주 바뀌지 않는 주소 좌표)
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// 동시 처리 배치 크기 (Kakao Geocoder rate limit 대응)
const BATCH_SIZE = 5;

// 배치 처리 간 딜레이 (ms)
const BATCH_DELAY_MS = 200;

// localStorage에서 캐시 로드
function loadCache(): GeoCache {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as GeoCache;
  } catch {
    return {};
  }
}

// localStorage에 캐시 저장
function saveCache(cache: GeoCache): void {
  try {
    // 만료된 항목 정리 후 저장
    const now = Date.now();
    const cleaned: GeoCache = {};
    for (const [key, val] of Object.entries(cache)) {
      if (now - val.ts < CACHE_TTL_MS) {
        cleaned[key] = val;
      }
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cleaned));
  } catch {
    // localStorage 용량 초과 등의 오류는 무시
  }
}

// 카카오 Geocoder 단건 호출 (Promise 래핑)
function geocodeOnce(
  geocoder: { addressSearch: (addr: string, cb: (result: KakaoGeoResult[], status: string) => void) => void },
  address: string
): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    geocoder.addressSearch(address, (result: KakaoGeoResult[], status: string) => {
      // kakao.maps.services.Status.OK
      if (status === 'OK' && result.length > 0) {
        resolve({
          lat: parseFloat(result[0].y),
          lng: parseFloat(result[0].x),
        });
      } else {
        resolve(null);
      }
    });
  });
}

// 카카오 Places keywordSearch 단건 호출 (아파트명 → 좌표 변환용)
function keywordSearchOnce(keyword: string): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const services = (window.kakao?.maps as any)?.services;
      if (!services) { resolve(null); return; }
      const ps = new services.Places();
      ps.keywordSearch(
        keyword,
        (result: Array<{ x: string; y: string; category_group_code: string }>, status: string) => {
          if (status === 'OK' && result.length > 0) {
            // AT4(아파트) 카테고리 결과 우선, 없으면 첫 번째 결과
            const apt = result.find((r) => r.category_group_code === 'AT4') ?? result[0];
            resolve({ lat: parseFloat(apt.y), lng: parseFloat(apt.x) });
          } else {
            resolve(null);
          }
        },
        { size: 5 }
      );
    } catch {
      resolve(null);
    }
  });
}

// Kakao Geocoder 응답 단건 타입
interface KakaoGeoResult {
  x: string; // 경도
  y: string; // 위도
}

// 배치 딜레이 헬퍼
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 주소 → 좌표 변환 훅
// - localStorage 캐싱으로 반복 API 호출 최소화
// - 배치 처리로 rate limit 대응
export function useGeocoder() {
  // 단건 주소 → 좌표 변환
  // fallbackQuery: 도로명 주소 실패 시 "읍면동명 + 단지명"으로 재시도
  const geocodeAddress = useCallback(
    async (address: string, fallbackQuery?: string): Promise<{ lat: number; lng: number } | null> => {
      // 카카오 SDK 및 Geocoder 서비스 확인
      if (
        typeof window === 'undefined' ||
        !window.kakao ||
        !window.kakao.maps ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        !(window.kakao.maps as any).services
      ) {
        return null;
      }

      const cache = loadCache();

      // 캐시 히트 확인
      const cacheKey = address.trim();
      if (cache[cacheKey] && Date.now() - cache[cacheKey].ts < CACHE_TTL_MS) {
        return { lat: cache[cacheKey].lat, lng: cache[cacheKey].lng };
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const services = (window.kakao.maps as any).services;
      const geocoder = new services.Geocoder();

      // 1차: 도로명/지번 주소로 시도
      let coords = await geocodeOnce(geocoder, address);

      // 2차: fallback 쿼리로 addressSearch 재시도
      if (!coords && fallbackQuery) {
        const fallbackKey = fallbackQuery.trim();
        if (cache[fallbackKey] && Date.now() - cache[fallbackKey].ts < CACHE_TTL_MS) {
          return { lat: cache[fallbackKey].lat, lng: cache[fallbackKey].lng };
        }
        coords = await geocodeOnce(geocoder, fallbackQuery);
        if (coords) {
          cache[fallbackKey] = { ...coords, ts: Date.now() };
        }
      }

      // 3차: Places keywordSearch (아파트명 검색 — addressSearch가 실패하는 단지명용)
      if (!coords) {
        const keywordQuery = fallbackQuery ?? address;
        const kwKey = `kw:${keywordQuery.trim()}`;
        if (cache[kwKey] && Date.now() - cache[kwKey].ts < CACHE_TTL_MS) {
          return { lat: cache[kwKey].lat, lng: cache[kwKey].lng };
        }
        coords = await keywordSearchOnce(keywordQuery);
        if (coords) {
          cache[kwKey] = { ...coords, ts: Date.now() };
        }
      }

      // 캐시에 저장
      if (coords) {
        cache[cacheKey] = { ...coords, ts: Date.now() };
        saveCache(cache);
      }

      return coords;
    },
    []
  );

  // 단지 배열 배치 Geocode - 최대 BATCH_SIZE개씩 병렬 처리
  // lat/lng 없는 단지만 처리하고, 이미 좌표가 있으면 그대로 유지
  const batchGeocode = useCallback(
    async (complexes: ApartmentComplex[]): Promise<ApartmentComplex[]> => {
      // 원본 순서 보존을 위해 결과 배열을 원본 복사본으로 초기화
      const result = [...complexes];
      const needGeocodeIndices = complexes
        .map((c, i) => ({ c, i }))
        .filter(({ c }) => c.lat == null || c.lng == null);

      if (needGeocodeIndices.length === 0) {
        return complexes;
      }

      // BATCH_SIZE씩 나눠서 처리 (원본 인덱스 추적)
      for (let b = 0; b < needGeocodeIndices.length; b += BATCH_SIZE) {
        const batch = needGeocodeIndices.slice(b, b + BATCH_SIZE);

        const batchResults = await Promise.all(
          batch.map(async ({ c: complex, i: originalIndex }) => {
            // fallback: "읍면동명 단지명" 형식
            const fallback = `${complex.umdNm} ${complex.name}`;
            const coords = await geocodeAddress(complex.address, fallback);
            return { originalIndex, geocoded: coords ? { ...complex, lat: coords.lat, lng: coords.lng } : complex };
          })
        );

        // 원본 인덱스 위치에 결과 삽입
        for (const { originalIndex, geocoded } of batchResults) {
          result[originalIndex] = geocoded;
        }

        // 배치 간 딜레이 (마지막 배치 제외)
        if (b + BATCH_SIZE < needGeocodeIndices.length) {
          await sleep(BATCH_DELAY_MS);
        }
      }

      return result;
    },
    [geocodeAddress]
  );

  return { geocodeAddress, batchGeocode };
}
