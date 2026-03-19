// ============================================================
// 라우트 통합 진입점
// 모든 API 라우트를 /api 하위에 마운트합니다.
// ============================================================
import { Router, Request, Response } from 'express';
import apartmentRouter from './apartment.routes';
import subscriptionRouter from './subscription.routes';
import trendRouter from './trend.routes';
import renewalRouter from './renewal.routes';
import { cacheService } from '../services/cache.service';

const router = Router();

// ---- 각 도메인 라우터 마운트 ----
router.use('/apartments', apartmentRouter);
router.use('/subscriptions', subscriptionRouter);
router.use('/trends', trendRouter);
router.use('/renewal', renewalRouter);

// /api/regions 는 trendRouter에 포함된 라우트를 재사용
router.use('/regions', trendRouter);

// ---- 헬스체크 엔드포인트 ----
router.get('/health', (_req: Request, res: Response) => {
  const stats = cacheService.stats();

  // API 키 설정 여부 확인 — 길이 20자 이상이면 실 키로 간주
  const molitKey = process.env.MOLIT_API_KEY ?? '';
  const lhKey = process.env.LH_SUBSCRIPTION_API_KEY ?? '';
  const molitConfigured =
    molitKey.length >= 20 && molitKey !== 'demo_key_replace_with_real_key';
  const lhConfigured =
    lhKey.length >= 20 && lhKey !== 'demo_key_replace_with_real_key';

  // 국토부 키가 없으면 Mock 모드
  const isMockMode = !molitConfigured;

  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV ?? 'development',
      // 실 API 없이 Mock 데이터로 동작 중임을 클라이언트에 알림
      mockMode: isMockMode,
      // API 키 설정 여부 (키 값 자체는 노출하지 않음)
      apis: {
        molit: molitConfigured ? 'configured' : 'missing',
        lh: lhConfigured ? 'configured' : 'missing',
      },
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
        'GET /api/apartments/:aptCode/sale-price',
        'GET /api/subscriptions',
        'GET /api/subscriptions?status=ongoing',
        'GET /api/subscriptions?status=upcoming',
        'GET /api/subscriptions?status=closed',
        'GET /api/subscriptions/:id',
        'GET /api/trends/region?regionCode=11',
        'GET /api/apartments/map-prices?lawdCd=11200&year=2025&month=2',
        'GET /api/regions/lawdCd?lat=37.56&lng=126.97',
        'GET /api/regions/list',
        'GET /api/regions/:siDoCd/sigungu',
        'GET /api/renewal?swLat=37.4&swLng=126.8&neLat=37.7&neLng=127.2',
      ],
    },
  });
});

export default router;
