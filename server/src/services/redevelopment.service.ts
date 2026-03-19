// ============================================================
// 정비사업(재개발/재건축) 마커 서비스
// TODO: 실 데이터소스 — 국토부 정비사업현황 API 또는 서울시 열린데이터광장 연동 예정
// 현재는 주요 정비사업 Mock 데이터 제공
// ============================================================

export interface RedevelopmentProject {
  id: string;
  name: string;         // 정비사업명
  type: 'redevelopment' | 'reconstruction' | 'newtown'; // 재개발 | 재건축 | 뉴타운
  status: 'planning' | 'approved' | 'construction' | 'completed'; // 단계
  lat: number;
  lng: number;
  address: string;
  estimatedUnits?: number; // 예상 세대수
  completionYear?: number; // 예상 완공연도
}

const MOCK_REDEVELOPMENT_PROJECTS: RedevelopmentProject[] = [
  // ---- 재개발 ----
  { id: 'rdv-001', name: '한남3구역 재개발', type: 'redevelopment', status: 'approved', lat: 37.5348, lng: 127.0042, address: '서울시 용산구 한남동 686', estimatedUnits: 5816, completionYear: 2029 },
  { id: 'rdv-002', name: '흑석9구역 재개발', type: 'redevelopment', status: 'construction', lat: 37.5078, lng: 126.9623, address: '서울시 동작구 흑석동 222', estimatedUnits: 1538, completionYear: 2026 },
  { id: 'rdv-003', name: '신길1구역 재개발', type: 'redevelopment', status: 'planning', lat: 37.5139, lng: 126.9011, address: '서울시 영등포구 신길동 359', estimatedUnits: 2100, completionYear: 2031 },
  { id: 'rdv-004', name: '성수전략정비구역 4지구', type: 'redevelopment', status: 'approved', lat: 37.5442, lng: 127.0568, address: '서울시 성동구 성수1가', estimatedUnits: 2800 },
  { id: 'rdv-005', name: '노량진1구역 재개발', type: 'redevelopment', status: 'approved', lat: 37.5137, lng: 126.9423, address: '서울시 동작구 노량진동', estimatedUnits: 3885 },
  { id: 'rdv-006', name: '고덕강일 공공주택지구', type: 'redevelopment', status: 'construction', lat: 37.5683, lng: 127.1769, address: '서울시 강동구 강일동', estimatedUnits: 7000, completionYear: 2026 },
  { id: 'rdv-007', name: '망우3재정비촉진구역', type: 'redevelopment', status: 'planning', lat: 37.5883, lng: 127.0932, address: '서울시 중랑구 망우동', estimatedUnits: 1200 },
  // ---- 재건축 ----
  { id: 'rct-001', name: '올림픽파크포레온(둔촌주공)', type: 'reconstruction', status: 'completed', lat: 37.5289, lng: 127.1367, address: '서울시 강동구 둔촌동 170', estimatedUnits: 12032, completionYear: 2024 },
  { id: 'rct-002', name: '이촌동 한강맨션 재건축', type: 'reconstruction', status: 'approved', lat: 37.5207, lng: 126.9697, address: '서울시 용산구 이촌동 300-106', estimatedUnits: 1441, completionYear: 2029 },
  { id: 'rct-003', name: '압구정3구역 재건축', type: 'reconstruction', status: 'planning', lat: 37.5267, lng: 127.0282, address: '서울시 강남구 압구정동 192', estimatedUnits: 2870, completionYear: 2032 },
  { id: 'rct-004', name: '반포주공1단지 재건축', type: 'reconstruction', status: 'approved', lat: 37.5073, lng: 126.9994, address: '서울시 서초구 반포동', estimatedUnits: 2990 },
  // ---- 뉴타운 ----
  { id: 'ntt-001', name: '흑석뉴타운', type: 'newtown', status: 'construction', lat: 37.5105, lng: 126.9603, address: '서울시 동작구 흑석동', estimatedUnits: 5700, completionYear: 2027 },
  { id: 'ntt-002', name: '은평뉴타운', type: 'newtown', status: 'completed', lat: 37.6356, lng: 126.9238, address: '서울시 은평구 진관동', estimatedUnits: 16000, completionYear: 2011 },
];

// 인메모리 캐시 (TTL: 1시간)
let _cache: { data: RedevelopmentProject[]; expiresAt: number } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * 정비사업 목록 조회
 * @param regionCode 시도 코드 2자리 (선택)
 * @param bbox 뷰포트 bounding box (선택 — 지도 마커 렌더링 시 사용)
 */
export async function getRedevelopmentProjects(
  regionCode?: string,
  bbox?: { swLat: number; swLng: number; neLat: number; neLng: number },
): Promise<RedevelopmentProject[]> {
  const now = Date.now();

  if (!(_cache && now < _cache.expiresAt)) {
    // TODO: 실 API 연동 시 이 부분을 외부 호출로 교체
    _cache = { data: MOCK_REDEVELOPMENT_PROJECTS, expiresAt: now + CACHE_TTL_MS };
  }

  let result = _cache.data;
  if (regionCode) result = result.filter((p) => matchesRegion(p, regionCode));
  if (bbox) {
    result = result.filter(
      (p) => p.lat >= bbox.swLat && p.lat <= bbox.neLat && p.lng >= bbox.swLng && p.lng <= bbox.neLng,
    );
  }
  return result;
}

// 시도 코드 기반 지역 필터 헬퍼 (Mock 주소 문자열 기반 간단 매칭)
function matchesRegion(project: RedevelopmentProject, regionCode: string): boolean {
  // 현재 Mock 데이터 모두 서울(11) — 추후 실 API 연동 시 regionCode 필드 추가 예정
  if (regionCode === '11') return project.address.startsWith('서울');
  return true;
}
