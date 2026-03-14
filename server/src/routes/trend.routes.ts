// ============================================================
// 트렌드 및 지역 코드 라우트
// GET /api/trends/region
// GET /api/regions
// GET /api/regions/:siDoCd/sigungu
// ============================================================
import { Router, Request, Response, NextFunction } from 'express';
import { getRegionTrend } from '../services/trend.service';
import { cacheService, CACHE_TTL } from '../services/cache.service';
import { SiDo, SiGunGu, TrendQueryParams } from '../types';

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

// ---- 시군구 코드 정적 데이터 (주요 지역 포함) ----
// 국토부 실거래가 API에서 사용하는 법정동 코드 앞 5자리
const SI_GUN_GU_LIST: SiGunGu[] = [
  // 서울특별시
  { code: '11110', name: '종로구', siDoCode: '11' },
  { code: '11140', name: '중구', siDoCode: '11' },
  { code: '11170', name: '용산구', siDoCode: '11' },
  { code: '11200', name: '성동구', siDoCode: '11' },
  { code: '11215', name: '광진구', siDoCode: '11' },
  { code: '11230', name: '동대문구', siDoCode: '11' },
  { code: '11260', name: '중랑구', siDoCode: '11' },
  { code: '11290', name: '성북구', siDoCode: '11' },
  { code: '11305', name: '강북구', siDoCode: '11' },
  { code: '11320', name: '도봉구', siDoCode: '11' },
  { code: '11350', name: '노원구', siDoCode: '11' },
  { code: '11380', name: '은평구', siDoCode: '11' },
  { code: '11410', name: '서대문구', siDoCode: '11' },
  { code: '11440', name: '마포구', siDoCode: '11' },
  { code: '11470', name: '양천구', siDoCode: '11' },
  { code: '11500', name: '강서구', siDoCode: '11' },
  { code: '11530', name: '구로구', siDoCode: '11' },
  { code: '11545', name: '금천구', siDoCode: '11' },
  { code: '11560', name: '영등포구', siDoCode: '11' },
  { code: '11590', name: '동작구', siDoCode: '11' },
  { code: '11620', name: '관악구', siDoCode: '11' },
  { code: '11650', name: '서초구', siDoCode: '11' },
  { code: '11680', name: '강남구', siDoCode: '11' },
  { code: '11710', name: '송파구', siDoCode: '11' },
  { code: '11740', name: '강동구', siDoCode: '11' },
  // 경기도 주요 시군구
  { code: '41111', name: '수원시 장안구', siDoCode: '41' },
  { code: '41113', name: '수원시 권선구', siDoCode: '41' },
  { code: '41115', name: '수원시 팔달구', siDoCode: '41' },
  { code: '41117', name: '수원시 영통구', siDoCode: '41' },
  { code: '41131', name: '성남시 수정구', siDoCode: '41' },
  { code: '41133', name: '성남시 중원구', siDoCode: '41' },
  { code: '41135', name: '성남시 분당구', siDoCode: '41' },
  { code: '41150', name: '의정부시', siDoCode: '41' },
  { code: '41171', name: '안양시 만안구', siDoCode: '41' },
  { code: '41173', name: '안양시 동안구', siDoCode: '41' },
  { code: '41190', name: '부천시', siDoCode: '41' },
  { code: '41210', name: '광명시', siDoCode: '41' },
  { code: '41280', name: '고양시 덕양구', siDoCode: '41' },
  { code: '41285', name: '고양시 일산동구', siDoCode: '41' },
  { code: '41287', name: '고양시 일산서구', siDoCode: '41' },
  { code: '41461', name: '용인시 처인구', siDoCode: '41' },
  { code: '41463', name: '용인시 기흥구', siDoCode: '41' },
  { code: '41465', name: '용인시 수지구', siDoCode: '41' },
  // 인천광역시
  { code: '28110', name: '중구', siDoCode: '28' },
  { code: '28140', name: '동구', siDoCode: '28' },
  { code: '28177', name: '미추홀구', siDoCode: '28' },
  { code: '28185', name: '연수구', siDoCode: '28' },
  { code: '28200', name: '남동구', siDoCode: '28' },
  { code: '28237', name: '부평구', siDoCode: '28' },
  { code: '28245', name: '계양구', siDoCode: '28' },
  { code: '28260', name: '서구', siDoCode: '28' },
];

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

    const list = SI_GUN_GU_LIST.filter((sg) => sg.siDoCode === siDoCd);

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

export default router;
