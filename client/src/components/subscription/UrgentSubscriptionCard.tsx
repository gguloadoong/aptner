import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Subscription } from '../../types';
import { formatPrice } from '../../utils/formatNumber';
import { Box, FlexBox, Typography } from '@wanteddev/wds';
import DdayBadge from './DdayBadge';

interface UrgentSubscriptionCardProps {
  subscription: Subscription;
}

// D-day 강화 컴팩트 청약 카드 (세로 스택용)
const UrgentSubscriptionCard = React.memo<UrgentSubscriptionCardProps>(
  ({ subscription }) => {
    const navigate = useNavigate();

    const dDay = subscription.dDay;
    const isUrgent = dDay >= 0 && dDay <= 3;

    const handleMapLinkClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      const searchQuery = encodeURIComponent(`${subscription.name} ${subscription.location}`);
      navigate(`/map?search=${searchQuery}`);
    };

    return (
      <Box
        sx={{
          minHeight: '72px',
          borderRadius: '12px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          padding: '12px 16px',
          cursor: 'pointer',
          transition: 'transform 150ms ease',
          background: isUrgent
            ? 'linear-gradient(135deg, #FFF8F8 0%, var(--semantic-background-normal-normal) 100%)'
            : 'var(--semantic-background-normal-normal)',
          borderLeft: isUrgent ? '3px solid #FF4B4B' : 'none',
          border: isUrgent ? undefined : '1px solid var(--semantic-line-normal)',
        }}
        onClick={() => navigate(`/subscription/${subscription.id}`)}
        role="button"
        tabIndex={0}
        onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && navigate(`/subscription/${subscription.id}`)}
      >
        {/* 상단 행: D-day + 단지명 + 가격 */}
        <FlexBox alignItems="center" gap="12px">
          {/* D-day 배지 */}
          <div style={{ flexShrink: 0, width: '48px', display: 'flex', justifyContent: 'center' }}>
            <DdayBadge dDay={dDay} />
          </div>

          {/* 단지명 + 위치·유형 */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body1"
              weight="medium"
              sx={{ color: 'var(--semantic-label-normal)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}
            >
              {subscription.name}
            </Typography>
            <Typography
              variant="caption1"
              sx={{ color: 'var(--semantic-label-assistive)', display: 'block', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {subscription.location}
            </Typography>
          </Box>

          {/* 분양가 + 공급세대 */}
          <Box sx={{ flexShrink: 0, textAlign: 'right' }}>
            <Typography
              variant="body1"
              weight="bold"
              sx={{ color: 'var(--semantic-primary-normal)', fontFamily: 'var(--font-jetbrains, monospace)' }}
            >
              {subscription.supplyPrice != null ? formatPrice(subscription.supplyPrice) : '분양가 미정'}
            </Typography>
            <Typography
              variant="caption1"
              sx={{ color: 'var(--semantic-label-assistive)', display: 'block', marginTop: '2px' }}
            >
              {subscription.totalUnits ? subscription.totalUnits.toLocaleString() : '--'}세대
            </Typography>
          </Box>
        </FlexBox>

        {/* 하단 행: 주변 시세 보기 CTA */}
        <FlexBox justifyContent="flex-end" style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--semantic-background-normal-alternative)' }}>
          <button
            style={{
              fontSize: '12px',
              color: 'var(--semantic-primary-normal)',
              fontWeight: 500,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
            onClick={handleMapLinkClick}
          >
            주변 시세 보기 →
          </button>
        </FlexBox>
      </Box>
    );
  }
);

UrgentSubscriptionCard.displayName = 'UrgentSubscriptionCard';
export default UrgentSubscriptionCard;
