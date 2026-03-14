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

  // 실 API 키 존재 여부 확인 (Mock 모드 판단)
  const isMockMode = !process.env.MOLIT_API_KEY;

  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV ?? 'development',
      // 실 API 없이 Mock 데이터로 동작 중임을 클라이언트에 알림
      mockMode: isMockMode,
      cache: {
        hits: stats.hits,
        misses: stats.misses,
        keys: stats.keys,
      },
      // 사용 가능한 주요 엔드포인트 목록
      availableEndpoints: [
        'GET /api/health',
        'GET /api/apartments/trades?lawdCd=11110&dealYmd=202601',
        'GET /api/apartments/hot?region=서울&limit=10',
        'GET /api/apartments/map?swLat=37.4&swLng=126.8&neLat=37.7&neLng=127.2',
        'GET /api/apartments/:aptCode/history?lawdCd=11650',
        'GET /api/subscriptions',
        'GET /api/subscriptions?status=ongoing',
        'GET /api/subscriptions?status=upcoming',
        'GET /api/subscriptions?status=closed',
        'GET /api/subscriptions/:id',
        'GET /api/trends/region?regionCode=11',
        'GET /api/regions/list',
        'GET /api/regions/:siDoCd/sigungu',
      ],
    },
  });
});

export default router;
