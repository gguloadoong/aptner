import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Subscription } from '../../types';
import { formatPrice, calcDday } from '../../utils/formatNumber';
import { Box, FlexBox, Typography } from '@wanteddev/wds';
import SubscriptionBadge from './SubscriptionBadge';

interface SubscriptionCardProps {
  subscription: Subscription;
}

// 청약 카드 컴포넌트
const SubscriptionCard = React.memo<SubscriptionCardProps>(({ subscription }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/subscription/${subscription.id}`);
  };

  const dday = calcDday(subscription.deadline);
  // D-day 당일 포함, D-3 이내를 긴급으로 처리
  const isDdayUrgent =
    dday !== '마감' && (dday === 'D-day' || parseInt(dday.replace('D-', '')) <= 3);

  const ddayColor = isDdayUrgent
    ? '#FF4B4B'
    : subscription.status === 'closed'
      ? 'var(--semantic-label-assistive)'
      : 'var(--semantic-label-normal)';

  return (
    <Box
      sx={{
        backgroundColor: 'var(--semantic-background-normal-normal)',
        borderRadius: '12px',
        border: '1px solid var(--semantic-line-normal)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        padding: '16px',
        cursor: 'pointer',
        transition: 'box-shadow 200ms ease, border-color 200ms ease',
      }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleClick()}
      onMouseEnter={(e: React.MouseEvent) => {
        const el = e.currentTarget as HTMLElement;
        el.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
        el.style.borderColor = 'rgba(0,102,255,0.3)';
      }}
      onMouseLeave={(e: React.MouseEvent) => {
        const el = e.currentTarget as HTMLElement;
        el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
        el.style.borderColor = 'var(--semantic-line-normal)';
      }}
    >
      {/* 헤더: 상태 뱃지 + D-day */}
      <FlexBox alignItems="center" justifyContent="space-between" style={{ marginBottom: '12px' }}>
        <FlexBox alignItems="center" gap="8px">
          <SubscriptionBadge status={subscription.status} />
          {subscription.type === 'special' && (
            <span style={{ fontSize: '12px', padding: '2px 8px', backgroundColor: '#F3E5F5', color: '#7B1FA2', fontWeight: 600, borderRadius: '9999px' }}>
              특별
            </span>
          )}
        </FlexBox>
        <Typography variant="body2" weight="bold" sx={{ color: ddayColor }}>
          {dday}
        </Typography>
      </FlexBox>

      {/* 단지명 */}
      <Typography
        variant="body1"
        weight="bold"
        sx={{ color: 'var(--semantic-label-normal)', display: 'block', lineHeight: 1.3, marginBottom: '4px' }}
      >
        {subscription.name}
      </Typography>

      {/* 위치 */}
      <Typography
        variant="caption1"
        sx={{ color: 'var(--semantic-label-assistive)', display: 'block', marginBottom: '12px' }}
      >
        {subscription.location}
      </Typography>

      {/* 정보 그리드 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          paddingTop: '12px',
          borderTop: '1px solid var(--semantic-line-normal)',
        }}
      >
        <div>
          <Typography variant="caption2" sx={{ color: 'var(--semantic-label-assistive)', display: 'block', marginBottom: '2px' }}>
            최저 분양가
          </Typography>
          <Typography variant="body2" weight="bold" sx={{ color: 'var(--semantic-label-normal)' }}>
            {subscription.startPrice ? formatPrice(subscription.startPrice) : '분양가 미정'}
          </Typography>
        </div>
        <div>
          <Typography variant="caption2" sx={{ color: 'var(--semantic-label-assistive)', display: 'block', marginBottom: '2px' }}>
            공급세대
          </Typography>
          <Typography variant="body2" weight="bold" sx={{ color: 'var(--semantic-label-normal)' }}>
            {subscription.supplyUnits ? subscription.supplyUnits.toLocaleString() : '--'}세대
          </Typography>
        </div>
        <div>
          <Typography variant="caption2" sx={{ color: 'var(--semantic-label-assistive)', display: 'block', marginBottom: '2px' }}>
            청약 마감
          </Typography>
          <Typography variant="body2" weight="bold" sx={{ color: 'var(--semantic-label-normal)' }}>
            {subscription.deadline ? subscription.deadline.slice(5).replace('-', '/') : '일정 미정'}
          </Typography>
        </div>
      </div>
    </Box>
  );
});

SubscriptionCard.displayName = 'SubscriptionCard';
export default SubscriptionCard;
