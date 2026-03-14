// ============================================================
// Aptner API 프록시 서버 - 엔트리포인트
// Node.js + Express + TypeScript
// ============================================================
import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import apiRouter from './routes';
import {
  helmetMiddleware,
  corsMiddleware,
  globalRateLimiter,
  validateInput,
} from './middleware/security';
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

// ---- 보안 미들웨어 (가장 먼저 적용) ----
app.use(helmetMiddleware);
app.use(corsMiddleware());
app.use(globalRateLimiter);

// ---- 공통 미들웨어 ----
// 요청 로깅 (개발: 상세, 프로덕션: combined 포맷)
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// JSON 파싱 (요청 본문 최대 1MB로 제한)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// 입력값 검증 미들웨어
app.use(validateInput);

// ---- API 라우터 ----
app.use('/api', apiRouter);

// ---- 에러 처리 ----
// 정의되지 않은 라우트 처리 (404)
app.use(notFoundHandler);

// 전역 에러 핸들러 (반드시 마지막에 위치)
app.use(globalErrorHandler);

// ---- 서버 시작 ----
const server = app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`[Server] Aptner API 서버 시작`);
  console.log(`[Server] 포트: ${PORT}`);
  console.log(`[Server] 환경: ${process.env.NODE_ENV ?? 'development'}`);
  console.log(`[Server] URL: http://localhost:${PORT}`);
  console.log('='.repeat(50));
  console.log('[Server] 사용 가능한 엔드포인트:');
  console.log(`  GET /api/health`);
  console.log(`  GET /api/apartments/trades?lawdCd=&dealYmd=`);
  console.log(`  GET /api/apartments/:aptCode/history?lawdCd=`);
  console.log(`  GET /api/apartments/hot?region=`);
  console.log(`  GET /api/subscriptions`);
  console.log(`  GET /api/subscriptions/:id`);
  console.log(`  GET /api/trends/region?regionCode=`);
  console.log(`  GET /api/regions/list`);
  console.log(`  GET /api/regions/:siDoCd/sigungu`);
  console.log('='.repeat(50));
});

// ---- Graceful Shutdown 처리 ----
function gracefulShutdown(signal: string): void {
  console.log(`\n[Server] ${signal} 수신. 서버 종료 중...`);
  server.close(() => {
    console.log('[Server] HTTP 서버 종료 완료');
    process.exit(0);
  });

  // 10초 이내 종료되지 않으면 강제 종료
  setTimeout(() => {
    console.error('[Server] 강제 종료 (timeout)');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 처리되지 않은 Promise rejection 로깅
process.on('unhandledRejection', (reason: unknown) => {
  console.error('[Server] UnhandledRejection:', reason);
});

process.on('uncaughtException', (err: Error) => {
  console.error('[Server] UncaughtException:', err.message);
  process.exit(1);
});

export default app;
