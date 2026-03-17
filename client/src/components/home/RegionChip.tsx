import React from 'react';
import type { RegionTrend } from '../../types';
import { formatPriceShort } from '../../utils/formatNumber';
import { Typography } from '@wanteddev/wds';

interface RegionChipProps {
  trend: RegionTrend;
}

// 지역 시세 pill 칩 컴포넌트
const RegionChip = React.memo<RegionChipProps>(({ trend }) => {
  const isUp = trend.priceChange > 0;
  const isDown = trend.priceChange < 0;

  // 등락 방향별 칩 스타일
  const chipStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    height: '52px',
    borderRadius: '26px',
    padding: '0 16px',
    flexShrink: 0,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    cursor: 'pointer',
    transition: 'transform 150ms ease',
    backgroundColor: isUp ? '#FFF3F3' : isDown ? '#EFF6FF' : 'var(--semantic-background-normal-normal)',
    border: `1px solid ${isUp ? 'rgba(255,75,75,0.3)' : isDown ? 'rgba(59,130,246,0.25)' : 'var(--semantic-line-normal)'}`,
  };

  const changeColor = isUp ? '#FF4B4B' : isDown ? '#3B82F6' : 'var(--semantic-label-assistive)';

  return (
    <div
      style={chipStyle}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
    >
      {/* 지역명 */}
      <Typography variant="body2" weight="medium" sx={{ color: 'var(--semantic-label-normal)' }}>
        {trend.region}
      </Typography>
      {/* 평균가 */}
      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--semantic-label-normal)', fontFamily: 'var(--font-jetbrains, monospace)' }}>
        {formatPriceShort(trend.avgPrice)}
      </span>
      {/* 변동률 */}
      <Typography variant="caption1" weight="medium" sx={{ color: changeColor }}>
        {isUp ? '▲' : isDown ? '▼' : ''}{Math.abs(trend.priceChange).toFixed(1)}%
      </Typography>
    </div>
  );
});

RegionChip.displayName = 'RegionChip';
export default RegionChip;
