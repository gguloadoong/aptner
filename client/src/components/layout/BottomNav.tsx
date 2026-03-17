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
  IconSearch,
} from '@wanteddev/wds-icon';

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
          icon={<IconSearch />}
        />
      </BottomNavigation>
    </div>
  );
}
