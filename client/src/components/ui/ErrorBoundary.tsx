import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// 렌더링 중 발생한 에러를 포착하는 클래스 기반 컴포넌트
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // 프로덕션에서는 외부 에러 트래킹 서비스(Sentry 등)로 전송
    console.error('[ErrorBoundary] 렌더링 중 에러 발생:', error, info.componentStack);
  }

  // 새로고침으로 에러 상태 초기화
  handleReset = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center px-5">
          <div className="bg-white rounded-2xl border border-[#E5E8EB] shadow-sm p-8 max-w-md w-full text-center">
            {/* 에러 아이콘 */}
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg
                className="w-8 h-8 text-[#FF4B4B]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
              </svg>
            </div>

            <h2 className="text-lg font-black text-[#191F28] mb-2">
              문제가 발생했습니다
            </h2>
            <p className="text-sm text-[#8B95A1] mb-6">
              예상치 못한 오류가 발생했습니다. 새로고침하면 대부분 해결됩니다.
            </p>

            {/* 새로고침 버튼 */}
            <button
              onClick={this.handleReset}
              className="w-full bg-[#1B64DA] text-white font-bold py-3 rounded-xl hover:bg-[#1554C0] transition-colors"
            >
              새로고침
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
