import { Loading, Skeleton, FlexBox, Box } from '@wanteddev/wds';
import { Typography } from '@wanteddev/wds';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  fullScreen?: boolean;
}

// WDS Loading 컴포넌트 래퍼 - 기존 인터페이스 유지
const LoadingSpinner = ({ size = 'md', message, fullScreen = false }: LoadingSpinnerProps) => {
  const sizeMap = {
    sm: '20px',
    md: '32px',
    lg: '48px',
  } as const;

  const spinner = (
    <FlexBox flexDirection="column" alignItems="center" gap="12px">
      <Loading size={sizeMap[size]} />
      {message && (
        <Typography variant="body2" sx={{ color: 'var(--semantic-label-assistive)' }}>
          {message}
        </Typography>
      )}
    </FlexBox>
  );

  if (fullScreen) {
    return (
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255,255,255,0.8)',
          zIndex: 50,
        }}
      >
        {spinner}
      </Box>
    );
  }

  return spinner;
};

LoadingSpinner.displayName = 'LoadingSpinner';
export default LoadingSpinner;

// 카드 스켈레톤 — WDS Skeleton 사용
export const CardSkeleton = () => (
  <Box
    sx={{
      backgroundColor: 'var(--semantic-background-normal-normal)',
      borderRadius: '12px',
      border: '1px solid var(--semantic-line-normal)',
      padding: '16px',
    }}
  >
    <FlexBox flexDirection="column" gap="12px">
      <Skeleton variant="text" width="75%" height="16px" />
      <Skeleton variant="text" width="50%" height="12px" />
      <Skeleton variant="text" width="33%" height="24px" />
      <Skeleton variant="text" width="25%" height="12px" />
    </FlexBox>
  </Box>
);

CardSkeleton.displayName = 'CardSkeleton';
