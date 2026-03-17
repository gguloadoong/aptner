// ============================================================
// [P1-02] 거래량 급등 단지 서비스
// Mock 구현: APT_BASE_DATA 기반, 날짜 시드로 주간 일관성 유지
// TODO: 실 API 연동 시 이 서비스 교체
// ============================================================
import { HotTradeApartment } from '../types';

// APT_BASE_DATA와 동일한 단지 정보를 직접 참조하기 위해 molit.service 일부를 재사용
// (순환 참조 방지를 위해 service → service 직접 import 대신 독립 Mock 정의)
interface HotTradeBaseData {
  aptCode: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  basePrice: number;
  priceChange: number;
}

/** APT_BASE_DATA와 일치하는 단지 정보 (순환 import 방지용 로컬 사본) */
const HOT_TRADE_BASE: HotTradeBaseData[] = [
  { aptCode: 'APT001', name: '래미안 원베일리',       address: '서울 서초구 반포동',     lat: 37.5068, lng: 127.0053, basePrice: 280000, priceChange:  15000 },
  { aptCode: 'APT002', name: '아크로리버파크',         address: '서울 서초구 반포동',     lat: 37.5075, lng: 126.9994, basePrice: 310000, priceChange:   8000 },
  { aptCode: 'APT003', name: '헬리오시티',             address: '서울 송파구 가락동',     lat: 37.4918, lng: 127.1239, basePrice: 145000, priceChange:   5000 },
  { aptCode: 'APT004', name: '은마아파트',             address: '서울 강남구 대치동',     lat: 37.4983, lng: 127.0622, basePrice: 180000, priceChange:  -2000 },
  { aptCode: 'APT005', name: '올림픽파크포레온',       address: '서울 강동구 둔촌동',     lat: 37.5211, lng: 127.1366, basePrice: 135000, priceChange:   7000 },
  { aptCode: 'APT006', name: '래미안 대치팰리스',      address: '서울 강남구 대치동',     lat: 37.4977, lng: 127.0631, basePrice: 220000, priceChange:   9000 },
  { aptCode: 'APT007', name: '도곡렉슬',               address: '서울 강남구 도곡동',     lat: 37.4847, lng: 127.0468, basePrice: 195000, priceChange:   5500 },
  { aptCode: 'APT008', name: '잠실주공5단지',          address: '서울 송파구 잠실동',     lat: 37.5109, lng: 127.0867, basePrice: 230000, priceChange:  12000 },
  { aptCode: 'APT009', name: '마포래미안푸르지오',     address: '서울 마포구 아현동',     lat: 37.5494, lng: 126.9541, basePrice: 115000, priceChange:   3000 },
  { aptCode: 'APT010', name: '래미안 첼리투스',        address: '서울 용산구 이촌동',     lat: 37.5225, lng: 126.9685, basePrice: 260000, priceChange:  11000 },
];

/**
 * 날짜 기반 단순 시드 생성기.
 * 같은 주에는 동일한 시드를 반환하여 랜덤 값이 일주일 동안 유지됩니다.
 *
 * @param seed  단지별 고유 오프셋 (aptCode 인덱스)
 */
function seededRandom(seed: number): () => number {
  // ISO 주차(년도 + 주번호)를 기반으로 주간 시드 고정
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.floor(
    (now.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000),
  );
  let s = now.getFullYear() * 100 + weekNumber + seed * 997;

  return () => {
    // LCG (선형 합동법)
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

/**
 * 거래량 급등 단지 Top 10을 반환합니다.
 * - changeRate: 150~500% 범위의 날짜 시드 기반 랜덤 값
 * - 일주일 동안 동일한 값 유지
 */
export async function getHotTradeApartments(): Promise<HotTradeApartment[]> {
  return HOT_TRADE_BASE.map((apt, idx) => {
    const rand = seededRandom(idx);

    // 지난 주 거래 수: 3~8 범위
    const prevTradeCount = Math.floor(rand() * 6) + 3;

    // changeRate: 150~500% 범위
    const changeRate = Math.floor(rand() * 351) + 150;

    // 이번 주 거래 수: prevTradeCount × (1 + changeRate/100)
    const tradeCount = Math.round(prevTradeCount * (1 + changeRate / 100));

    // 가격 변동 타입
    const priceChangeType: 'up' | 'down' | 'flat' =
      apt.priceChange > 0 ? 'up' : apt.priceChange < 0 ? 'down' : 'flat';

    return {
      id: apt.aptCode,
      name: apt.name,
      address: apt.address,
      lat: apt.lat,
      lng: apt.lng,
      tradeCount,
      prevTradeCount,
      changeRate,
      recentPrice: apt.basePrice,
      priceChangeType,
    };
  });
}
