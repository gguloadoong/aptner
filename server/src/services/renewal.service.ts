// ============================================================
// [P3] 정비사업(재개발·재건축) 마커 서비스 — Mock 기반 구조
//
// TODO: 실 데이터소스 연동 옵션
//  1) 서울시 열린데이터광장 「정비구역 현황」
//     https://data.seoul.go.kr/dataList/OA-15560/S/1/datasetView.do
//  2) 서울시 클린업시스템 API
//     https://cleanup.seoul.go.kr (공개 API 없음 — 스크래핑 필요)
//  3) 국토교통부 도시재생 정보체계
//     https://www.city.go.kr (PDF 위주라 구조화 어려움)
//  권고: 서울시 공공데이터 API 키 발급 후 옵션 1 연동
// ============================================================

export type RenewalType = 'redevelopment' | 'reconstruction' | 'newtown';
export type RenewalStatus = 'planning' | 'approved' | 'under_construction' | 'completed';

export interface RenewalProject {
  id: string;
  name: string;         // 구역명 (예: 성수1가 제4구역)
  district: string;     // 행정구 (예: 성동구)
  dong: string;         // 읍면동 (예: 성수1가)
  type: RenewalType;
  status: RenewalStatus;
  lat: number;
  lng: number;
  totalUnits?: number;  // 계획 세대수
  completionYear?: number;
}

// ---- Mock 데이터 (서울 주요 정비사업 구역) ----
// 좌표는 구역 중심 근사치
const MOCK_RENEWAL_PROJECTS: RenewalProject[] = [
  {
    id: 'renewal-seongsu-4',
    name: '성수전략정비구역 4지구',
    district: '성동구',
    dong: '성수1가',
    type: 'redevelopment',
    status: 'approved',
    lat: 37.5442,
    lng: 127.0568,
    totalUnits: 2800,
  },
  {
    id: 'renewal-noryangjin-1',
    name: '노량진1구역',
    district: '동작구',
    dong: '노량진동',
    type: 'redevelopment',
    status: 'approved',
    lat: 37.5137,
    lng: 126.9423,
    totalUnits: 3885,
  },
  {
    id: 'renewal-heukseok-newtown',
    name: '흑석뉴타운',
    district: '동작구',
    dong: '흑석동',
    type: 'newtown',
    status: 'under_construction',
    lat: 37.5105,
    lng: 126.9603,
    totalUnits: 5700,
    completionYear: 2027,
  },
  {
    id: 'renewal-eunpyeong-newtown',
    name: '은평뉴타운',
    district: '은평구',
    dong: '진관동',
    type: 'newtown',
    status: 'completed',
    lat: 37.6356,
    lng: 126.9238,
    totalUnits: 16000,
    completionYear: 2011,
  },
  {
    id: 'renewal-godeok-gangdong',
    name: '고덕강일 공공주택지구',
    district: '강동구',
    dong: '강일동',
    type: 'redevelopment',
    status: 'under_construction',
    lat: 37.5683,
    lng: 127.1769,
    totalUnits: 7000,
    completionYear: 2026,
  },
  {
    id: 'renewal-mangwoo-3',
    name: '망우3재정비촉진구역',
    district: '중랑구',
    dong: '망우동',
    type: 'redevelopment',
    status: 'planning',
    lat: 37.5883,
    lng: 127.0932,
    totalUnits: 1200,
  },
  {
    id: 'renewal-banpo',
    name: '반포주공1단지 재건축',
    district: '서초구',
    dong: '반포동',
    type: 'reconstruction',
    status: 'approved',
    lat: 37.5073,
    lng: 126.9994,
    totalUnits: 2990,
  },
  {
    id: 'renewal-dunchon',
    name: '둔촌주공 재건축(올림픽파크포레온)',
    district: '강동구',
    dong: '둔촌동',
    type: 'reconstruction',
    status: 'completed',
    lat: 37.5313,
    lng: 127.1372,
    totalUnits: 12032,
    completionYear: 2024,
  },
];

/**
 * 뷰포트 bounding box 내 정비사업 구역 반환.
 * swLat/swLng/neLat/neLng 없으면 전체 반환.
 */
export function getRenewalProjects(
  swLat?: number,
  swLng?: number,
  neLat?: number,
  neLng?: number,
): RenewalProject[] {
  if (swLat == null || swLng == null || neLat == null || neLng == null) {
    return MOCK_RENEWAL_PROJECTS;
  }
  return MOCK_RENEWAL_PROJECTS.filter(
    (p) => p.lat >= swLat && p.lat <= neLat && p.lng >= swLng && p.lng <= neLng,
  );
}
