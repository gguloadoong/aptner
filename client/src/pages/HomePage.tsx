import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/ui/SearchBar';
import BomzipLogo from '../components/ui/BomzipLogo';
import { useBookmarkStore } from '../stores/bookmarkStore';
import CompareBar from '../components/apartment/CompareBar';
import {
  IconButton,
  Box,
  FlexBox,
  Typography,
} from '@wanteddev/wds';
import { useIsPC } from '../hooks/useBreakpoint';
import { IconSearch } from '@wanteddev/wds-icon';
import QuickActionTabs from '../components/home/QuickActionTabs';
import TodaySubscriptionBadge from '../components/home/TodaySubscriptionBadge';
import HotApartmentSection from '../components/home/HotApartmentSection';
import WeeklySubscriptionTimeline from '../components/home/WeeklySubscriptionTimeline';
import RecordHighSection from '../components/home/RecordHighSection';
import { useSubscriptions } from '../hooks/useSubscription';
import type { NewTradeItem } from '../stores/bookmarkStore';

export default function HomePage() {
  const navigate = useNavigate();
  const isMobile = !useIsPC();
  const bookmarkCount = useBookmarkStore((s) => s.bookmarkCount);
  const updateLastCheckedPrice = useBookmarkStore((s) => s.updateLastCheckedPrice);
  const newTrades = useBookmarkStore((s) => s.newTrades);

  // 타임라인용 청약 데이터 (ongoing + upcoming 병합)
  const { data: ongoingData, isLoading: ongoingLoading } = useSubscriptions({
    status: 'ongoing',
    sort: 'deadline',
  });
  const { data: upcomingData, isLoading: upcomingLoading } = useSubscriptions({
    status: 'upcoming',
    sort: 'deadline',
  });

  const allSubscriptions = useMemo(() => {
    return [
      ...(ongoingData?.data ?? []),
      ...(upcomingData?.data ?? []),
    ];
  }, [ongoingData, upcomingData]);

  const timelineLoading = ongoingLoading || upcomingLoading;

  return (
    <div style={{ minHeight: '100svh', backgroundColor: 'var(--semantic-background-normal-alternative)' }}>

      {/* 모바일 헤더 */}
      {isMobile && (
        <Box
          sx={{
            backgroundColor: 'var(--semantic-background-normal-normal)',
            position: 'sticky',
            top: 0,
            zIndex: 30,
            borderBottom: '1px solid var(--semantic-line-normal)',
            boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
          }}
        >
          <Box sx={{ padding: '16px 20px 12px 20px' }}>
            <FlexBox alignItems="center" justifyContent="space-between" style={{ marginBottom: '12px' }}>
              <BomzipLogo size="md" showText={true} />
              <FlexBox alignItems="center" gap="6px">
                {bookmarkCount > 0 && (
                  <button
                    onClick={() => navigate('/bookmarks')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      backgroundColor: '#FFF3F3',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    aria-label="찜 목록"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="#FF4B4B" stroke="none">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#FF4B4B' }}>{bookmarkCount}</span>
                  </button>
                )}
                <IconButton
                  variant="normal"
                  onClick={() => navigate('/search')}
                  aria-label="검색"
                >
                  <IconSearch />
                </IconButton>
              </FlexBox>
            </FlexBox>
            <SearchBar placeholder="아파트 단지명 또는 지역 검색" />
          </Box>
        </Box>
      )}

      {/* PC 헤더 */}
      {!isMobile && (
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 20,
            backgroundColor: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid var(--semantic-line-normal)',
          }}
        >
          <Box sx={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 32px' }}>
            <SearchBar placeholder="아파트 단지명 또는 지역 검색" />
          </Box>
        </Box>
      )}

      {/* 메인 콘텐츠 */}
      <Box as="main" sx={{ paddingBottom: isMobile ? '96px' : '40px' }}>
        <Box sx={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* 모바일 슬로건 */}
          {isMobile && (
            <Typography
              variant="caption1"
              weight="medium"
              sx={{
                color: 'var(--semantic-label-assistive)',
                display: 'block',
                padding: '16px 20px 4px 20px',
              }}
            >
              봄처럼 따뜻하게, 집처럼 포근하게
            </Typography>
          )}

          {/* 단일 컬럼 레이아웃 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: isMobile ? '16px' : '20px',
              padding: isMobile ? '12px 0 0 0' : '32px 20px 0 20px',
            }}
          >
            {/* 관심 단지 업데이트 카드 */}
            {newTrades.length > 0 && (
              <BookmarkUpdateSection
                trades={newTrades}
                onTradeRead={updateLastCheckedPrice}
                isMobile={isMobile}
              />
            )}

            {/* 퀵 액션 탭 */}
            <QuickActionTabs />

            {/* 오늘의 청약 배지 (D-7 이내) */}
            <TodaySubscriptionBadge />

            {/* 주간 청약 타임라인 */}
            <WeeklySubscriptionTimeline
              subscriptions={allSubscriptions}
              isLoading={timelineLoading}
            />

            {/* 이달의 신고가 섹션 */}
            <RecordHighSection />

            {/* HOT 아파트 랭킹 */}
            <Box sx={{ padding: isMobile ? '0 16px' : '0' }}>
              <HotApartmentSection />
            </Box>

            {/* 지도 바로가기 배너 */}
            <Box sx={{ padding: isMobile ? '0 16px' : '0' }}>
              <MapBanner />
            </Box>
          </div>
        </Box>
      </Box>

      {/* 단지 비교 바 */}
      <CompareBar />
    </div>
  );
}

// BookmarkUpdateSection — 관심 단지 신규 거래 알림 카드
function BookmarkUpdateSection({
  trades,
  onTradeRead,
  isMobile,
}: {
  trades: NewTradeItem[];
  onTradeRead: (id: string, price: number) => void;
  isMobile: boolean;
}) {
  return (
    <Box sx={{ padding: isMobile ? '0 16px' : '0' }}>
      <FlexBox alignItems="center" gap="6px" style={{ marginBottom: '10px' }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: '#FF4B4B',
            flexShrink: 0,
            display: 'inline-block',
          }}
        />
        <Typography variant="body2" weight="bold" sx={{ color: 'var(--semantic-label-normal)' }}>
          내 관심 단지 업데이트
        </Typography>
      </FlexBox>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {trades.map((trade) => {
          const changeAmt = trade.newPrice - trade.oldPrice;
          const changeRate = trade.oldPrice > 0
            ? ((changeAmt / trade.oldPrice) * 100).toFixed(1)
            : '0.0';
          const isUp = changeAmt > 0;
          const changeColor = isUp ? '#FF4B4B' : '#3B82F6';
          const changeSign = isUp ? '+' : '';

          return (
            <button
              key={trade.id}
              onClick={() => onTradeRead(trade.id, trade.newPrice)}
              style={{
                width: '100%',
                backgroundColor: 'var(--semantic-background-normal-normal)',
                border: '1px solid var(--semantic-line-normal)',
                borderRadius: '12px',
                padding: '14px 16px',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <Typography
                  variant="body2"
                  weight="bold"
                  sx={{
                    color: 'var(--semantic-label-normal)',
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {trade.name}
                </Typography>
                <Typography
                  variant="caption1"
                  sx={{ color: 'var(--semantic-label-alternative)', display: 'block', marginTop: '2px' }}
                >
                  {(trade.oldPrice / 10000).toFixed(1)}억 → {(trade.newPrice / 10000).toFixed(1)}억
                </Typography>
              </div>
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                <Typography
                  variant="body2"
                  weight="bold"
                  sx={{ color: changeColor, display: 'block' }}
                >
                  {changeSign}{(changeAmt / 10000).toFixed(1)}억
                </Typography>
                <Typography
                  variant="caption1"
                  sx={{ color: changeColor, display: 'block' }}
                >
                  {changeSign}{changeRate}%
                </Typography>
              </div>
            </button>
          );
        })}
      </div>
    </Box>
  );
}

// MapBanner — 지도 바로가기 배너
function MapBanner() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/map')}
      style={{
        width: '100%',
        background: 'linear-gradient(135deg, #0066FF 0%, #3B82F6 100%)',
        borderRadius: '16px',
        padding: '20px',
        textAlign: 'left',
        border: 'none',
        cursor: 'pointer',
        transition: 'opacity 150ms ease',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.95'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
    >
      <FlexBox alignItems="center" justifyContent="space-between">
        <div>
          <Typography variant="body1" weight="bold" sx={{ color: 'white', display: 'block', lineHeight: 1.3 }}>
            지도로 아파트 찾기
          </Typography>
          <Typography variant="caption1" sx={{ color: 'rgba(255,255,255,0.75)', display: 'block', marginTop: '4px' }}>
            서울 주요 아파트 실거래가를 지도에서 확인
          </Typography>
        </div>
        <div
          style={{
            width: '40px',
            height: '40px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginLeft: '12px',
          }}
        >
          <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      </FlexBox>
    </button>
  );
}

// BottomNav — AppLayout으로 이동됨. 하위 호환을 위해 re-export 유지
export { default as BottomNav } from '../components/layout/BottomNav';
