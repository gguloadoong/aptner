import { useNavigate, useLocation } from 'react-router-dom';
import BomzipLogo from '../ui/BomzipLogo';
import {
  IconHome,
  IconHomeFill,
  IconLocation,
  IconLocationFill,
  IconCalendar,
  IconSearch,
} from '@wanteddev/wds-icon';
import type { ReactNode } from 'react';

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

  return (
    <div className="flex min-h-screen">
      {/* PC 사이드바 — lg 브레이크포인트에서만 표시 */}
      <aside
        className="hidden lg:flex flex-col w-[220px] h-screen sticky top-0 bg-white border-r border-[#E5E8EB] z-20 flex-shrink-0"
        style={{ boxShadow: '2px 0 8px rgba(0,0,0,0.05)' }}
      >
        {/* 봄집 로고 */}
        <div
          className="flex items-center gap-2 px-5 py-5 cursor-pointer hover:opacity-80 transition-opacity duration-150"
          onClick={() => navigate('/')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/')}
          aria-label="홈으로 이동"
        >
          <BomzipLogo size="md" showText={true} />
        </div>

        {/* 구분선 */}
        <div className="h-px bg-[#E5E8EB] mx-4" />

        {/* 네비 아이템 */}
        <nav className="flex flex-col gap-0.5 px-3 py-4 flex-1">
          {NAV_ITEMS.map(({ label, path, icon, exact }) => {
            const isActive = exact ? pathname === path : pathname.startsWith(path);
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={[
                  'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[14px] font-medium',
                  'transition-all duration-150 text-left',
                  'hover:translate-x-0.5',
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-[#4E5968] hover:bg-gray-50 hover:text-blue-600',
                ].join(' ')}
              >
                {/* 아이콘 */}
                <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                  {icon(isActive)}
                </span>
                {label}
              </button>
            );
          })}
        </nav>

        {/* 하단: 검색 버튼 + 데이터 출처 */}
        <div className="px-3 pb-5">
          <div className="h-px bg-[#E5E8EB] mb-3" />
          <button
            onClick={() => navigate('/search')}
            className={[
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[14px] font-medium',
              'transition-all duration-150 hover:translate-x-0.5',
              pathname === '/search'
                ? 'bg-blue-50 text-blue-600 font-semibold'
                : 'text-[#4E5968] hover:bg-gray-50 hover:text-blue-600',
            ].join(' ')}
          >
            <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
              <IconSearch />
            </span>
            검색
          </button>

          {/* 데이터 출처 표시 */}
          <p className="text-[11px] text-[#8B95A1] mt-4 px-1 leading-relaxed">
            데이터 출처: 국토교통부
          </p>
        </div>
      </aside>

      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
