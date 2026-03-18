import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Apartment } from '../../types';
import { formatPriceShort, formatChange, formatUnits } from '../../utils/formatNumber';
import { Box, FlexBox, Typography } from '@wanteddev/wds';
import HotTag from './HotTag';
import { useCompareStore } from '../../stores/compareStore';

interface ApartmentCardProps {
  apartment: Apartment;
  rank?: number;
  showRankChange?: boolean;
  compact?: boolean;
}

// 카드 우하단 비교 추가 버튼 (작은 + 버튼)
function CompareAddButton({ id, name }: { id: string; name: string }) {
  const { isInCompare, addCompare, removeCompare, compareList } = useCompareStore();
  const inCompare = isInCompare(id);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inCompare) {
      removeCompare(id);
    } else {
      if (compareList.length >= 3) return;
      addCompare({ id, name });
    }
  };

  return (
    <button
      onClick={handleClick}
      style={{
        position: 'absolute',
        bottom: '12px',
        right: '12px',
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: 700,
        transition: 'all 150ms',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        border: inCompare ? '1px solid var(--semantic-primary-normal)' : '1px solid #C4C9CF',
        backgroundColor: inCompare ? 'var(--semantic-primary-normal)' : 'var(--semantic-background-normal-normal)',
        color: inCompare ? 'white' : 'var(--semantic-label-assistive)',
        cursor: compareList.length >= 3 && !inCompare ? 'not-allowed' : 'pointer',
        opacity: compareList.length >= 3 && !inCompare ? 0.3 : 1,
      }}
      aria-label={inCompare ? `${name} 비교 제거` : `${name} 비교 추가`}
      title={inCompare ? '비교 제거' : '비교 추가'}
    >
      {inCompare ? '✓' : '+'}
    </button>
  );
}

// 아파트 카드 컴포넌트
const ApartmentCard = React.memo<ApartmentCardProps>(
  ({ apartment, rank, showRankChange = false, compact = false }) => {
    const navigate = useNavigate();

    const handleClick = () => {
      navigate(`/apartment/${apartment.id}`);
    };

    const priceColor =
      apartment.priceChangeType === 'up'
        ? '#FF4B4B'
        : apartment.priceChangeType === 'down'
          ? '#00C896'
          : 'var(--semantic-label-assistive)';

    const priceArrow =
      apartment.priceChangeType === 'up'
        ? '▲'
        : apartment.priceChangeType === 'down'
          ? '▼'
          : '';

    const cardBaseStyle: React.CSSProperties = {
      position: 'relative',
      backgroundColor: 'var(--semantic-background-normal-normal)',
      borderRadius: '12px',
      border: '1px solid var(--semantic-line-normal)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      cursor: 'pointer',
      transition: 'box-shadow 200ms ease, border-color 200ms ease',
      width: '100%',
    };

    const handleMouseEnter = (e: React.MouseEvent) => {
      const el = e.currentTarget as HTMLElement;
      el.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
      el.style.borderColor = 'rgba(0,102,255,0.3)';
    };

    const handleMouseLeave = (e: React.MouseEvent) => {
      const el = e.currentTarget as HTMLElement;
      el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
      el.style.borderColor = 'var(--semantic-line-normal)';
    };

    if (compact) {
      return (
        <div
          style={{ ...cardBaseStyle, padding: '12px' }}
          onClick={handleClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleClick()}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <FlexBox alignItems="center" gap="12px">
            {rank && (
              <Typography
                variant="caption1"
                weight="bold"
                sx={{ color: 'var(--semantic-label-assistive)', width: '20px', textAlign: 'center', flexShrink: 0 }}
              >
                {rank}
              </Typography>
            )}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                weight="bold"
                sx={{ color: 'var(--semantic-label-normal)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {apartment.name}
              </Typography>
              <Typography
                variant="caption1"
                sx={{ color: 'var(--semantic-label-assistive)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {apartment.district}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right', flexShrink: 0, paddingRight: '28px' }}>
              <Typography variant="body2" weight="bold" sx={{ color: 'var(--semantic-label-normal)' }}>
                {formatPriceShort(apartment.recentPrice)}
              </Typography>
              <Typography variant="caption1" weight="medium" sx={{ color: priceColor }}>
                {priceArrow} {formatChange(apartment.priceChange)}
              </Typography>
            </Box>
          </FlexBox>
          <CompareAddButton id={apartment.id} name={apartment.name} />
        </div>
      );
    }

    return (
      <div
        style={{ ...cardBaseStyle, padding: '16px' }}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <FlexBox alignItems="flex-start" gap="12px">
          {/* 순위 표시 */}
          {rank && (
            <FlexBox flexDirection="column" alignItems="center" gap="4px" style={{ flexShrink: 0 }}>
              <Typography
                variant="heading1"
                weight="bold"
                sx={{ color: rank <= 3 ? 'var(--semantic-primary-normal)' : 'var(--semantic-label-assistive)' }}
              >
                {rank}
              </Typography>
              {showRankChange && apartment.weeklyRankChange !== undefined && (
                <RankChangeBadge change={apartment.weeklyRankChange} />
              )}
            </FlexBox>
          )}

          {/* 단지 정보 */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body1"
              weight="bold"
              sx={{ color: 'var(--semantic-label-normal)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {apartment.name}
            </Typography>
            {apartment.hotTags && apartment.hotTags.length > 0 && (
              <FlexBox gap="4px" style={{ marginTop: '4px', flexWrap: 'wrap' }}>
                {apartment.hotTags.slice(0, 2).map(tag => <HotTag key={tag} tag={tag} />)}
              </FlexBox>
            )}
            <Typography
              variant="caption1"
              sx={{ color: 'var(--semantic-label-assistive)', display: 'block', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {apartment.district} · {apartment.dong}
            </Typography>
            <Typography
              variant="caption1"
              sx={{ color: 'var(--semantic-label-assistive)', display: 'block', marginTop: '2px' }}
            >
              {formatUnits(apartment.totalUnits)} · {apartment.builtYear}년
            </Typography>
          </Box>

          {/* 가격 정보 */}
          <Box sx={{ textAlign: 'right', flexShrink: 0, paddingRight: '4px', paddingBottom: '20px' }}>
            <Typography variant="heading2" weight="bold" sx={{ color: 'var(--semantic-label-normal)' }}>
              {formatPriceShort(apartment.recentPrice)}
            </Typography>
            <Typography variant="caption1" sx={{ color: 'var(--semantic-label-assistive)', display: 'block', marginTop: '2px' }}>
              {apartment.recentPriceArea}㎡
            </Typography>
            <Typography variant="body2" weight="bold" sx={{ color: priceColor, display: 'block', marginTop: '4px' }}>
              {priceArrow} {formatChange(apartment.priceChange)}
            </Typography>
          </Box>
        </FlexBox>
        <CompareAddButton id={apartment.id} name={apartment.name} />
      </div>
    );
  }
);

ApartmentCard.displayName = 'ApartmentCard';
export default ApartmentCard;

// 순위 변동 뱃지
function RankChangeBadge({ change }: { change: number | 'new' }) {
  if (change === 'new') {
    return (
      <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: 'var(--semantic-primary-normal)', color: 'white', padding: '2px 6px', borderRadius: '9999px' }}>
        NEW
      </span>
    );
  }
  if (change > 0) {
    return <span style={{ fontSize: '10px', fontWeight: 700, color: '#FF4B4B' }}>▲{change}</span>;
  }
  if (change < 0) {
    return <span style={{ fontSize: '10px', fontWeight: 700, color: '#00C896' }}>▼{Math.abs(change)}</span>;
  }
  return <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--semantic-label-assistive)' }}>-</span>;
}
