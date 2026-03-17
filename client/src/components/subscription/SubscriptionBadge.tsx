import React from 'react';
import type { SubscriptionStatus } from '../../types';
import { ContentBadge, type ThemeColorsToken } from '@wanteddev/wds';

interface SubscriptionBadgeProps {
  status: SubscriptionStatus;
}

// ContentBadge color: "accent" | "neutral"
// accentColor로 봄집 브랜드 색상 토큰 오버라이드
const STATUS_CONFIG: Record<SubscriptionStatus, {
  label: string;
  color: 'accent' | 'neutral';
  accentColor?: ThemeColorsToken;
}> = {
  // ongoing(진행중): 초록 계열 - WDS semantic.primary.normal 토큰 사용
  ongoing: {
    label: '진행중',
    color: 'accent',
    accentColor: 'semantic.primary.normal',
  },
  // upcoming(예정): 기본 accent(cyan)
  upcoming: {
    label: '예정',
    color: 'accent',
  },
  // closed(마감): neutral
  closed: {
    label: '마감',
    color: 'neutral',
  },
};

// 청약 상태 뱃지 컴포넌트 - WDS ContentBadge 사용
const SubscriptionBadge = React.memo<SubscriptionBadgeProps>(({ status }) => {
  const { label, color, accentColor } = STATUS_CONFIG[status];

  return (
    <ContentBadge
      variant="solid"
      size="xsmall"
      color={color}
      accentColor={accentColor}
    >
      {label}
    </ContentBadge>
  );
});

SubscriptionBadge.displayName = 'SubscriptionBadge';
export default SubscriptionBadge;
