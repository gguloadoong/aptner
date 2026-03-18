// ============================================================
// 청약 정보 라우트
// GET /api/subscriptions
// GET /api/subscriptions/:id
// ============================================================
import { Router, Request, Response, NextFunction } from 'express';
import { getSubscriptions, getSubscriptionById } from '../services/subscription.service';
import { SubscriptionQueryParams, SubscriptionStatus } from '../types';

const router = Router();

const VALID_STATUSES: SubscriptionStatus[] = ['upcoming', 'ongoing', 'closed'];

/**
 * GET /api/subscriptions
 * 청약 목록 조회
 *
 * Query params:
 *   - page: 페이지 번호 (선택, 기본: 1)
 *   - limit: 페이지당 건수 (선택, 기본: 20, 최대: 50)
 *   - status: 청약 상태 필터 (선택: upcoming | ongoing | closed)
 *   - sido: 시도 필터 (선택, 예: "서울특별시")
 *   - month: 월 필터 (선택, YYYY-MM 형식, 해당 월에 걸치는 청약 반환)
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, status, sido, sort, month } = req.query as Partial<Record<string, string>>;

    // month 검증 (YYYY-MM 형식)
    if (month && !/^\d{4}-\d{2}$/.test(month)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_MONTH',
          message: 'month는 YYYY-MM 형식이어야 합니다. (예: 2026-03)',
        },
      });
      return;
    }

    // status 검증
    if (status && !VALID_STATUSES.includes(status as SubscriptionStatus)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: `status는 ${VALID_STATUSES.join(' | ')} 중 하나여야 합니다.`,
        },
      });
      return;
    }

    // sort 검증
    const VALID_SORTS = ['dDay', 'units', 'price'] as const;
    type SortType = typeof VALID_SORTS[number];
    if (sort && !VALID_SORTS.includes(sort as SortType)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_SORT', message: `sort는 ${VALID_SORTS.join(' | ')} 중 하나여야 합니다.` },
      });
      return;
    }

    const params: SubscriptionQueryParams = {
      page: page ? Math.max(1, parseInt(page, 10)) : 1,
      limit: limit ? Math.min(50, Math.max(1, parseInt(limit, 10))) : 20,
      status: status as SubscriptionStatus | undefined,
      sido,
      sort: sort as SortType | undefined,
      month,
    };

    const { items, total } = await getSubscriptions(params);
    const totalPages = Math.ceil(total / (params.limit ?? 20));

    res.json({
      success: true,
      data: items,
      meta: {
        total,
        page: params.page,
        limit: params.limit,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/subscriptions/:id
 * 청약 상세 정보 조회
 *
 * Path params:
 *   - id: 청약 ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const data = await getSubscriptionById(String(id));

    if (!data) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SUBSCRIPTION_NOT_FOUND',
          message: `ID "${id}"에 해당하는 청약 정보를 찾을 수 없습니다.`,
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
