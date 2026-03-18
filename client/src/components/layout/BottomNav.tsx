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
import { useBookmarkStore } from '../../stores/bookmarkStore';

// WDS에 트렌드 전용 아이콘 없어 AppLayout 사이드바와 동일한 인라인 SVG 사용
function TrendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

// 핫 랭킹 아이콘 (불꽃 모양 인라인 SVG)
function HotIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8 6 6 10 8 14c-2-1-3-3-3-5C3 14 5 20 12 22c7-2 9-8 7-13-1 2-3 3-5 2 2-2 2-6-2-9z" />
    </svg>
  );
}

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const hasNew = useBookmarkStore((s) => s.newTrades.length > 0);

  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30 }}>
      <BottomNavigation
        value={pathname}
        onValueChange={(value) => navigate(value)}
      >
        <BottomNavigationItem
          value="/"
          label="홈"
          icon={
            <span style={{ position: 'relative', display: 'inline-flex' }}>
              {pathname === '/' ? <IconHomeFill /> : <IconHome />}
              {hasNew && (
                <span
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: -2,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#FF4B4B',
                    flexShrink: 0,
                  }}
                  aria-label="새 거래 알림"
                />
              )}
            </span>
          }
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
        <BottomNavigationItem
          value="/hot"
          label="핫"
          icon={<HotIcon />}
        />
      </BottomNavigation>
    </div>
  );
}
