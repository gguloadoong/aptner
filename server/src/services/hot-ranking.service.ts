// ============================================================
// [P1] 핫 아파트 랭킹 서비스 — 거래량 급등률 기반
// GET /api/apartments/hot?region=11&limit=10
//
// 급등률 계산: (이번달 - 전달) / 전달 * 100
// 전달 0건이면 신규 진입 (rankChange: null)
// 정렬: tradeSurgeRate 내림차순
// ============================================================
import { HotApartmentRanking } from '../types';
import { cacheService } from './cache.service';

// TTL: 30분 (핫 랭킹은 실시간성보다 quota 보호 우선)
const HOT_RANKING_TTL = 60 * 30;

// ============================================================
// Mock 기준 데이터
// 최소 10건, 다양한 급등률/rankChange 포함
// recentPrice 단위: 원 (FE 합의 계약)
// ============================================================
interface RankingBaseData {
  aptCode: string;
  name: string;
  location: string;       // 시군구
  regionCode: string;     // 시도 코드 2자리
  recentPrice: number;    // 원
  thisMonthCount: number; // 이번 달 거래량
  prevMonthCount: number; // 전달 거래량 (0이면 신규 진입)
  prevRank: number | null; // 지난 주기 순위 (null=신규)
}

const RANKING_BASE_DATA: RankingBaseData[] = [
  // 서울 단지
  {
    aptCode: 'APT001',
    name: '래미안 원베일리',
    location: '서울 서초구',
    regionCode: '11',
    recentPrice: 2_800_000_000,
    thisMonthCount: 42,
    prevMonthCount: 12,
    prevRank: 3,
  },
  {
    aptCode: 'APT002',
    name: '아크로리버파크',
    location: '서울 서초구',
    regionCode: '11',
    recentPrice: 3_100_000_000,
    thisMonthCount: 38,
    prevMonthCount: 8,
    prevRank: 6,
  },
  {
    aptCode: 'APT003',
    name: '헬리오시티',
    location: '서울 송파구',
    regionCode: '11',
    recentPrice: 1_450_000_000,
    thisMonthCount: 35,
    prevMonthCount: 15,
    prevRank: 2,
  },
  {
    aptCode: 'APT004',
    name: '은마아파트',
    location: '서울 강남구',
    regionCode: '11',
    recentPrice: 1_800_000_000,
    thisMonthCount: 31,
    prevMonthCount: 31,
    prevRank: 1,
  },
  {
    aptCode: 'APT005',
    name: '올림픽파크포레온',
    location: '서울 강동구',
    regionCode: '11',
    recentPrice: 1_350_000_000,
    thisMonthCount: 28,
    prevMonthCount: 0, // 신규 진입
    prevRank: null,
  },
  {
    aptCode: 'APT006',
    name: '래미안 대치팰리스',
    location: '서울 강남구',
    regionCode: '11',
    recentPrice: 2_200_000_000,
    thisMonthCount: 25,
    prevMonthCount: 20,
    prevRank: 4,
  },
  {
    aptCode: 'APT007',
    name: '도곡렉슬',
    location: '서울 강남구',
    regionCode: '11',
    recentPrice: 1_950_000_000,
    thisMonthCount: 22,
    prevMonthCount: 5,
    prevRank: 9,
  },
  {
    aptCode: 'APT008',
    name: '잠실주공5단지',
    location: '서울 송파구',
    regionCode: '11',
    recentPrice: 2_300_000_000,
    thisMonthCount: 20,
    prevMonthCount: 18,
    prevRank: 5,
  },
  {
    aptCode: 'APT009',
    name: '마포래미안푸르지오',
    location: '서울 마포구',
    regionCode: '11',
    recentPrice: 1_150_000_000,
    thisMonthCount: 18,
    prevMonthCount: 22,
    prevRank: 7,
  },
  {
    aptCode: 'APT010',
    name: '래미안 첼리투스',
    location: '서울 용산구',
    regionCode: '11',
    recentPrice: 2_600_000_000,
    thisMonthCount: 15,
    prevMonthCount: 3,
    prevRank: 10,
  },
  // 경기 단지
  {
    aptCode: 'APT011',
    name: '판교 알파리움',
    location: '경기 성남시',
    regionCode: '41',
    recentPrice: 1_200_000_000,
    thisMonthCount: 33,
    prevMonthCount: 9,
    prevRank: 5,
  },
  {
    aptCode: 'APT012',
    name: '힐스테이트 광교중앙역',
    location: '경기 수원시',
    regionCode: '41',
    recentPrice: 980_000_000,
    thisMonthCount: 29,
    prevMonthCount: 0, // 신규 진입
    prevRank: null,
  },
  {
    aptCode: 'APT013',
    name: '래미안 위브',
    location: '경기 용인시',
    regionCode: '41',
    recentPrice: 720_000_000,
    thisMonthCount: 24,
    prevMonthCount: 16,
    prevRank: 3,
  },
  // 부산 단지
  {
    aptCode: 'APT014',
    name: '더샵 센텀파크',
    location: '부산 해운대구',
    regionCode: '26',
    recentPrice: 850_000_000,
    thisMonthCount: 27,
    prevMonthCount: 6,
    prevRank: 8,
  },
  {
    aptCode: 'APT015',
    name: '엘시티 더샵',
    location: '부산 해운대구',
    regionCode: '26',
    recentPrice: 1_100_000_000,
    thisMonthCount: 19,
    prevMonthCount: 19,
    prevRank: 2,
  },
];

/**
 * 거래량 급등률을 계산합니다.
 * 전달 거래량이 0이면 신규 진입으로 간주해 Infinity 반환 (정렬 최상위 처리용).
 */
function calcSurgeRate(thisMonth: number, prevMonth: number): number {
  if (prevMonth === 0) return Infinity;
  return Math.round(((thisMonth - prevMonth) / prevMonth) * 100 * 10) / 10;
}

/**
 * 순위 변동을 계산합니다.
 * - prevRank가 null이면 신규 진입 → rankChange: null
 * - prevRank가 있으면 prevRank - currentRank (양수=상승, 음수=하락, 0=유지)
 */
function calcRankChange(prevRank: number | null, currentRank: number): number | null {
  if (prevRank === null) return null;
  return prevRank - currentRank;
}

/**
 * 핫 아파트 랭킹을 반환합니다.
 *
 * @param regionCode - 시도 코드 2자리 (예: '11' = 서울). undefined이면 전국.
 * @param limit - 반환 개수 (기본: 20, 최대: 50)
 */
export async function getHotApartmentRanking(
  regionCode: string | undefined,
  limit: number = 20,
): Promise<HotApartmentRanking[]> {
  const cacheKey = `hot-ranking:${regionCode ?? 'all'}:${limit}`;

  const cached = cacheService.get<HotApartmentRanking[]>(cacheKey);
  if (cached) {
    console.log(`[HotRanking] 캐시 히트: ${cacheKey}`);
    return cached;
  }

  console.log(`[HotRanking] 랭킹 계산: region=${regionCode ?? '전국'}, limit=${limit}`);

  // 1. 지역 필터
  let pool = RANKING_BASE_DATA;
  if (regionCode) {
    pool = RANKING_BASE_DATA.filter((d) => d.regionCode === regionCode);
  }

  // 2. 급등률 계산 후 내림차순 정렬
  //    Infinity(신규 진입)는 자동으로 최상단 위치
  const withRate = pool.map((d) => ({
    ...d,
    surgeRate: calcSurgeRate(d.thisMonthCount, d.prevMonthCount),
  }));

  withRate.sort((a, b) => b.surgeRate - a.surgeRate);

  // 3. TOP N 슬라이스 후 랭킹 구조 생성
  const result: HotApartmentRanking[] = withRate
    .slice(0, limit)
    .map((d, idx) => {
      const currentRank = idx + 1;
      // Infinity는 JSON 직렬화 불가 → 신규 진입은 surgeRate를 별도 처리
      // 전달 0건이므로 thisMonthCount × 100 을 대표값으로 표시 (의미있는 수치)
      const tradeSurgeRate =
        d.surgeRate === Infinity
          ? d.thisMonthCount * 100
          : d.surgeRate;

      return {
        rank: currentRank,
        rankChange: calcRankChange(d.prevRank, currentRank),
        aptCode: d.aptCode,
        name: d.name,
        location: d.location,
        recentPrice: d.recentPrice,
        tradeCount: d.thisMonthCount,
        tradeSurgeRate,
      };
    });

  cacheService.set(cacheKey, result, HOT_RANKING_TTL);
  return result;
}
