import { useNavigate } from 'react-router-dom';
import { FlexBox, Typography } from '@wanteddev/wds';

interface QuickAction {
  icon: string;
  label: string;
  path: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { icon: '🗺', label: '지도로 찾기', path: '/map' },
  { icon: '📋', label: '청약 일정', path: '/subscription' },
  { icon: '🔥', label: '이번 주 HOT', path: '/hot' },
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
            <Typography variant="body1" sx={{ fontSize: '32px', lineHeight: 1 }}>
              {action.icon}
            </Typography>
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
