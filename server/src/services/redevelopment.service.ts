// ============================================================
// 정비사업(재개발/재건축) 마커 서비스
// TODO: 실 데이터소스 — 국토부 정비사업현황 API 또는 서울시 열린데이터광장 연동 예정
// 현재는 주요 정비사업 Mock 데이터 제공
// ============================================================

export interface RedevelopmentProject {
  id: string;
  name: string;         // 정비사업명
  type: 'redevelopment' | 'reconstruction'; // 재개발 | 재건축
  status: 'planning' | 'approved' | 'construction' | 'completed'; // 단계
  lat: number;
  lng: number;
  address: string;
  estimatedUnits?: number; // 예상 세대수
  completionYear?: number; // 예상 완공연도
}

const MOCK_REDEVELOPMENT_PROJECTS: RedevelopmentProject[] = [
  // ---- 재개발 3건 ----
  {
    id: 'rdv-001',
    name: '한남3구역 재개발',
    type: 'redevelopment',
    status: 'approved',
    lat: 37.5348,
    lng: 127.0042,
    address: '서울시 용산구 한남동 686',
    estimatedUnits: 5816,
    completionYear: 2029,
  },
  {
    id: 'rdv-002',
    name: '흑석9구역 재개발',
    type: 'redevelopment',
    status: 'construction',
    lat: 37.5078,
    lng: 126.9623,
    address: '서울시 동작구 흑석동 222',
    estimatedUnits: 1538,
    completionYear: 2026,
  },
  {
    id: 'rdv-003',
    name: '신길1구역 재개발',
    type: 'redevelopment',
    status: 'planning',
    lat: 37.5139,
    lng: 126.9011,
    address: '서울시 영등포구 신길동 359',
    estimatedUnits: 2100,
    completionYear: 2031,
  },
  // ---- 재건축 3건 ----
  {
    id: 'rct-001',
    name: '올림픽파크포레온(둔촌주공)',
    type: 'reconstruction',
    status: 'completed',
    lat: 37.5289,
    lng: 127.1367,
    address: '서울시 강동구 둔촌동 170',
    estimatedUnits: 12032,
    completionYear: 2024,
  },
  {
    id: 'rct-002',
    name: '이촌동 한강맨션 재건축',
    type: 'reconstruction',
    status: 'approved',
    lat: 37.5207,
    lng: 126.9697,
    address: '서울시 용산구 이촌동 300-106',
    estimatedUnits: 1441,
    completionYear: 2029,
  },
  {
    id: 'rct-003',
    name: '압구정3구역 재건축',
    type: 'reconstruction',
    status: 'planning',
    lat: 37.5267,
    lng: 127.0282,
    address: '서울시 강남구 압구정동 192',
    estimatedUnits: 2870,
    completionYear: 2032,
  },
];

// 인메모리 캐시 (TTL: 1시간)
let _cache: { data: RedevelopmentProject[]; expiresAt: number } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * 정비사업 목록 조회
 * @param regionCode 시도 코드 2자리 (선택, 현재 Mock에서는 미사용 — 추후 실 API 연동 시 필터 적용)
 */
export async function getRedevelopmentProjects(
  regionCode?: string,
): Promise<RedevelopmentProject[]> {
  const now = Date.now();

  if (_cache && now < _cache.expiresAt) {
    return regionCode
      ? _cache.data.filter((p) => matchesRegion(p, regionCode))
      : _cache.data;
  }

  // TODO: 실 API 연동 시 이 부분을 외부 호출로 교체
  const data = MOCK_REDEVELOPMENT_PROJECTS;

  _cache = { data, expiresAt: now + CACHE_TTL_MS };

  return regionCode ? data.filter((p) => matchesRegion(p, regionCode)) : data;
}

// 시도 코드 기반 지역 필터 헬퍼 (Mock 주소 문자열 기반 간단 매칭)
function matchesRegion(project: RedevelopmentProject, regionCode: string): boolean {
  // 현재 Mock 데이터 모두 서울(11) — 추후 실 API 연동 시 regionCode 필드 추가 예정
  if (regionCode === '11') return project.address.startsWith('서울');
  return true;
}
