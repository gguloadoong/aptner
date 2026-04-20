import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscriptions } from '../../hooks/useSubscription';
import { Box, FlexBox, Typography, Skeleton } from '@wanteddev/wds';
import { IconChevronRight, IconBell } from '@wanteddev/wds-icon';

const D7_MAX = 7;

export default function TodaySubscriptionBadge() {
  const navigate = useNavigate();

  const { data: subData, isLoading } = useSubscriptions({
    status: 'ongoing',
    sort: 'deadline',
  });

  const todaySub = useMemo(() => {
    const all = subData?.data ?? [];
    return all.find((sub) => sub.dDay >= 0 && sub.dDay <= D7_MAX) ?? null;
  }, [subData]);

  if (isLoading) {
    return (
      <Box sx={{ padding: '0 16px' }}>
        <Skeleton variant="rectangle" width="100%" height="52px" style={{ borderRadius: '12px' }} />
      </Box>
    );
  }

  if (!todaySub) {
    return null;
  }

  return (
    <Box sx={{ padding: '0 16px' }}>
      <button
        onClick={() => navigate('/subscription')}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#EBF1FC',
          border: 'none',
          borderRadius: '12px',
          padding: '12px 16px',
          cursor: 'pointer',
          transition: 'opacity 120ms ease',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
        aria-label={`${todaySub.name} D-${todaySub.dDay} 마감 임박`}
      >
        <FlexBox alignItems="center" gap="6px">
          <IconBell style={{ width: '16px', height: '16px', color: 'var(--semantic-primary-normal)' }} />
          <Typography
            variant="caption1"
            weight="bold"
            sx={{ color: 'var(--semantic-primary-normal)' }}
          >
            D-{todaySub.dDay} 마감 임박
          </Typography>
        </FlexBox>

        <FlexBox alignItems="center" gap="4px">
          <Typography
            variant="caption1"
            sx={{ color: 'var(--semantic-label-normal)' }}
          >
            {todaySub.name}
          </Typography>
          <IconChevronRight style={{ width: '14px', height: '14px', color: 'var(--semantic-label-assistive)' }} />
        </FlexBox>
      </button>
    </Box>
  );
}
