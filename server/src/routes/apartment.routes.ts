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
  getApartmentById,
  searchApartments,
  getJeonseRate,
} from '../services/molit.service';
import { getComplexesByViewport } from '../services/complex.service';
import { apiRateLimiter } from '../middleware/security';
import { ComplexFilter, TradeQueryParams } from '../types';

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
 * GET /api/apartments/search?q=keyword
 * 키워드로 아파트 검색 (아파트명 또는 행정구역명 포함 여부)
 *
 * Query params:
 *   - q: 검색 키워드 (필수, 빈 문자열 불가)
 */
router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
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

    // 문자열 enum을 숫자 상한값으로 변환 (under5, 5to10, over10 처리)
    let maxPrice: number | undefined;
    if (priceFilter === 'under5') maxPrice = 50000;
    else if (priceFilter === '5to10') maxPrice = 100000;
    else if (priceFilter === 'over10') maxPrice = undefined; // 하한만 있음 (필터 없이 전체 반환)
    else if (priceFilter && !isNaN(Number(priceFilter))) maxPrice = Number(priceFilter);

    // 불리언 쿼리파라미터 파서 (문자열 'true'/'false' → boolean)
    const parseBool = (v: string | undefined): boolean | undefined =>
      v === 'true' ? true : v === 'false' ? false : undefined;

    // 단지 특성 필터 파싱
    const complexFilter: ComplexFilter = {
      minUnit: req.query.minUnit ? parseInt(req.query.minUnit as string, 10) : undefined,
      isBrand: parseBool(req.query.isBrand as string),
      isWalkSubway: parseBool(req.query.isWalkSubway as string),
      isLargeComplex: parseBool(req.query.isLargeComplex as string),
      isNewBuild: parseBool(req.query.isNewBuild as string),
      isFlat: parseBool(req.query.isFlat as string),
      hasElementarySchool: parseBool(req.query.hasElementarySchool as string),
    };

    // 모든 필드가 undefined이면 필터 객체 자체를 전달하지 않음 (불필요한 캐시 키 증가 방지)
    const hasAnyComplexFilter = Object.values(complexFilter).some((v) => v !== undefined);

    const data = await getApartmentMapMarkers(
      swLatNum,
      swLngNum,
      neLatNum,
      neLngNum,
      maxPrice,
      hasAnyComplexFilter ? complexFilter : undefined,
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
  async (req: Request, res: Response, next: NextFunction) => {
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
      next(error);
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
