interface BomzipLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

// 봄집 브랜드 로고 컴포넌트
// - 브랜드 컬러 #0066FF (WDS 파란색) 적용
// - 사이드바/헤더 모두 대응
export default function BomzipLogo({ size = 'md', showText = true, className = '' }: BomzipLogoProps) {
  const iconSize = size === 'sm' ? 26 : size === 'md' ? 30 : 38;

  const textSizeClass =
    size === 'sm' ? 'text-[15px]' : size === 'md' ? 'text-[18px]' : 'text-[22px]';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* 파란 배경 아이콘 컨테이너 */}
      <div
        className="flex items-center justify-center rounded-[10px] bg-[#0066FF] flex-shrink-0"
        style={{ width: iconSize, height: iconSize }}
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
        <div className="flex flex-col leading-none">
          <span
            className={`${textSizeClass} font-black tracking-tight`}
            style={{ color: '#191F28', letterSpacing: '-0.03em' }}
          >
            봄집
          </span>
          <span className="text-[9px] font-semibold text-[#0066FF] tracking-[0.12em] mt-[1px]">
            BOMZIP
          </span>
        </div>
      )}
    </div>
  );
}
