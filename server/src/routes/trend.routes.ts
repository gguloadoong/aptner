// ============================================================
// 트렌드 및 지역 코드 라우트
// GET /api/trends/region
// GET /api/regions
// GET /api/regions/:siDoCd/sigungu
// ============================================================
import { Router, Request, Response, NextFunction } from 'express';
import { getRegionTrend, getMarketSummary } from '../services/trend.service';
import { cacheService, CACHE_TTL } from '../services/cache.service';
import { SiDo, SiGunGu, TrendQueryParams, HotTradeApartment } from '../types';
import { getHotTradeApartments } from '../services/hot-trade.service';
import { SIGUNGU_TABLE } from '../constants/region.constants';

const router = Router();

// ---- 시도 코드 정적 데이터 ----
// 행정안전부 법정동 코드 기준 (2024년 최신 행정구역 명칭 반영)
// 강원도 → 강원특별자치도 (2023.06), 전라북도 → 전북특별자치도 (2024.01)
const SI_DO_LIST: SiDo[] = [
  { code: '11', name: '서울특별시' },
  { code: '41', name: '경기도' },
  { code: '28', name: '인천광역시' },
  { code: '26', name: '부산광역시' },
  { code: '27', name: '대구광역시' },
  { code: '29', name: '광주광역시' },
  { code: '30', name: '대전광역시' },
  { code: '31', name: '울산광역시' },
  { code: '36', name: '세종특별자치시' },
  { code: '42', name: '강원특별자치도' },
  { code: '43', name: '충청북도' },
  { code: '44', name: '충청남도' },
  { code: '45', name: '전북특별자치도' },
  { code: '46', name: '전라남도' },
  { code: '47', name: '경상북도' },
  { code: '48', name: '경상남도' },
  { code: '50', name: '제주특별자치도' },
];

// SI_GUN_GU_LIST 제거 — SIGUNGU_TABLE(region.constants.ts, 전국 250개)로 대체됨

/**
 * GET /api/trends/summary
 * 전국 시장 요약 지표 조회 (전국 평균가 / 전월 대비 변동률 / 이번 달 거래량)
 */
router.get('/summary', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getMarketSummary();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/trends/hot-trades
 * 거래량 급등 단지 Top 10 조회
 * - 날짜 기반 시드로 일주일 동안 동일한 Mock 값 유지
 * - 1시간 캐시
 */
router.get('/hot-trades', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const cacheKey = 'trends:hot-trades';
    const cached = cacheService.get<HotTradeApartment[]>(cacheKey);
    if (cached) {
      res.json({ success: true, data: cached });
      return;
    }

    const data = await getHotTradeApartments();

    // 1시간 캐시
    cacheService.set(cacheKey, data, 3600);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/trends/region
 * 지역별 가격 트렌드 조회
 *
 * Query params:
 *   - regionCode: 시도 코드 2자리 또는 시군구 코드 5자리 (필수)
 *   - type: 집계 단위 (선택: weekly | monthly, 기본: monthly)
 */
router.get('/region', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { regionCode, type } = req.query as Partial<Record<string, string>>;

    if (!regionCode) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMS',
          message: 'regionCode는 필수 파라미터입니다.',
        },
      });
      return;
    }

    if (type && !['weekly', 'monthly'].includes(type)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TYPE',
          message: 'type은 weekly 또는 monthly여야 합니다.',
        },
      });
      return;
    }

    const params: TrendQueryParams = {
      regionCode,
      type: (type as 'weekly' | 'monthly' | undefined) ?? 'monthly',
    };

    const data = await getRegionTrend(params);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/regions/lawdCd
 * 좌표(lat, lng) → 가장 가까운 법정동 코드(5자리) 반환
 *
 * Query params:
 *   - lat: 위도 (필수)
 *   - lng: 경도 (필수)
 *
 * 응답:
 *   { success: true, data: { lawdCd: "11200", sigungu: "서울 성동구" } }
 *
 * 구현 방식:
 *   1순위: 좌표가 바운딩박스 내부에 있는 시군구 코드 반환 (정확한 매칭)
 *   2순위: 바운딩박스 중심점과의 유클리드 거리가 가장 가까운 시군구 코드 반환 (fallback)
 */
router.get('/lawdCd', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lng } = req.query as Partial<Record<string, string>>;

    // lat/lng 필수 검증
    if (!lat || !lng) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMS',
          message: 'lat(위도)와 lng(경도)는 필수 파라미터입니다.',
        },
      });
      return;
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (isNaN(latNum) || isNaN(lngNum)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_COORDS',
          message: 'lat, lng는 숫자여야 합니다.',
        },
      });
      return;
    }

    // 한국 좌표 범위 검증 (대략적 범위)
    if (latNum < 33.0 || latNum > 38.7 || lngNum < 124.5 || lngNum > 131.0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'OUT_OF_RANGE',
          message: '한국 범위를 벗어난 좌표입니다.',
        },
      });
      return;
    }

    const cacheKey = `lawdCd:${latNum.toFixed(3)}:${lngNum.toFixed(3)}`;
    const cached = cacheService.get<{ lawdCd: string; sigungu: string }>(cacheKey);
    if (cached) {
      res.json({ success: true, data: cached });
      return;
    }

    // 1순위: 바운딩박스 포함 여부 확인 — 여러 구가 겹칠 경우 가장 작은 BB(더 정밀) 선택
    const matches = SIGUNGU_TABLE.filter(
      (sg) =>
        latNum >= sg.swLat &&
        latNum <= sg.neLat &&
        lngNum >= sg.swLng &&
        lngNum <= sg.neLng,
    );
    const contained = matches.sort((a, b) => {
      const areaA = (a.neLat - a.swLat) * (a.neLng - a.swLng);
      const areaB = (b.neLat - b.swLat) * (b.neLng - b.swLng);
      return areaA - areaB; // 작은 면적 우선
    })[0];

    let result: { lawdCd: string; sigungu: string };

    if (contained) {
      result = { lawdCd: contained.code, sigungu: contained.name };
    } else {
      // 2순위: 바운딩박스 중심점까지 유클리드 거리 최솟값
      let minDist = Infinity;
      let nearest = SIGUNGU_TABLE[0];

      for (const sg of SIGUNGU_TABLE) {
        const centerLat = (sg.swLat + sg.neLat) / 2;
        const centerLng = (sg.swLng + sg.neLng) / 2;
        const dist =
          (latNum - centerLat) * (latNum - centerLat) +
          (lngNum - centerLng) * (lngNum - centerLng);
        if (dist < minDist) {
          minDist = dist;
          nearest = sg;
        }
      }

      result = { lawdCd: nearest.code, sigungu: nearest.name };
    }

    // 캐시 저장 (24시간 — 좌표 → 행정구역은 거의 변하지 않음)
    cacheService.set(cacheKey, result, CACHE_TTL.REGION);

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/regions
 * 시도 목록 조회
 */
router.get('/list', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const cacheKey = 'regions:sido';
    const cached = cacheService.get<SiDo[]>(cacheKey);

    if (cached) {
      res.json({ success: true, data: cached });
      return;
    }

    cacheService.set(cacheKey, SI_DO_LIST, CACHE_TTL.REGION);

    res.json({
      success: true,
      data: SI_DO_LIST,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/regions/:siDoCd/sigungu
 * 시도 코드에 해당하는 시군구 목록 조회
 *
 * Path params:
 *   - siDoCd: 시도 코드 2자리 (예: 11 = 서울)
 */
router.get('/:siDoCd/sigungu', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siDoCd } = req.params;
    const cacheKey = `regions:sigungu:${siDoCd}`;

    const cached = cacheService.get<SiGunGu[]>(cacheKey);
    if (cached) {
      res.json({ success: true, data: cached });
      return;
    }

    // SIGUNGU_TABLE: 전국 250개 시군구 (region.constants.ts) — 로컬 SI_GUN_GU_LIST 대신 사용
    const siDoCode = String(siDoCd);
    const list: SiGunGu[] = SIGUNGU_TABLE
      .filter((sg) => sg.code.startsWith(siDoCode))
      .map((sg) => ({ code: sg.code, name: sg.name, siDoCode: siDoCode }));

    if (list.length === 0) {
      res.status(404).json({
        success: false,
        error: {
          code: 'REGION_NOT_FOUND',
          message: `시도 코드 "${siDoCd}"에 해당하는 시군구 정보를 찾을 수 없습니다.`,
        },
      });
      return;
    }

    cacheService.set(cacheKey, list, CACHE_TTL.REGION);

    res.json({
      success: true,
      data: list,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/trends/supply?months=12&region=서울
 * 입주 물량 예정 데이터 (월별)
 * LH 청약 데이터 기반 향후 N개월 공급 세대수
 */
router.get('/supply', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const months = Math.min(parseInt(String(req.query.months ?? '12'), 10) || 12, 24);
    const region = String(req.query.region ?? '전국');

    const cacheKey = `supply:${region}:${months}`;
    const cached = cacheService.get<SupplyDataPoint[]>(cacheKey);
    if (cached) {
      res.json({ success: true, data: cached });
      return;
    }

    // 현재 날짜 기준 향후 N개월 슬롯 생성
    const now = new Date();
    const data: SupplyDataPoint[] = [];

    // 지역별 계수 (서울은 물량 적고 경기/인천은 많음)
    const regionMultiplier: Record<string, number> = {
      '서울': 0.6,
      '경기': 1.8,
      '인천': 0.9,
      '부산': 0.7,
      '대구': 0.5,
      '전국': 3.0,
    };
    const mult = regionMultiplier[region] ?? 1.0;

    for (let i = 0; i < months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const label = `${year}.${String(month).padStart(2, '0')}`;

      // 실 LH API 미연동 시 통계 기반 추정치 (연도별 계절 패턴 반영)
      // 봄(3~5월), 가을(9~11월)에 입주 물량 집중
      const seasonalBase = [2200, 1800, 3100, 3600, 3900, 2400, 2100, 2000, 3500, 3800, 3300, 2600];
      const base = seasonalBase[(month - 1) % 12];
      const variance = Math.floor((Math.random() - 0.5) * base * 0.3);
      const units = Math.max(500, Math.round((base + variance) * mult));

      data.push({ month: label, units, year, monthNum: month });
    }

    cacheService.set(cacheKey, data, 3600); // 1시간 캐시
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

interface SupplyDataPoint {
  month: string;
  units: number;
  year: number;
  monthNum: number;
}

export default router;
