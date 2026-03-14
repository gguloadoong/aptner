// ============================================================
// 청약 정보 서비스
// TODO: 실제 LH 청약홈 API 연동 시 이 파일의 Mock 데이터를 교체하세요.
// LH 청약홈 OpenAPI: https://apply.lh.or.kr/lhapply/api/open/api.do
// 현재는 실제 데이터 형태를 갖춘 Mock 데이터로 구현됩니다.
// ============================================================
import {
  Subscription,
  SubscriptionDetail,
  SubscriptionQueryParams,
  SubscriptionStatus,
} from '../types';
import { cacheService, CACHE_TTL } from './cache.service';

/**
 * 현재 날짜 기준으로 N일 후(전)의 날짜 문자열 반환
 * 음수 값을 넘기면 과거 날짜를 반환합니다.
 */
function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * D-day 계산 유틸리티
 */
function calcDDay(endDateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(endDateStr);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * 날짜 문자열을 기준으로 청약 상태를 계산합니다.
 */
function calcStatus(startDate: string, endDate: string): SubscriptionStatus {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now < start) return 'upcoming';
  if (now > end) return 'closed';
  return 'ongoing';
}

// ---- Mock 데이터 (실제 청약홈 API 연동 전까지 사용) ----
// 날짜는 daysFromNow()로 동적 생성하여 항상 현재 기준 상대값을 유지합니다.
// ongoing:  startDate 과거, endDate 미래
// upcoming: startDate 미래
// closed:   endDate 과거

const MOCK_SUBSCRIPTIONS_RAW: Omit<Subscription, 'status' | 'dDay'>[] = [
  // ---- 진행중(ongoing) 2개 이상 ----
  {
    id: 'sub-2024-001',
    name: '래미안 원베일리 2차',
    constructor: '삼성물산',
    sido: '서울특별시',
    sigungu: '서초구',
    address: '서울특별시 서초구 반포동 1-1',
    minPrice: 150000,
    maxPrice: 280000,
    totalSupply: 641,
    startDate: daysFromNow(-3),   // 3일 전 시작
    endDate: daysFromNow(4),      // 4일 후 마감
    announceDate: daysFromNow(18),
    type: '일반공급',
    areas: [
      { typeName: '59A', area: 59.98, supply: 120, price: 150000 },
      { typeName: '84A', area: 84.99, supply: 320, price: 200000 },
      { typeName: '109A', area: 109.97, supply: 201, price: 280000 },
    ],
  },
  {
    id: 'sub-2024-002',
    name: '힐스테이트 e편한세상 문정',
    constructor: '현대건설/대림산업',
    sido: '서울특별시',
    sigungu: '송파구',
    address: '서울특별시 송파구 문정동 150',
    minPrice: 80000,
    maxPrice: 120000,
    totalSupply: 1052,
    startDate: daysFromNow(-5),   // 5일 전 시작
    endDate: daysFromNow(2),      // 2일 후 마감
    announceDate: daysFromNow(16),
    type: '일반공급',
    areas: [
      { typeName: '59A', area: 59.6, supply: 400, price: 80000 },
      { typeName: '74A', area: 74.99, supply: 352, price: 100000 },
      { typeName: '84B', area: 84.5, supply: 300, price: 120000 },
    ],
  },
  {
    id: 'sub-2024-006',
    name: '마포 래미안 클래스',
    constructor: '삼성물산',
    sido: '서울특별시',
    sigungu: '마포구',
    address: '서울특별시 마포구 아현동 300',
    minPrice: 95000,
    maxPrice: 135000,
    totalSupply: 720,
    startDate: daysFromNow(-1),   // 어제 시작
    endDate: daysFromNow(6),      // 6일 후 마감
    announceDate: daysFromNow(20),
    type: '일반공급',
    areas: [
      { typeName: '59A', area: 59.9, supply: 280, price: 95000 },
      { typeName: '84A', area: 84.7, supply: 440, price: 135000 },
    ],
  },

  // ---- 예정(upcoming) 3개 이상 ----
  {
    id: 'sub-2024-003',
    name: '수원 광교 아이파크',
    constructor: 'HDC현대산업개발',
    sido: '경기도',
    sigungu: '수원시 영통구',
    address: '경기도 수원시 영통구 광교동 100',
    minPrice: 55000,
    maxPrice: 90000,
    totalSupply: 824,
    startDate: daysFromNow(10),   // 10일 후 시작
    endDate: daysFromNow(14),     // 14일 후 마감
    announceDate: daysFromNow(28),
    type: '일반공급',
    areas: [
      { typeName: '59A', area: 59.7, supply: 300, price: 55000 },
      { typeName: '84A', area: 84.98, supply: 400, price: 75000 },
      { typeName: '101A', area: 101.0, supply: 124, price: 90000 },
    ],
  },
  {
    id: 'sub-2024-005',
    name: '고양 창릉 e편한세상',
    constructor: '대림산업',
    sido: '경기도',
    sigungu: '고양시 덕양구',
    address: '경기도 고양시 덕양구 창릉동 50',
    minPrice: 45000,
    maxPrice: 68000,
    totalSupply: 980,
    startDate: daysFromNow(20),   // 20일 후 시작
    endDate: daysFromNow(24),     // 24일 후 마감
    announceDate: daysFromNow(38),
    type: '특별공급',
    areas: [
      { typeName: '59A', area: 59.5, supply: 400, price: 45000 },
      { typeName: '74A', area: 74.5, supply: 380, price: 58000 },
      { typeName: '84A', area: 84.6, supply: 200, price: 68000 },
    ],
  },
  {
    id: 'sub-2024-007',
    name: '인천 송도 더샵 센트럴파크',
    constructor: '포스코이앤씨',
    sido: '인천광역시',
    sigungu: '연수구',
    address: '인천광역시 연수구 송도동 400',
    minPrice: 62000,
    maxPrice: 95000,
    totalSupply: 1200,
    startDate: daysFromNow(30),   // 30일 후 시작
    endDate: daysFromNow(34),     // 34일 후 마감
    announceDate: daysFromNow(48),
    type: '일반공급',
    areas: [
      { typeName: '59A', area: 59.8, supply: 500, price: 62000 },
      { typeName: '74A', area: 74.6, supply: 400, price: 78000 },
      { typeName: '84A', area: 84.9, supply: 300, price: 95000 },
    ],
  },

  // ---- 마감(closed) 2개 이상 ----
  {
    id: 'sub-2024-004',
    name: '인천 검단 푸르지오 더퍼스트',
    constructor: '대우건설',
    sido: '인천광역시',
    sigungu: '서구',
    address: '인천광역시 서구 검단동 200',
    minPrice: 32000,
    maxPrice: 48000,
    totalSupply: 1560,
    startDate: daysFromNow(-20),  // 20일 전 시작
    endDate: daysFromNow(-16),    // 16일 전 마감
    announceDate: daysFromNow(-2),
    type: '일반공급',
    areas: [
      { typeName: '59A', area: 59.99, supply: 600, price: 32000 },
      { typeName: '84A', area: 84.9, supply: 760, price: 42000 },
      { typeName: '102A', area: 102.5, supply: 200, price: 48000 },
    ],
  },
  {
    id: 'sub-2024-008',
    name: '부산 해운대 아이파크',
    constructor: 'HDC현대산업개발',
    sido: '부산광역시',
    sigungu: '해운대구',
    address: '부산광역시 해운대구 우동 500',
    minPrice: 58000,
    maxPrice: 88000,
    totalSupply: 890,
    startDate: daysFromNow(-35),  // 35일 전 시작
    endDate: daysFromNow(-31),    // 31일 전 마감
    announceDate: daysFromNow(-17),
    type: '일반공급',
    areas: [
      { typeName: '59A', area: 59.5, supply: 350, price: 58000 },
      { typeName: '84A', area: 84.8, supply: 400, price: 74000 },
      { typeName: '101A', area: 101.2, supply: 140, price: 88000 },
    ],
  },
];

/**
 * Mock 데이터에 상태와 D-day를 동적으로 계산하여 붙입니다.
 * 매 호출 시 현재 날짜 기준으로 재계산됩니다.
 */
function buildSubscriptions(): Subscription[] {
  return MOCK_SUBSCRIPTIONS_RAW.map((raw) => ({
    ...raw,
    status: calcStatus(raw.startDate, raw.endDate),
    dDay: calcDDay(raw.endDate),
  }));
}

/**
 * 청약 목록을 조회합니다.
 * Mock 데이터를 반환합니다.
 * TODO: LH 청약홈 API 연동 시 교체 필요
 *
 * 캐시 키에 오늘 날짜(YYYY-MM-DD)를 포함하여,
 * 자정이 지나면 캐시가 자동으로 무효화됩니다.
 */
export async function getSubscriptions(
  params: SubscriptionQueryParams,
): Promise<{ items: Subscription[]; total: number }> {
  // 날짜를 캐시 키에 포함 → 날짜가 바뀌면 캐시 자동 무효화
  const today = new Date().toISOString().split('T')[0]; // "2026-03-14"
  const cacheKey = `subs:${today}:${JSON.stringify(params)}`;

  const cached = cacheService.get<{ items: Subscription[]; total: number }>(cacheKey);
  if (cached) {
    console.log(`[Subscription] 캐시 히트: ${cacheKey}`);
    return cached;
  }

  const { page = 1, limit = 20, status, sido, sort } = params;

  let list = buildSubscriptions();

  // 상태 필터
  if (status) {
    list = list.filter((s) => s.status === status);
  }

  // 시도 필터
  if (sido) {
    list = list.filter((s) => s.sido.includes(sido));
  }

  // 정렬 (MAJOR-04 추가)
  if (sort === 'price') {
    list.sort((a, b) => a.minPrice - b.minPrice);
  } else if (sort === 'latest') {
    list.sort((a, b) => b.startDate.localeCompare(a.startDate));
  } else {
    // 기본: 마감일 오름차순
    list.sort((a, b) => a.endDate.localeCompare(b.endDate));
  }

  const total = list.length;
  const start = (page - 1) * limit;
  const items = list.slice(start, start + limit);

  const result = { items, total };
  // TTL을 10분으로 설정 (날짜 키 포함으로 자정 무효화도 함께 적용)
  cacheService.set(cacheKey, result, CACHE_TTL.SUBSCRIPTION);

  return result;
}

/**
 * 청약 상세 정보를 조회합니다.
 * Mock 데이터를 반환합니다.
 * TODO: LH 청약홈 API 연동 시 교체 필요
 *
 * 상세 조회도 날짜를 캐시 키에 포함하여 stale 방지.
 */
export async function getSubscriptionById(id: string): Promise<SubscriptionDetail | null> {
  const today = new Date().toISOString().split('T')[0];
  const cacheKey = `sub:${today}:${id}`;

  const cached = cacheService.get<SubscriptionDetail>(cacheKey);
  if (cached) {
    console.log(`[Subscription] 상세 캐시 히트: ${cacheKey}`);
    return cached;
  }

  const list = buildSubscriptions();
  const found = list.find((s) => s.id === id);

  if (!found) return null;

  // 상세 정보 조합
  const detail: SubscriptionDetail = {
    ...found,
    schedule: {
      specialStartDate: subtractDays(found.startDate, 2),
      specialEndDate: subtractDays(found.startDate, 1),
      firstPriorityDate: found.startDate,
      secondPriorityDate: addDays(found.startDate, 1),
      announceDate: found.announceDate,
      contractStartDate: addDays(found.announceDate, 7),
      contractEndDate: addDays(found.announceDate, 14),
    },
    specialSupply: Math.floor(found.totalSupply * 0.3),
  };

  cacheService.set(cacheKey, detail, CACHE_TTL.SUBSCRIPTION);

  return detail;
}

/** 날짜 문자열에서 N일을 뺀 날짜 문자열 반환 */
function subtractDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

/** 날짜 문자열에 N일을 더한 날짜 문자열 반환 */
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
