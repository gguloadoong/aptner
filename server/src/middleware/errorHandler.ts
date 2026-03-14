// ============================================================
// 전역 에러 핸들러 미들웨어
// 모든 에러를 일관된 형식으로 변환하여 응답합니다.
// 프로덕션 환경에서는 스택 트레이스를 절대 노출하지 않습니다.
// ============================================================
import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

/**
 * 404 핸들러 - 정의되지 않은 라우트 처리
 */
export function notFoundHandler(req: Request, res: Response): void {
  console.warn(`[Error] 404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `요청한 리소스를 찾을 수 없습니다: ${req.originalUrl}`,
    },
  });
}

/**
 * 전역 에러 핸들러
 * Express 에러 미들웨어는 반드시 4개의 파라미터를 가져야 합니다.
 */
export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // 에러 로깅 (서버 내부 로그에는 스택 트레이스 포함)
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message);

  // 개발 환경에서만 스택 트레이스 로깅
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Axios 에러 처리 (외부 API 호출 실패)
  if (axios.isAxiosError(err)) {
    const status = err.response?.status ?? 503;

    if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
      res.status(504).json({
        success: false,
        error: {
          code: 'EXTERNAL_API_TIMEOUT',
          message: '외부 API 응답 시간 초과. 잠시 후 다시 시도해 주세요.',
        },
      });
      return;
    }

    if (status === 503 || status === 502) {
      res.status(503).json({
        success: false,
        error: {
          code: 'EXTERNAL_API_UNAVAILABLE',
          message: '외부 API가 일시적으로 사용 불가합니다. 캐시 데이터를 확인해 주세요.',
        },
      });
      return;
    }

    res.status(502).json({
      success: false,
      error: {
        code: 'EXTERNAL_API_ERROR',
        message: '외부 API 호출 중 오류가 발생했습니다.',
      },
    });
    return;
  }

  // 환경변수 누락 에러
  if (err.message.includes('환경변수')) {
    res.status(500).json({
      success: false,
      error: {
        code: 'CONFIGURATION_ERROR',
        message: '서버 설정 오류가 발생했습니다. 관리자에게 문의해 주세요.',
      },
    });
    return;
  }

  // CORS 에러
  if (err.message.startsWith('CORS:')) {
    res.status(403).json({
      success: false,
      error: {
        code: 'CORS_ERROR',
        message: '허용되지 않은 도메인에서의 요청입니다.',
      },
    });
    return;
  }

  // 기타 에러 - 프로덕션에서는 내부 정보 노출 금지
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: '서버 내부 오류가 발생했습니다.',
    },
  });
}
