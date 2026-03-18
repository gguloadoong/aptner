import { useNavigate } from 'react-router-dom';
import { FlexBox, Typography } from '@wanteddev/wds';
import { IconLocation, IconCalendar, IconFire } from '@wanteddev/wds-icon';
import type { ComponentType, SVGProps } from 'react';

interface QuickAction {
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  path: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { Icon: IconLocation, label: '지도로 찾기', path: '/map' },
  { Icon: IconCalendar, label: '청약 일정', path: '/subscription' },
  { Icon: IconFire, label: '이번 주 HOT', path: '/hot' },
];

export default function QuickActionTabs() {
  const navigate = useNavigate();

  return (
    <FlexBox
      gap="8px"
      style={{ padding: '0 16px' }}
    >
      {QUICK_ACTIONS.map((action) => (
        <button
          key={action.path}
          onClick={() => navigate(action.path)}
          style={{
            flex: 1,
            height: '72px',
            backgroundColor: 'white',
            border: 'none',
            borderRadius: '12px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            cursor: 'pointer',
            transition: 'transform 100ms ease, box-shadow 100ms ease',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.transform = 'translateY(-1px)';
            el.style.boxShadow = '0 3px 8px rgba(0,0,0,0.12)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.transform = 'translateY(0)';
            el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)';
          }}
          aria-label={action.label}
        >
          <FlexBox flexDirection="column" alignItems="center" justifyContent="center" gap="6px" style={{ height: '100%' }}>
            <action.Icon style={{ width: '28px', height: '28px', color: 'var(--semantic-primary-normal)' }} />
            <Typography
              variant="caption1"
              weight="bold"
              sx={{ color: 'var(--semantic-label-normal)', letterSpacing: '-0.01em' }}
            >
              {action.label}
            </Typography>
          </FlexBox>
        </button>
      ))}
    </FlexBox>
  );
}
