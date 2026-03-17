import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Apartment } from '../../types';
import { formatPriceShort, formatChange, formatArea } from '../../utils/formatNumber';
import { Box, FlexBox, Typography } from '@wanteddev/wds';

interface HeroApartmentCardProps {
  apartment: Apartment;
}

// 주간 HOT 1위 전용 히어로 카드
const HeroApartmentCard = React.memo<HeroApartmentCardProps>(({ apartment }) => {
  const navigate = useNavigate();

  const isUp = apartment.priceChangeType === 'up';
  const isDown = apartment.priceChangeType === 'down';
  const priceColor = isUp ? '#FF4B4B' : isDown ? '#3B82F6' : 'var(--semantic-label-assistive)';
  const changeArrow = isUp ? '▲' : isDown ? '▼' : '';

  // 순위 변동 뱃지
  const renderRankChange = () => {
    const change = apartment.weeklyRankChange;
    if (change === undefined || change === null) return null;
    if (change === 'new') {
      return (
        <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: 'var(--semantic-primary-normal)', color: 'white', padding: '3px 8px', borderRadius: '9999px' }}>
          NEW
        </span>
      );
    }
    if (typeof change === 'number' && change > 0) {
      return <span style={{ fontSize: '12px', fontWeight: 700, color: '#FF4B4B' }}>▲{change}</span>;
    }
    if (typeof change === 'number' && change < 0) {
      return <span style={{ fontSize: '12px', fontWeight: 700, color: '#3B82F6' }}>▼{Math.abs(change)}</span>;
    }
    return <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--semantic-label-assistive)' }}>-</span>;
  };

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, rgba(0,102,255,0.06) 0%, var(--semantic-background-normal-normal) 100%)',
        borderRadius: '16px',
        padding: '20px',
        cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
        borderLeft: '4px solid var(--semantic-primary-normal)',
        transition: 'box-shadow 200ms ease',
      }}
      onClick={() => navigate(`/apartment/${apartment.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && navigate(`/apartment/${apartment.id}`)}
      onMouseEnter={(e: React.MouseEvent) => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.14)';
      }}
      onMouseLeave={(e: React.MouseEvent) => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.10)';
      }}
    >
      {/* 상단 행: 1위 뱃지 + 순위 변동 */}
      <FlexBox alignItems="center" justifyContent="space-between">
        <span style={{ backgroundColor: '#FFD700', color: 'white', fontSize: '14px', fontWeight: 900, padding: '4px 12px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(255,215,0,0.5)' }}>
          1위
        </span>
        {renderRankChange()}
      </FlexBox>

      {/* 단지명 + 최고가 경신 뱃지 */}
      <FlexBox alignItems="center" gap="8px" style={{ marginTop: '8px', flexWrap: 'wrap' }}>
        <Typography
          variant="title2"
          weight="bold"
          sx={{ color: 'var(--semantic-label-normal)', lineHeight: 1.2 }}
        >
          {apartment.name}
        </Typography>
        {apartment.isRecordHigh && (
          <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: '#FFEBEE', color: '#C62828', border: '1px solid rgba(239,154,154,0.3)', padding: '2px 8px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
            최고가 경신
          </span>
        )}
      </FlexBox>

      {/* 위치 */}
      <Typography
        variant="body2"
        sx={{ color: 'var(--semantic-label-assistive)', marginTop: '4px', display: 'block' }}
      >
        {apartment.district} · {apartment.dong}
      </Typography>

      {/* 가격 + 변동률 행 */}
      <FlexBox alignItems="flex-end" style={{ marginTop: '16px' }}>
        <span style={{ fontSize: '32px', fontWeight: 900, color: 'var(--semantic-label-normal)', fontFamily: 'var(--font-jetbrains, monospace)', lineHeight: 1 }}>
          {formatPriceShort(apartment.recentPrice)}
        </span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: priceColor, marginLeft: '8px', marginBottom: '2px' }}>
          {changeArrow} {formatChange(apartment.priceChange)}
        </span>
      </FlexBox>

      {/* 면적 */}
      <Typography
        variant="caption1"
        sx={{ color: 'var(--semantic-label-assistive)', display: 'block', marginTop: '4px' }}
      >
        기준 {formatArea(apartment.recentPriceArea)}
      </Typography>
    </Box>
  );
});

HeroApartmentCard.displayName = 'HeroApartmentCard';
export default HeroApartmentCard;
