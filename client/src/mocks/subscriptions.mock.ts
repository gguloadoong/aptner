import type { Subscription, SubscriptionStatus } from '../types';

// 현재 날짜 기준 N일 후/전 YYYY-MM-DD 반환
function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// 날짜 기반 status 동적 계산
function calcStatus(startDate: string, deadline: string): SubscriptionStatus {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  const end = new Date(deadline);
  if (now < start) return 'upcoming';
  if (now > end) return 'closed';
  return 'ongoing';
}

// 청약 Mock 데이터
// 날짜는 daysFromNow()로 동적 생성하여 항상 현재 기준 상대값을 유지합니다.
// ongoing:  startDate 과거, deadline 미래
// upcoming: startDate 미래
// closed:   deadline 과거

function buildMockSubscriptions(): Subscription[] {
  const items: Omit<Subscription, 'status'>[] = [
    // ---- ongoing 3개 ----
    {
      id: 'sub-001',
      name: '힐스테이트 동탄 2차',
      location: '경기도 화성시 동탄2신도시',
      district: '화성시',
      startPrice: 42000,
      maxPrice: 65000,
      deadline: daysFromNow(4),
      startDate: daysFromNow(-2),
      supplyUnits: 1240,
      type: 'general',
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
      district: '서초구',
      startPrice: 180000,
      maxPrice: 280000,
      deadline: daysFromNow(6),
      startDate: daysFromNow(-3),
      supplyUnits: 386,
      type: 'general',
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
      district: '서구',
      startPrice: 35000,
      maxPrice: 52000,
      deadline: daysFromNow(2),
      startDate: daysFromNow(-5),
      supplyUnits: 880,
      type: 'general',
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
      district: '광명시',
      startPrice: 55000,
      maxPrice: 80000,
      deadline: daysFromNow(20),
      startDate: daysFromNow(18),
      supplyUnits: 542,
      type: 'general',
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
      district: '하남시',
      startPrice: 65000,
      maxPrice: 95000,
      deadline: daysFromNow(25),
      startDate: daysFromNow(22),
      supplyUnits: 784,
      type: 'general',
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
      district: '과천시',
      startPrice: 88000,
      maxPrice: 135000,
      deadline: daysFromNow(30),
      startDate: daysFromNow(28),
      supplyUnits: 612,
      type: 'special',
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
      district: '연수구',
      startPrice: 48000,
      maxPrice: 72000,
      deadline: daysFromNow(37),
      startDate: daysFromNow(35),
      supplyUnits: 1058,
      type: 'general',
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
      district: '수성구',
      startPrice: 45000,
      maxPrice: 68000,
      deadline: daysFromNow(-15),
      startDate: daysFromNow(-19),
      supplyUnits: 432,
      type: 'general',
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
      district: '동구',
      startPrice: 38000,
      maxPrice: 58000,
      deadline: daysFromNow(-25),
      startDate: daysFromNow(-28),
      supplyUnits: 680,
      type: 'general',
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
      district: '화성시',
      startPrice: 52000,
      maxPrice: 78000,
      deadline: daysFromNow(-35),
      startDate: daysFromNow(-38),
      supplyUnits: 924,
      type: 'general',
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
      district: '화성시',
      startPrice: 38000,
      maxPrice: 85000,
      deadline: daysFromNow(8),
      startDate: daysFromNow(-5),
      supplyUnits: 1284,
      type: 'general',
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
      district: '과천시',
      startPrice: 72000,
      maxPrice: 118000,
      deadline: daysFromNow(4),
      startDate: daysFromNow(-3),
      supplyUnits: 429,
      type: 'general',
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
      district: '동구',
      startPrice: 52000,
      maxPrice: 128000,
      deadline: daysFromNow(22),
      startDate: daysFromNow(18),
      supplyUnits: 1096,
      type: 'general',
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
      district: '세종시',
      startPrice: 29000,
      maxPrice: 72000,
      deadline: daysFromNow(29),
      startDate: daysFromNow(25),
      supplyUnits: 842,
      type: 'general',
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
      district: '안산시',
      startPrice: 32000,
      maxPrice: 78000,
      deadline: daysFromNow(-45),
      startDate: daysFromNow(-60),
      supplyUnits: 2037,
      type: 'general',
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
    status: calcStatus(item.startDate, item.deadline),
  }));
}

export const MOCK_SUBSCRIPTIONS: Subscription[] = buildMockSubscriptions();
