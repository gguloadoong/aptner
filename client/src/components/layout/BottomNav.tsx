// 모바일 하단 네비게이션 — AppLayout에서 통합 처리
// SubscriptionPage, TrendPage, HomePage 등에서 개별 import 불필요
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BottomNavigation,
  BottomNavigationItem,
} from '@wanteddev/wds';
import {
  IconHome,
  IconHomeFill,
  IconLocation,
  IconLocationFill,
  IconCalendar,
} from '@wanteddev/wds-icon';

// WDS에 트렌드 전용 아이콘 없어 AppLayout 사이드바와 동일한 인라인 SVG 사용
function TrendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30 }}>
      <BottomNavigation
        value={pathname}
        onValueChange={(value) => navigate(value)}
      >
        <BottomNavigationItem
          value="/"
          label="홈"
          icon={pathname === '/' ? <IconHomeFill /> : <IconHome />}
        />
        <BottomNavigationItem
          value="/map"
          label="지도"
          icon={pathname === '/map' ? <IconLocationFill /> : <IconLocation />}
        />
        <BottomNavigationItem
          value="/subscription"
          label="청약"
          icon={<IconCalendar />}
        />
        <BottomNavigationItem
          value="/trend"
          label="트렌드"
          icon={<TrendIcon />}
        />
      </BottomNavigation>
    </div>
  );
}
