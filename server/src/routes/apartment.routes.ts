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
  getApartmentMapMarkers,
  getApartmentById,
  searchApartments,
  getJeonseRate,
  getNearbyApartments,
  getMapPrices,
  getRecordHighApartments,
} from '../services/molit.service';
import { getHotApartmentRanking } from '../services/hot-ranking.service';
import { getRecentTrades } from '../services/recent-trades.service';
import { getComplexesByViewport } from '../services/complex.service';

import { apiRateLimiter } from '../middleware/security';
import { ComplexFilter, TradeQueryParams } from '../types';

const router = Router();

/**
 * GET /api/apartments/map-prices
 * 지도 마커용 단지별 최근 거래가 요약
 *
 * Query params:
 *   - lawdCd: 법정동 코드 앞 5자리 (필수, 예: 11200 = 성동구)
 *   - year:   조회 년도 (선택, 미지정 시 최근 3개월 자동 조회)
 *   - month:  조회 월  (선택, year와 함께 사용)
 *
 * 응답:
 *   { success: true, data: ApartmentPrice[], cached: boolean }
 *   - 동일 단지(aptName) 중 가장 최근 거래 1건만 포함
 *   - API 키 없거나 결과 0건이면 Mock fallback(12개) 반환
 */
router.get('/map-prices', apiRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lawdCd, year, month } = req.query as Partial<Record<string, string>>;

    // lawdCd 필수 검증
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

    // lawdCd 형식 검증 (5자리 숫자)
    if (!/^\d{5}$/.test(lawdCd)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_LAWD_CD',
          message: 'lawdCd는 5자리 숫자여야 합니다. (예: 11200)',
        },
      });
      return;
    }

    // year/month 파싱 및 유효성 검증
    let yearNum: number | undefined;
    let monthNum: number | undefined;

    if (year !== undefined) {
      yearNum = parseInt(year, 10);
      if (isNaN(yearNum) || yearNum < 2006 || yearNum > 2100) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_YEAR',
            message: 'year는 2006~2100 사이의 숫자여야 합니다.',
          },
        });
        return;
      }
    }

    if (month !== undefined) {
      monthNum = parseInt(month, 10);
      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_MONTH',
            message: 'month는 1~12 사이의 숫자여야 합니다.',
          },
        });
        return;
      }
    }

    // year만 있고 month가 없는 경우는 허용하지 않음 (둘 다 있거나 둘 다 없어야)
    if ((yearNum !== undefined) !== (monthNum !== undefined)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMS',
          message: 'year와 month는 함께 지정하거나 둘 다 생략해야 합니다.',
        },
      });
      return;
    }

    const { data, cached } = await getMapPrices(lawdCd, yearNum, monthNum);

    res.json({
      success: true,
      data,
      cached,
    });
  } catch (error) {
    next(error);
  }
});

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
 * GET /api/apartments/search?q=keyword
 * 키워드로 아파트 검색 (아파트명 또는 행정구역명 포함 여부)
 *
 * Query params:
 *   - q: 검색 키워드 (필수, 빈 문자열 불가)
 */
router.get('/search', apiRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query as Partial<Record<string, string>>;

    // q 파라미터 없거나 빈 문자열이면 400 반환
    if (!q || q.trim() === '') {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMS',
          message: 'q(검색 키워드)는 필수 파라미터이며 빈 문자열일 수 없습니다.',
        },
      });
      return;
    }

    // URL 인코딩이 두 번 적용된 경우 대비 추가 디코딩 시도
    let keyword = q.trim();
    try {
      const decoded = decodeURIComponent(keyword);
      // 디코딩 후 달라지면 다시 적용 (예: %EB%9E%98... → 래미안)
      if (decoded !== keyword) keyword = decoded.trim();
    } catch {
      // decodeURIComponent 실패 시 원래 값 그대로 사용
    }

    const data = await searchApartments(keyword);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/apartments/nearby
 * 좌표 기반 반경 내 아파트 단지 검색
 *
 * Query params:
 *   - lat: 기준 위도 (필수)
 *   - lng: 기준 경도 (필수)
 *   - radius: 검색 반경 미터 (선택, 기본: 1000, 범위: 200~5000)
 */
router.get('/nearby', apiRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lng, radius } = req.query as Partial<Record<string, string>>;

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

    // 좌표 유효성 검증
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

    // radius 범위 검증 (200 ~ 5000m)
    const DEFAULT_RADIUS = 1000;
    const MIN_RADIUS = 200;
    const MAX_RADIUS = 5000;
    let radiusNum = radius ? parseFloat(radius) : DEFAULT_RADIUS;

    if (isNaN(radiusNum) || radiusNum < MIN_RADIUS || radiusNum > MAX_RADIUS) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_RADIUS',
          message: `radius는 ${MIN_RADIUS}~${MAX_RADIUS} 범위의 숫자여야 합니다.`,
        },
      });
      return;
    }

    const data = await getNearbyApartments(latNum, lngNum, radiusNum);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/apartments/record-highs
 * 신고가 경신 단지 조회
 *
 * Query params:
 *   - region: '수도권' | '전국' (기본: '수도권')
 *   - limit:  반환 건수 (기본: 5, 최대: 10)
 *
 * 응답:
 *   { success: true, data: RecordHighItem[], meta: { baseMonth, region } }
 *   실 데이터 없거나 API 실패 시 Mock fallback 반환 (ADR-006 준수)
 */
router.get('/record-highs', apiRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { region, limit } = req.query as Partial<Record<string, string>>;

    // region 검증
    const VALID_REGIONS = ['수도권', '전국'] as const;
    type RegionType = typeof VALID_REGIONS[number];
    if (region && !VALID_REGIONS.includes(region as RegionType)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REGION',
          message: `region은 '수도권' 또는 '전국' 중 하나여야 합니다.`,
        },
      });
      return;
    }

    // limit 검증 (1~10)
    let limitNum = 5;
    if (limit !== undefined) {
      limitNum = parseInt(limit, 10);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 10) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_LIMIT',
            message: 'limit은 1~10 사이의 정수여야 합니다.',
          },
        });
        return;
      }
    }

    const regionVal = (region as RegionType | undefined) ?? '수도권';
    const { data, meta } = await getRecordHighApartments(regionVal, limitNum);

    res.json({
      success: true,
      data,
      meta,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/apartments/hot
 * 핫 아파트 랭킹 — 거래량 급등률 기반 (P1)
 *
 * Query params:
 *   - region: 시도 코드 2자리 (예: 11=서울, 41=경기, 26=부산)
 *             미지정 또는 '전국' 시 전국 반환
 *   - limit:  반환 개수 (기본: 20, 최대: 50)
 *
 * 응답:
 *   { success: true, data: HotApartmentRanking[], meta: { total, updatedAt } }
 */
router.get('/hot', apiRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { region, limit } = req.query as Partial<Record<string, string>>;

    // limit: 검증 후 파싱 (순서 중요 — NaN 상태로 limitNum 사용 방지)
    if (limit && isNaN(parseInt(limit, 10))) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_LIMIT', message: 'limit은 숫자여야 합니다.' },
      });
      return;
    }
    const limitNum = limit ? Math.min(50, Math.max(1, parseInt(limit, 10))) : 20;

    // region 정규화: 숫자 2자리 코드만 허용, 전국/미지정은 undefined
    const isNationwide = !region || region === '전국';
    const regionCode = isNationwide ? undefined : region;

    // 숫자 코드 형식 검증 (전달된 경우만)
    if (regionCode && !/^\d{2}$/.test(regionCode)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REGION',
          message: 'region은 시도 코드 2자리 숫자여야 합니다. (예: 11=서울, 41=경기)',
        },
      });
      return;
    }

    const data = await getHotApartmentRanking(regionCode, limitNum);

    res.json({
      success: true,
      data,
      meta: {
        total: data.length,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/apartments/recent-trades
 * 홈 화면 최근 거래 피드 — 거래일 최신순 실거래 리스트
 *
 * Query params:
 *   - region: 시도 코드 2자리 (선택, 기본: '11' = 서울)
 *   - limit:  반환 건수 (선택, 기본: 20, 최대: 30)
 *
 * 응답:
 *   { success: true, data: RecentTrade[] }
 *   MOLIT API 실패 시 빈 배열 반환 (홈 화면 크래시 방지)
 */
router.get('/recent-trades', apiRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { region, limit } = req.query as Partial<Record<string, string>>;

    // region 형식 검증 (전달된 경우만 — 2자리 숫자)
    if (region && !/^\d{2}$/.test(region)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REGION',
          message: 'region은 시도 코드 2자리 숫자여야 합니다. (예: 11=서울, 41=경기)',
        },
      });
      return;
    }

    // limit 검증: 1~30
    const MAX_LIMIT = 30;
    let limitNum = 20;
    if (limit !== undefined) {
      limitNum = parseInt(limit, 10);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > MAX_LIMIT) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_LIMIT',
            message: `limit은 1~${MAX_LIMIT} 사이의 정수여야 합니다.`,
          },
        });
        return;
      }
    }

    const regionCode = region ?? '11';
    const data = await getRecentTrades(regionCode, limitNum);

    res.json({
      success: true,
      data,
      meta: {
        total: data.length,
        region: regionCode,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/apartments/complexes
 * 지도 뷰포트 내 실 아파트 단지 + 최근 2개월 실거래가 집계
 *
 * 국토부 실거래가 API를 직접 호출해 단지별로 집계한 후 반환합니다.
 * 좌표 변환은 FE에서 Kakao JS Geocoder로 처리하므로 서버는 address만 제공.
 *
 * Query params:
 *   - swLat: 남서쪽 위도 (필수)
 *   - swLng: 남서쪽 경도 (필수)
 *   - neLat: 북동쪽 위도 (필수)
 *   - neLng: 북동쪽 경도 (필수)
 *   - zoom: 지도 줌 레벨 (선택)
 *           5 이하 → 상위 50개 / 6~7 → 상위 100개 / 8 이상 → 상위 200개
 */
router.get('/complexes', apiRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { swLat, swLng, neLat, neLng, zoom } = req.query as Partial<Record<string, string>>;

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
    const neLatNum = parseFloat(neLat);
    const neLngNum = parseFloat(neLng);

    // 좌표 유효성 검증
    if (isNaN(swLatNum) || isNaN(swLngNum) || isNaN(neLatNum) || isNaN(neLngNum)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_COORDS',
          message: '좌표 파라미터는 숫자여야 합니다.',
        },
      });
      return;
    }

    // 줌 레벨에 따른 반환 개수 결정
    // 5 이하: 50개 / 6~7: 100개 / 8 이상: 200개 (기본)
    const zoomNum = zoom ? parseInt(zoom, 10) : 8;
    let limit: number;
    if (zoomNum <= 5) {
      limit = 50;
    } else if (zoomNum <= 7) {
      limit = 100;
    } else {
      limit = 200;
    }

    const data = await getComplexesByViewport(
      swLatNum,
      swLngNum,
      neLatNum,
      neLngNum,
      limit,
    );

    res.json({
      success: true,
      data,
      meta: {
        total: data.length,
        zoom: zoomNum,
        limit,
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
router.get('/map', apiRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
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
    const neLatNum = parseFloat(neLat);
    const neLngNum = parseFloat(neLng);

    // 좌표 유효성 검증
    if (
      isNaN(swLatNum) || isNaN(swLngNum) ||
      isNaN(neLatNum) || isNaN(neLngNum)
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

    // 문자열 enum을 숫자 범위로 변환 (under5, 5to10, over10 처리)
    let maxPrice: number | undefined;
    let minPrice: number | undefined;
    if (priceFilter === 'under5') maxPrice = 50000;
    else if (priceFilter === '5to10') { minPrice = 50000; maxPrice = 100000; }
    else if (priceFilter === 'over10') minPrice = 100000;
    else if (priceFilter && !isNaN(Number(priceFilter))) maxPrice = Number(priceFilter);

    // 불리언 쿼리파라미터 파서 (문자열 'true'/'false' → boolean)
    const parseBool = (v: string | undefined): boolean | undefined =>
      v === 'true' ? true : v === 'false' ? false : undefined;

    // 단지 특성 필터 파싱
    const complexFilter: ComplexFilter = {
      minUnit: req.query.minUnit ? (parseInt(req.query.minUnit as string, 10) || undefined) : undefined,
      isBrand: parseBool(req.query.isBrand as string),
      isWalkSubway: parseBool(req.query.isWalkSubway as string),
      isLargeComplex: parseBool(req.query.isLargeComplex as string),
      isNewBuild: parseBool(req.query.isNewBuild as string),
      isFlat: parseBool(req.query.isFlat as string),
      hasElementarySchool: parseBool(req.query.hasElementarySchool as string),
    };

    // 모든 필드가 undefined이면 필터 객체 자체를 전달하지 않음 (불필요한 캐시 키 증가 방지)
    const hasAnyComplexFilter = Object.values(complexFilter).some((v) => v !== undefined);

    let data = await getApartmentMapMarkers(
      swLatNum,
      swLngNum,
      neLatNum,
      neLngNum,
      maxPrice,
      hasAnyComplexFilter ? complexFilter : undefined,
    );

    // over10 / 5to10 하한 필터 적용 (서비스 레이어는 maxPrice만 처리)
    if (minPrice !== undefined) {
      data = data.filter((m) => m.price >= minPrice!);
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/apartments/:aptCode/jeonse-rate
 * 특정 아파트의 전세가율 조회
 *
 * Path params:
 *   - aptCode: 단지 시퀀스 코드 또는 단지명
 *
 * Query params:
 *   - lawdCd: 법정동 코드 앞 5자리 (필수, 예: 11650)
 *
 * 응답 예시:
 *   { "success": true, "data": { "jeonseRate": 72.3, "jeonsePrice": 45000, "tradePrice": 62000 } }
 *   전세가율 계산 불가 시 jeonseRate/jeonsePrice/tradePrice 는 null
 */
router.get(
  '/:aptCode/jeonse-rate',
  apiRateLimiter,
  async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const { aptCode } = req.params;
      const { lawdCd } = req.query as Partial<Record<string, string>>;

      // lawdCd 필수 검증
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

      // lawdCd 형식 검증 (5자리 숫자)
      if (!/^\d{5}$/.test(lawdCd)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_LAWD_CD',
            message: 'lawdCd는 5자리 숫자여야 합니다. (예: 11650)',
          },
        });
        return;
      }

      const data = await getJeonseRate(String(aptCode), lawdCd);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      // API 실패 시 500을 그대로 내보내지 않고 전세가율 null fallback 반환
      console.warn(`[Apartment] 전세가율 조회 실패 → fallback 반환: aptCode=${req.params.aptCode}`, error instanceof Error ? error.message : error);
      res.json({
        success: true,
        data: { jeonseRate: null, jeonsePrice: null, tradePrice: null, isEstimated: true },
      });
    }
  },
);

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

      // lawdCd는 선택 파라미터: 없으면 Mock 데이터 반환, 있으면 형식 검증 후 실 API 시도
      if (lawdCd && !/^\d{5}$/.test(lawdCd)) {
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

      // lawdCd 미전달 시 빈 문자열로 전달 → 서비스 레이어에서 Mock 전용 처리
      const data = await getApartmentHistory(String(aptCode), lawdCd ?? '', monthsNum, areaNum);

      // 데이터 없을 경우 경고 로그 (빈 배열 조용히 반환 방지)
      if (data.length === 0) {
        console.warn(`[Apartment] 히스토리 데이터 없음: aptCode=${aptCode}, lawdCd=${lawdCd}, months=${monthsNum}`);
      }

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

// GET /api/apartments/redevelopment 제거 — GET /api/redevelopment (redevelopment.routes.ts)로 통합됨

/**
 * GET /api/apartments/:aptCode/sale-price
 * 특정 아파트 최신 분양가 조회 (국토부 실거래 기반)
 *
 * Path params:
 *   - aptCode: 아파트 코드 (예: APT001)
 *
 * 응답 예시:
 *   { "success": true, "data": { "salePrice": 160000, "date": "2023-05-01" } }
 *   데이터 없을 시:
 *   { "success": true, "data": { "salePrice": null, "date": null } }
 */
router.get(
  '/:aptCode/sale-price',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const aptCode = String(req.params.aptCode);
      console.log(`[Apartment] 분양가 조회: aptCode=${aptCode}`);

      // TODO: 국토부 분양가 공개 API 연동 예정
      // 현재는 Mock 데이터에서 basePrice를 분양가로 근사 반환
      const { getSalePriceByAptCode } = await import('../services/molit.service');
      const result = await getSalePriceByAptCode(aptCode);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/apartments/:aptCode
 * 특정 아파트 상세 정보 조회
 * 주의: /search, /hot, /map, /trades, /:aptCode/history, /:aptCode/sale-price 라우트보다 반드시 뒤에 선언
 *
 * Path params:
 *   - aptCode: 아파트 코드 (예: APT001)
 */
router.get('/:aptCode', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const aptCode = String(req.params.aptCode);

    const data = await getApartmentById(aptCode);

    if (!data) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `aptCode '${aptCode}'에 해당하는 아파트를 찾을 수 없습니다.`,
        },
      });
      return;
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
