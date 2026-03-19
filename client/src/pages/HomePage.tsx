import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import SearchBar from '../components/ui/SearchBar';
import BomzipLogo from '../components/ui/BomzipLogo';
import { useBookmarkStore } from '../stores/bookmarkStore';
import CompareBar from '../components/apartment/CompareBar';
import {
  IconButton,
  Box,
  FlexBox,
  Typography,
  Skeleton,
} from '@wanteddev/wds';
import { useIsPC } from '../hooks/useBreakpoint';
import { IconSearch, IconArrowRight } from '@wanteddev/wds-icon';
import HotApartmentSection from '../components/home/HotApartmentSection';
import MarketSummaryBanner from '../components/home/MarketSummaryBanner';
import WeeklySubscriptionTimeline from '../components/home/WeeklySubscriptionTimeline';
import RecordHighSection from '../components/home/RecordHighSection';
import RecentTradesSection from '../components/home/RecentTradesSection';
import { useSubscriptions } from '../hooks/useSubscription';
import api from '../services/api';

export default function HomePage() {
  const navigate = useNavigate();
  const isMobile = !useIsPC();
  const bookmarkCount = useBookmarkStore((s) => s.bookmarkCount);

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
            {/* 시장 요약 배너 */}
            <MarketSummaryBanner />

            {/* 이달의 신고가 섹션 */}
            <RecordHighSection />

            {/* 최근 실거래 */}
            <RecentTradesSection />

            {/* 주간 청약 타임라인 */}
            <WeeklySubscriptionTimeline
              subscriptions={allSubscriptions}
              isLoading={timelineLoading}
            />

            {/* HOT 아파트 랭킹 */}
            <Box sx={{ padding: isMobile ? '0 16px' : '0' }}>
              <HotApartmentSection />
            </Box>

            {/* 트렌드 요약 배너 */}
            <Box sx={{ padding: isMobile ? '0 16px' : '0' }}>
              <TrendBanner />
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

// MapBanner — 지도 바로가기 배너
function MapBanner() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/map')}
      style={{
        width: '100%',
        background: 'linear-gradient(135deg, #1B64DA 0%, #2563EB 100%)',
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
            전국 아파트 실거래가를 지도에서 확인
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

// TrendBanner — 서울 부동산 트렌드 요약 카드 (트렌드 탭 인라인 통합)
interface MarketSummary {
  avgPrice: number;
  priceChangeRate: number;
  tradeCount: number;
}

function TrendBanner() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    // MarketSummaryBanner와 동일한 queryKey → 캐시 재활용
    queryKey: ['trends', 'region', '전국', 'monthly'],
    queryFn: () =>
      api
        .get<{ success: boolean; data: MarketSummary }>('/trends/summary')
        .then((res) => res.data.data),
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });

  const rate = data?.priceChangeRate ?? 0;
  const rateText =
    rate === 0
      ? '0.0%'
      : `${rate > 0 ? '+' : ''}${rate.toFixed(1)}%`;
  const rateColor =
    rate > 0
      ? '#FF4B4B'
      : rate < 0
        ? '#3B82F6'
        : 'var(--semantic-label-assistive)';

  return (
    <button
      onClick={() => navigate('/trend')}
      style={{
        width: '100%',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        borderRadius: '16px',
        padding: '20px',
        textAlign: 'left',
        border: 'none',
        cursor: 'pointer',
        transition: 'opacity 150ms ease',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.95'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
      aria-label="서울 부동산 트렌드 상세 보기"
    >
      <FlexBox alignItems="center" justifyContent="space-between" style={{ marginBottom: '14px' }}>
        <Typography variant="body1" weight="bold" sx={{ color: 'white', display: 'block' }}>
          서울 부동산 트렌드
        </Typography>
        <FlexBox alignItems="center" style={{ gap: '4px', color: 'rgba(255,255,255,0.6)' }}>
          <Typography variant="caption1" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            자세히 보기
          </Typography>
          <IconArrowRight style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.6)' }} />
        </FlexBox>
      </FlexBox>

      {isLoading ? (
        <FlexBox style={{ gap: '12px' }}>
          <Skeleton variant="rectangle" width="80px" height="36px" style={{ borderRadius: '8px' }} />
          <Skeleton variant="rectangle" width="60px" height="36px" style={{ borderRadius: '8px' }} />
        </FlexBox>
      ) : (
        <FlexBox alignItems="flex-end" style={{ gap: '20px' }}>
          <div>
            <Typography variant="caption2" sx={{ color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: '2px' }}>
              전국 평균가
            </Typography>
            <Typography
              variant="title3"
              weight="bold"
              sx={{ color: 'white', fontFamily: 'var(--font-jetbrains, monospace)' }}
            >
              {data
                ? data.avgPrice >= 10000
                  ? `${Math.floor(data.avgPrice / 10000)}억`
                  : `${data.avgPrice.toLocaleString()}만`
                : '—'}
            </Typography>
          </div>
          <div>
            <Typography variant="caption2" sx={{ color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: '2px' }}>
              전월 대비
            </Typography>
            <Typography
              variant="title3"
              weight="bold"
              sx={{ color: rateColor, fontFamily: 'var(--font-jetbrains, monospace)' }}
            >
              {rateText}
            </Typography>
          </div>
          <div>
            <Typography variant="caption2" sx={{ color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: '2px' }}>
              이번달 거래
            </Typography>
            <Typography
              variant="title3"
              weight="bold"
              sx={{ color: 'white', fontFamily: 'var(--font-jetbrains, monospace)' }}
            >
              {data ? `${data.tradeCount.toLocaleString()}건` : '—'}
            </Typography>
          </div>
        </FlexBox>
      )}
    </button>
  );
}

// BottomNav — AppLayout으로 이동됨. 하위 호환을 위해 re-export 유지
export { default as BottomNav } from '../components/layout/BottomNav';
