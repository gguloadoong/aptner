import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  fullScreen?: boolean;
}

// 로딩 스피너 컴포넌트
const LoadingSpinner = React.memo<LoadingSpinnerProps>(
  ({ size = 'md', message, fullScreen = false }) => {
    const sizeStyles = {
      sm: 'w-5 h-5 border-2',
      md: 'w-8 h-8 border-3',
      lg: 'w-12 h-12 border-4',
    };

    const spinner = (
      <div className="flex flex-col items-center gap-3">
        <div
          className={[
            'rounded-full border-[#1B64DA] border-t-transparent animate-spin',
            sizeStyles[size],
          ].join(' ')}
          style={{ borderWidth: size === 'sm' ? 2 : size === 'md' ? 3 : 4 }}
        />
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
  }
);

LoadingSpinner.displayName = 'LoadingSpinner';
export default LoadingSpinner;

// 카드 스켈레톤
export const CardSkeleton = React.memo(() => (
  <div className="bg-white rounded-xl border border-[#E5E8EB] p-4 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
    <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
    <div className="h-6 bg-gray-200 rounded w-1/3 mb-2" />
    <div className="h-3 bg-gray-200 rounded w-1/4" />
  </div>
));

CardSkeleton.displayName = 'CardSkeleton';
