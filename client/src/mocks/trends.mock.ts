import type { RegionTrend } from '../types';
import { MOCK_APARTMENTS } from './apartments.mock';

// 지역별 트렌드 Mock 데이터
export const MOCK_REGION_TRENDS: RegionTrend[] = [
  {
    region: '서울',
    avgPrice: 130000,
    priceChange: 2.1,
    tradeVolume: 1842,
    hotApartments: MOCK_APARTMENTS.filter((a) => a.district.includes('구') && a.address.includes('서울')).slice(0, 3),
  },
  {
    region: '경기',
    avgPrice: 68000,
    priceChange: 3.5,
    tradeVolume: 3210,
    hotApartments: MOCK_APARTMENTS.filter((a) => a.address.includes('경기')).slice(0, 3),
  },
  {
    region: '인천',
    avgPrice: 55000,
    priceChange: 1.8,
    tradeVolume: 987,
    hotApartments: MOCK_APARTMENTS.filter((a) => a.address.includes('인천')).slice(0, 3),
  },
];

// 주간 HOT 아파트 랭킹 TOP 20 (Mock)
export const MOCK_WEEKLY_RANKING = MOCK_APARTMENTS.map((apt, index) => ({
  ...apt,
  weeklyRank: index + 1,
  viewCount: Math.floor(Math.random() * 50000) + 10000,
  tradeVolumeDelta: Math.floor(Math.random() * 30) - 10, // 거래량 변동
}));

// 거래량 급등 알림 데이터 (Mock)
export const MOCK_SURGE_ALERTS = [
  {
    id: 'surge-001',
    apartmentId: 'apt-004',
    apartmentName: '헬리오시티',
    district: '송파구',
    previousVolume: 12,
    currentVolume: 31,
    surgeRate: 158.3,
    date: '2026-03-10',
  },
  {
    id: 'surge-002',
    apartmentId: 'apt-008',
    apartmentName: '과천 푸르지오써밋',
    district: '과천시',
    previousVolume: 5,
    currentVolume: 18,
    surgeRate: 260.0,
    date: '2026-03-11',
  },
  {
    id: 'surge-003',
    apartmentId: 'apt-010',
    apartmentName: '인천 송도 더샵 퍼스트파크',
    district: '연수구',
    previousVolume: 8,
    currentVolume: 22,
    surgeRate: 175.0,
    date: '2026-03-12',
  },
];
