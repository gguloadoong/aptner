import React from 'react';
import type { SubscriptionStatus } from '../../types';
import Badge from '../ui/Badge';

interface SubscriptionBadgeProps {
  status: SubscriptionStatus;
}

// 청약 상태 뱃지 컴포넌트
const SubscriptionBadge = React.memo<SubscriptionBadgeProps>(({ status }) => {
  const config = {
    ongoing: { label: '진행중', variant: 'success' as const },
    upcoming: { label: '예정', variant: 'primary' as const },
    closed: { label: '마감', variant: 'neutral' as const },
  };

  const { label, variant } = config[status];

  return <Badge variant={variant}>{label}</Badge>;
});

SubscriptionBadge.displayName = 'SubscriptionBadge';
export default SubscriptionBadge;
