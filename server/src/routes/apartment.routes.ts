// ============================================================
// 아파트 실거래가 라우트
// GET /api/apartments/trades
// GET /api/apartments/:aptCode/history
// GET /api/apartments/hot
// ============================================================
import { Router, Request, Response, NextFunction } from 'express';
import {
  getApartmentTrades,
  getApartmentHistory,
  getHotApartments,
  getApartmentMapMarkers,
} from '../services/molit.service';
import { apiRateLimiter } from '../middleware/security';
import { TradeQueryParams } from '../types';

const router = Router();

/**
 * GET /api/apartments/trades
 * 아파트 실거래가 목록 조회
 *
 * Query params:
 *   - lawdCd: 법정동 코드 앞 5자리 (필수, 예: 11110 = 서울 종로구)
 *   - dealYmd: 거래 년월 (필수, 예: 202401)
 *   - page: 페이지 번호 (선택, 기본: 1)
 *   - limit: 페이지당 건수 (선택, 기본: 20, 최대: 100)
 */
router.get('/trades', apiRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lawdCd, dealYmd, page, limit } = req.query as Partial<Record<string, string>>;

    // 필수 파라미터 검증
    if (!lawdCd || !dealYmd) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMS',
          message: 'lawdCd(지역코드)와 dealYmd(년월, YYYYMM)는 필수 파라미터입니다.',
        },
      });
      return;
    }

    // 지역 코드 형식 검증 (5자리 숫자)
    if (!/^\d{5}$/.test(lawdCd)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_LAWD_CD',
          message: 'lawdCd는 5자리 숫자여야 합니다. (예: 11110)',
        },
      });
      return;
    }

    // 년월 형식 검증 (6자리 숫자)
    if (!/^\d{6}$/.test(dealYmd)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DEAL_YMD',
          message: 'dealYmd는 YYYYMM 형식의 6자리 숫자여야 합니다. (예: 202401)',
        },
      });
      return;
    }

    const params: TradeQueryParams = {
      lawdCd,
      dealYmd,
      page: page ? Math.max(1, parseInt(page, 10)) : 1,
      limit: limit ? Math.min(100, Math.max(1, parseInt(limit, 10))) : 20,
    };

    const { items, totalCount, cached } = await getApartmentTrades(
      params.lawdCd,
      params.dealYmd,
      params.page,
      params.limit,
    );

    const totalPages = Math.ceil(totalCount / (params.limit ?? 20));

    res.json({
      success: true,
      data: items,
      meta: {
        total: totalCount,
        page: params.page,
        limit: params.limit,
        totalPages,
      },
      cached,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/apartments/hot
 * 핫한 아파트 랭킹 (거래량 기준)
 *
 * Query params:
 *   - region: 시도 코드 2자리(예: 11 = 서울) 또는 한글 시도명(예: '서울', '경기')
 *             '전국' 또는 미지정 시 전체 반환
 *   - limit: 랭킹 개수 (선택, 기본: 10, 최대: 20)
 */
router.get('/hot', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { region, limit } = req.query as Partial<Record<string, string>>;

    const limitNum = limit ? Math.min(20, Math.max(1, parseInt(limit, 10))) : 10;

    // region 파라미터 정규화:
    // - 한글(서울, 경기 등): lawdNm 기준 필터용 한글 키워드로 전달
    // - 숫자 코드(11, 41 등): 기존 법정동 코드 방식으로 전달
    // - '전국' 또는 미지정: 전체 반환 (regionCode = undefined)
    const isKorean = region && /[가-힣]/.test(region);
    const isNationwide = !region || region === '전국';

    // 서비스에 전달할 regionCode: 숫자 코드이거나 미지정이면 기존 방식
    const regionCode = isNationwide ? undefined : isKorean ? undefined : region;

    // 한글 region이면 lawdNm 필터 키워드로 사용
    const regionFilter = isKorean ? region : undefined;

    const data = await getHotApartments(regionCode ?? '11', limitNum, regionFilter);

    res.json({
      success: true,
      data,
      meta: {
        total: data.length,
        page: 1,
        limit: limitNum,
        totalPages: 1,
        regionFilter: regionFilter ?? regionCode ?? '전국',
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/apartments/map
 * 지도 뷰포트 내 아파트 마커 조회
 *
 * Query params:
 *   - swLat: 남서쪽 위도 (필수)
 *   - swLng: 남서쪽 경도 (필수)
 *   - neLat: 북동쪽 위도 (필수)
 *   - neLng: 북동쪽 경도 (필수)
 *   - priceFilter: 가격 상한 필터 (선택, 만원 단위)
 */
router.get('/map', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { swLat, swLng, neLat, neLng, priceFilter } = req.query as Partial<Record<string, string>>;

    // 필수 좌표 파라미터 검증
    if (!swLat || !swLng || !neLat || !neLng) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMS',
          message: 'swLat, swLng, neLat, neLng 는 모두 필수 파라미터입니다.',
        },
      });
      return;
    }

    const swLatNum = parseFloat(swLat);
    const swLngNum = parseFloat(swLng);
    const neLarNum = parseFloat(neLat);
    const neLngNum = parseFloat(neLng);

    // 좌표 유효성 검증
    if (
      isNaN(swLatNum) || isNaN(swLngNum) ||
      isNaN(neLarNum) || isNaN(neLngNum)
    ) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_COORDS',
          message: '좌표 파라미터는 숫자여야 합니다.',
        },
      });
      return;
    }

    const priceFilterNum = priceFilter ? parseInt(priceFilter, 10) : undefined;

    const data = await getApartmentMapMarkers(
      swLatNum,
      swLngNum,
      neLarNum,
      neLngNum,
      priceFilterNum,
    );

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/apartments/:aptCode/history
 * 특정 아파트 실거래가 히스토리 (차트용)
 *
 * Path params:
 *   - aptCode: 아파트 코드 또는 아파트명
 *
 * Query params:
 *   - lawdCd: 법정동 코드 앞 5자리 (필수)
 *   - months: 조회 기간 (선택, 기본: 24, 최대: 36)
 *   - area: 전용 면적 필터 (선택, m² 단위)
 */
router.get(
  '/:aptCode/history',
  apiRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { aptCode } = req.params;
      const { lawdCd, months, area } = req.query as Partial<Record<string, string>>;

      if (!lawdCd) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PARAMS',
            message: 'lawdCd(지역코드)는 필수 파라미터입니다.',
          },
        });
        return;
      }

      if (!/^\d{5}$/.test(lawdCd)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_LAWD_CD',
            message: 'lawdCd는 5자리 숫자여야 합니다.',
          },
        });
        return;
      }

      const monthsNum = months ? Math.min(36, Math.max(1, parseInt(String(months), 10))) : 24;
      const areaNum = area ? parseFloat(String(area)) : undefined;

      const data = await getApartmentHistory(String(aptCode), String(lawdCd), monthsNum, areaNum);

      res.json({
        success: true,
        data,
        meta: {
          total: data.length,
          page: 1,
          limit: data.length,
          totalPages: 1,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
