import { useNavigate, useLocation } from 'react-router-dom';
import BomzipLogo from '../ui/BomzipLogo';
import BottomNav from './BottomNav';
import { FlexBox, Box, Typography, Divider } from '@wanteddev/wds';
import { useIsPC } from '../../hooks/useBreakpoint';
import {
  IconHome,
  IconHomeFill,
  IconLocation,
  IconLocationFill,
  IconCalendar,
  IconSearch,
} from '@wanteddev/wds-icon';
import type { ReactNode } from 'react';

// BottomNav 표시 대상 경로 (지도 페이지는 전체화면 레이아웃이므로 자체 처리)
const BOTTOM_NAV_PATHS = ['/', '/map', '/subscription', '/trend'];

// PC 사이드바 네비 아이템 정의
const NAV_ITEMS = [
  {
    label: '홈',
    path: '/',
    icon: (isActive: boolean) => (isActive ? <IconHomeFill /> : <IconHome />),
    exact: true,
  },
  {
    label: '지도',
    path: '/map',
    icon: (isActive: boolean) => (isActive ? <IconLocationFill /> : <IconLocation />),
    exact: false,
  },
  {
    label: '청약',
    path: '/subscription',
    icon: () => <IconCalendar />,
    exact: false,
  },
  {
    label: '트렌드',
    path: '/trend',
    icon: () => (
      // WDS에 트렌드 전용 아이콘 없어 인라인 SVG 사용
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    exact: false,
  },
];

interface AppLayoutProps {
  children: ReactNode;
}

// AppLayout — PC: 좌측 사이드바(220px) + 우측 콘텐츠 / 모바일: 사이드바 숨김
export default function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isPC = useIsPC();

  return (
    <FlexBox style={{ minHeight: '100svh' }}>
      {/* PC 사이드바 — lg 브레이크포인트에서만 표시 */}
      {isPC && (
        <Box
          as="aside"
          sx={{
            width: '220px',
            height: '100vh',
            position: 'sticky',
            top: 0,
            backgroundColor: 'var(--semantic-background-normal-normal)',
            borderRight: '1px solid var(--semantic-line-normal)',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            boxShadow: '2px 0 8px rgba(0,0,0,0.05)',
            zIndex: 20,
          }}
        >
          {/* 봄집 로고 */}
          <Box
            sx={{ padding: '20px', cursor: 'pointer' }}
            role="button"
            tabIndex={0}
            onClick={() => navigate('/')}
            onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && navigate('/')}
            aria-label="홈으로 이동"
          >
            <BomzipLogo size="md" showText={true} />
          </Box>

          {/* 구분선 */}
          <Box sx={{ paddingLeft: '16px', paddingRight: '16px' }}>
            <Divider />
          </Box>

          {/* 네비 아이템 */}
          <Box
            as="nav"
            sx={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}
          >
            {NAV_ITEMS.map(({ label, path, icon, exact }) => {
              const isActive = exact ? pathname === path : pathname.startsWith(path);
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: isActive ? 600 : 500,
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 150ms ease, color 150ms ease',
                    backgroundColor: isActive ? 'rgba(0,102,255,0.08)' : 'transparent',
                    color: isActive
                      ? 'var(--semantic-primary-normal)'
                      : 'var(--semantic-label-alternative)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--semantic-background-normal-alternative)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {/* 아이콘 */}
                  <span style={{ flexShrink: 0, width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {icon(isActive)}
                  </span>
                  {label}
                </button>
              );
            })}
          </Box>

          {/* 하단: 검색 버튼 + 데이터 출처 */}
          <Box sx={{ padding: '0 12px 20px 12px' }}>
            <Divider />
            <Box sx={{ marginTop: '12px' }}>
              <button
                onClick={() => navigate('/search')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: pathname === '/search' ? 600 : 500,
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 150ms ease, color 150ms ease',
                  backgroundColor: pathname === '/search' ? 'rgba(0,102,255,0.08)' : 'transparent',
                  color: pathname === '/search'
                    ? 'var(--semantic-primary-normal)'
                    : 'var(--semantic-label-alternative)',
                }}
                onMouseEnter={(e) => {
                  if (pathname !== '/search') {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--semantic-background-normal-alternative)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (pathname !== '/search') {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span style={{ flexShrink: 0, width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconSearch />
                </span>
                검색
              </button>
            </Box>

            {/* 데이터 출처 표시 */}
            <Typography
              variant="caption2"
              sx={{ color: 'var(--semantic-label-assistive)', marginTop: '16px', paddingLeft: '4px', lineHeight: 1.6 }}
            >
              데이터 출처: 국토교통부
            </Typography>
          </Box>
        </Box>
      )}

      {/* 메인 콘텐츠 영역 */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {children}
      </Box>

      {/* 모바일 하단 네비게이션 — 지도 페이지 제외한 BottomNav 대상 경로에서만 표시 */}
      {!isPC && pathname !== '/map' && BOTTOM_NAV_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/')) && (
        <BottomNav />
      )}
    </FlexBox>
  );
}
