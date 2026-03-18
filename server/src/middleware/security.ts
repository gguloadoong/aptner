// ============================================================
// 보안 미들웨어 모음
// helmet, CORS, rate limiting 설정
// ============================================================
import { Request, Response, NextFunction, RequestHandler } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

/**
 * helmet 보안 헤더 미들웨어
 * X-Frame-Options, CSP, HSTS 등 보안 헤더를 자동으로 설정합니다.
 */
export const helmetMiddleware = helmet({
  // 개발 환경에서 CSP 완화 (프로덕션에서는 더 엄격하게 설정 권장)
  contentSecurityPolicy: process.env.NODE_ENV === 'production',
});

/**
 * CORS 미들웨어
 * 환경변수 ALLOWED_ORIGINS에 설정된 도메인만 허용합니다.
 * ALLOWED_ORIGINS=* 로 설정 시 전체 허용 (개발/스테이징 용도)
 * *.vercel.app 패턴도 지원합니다.
 */
export function corsMiddleware(): RequestHandler {
  const rawOrigins = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) ?? [
    'http://localhost:5173',
  ];

  // 전체 허용 와일드카드 여부
  const allowAll = rawOrigins.includes('*');

  console.log(`[Security] CORS 허용 도메인: ${rawOrigins.join(', ')}`);

  return cors({
    origin: (origin, callback) => {
      // origin === null: 파일 프로토콜(file://) 또는 sandboxed iframe — 명시적 차단
      if (origin === 'null') {
        console.warn('[Security] CORS 차단: null origin (file:// 또는 sandboxed iframe)');
        callback(new Error('CORS: null origin은 허용되지 않습니다.'));
        return;
      }

      // origin이 undefined인 경우: 서버 간 요청(헬스체크, Railway 내부 등) 허용
      if (!origin) {
        callback(null, true);
        return;
      }

      // * 전체 허용 모드
      if (allowAll) {
        callback(null, true);
        return;
      }

      // 정확한 도메인 일치 또는 *.vercel.app 패턴 확인
      const isAllowed = rawOrigins.some((allowed) => {
        if (allowed === origin) return true;
        // 와일드카드 패턴 처리: *.vercel.app → ^https?://[^.]+\.vercel\.app$
        if (allowed.startsWith('*.')) {
          const suffix = allowed.slice(1); // .vercel.app
          return origin.endsWith(suffix);
        }
        return false;
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`[Security] CORS 차단: ${origin}`);
        callback(new Error(`CORS: ${origin} 은 허용되지 않은 도메인입니다.`));
      }
    },
    methods: ['GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400, // preflight 캐시: 24시간
  });
}

/**
 * 전역 rate limiter
 * 15분 내 100회 요청으로 제한합니다.
 * 공공 API quota 보호 및 DDoS 방어 목적
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: process.env.NODE_ENV === 'production' ? 300 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '너무 많은 요청이 발생했습니다. 15분 후 다시 시도해 주세요.',
    },
  },
  handler: (req: Request, res: Response) => {
    console.warn(`[Security] Rate limit 초과: IP=${req.ip}, URL=${req.originalUrl}`);
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: '너무 많은 요청이 발생했습니다. 15분 후 다시 시도해 주세요.',
      },
    });
  },
});

/**
 * 국토부 API 전용 rate limiter (더 엄격한 제한)
 * 국토부 API는 월 1,000회 무료이므로 과도한 호출을 방지합니다.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1분
  max: process.env.NODE_ENV === 'production' ? 60 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    console.warn(`[Security] API Rate limit 초과: IP=${req.ip}, URL=${req.originalUrl}`);
    res.status(429).json({
      success: false,
      error: {
        code: 'API_RATE_LIMIT_EXCEEDED',
        message: 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.',
      },
    });
  },
});

/**
 * 요청 파라미터 기본 검증 미들웨어
 * SQL Injection, XSS 등 악의적 입력값을 사전 차단합니다.
 */
export function validateInput(req: Request, res: Response, next: NextFunction): void {
  // 위험한 문자 패턴 검사 (SQL Injection, script 태그 등)
  const dangerousPattern = /[<>'"`;\\]/;

  for (const [key, value] of Object.entries(req.query)) {
    const strValue = String(value);
    if (dangerousPattern.test(strValue)) {
      console.warn(`[Security] 의심스러운 입력값 감지: key=${key}, value=${strValue}`);
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: '유효하지 않은 입력값이 포함되어 있습니다.',
        },
      });
      return;
    }
  }

  next();
}
