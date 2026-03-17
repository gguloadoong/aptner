import { Loading, Skeleton } from '@wanteddev/wds';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  fullScreen?: boolean;
}

// WDS Loading 컴포넌트 래퍼 - 기존 인터페이스 유지
const LoadingSpinner = ({ size = 'md', message, fullScreen = false }: LoadingSpinnerProps) => {
  // size를 WDS Loading의 px 단위로 변환
  const sizeMap = {
    sm: '20px',
    md: '32px',
    lg: '48px',
  } as const;

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <Loading size={sizeMap[size]} />
      {message && (
        <p className="text-sm text-[#8B95A1]">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

LoadingSpinner.displayName = 'LoadingSpinner';
export default LoadingSpinner;

// 카드 스켈레톤 - WDS Skeleton으로 교체
export const CardSkeleton = () => (
  <div className="bg-white rounded-xl border border-[#E5E8EB] p-4 space-y-3">
    <Skeleton variant="text" width="75%" height="16px" />
    <Skeleton variant="text" width="50%" height="12px" />
    <Skeleton variant="text" width="33%" height="24px" />
    <Skeleton variant="text" width="25%" height="12px" />
  </div>
);

CardSkeleton.displayName = 'CardSkeleton';
