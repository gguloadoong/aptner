// ============================================================
// 라우트 통합 진입점
// 모든 API 라우트를 /api 하위에 마운트합니다.
// ============================================================
import { Router, Request, Response } from 'express';
import apartmentRouter from './apartment.routes';
import subscriptionRouter from './subscription.routes';
import trendRouter from './trend.routes';
import { cacheService } from '../services/cache.service';

const router = Router();

// ---- 각 도메인 라우터 마운트 ----
router.use('/apartments', apartmentRouter);
router.use('/subscriptions', subscriptionRouter);
router.use('/trends', trendRouter);

// /api/regions 는 trendRouter에 포함된 라우트를 재사용
router.use('/regions', trendRouter);

// ---- 헬스체크 엔드포인트 ----
router.get('/health', (_req: Request, res: Response) => {
  const stats = cacheService.stats();
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV ?? 'development',
      cache: {
        hits: stats.hits,
        misses: stats.misses,
        keys: stats.keys,
      },
    },
  });
});

export default router;
