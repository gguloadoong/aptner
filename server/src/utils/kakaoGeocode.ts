// Kakao Local Search API를 사용한 서버사이드 아파트 좌표 조회
// 결과를 인메모리 캐시에 저장하여 반복 API 호출 방지

const GEO_CACHE = new Map<string, { lat: number; lng: number; ts: number }>();
const GEO_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7일
const GEO_CACHE_MAX = 500; // 최대 항목 수 — 초과 시 만료/오래된 항목 제거

function evictGeoCache(): void {
  const now = Date.now();
  // 1차: 만료된 항목 제거
  for (const [key, val] of GEO_CACHE) {
    if (now - val.ts >= GEO_CACHE_TTL) GEO_CACHE.delete(key);
  }
  // 2차: 여전히 초과면 가장 오래된 항목부터 제거
  if (GEO_CACHE.size > GEO_CACHE_MAX) {
    const overflow = GEO_CACHE.size - GEO_CACHE_MAX;
    let removed = 0;
    for (const key of GEO_CACHE.keys()) {
      if (removed >= overflow) break;
      GEO_CACHE.delete(key);
      removed++;
    }
  }
}

export async function geocodeComplex(
  name: string,
  umdNm: string,
  centerLng?: number,
  centerLat?: number
): Promise<{ lat: number; lng: number } | null> {
  const cacheKey = `${name}:${umdNm}`;
  const cached = GEO_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < GEO_CACHE_TTL) {
    return { lat: cached.lat, lng: cached.lng };
  }

  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) return null;

  const query = `${umdNm} ${name}`;
  // x/y는 결과 정렬 힌트로만 사용 (radius 없이) — radius를 쓰면 검색 범위가 좁아져 누락 발생
  const params = new URLSearchParams({ query, size: '5' });
  if (centerLng != null && centerLat != null) {
    params.set('x', String(centerLng));
    params.set('y', String(centerLat));
  }

  // KA 헤더: Kakao JS 키는 등록된 도메인 origin 필요
  const kaOrigin = process.env.KAKAO_KA_ORIGIN ?? 'https://client-steel-rho.vercel.app';

  try {
    const res = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?${params}`,
      {
        headers: {
          Authorization: `KakaoAK ${apiKey}`,
          KA: `sdk/2.1.0 os/javascript lang/ko-KR device/desktop origin/${kaOrigin}`,
        },
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { documents: Array<{ x: string; y: string; place_name: string }> };
    if (!data.documents?.length) return null;

    // 아파트 관련 장소 우선 선택 (관리사무소, 주차장 등 제외)
    const EXCLUDE_KEYWORDS = ['관리사무소', '주차장', '공인중개', '부동산', '상가'];
    const apt = data.documents.find(
      (d) => !EXCLUDE_KEYWORDS.some((kw) => d.place_name.includes(kw))
    ) ?? data.documents[0];
    const doc = apt;
    const coords = { lat: parseFloat(doc.y), lng: parseFloat(doc.x) };
    if (GEO_CACHE.size >= GEO_CACHE_MAX) evictGeoCache();
    GEO_CACHE.set(cacheKey, { ...coords, ts: Date.now() });
    return coords;
  } catch {
    return null;
  }
}

// 배치 geocoding — 최대 5개 병렬, API rate limit 대응
export async function batchGeocodeComplexes<T extends { name: string; umdNm: string; lat?: number | null; lng?: number | null }>(
  complexes: T[],
  centerLng?: number,
  centerLat?: number
): Promise<(T & { lat: number | null; lng: number | null })[]> {
  const BATCH = 5;
  const result: (T & { lat: number | null; lng: number | null })[] = [];

  for (let i = 0; i < complexes.length; i += BATCH) {
    const batch = complexes.slice(i, i + BATCH);
    const geocoded = await Promise.all(
      batch.map(async (c) => {
        if (c.lat != null && c.lng != null) return { ...c, lat: c.lat, lng: c.lng };
        const coords = await geocodeComplex(c.name, c.umdNm, centerLng, centerLat);
        return { ...c, lat: coords?.lat ?? null, lng: coords?.lng ?? null };
      })
    );
    result.push(...geocoded);

    // 마지막 배치 제외하고 딜레이
    if (i + BATCH < complexes.length) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  return result;
}
