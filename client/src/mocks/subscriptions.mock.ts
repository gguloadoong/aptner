import type { Subscription, SubscriptionStatus } from '../types';

// 현재 날짜 기준 N일 후/전 YYYY-MM-DD 반환
function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// endDate 기준 D-day 숫자 계산 (오늘 = 0, 미래 = 양수, 과거 = 음수)
function calcDayDiff(endDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// 날짜 기반 status 동적 계산
function calcStatus(startDate: string, endDate: string): SubscriptionStatus {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (now < start) return 'upcoming';
  if (now > end) return 'closed';
  return 'ongoing';
}

// 청약 Mock 데이터 (CRIT-01: BE 확정 타입 기준)
// 날짜는 daysFromNow()로 동적 생성하여 항상 현재 기준 상대값을 유지합니다.
// ongoing:  startDate 과거, endDate 미래
// upcoming: startDate 미래
// closed:   endDate 과거

function buildMockSubscriptions(): Subscription[] {
  const items: Omit<Subscription, 'status' | 'dDay'>[] = [
    // ---- ongoing 3개 ----
    {
      id: 'sub-001',
      name: '힐스테이트 동탄 2차',
      location: '경기도 화성시 동탄2신도시',
      startDate: daysFromNow(-2),
      endDate: daysFromNow(4),
      totalUnits: 1240,
      supplyPrice: 42000,
      district: '화성시',
      areas: [
        { area: '59', price: 42000, units: 400, generalRatio: 40, lotteryRatio: 60 },
        { area: '84', price: 58000, units: 600, generalRatio: 75, lotteryRatio: 25 },
        { area: '101', price: 65000, units: 240, generalRatio: 75, lotteryRatio: 25 },
      ],
      lat: 37.2075,
      lng: 127.0760,
    },
    {
      id: 'sub-002',
      name: '래미안 원베일리 2단지',
      location: '서울특별시 서초구 반포동',
      startDate: daysFromNow(-3),
      endDate: daysFromNow(6),
      totalUnits: 386,
      supplyPrice: 180000,
      district: '서초구',
      areas: [
        { area: '59', price: 180000, units: 100, generalRatio: 100, lotteryRatio: 0 },
        { area: '84', price: 240000, units: 200, generalRatio: 100, lotteryRatio: 0 },
        { area: '114', price: 280000, units: 86, generalRatio: 100, lotteryRatio: 0 },
      ],
      lat: 37.5065,
      lng: 127.0050,
    },
    {
      id: 'sub-003',
      name: '검단 푸르지오 더파크',
      location: '인천광역시 서구 검단신도시',
      startDate: daysFromNow(-5),
      endDate: daysFromNow(2),
      totalUnits: 880,
      supplyPrice: 35000,
      district: '서구',
      areas: [
        { area: '59', price: 35000, units: 300, generalRatio: 40, lotteryRatio: 60 },
        { area: '74', price: 44000, units: 380, generalRatio: 75, lotteryRatio: 25 },
        { area: '84', price: 52000, units: 200, generalRatio: 75, lotteryRatio: 25 },
      ],
      lat: 37.5697,
      lng: 126.7291,
    },
    // ---- upcoming 4개 ----
    {
      id: 'sub-004',
      name: 'e편한세상 광명 어반센트로',
      location: '경기도 광명시 광명동',
      startDate: daysFromNow(18),
      endDate: daysFromNow(20),
      totalUnits: 542,
      supplyPrice: 55000,
      district: '광명시',
      areas: [
        { area: '59', price: 55000, units: 180, generalRatio: 75, lotteryRatio: 25 },
        { area: '84', price: 72000, units: 280, generalRatio: 75, lotteryRatio: 25 },
        { area: '101', price: 80000, units: 82, generalRatio: 75, lotteryRatio: 25 },
      ],
      lat: 37.4785,
      lng: 126.8653,
    },
    {
      id: 'sub-005',
      name: '위례 자이 더시티',
      location: '경기도 하남시 학암동',
      startDate: daysFromNow(22),
      endDate: daysFromNow(25),
      totalUnits: 784,
      supplyPrice: 65000,
      district: '하남시',
      areas: [
        { area: '59', price: 65000, units: 250, generalRatio: 75, lotteryRatio: 25 },
        { area: '84', price: 85000, units: 400, generalRatio: 75, lotteryRatio: 25 },
        { area: '109', price: 95000, units: 134, generalRatio: 75, lotteryRatio: 25 },
      ],
      lat: 37.4803,
      lng: 127.1472,
    },
    {
      id: 'sub-006',
      name: '과천 르센토 데시앙',
      location: '경기도 과천시 주암동',
      startDate: daysFromNow(28),
      endDate: daysFromNow(30),
      totalUnits: 612,
      supplyPrice: 88000,
      district: '과천시',
      areas: [
        { area: '59', price: 88000, units: 200, generalRatio: 0, lotteryRatio: 100 },
        { area: '84', price: 115000, units: 300, generalRatio: 75, lotteryRatio: 25 },
        { area: '114', price: 135000, units: 112, generalRatio: 75, lotteryRatio: 25 },
      ],
      lat: 37.4261,
      lng: 126.9878,
    },
    {
      id: 'sub-007',
      name: '송도 랜드마크시티 센트럴 더샵',
      location: '인천광역시 연수구 송도동',
      startDate: daysFromNow(35),
      endDate: daysFromNow(37),
      totalUnits: 1058,
      supplyPrice: 48000,
      district: '연수구',
      areas: [
        { area: '59', price: 48000, units: 350, generalRatio: 40, lotteryRatio: 60 },
        { area: '74', price: 62000, units: 450, generalRatio: 75, lotteryRatio: 25 },
        { area: '84', price: 72000, units: 258, generalRatio: 75, lotteryRatio: 25 },
      ],
      lat: 37.3851,
      lng: 126.6558,
    },
    // ---- closed 3개 ----
    {
      id: 'sub-008',
      name: '힐스테이트 대구 더퍼스트',
      location: '대구광역시 수성구 황금동',
      startDate: daysFromNow(-19),
      endDate: daysFromNow(-15),
      totalUnits: 432,
      supplyPrice: 45000,
      district: '수성구',
      areas: [
        { area: '59', price: 45000, units: 150, generalRatio: 40, lotteryRatio: 60 },
        { area: '84', price: 62000, units: 200, generalRatio: 75, lotteryRatio: 25 },
        { area: '109', price: 68000, units: 82, generalRatio: 75, lotteryRatio: 25 },
      ],
      lat: 35.8668,
      lng: 128.6293,
    },
    {
      id: 'sub-009',
      name: '롯데캐슬 부산 센트럴파크',
      location: '부산광역시 동구 범일동',
      startDate: daysFromNow(-28),
      endDate: daysFromNow(-25),
      totalUnits: 680,
      supplyPrice: 38000,
      district: '동구',
      areas: [
        { area: '59', price: 38000, units: 250, generalRatio: 40, lotteryRatio: 60 },
        { area: '84', price: 52000, units: 350, generalRatio: 75, lotteryRatio: 25 },
        { area: '101', price: 58000, units: 80, generalRatio: 75, lotteryRatio: 25 },
      ],
      lat: 35.1368,
      lng: 129.0416,
    },
    {
      id: 'sub-010',
      name: '동탄역 롯데캐슬 나노시티',
      location: '경기도 화성시 영통구 이의동',
      startDate: daysFromNow(-38),
      endDate: daysFromNow(-35),
      totalUnits: 924,
      supplyPrice: 52000,
      district: '화성시',
      areas: [
        { area: '59', price: 52000, units: 300, generalRatio: 40, lotteryRatio: 60 },
        { area: '74', price: 65000, units: 400, generalRatio: 75, lotteryRatio: 25 },
        { area: '84', price: 78000, units: 224, generalRatio: 75, lotteryRatio: 25 },
      ],
      lat: 37.2449,
      lng: 127.0783,
    },
    // ---- ongoing 추가 2개 ----
    {
      id: 'SUB009',
      name: '동탄2 아이파크 더레이크',
      location: '경기 화성시 동탄',
      startDate: daysFromNow(-5),
      endDate: daysFromNow(8),
      totalUnits: 1284,
      supplyPrice: 38000,
      district: '화성시',
      areas: [
        { area: '59', price: 38000, units: 312, generalRatio: 40, lotteryRatio: 60 },
        { area: '84', price: 55000, units: 742, generalRatio: 75, lotteryRatio: 25 },
        { area: '109', price: 72000, units: 230, generalRatio: 75, lotteryRatio: 25 },
      ],
      lat: 37.2191,
      lng: 127.0812,
    },
    {
      id: 'SUB010',
      name: '과천 푸르지오 어울림 라비엔오',
      location: '경기 과천시',
      startDate: daysFromNow(-3),
      endDate: daysFromNow(4),
      totalUnits: 429,
      supplyPrice: 72000,
      district: '과천시',
      areas: [
        { area: '59', price: 72000, units: 180, generalRatio: 75, lotteryRatio: 25 },
        { area: '84', price: 95000, units: 249, generalRatio: 75, lotteryRatio: 25 },
      ],
      lat: 37.4295,
      lng: 126.9891,
    },
    // ---- upcoming 추가 2개 ----
    {
      id: 'SUB011',
      name: '부산 북항 르엘',
      location: '부산 동구 범일동',
      startDate: daysFromNow(18),
      endDate: daysFromNow(22),
      totalUnits: 1096,
      supplyPrice: 52000,
      district: '동구',
      areas: [
        { area: '59', price: 52000, units: 420, generalRatio: 40, lotteryRatio: 60 },
        { area: '84', price: 78000, units: 546, generalRatio: 75, lotteryRatio: 25 },
        { area: '109', price: 105000, units: 130, generalRatio: 75, lotteryRatio: 25 },
      ],
      lat: 35.1162,
      lng: 129.0523,
    },
    {
      id: 'SUB012',
      name: '세종 6-3생활권 힐스테이트',
      location: '세종특별자치시 어진동',
      startDate: daysFromNow(25),
      endDate: daysFromNow(29),
      totalUnits: 842,
      supplyPrice: 29000,
      district: '세종시',
      areas: [
        { area: '59', price: 29000, units: 310, generalRatio: 40, lotteryRatio: 60 },
        { area: '84', price: 42000, units: 420, generalRatio: 75, lotteryRatio: 25 },
        { area: '109', price: 58000, units: 112, generalRatio: 75, lotteryRatio: 25 },
      ],
      lat: 36.5012,
      lng: 127.2719,
    },
    // ---- closed 추가 1개 ----
    {
      id: 'SUB013',
      name: '안산 그랑시티자이 2차',
      location: '경기 안산시 단원구',
      startDate: daysFromNow(-60),
      endDate: daysFromNow(-45),
      totalUnits: 2037,
      supplyPrice: 32000,
      district: '안산시',
      areas: [
        { area: '59', price: 32000, units: 820, generalRatio: 40, lotteryRatio: 60 },
        { area: '84', price: 48000, units: 1017, generalRatio: 75, lotteryRatio: 25 },
        { area: '109', price: 65000, units: 200, generalRatio: 75, lotteryRatio: 25 },
      ],
      lat: 37.3215,
      lng: 126.8312,
    },
  ];

  return items.map((item) => ({
    ...item,
    status: calcStatus(item.startDate, item.endDate),
    dDay: calcDayDiff(item.endDate),
  }));
}

export const MOCK_SUBSCRIPTIONS: Subscription[] = buildMockSubscriptions();
