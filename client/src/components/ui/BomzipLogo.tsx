import { FlexBox, Typography } from '@wanteddev/wds';

interface BomzipLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

// 봄집 브랜드 로고 컴포넌트
// - 브랜드 컬러 #0066FF (WDS 파란색) 적용
// - 사이드바/헤더 모두 대응
export default function BomzipLogo({ size = 'md', showText = true }: BomzipLogoProps) {
  const iconSize = size === 'sm' ? 26 : size === 'md' ? 30 : 38;

  const textVariant = size === 'sm' ? 'body1' : size === 'md' ? 'heading2' : 'title3';

  return (
    <FlexBox alignItems="center" gap="8px">
      {/* 파란 배경 아이콘 컨테이너 */}
      <div
        style={{
          width: iconSize,
          height: iconSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '10px',
          backgroundColor: 'var(--semantic-primary-normal)',
          flexShrink: 0,
        }}
      >
        {/* 집 아이콘 SVG */}
        <svg
          width={iconSize * 0.62}
          height={iconSize * 0.62}
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
          <path d="M9 21V12h6v9" />
        </svg>
      </div>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <Typography
            variant={textVariant}
            weight="bold"
            sx={{ color: 'var(--semantic-label-normal)', letterSpacing: '-0.03em', lineHeight: 1.1 }}
          >
            봄집
          </Typography>
          <Typography
            variant="caption2"
            weight="bold"
            sx={{ color: 'var(--semantic-primary-normal)', letterSpacing: '0.12em', marginTop: '1px' }}
          >
            BOMZIP
          </Typography>
        </div>
      )}
    </FlexBox>
  );
}
