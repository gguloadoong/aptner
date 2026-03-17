import React from 'react';
import type { RegionTrend } from '../../types';
import { formatPriceShort } from '../../utils/formatNumber';

interface RegionChipProps {
  trend: RegionTrend;
}

// 지역 시세 pill 칩 컴포넌트
const RegionChip = React.memo<RegionChipProps>(({ trend }) => {
  const isUp = trend.priceChange > 0;
  const isDown = trend.priceChange < 0;

  // 등락 방향별 칩 스타일
  const chipClass = [
    'inline-flex items-center gap-2 h-[52px] rounded-[26px] px-4 flex-shrink-0',
    'shadow-sm cursor-pointer transition-all duration-150 active:scale-[0.96]',
    'scroll-snap-align-start',
    isUp
      ? 'bg-[#FFF3F3] border border-[#FF4B4B]/30'
      : isDown
        ? 'bg-[#EFF6FF] border border-[rgba(59,130,246,0.25)]'
        : 'bg-white border border-[#E5E8EB]',
  ].join(' ');

  // 변동률 색상
  const changeColor = isUp
    ? 'text-[#FF4B4B]'
    : isDown
      ? 'text-[#3B82F6]'
      : 'text-[#8B95A1]';

  return (
    <div className={chipClass}>
      {/* 지역명 */}
      <span className="text-[13px] font-semibold text-[#191F28]">{trend.region}</span>
      {/* 평균가 */}
      <span className="text-[13px] font-bold text-[#191F28] font-mono">
        {formatPriceShort(trend.avgPrice)}
      </span>
      {/* 변동률 */}
      <span className={`text-[11px] font-semibold ${changeColor}`}>
        {isUp ? '▲' : isDown ? '▼' : ''}{Math.abs(trend.priceChange).toFixed(1)}%
      </span>
    </div>
  );
});

RegionChip.displayName = 'RegionChip';
export default RegionChip;
