import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHotApartments } from '../hooks/useApartment';
import { useSubscriptions } from '../hooks/useSubscription';
import HeroApartmentCard from '../components/apartment/HeroApartmentCard';
import UrgentSubscriptionCard from '../components/subscription/UrgentSubscriptionCard';
import RegionChip from '../components/home/RegionChip';
import SearchBar from '../components/ui/SearchBar';
import BomzipLogo from '../components/ui/BomzipLogo';
import { formatPriceShort, formatChange, calcDday } from '../utils/formatNumber';
import { MOCK_REGION_TRENDS } from '../mocks/trends.mock';
import HotTag from '../components/apartment/HotTag';
import RankChange from '../components/apartment/RankChange';
import { useBookmarkStore } from '../stores/bookmarkStore';
import CompareBar from '../components/apartment/CompareBar';
import {
  Button,
  TextButton,
  IconButton,
  Box,
  FlexBox,
  Typography,
  Skeleton,
} from '@wanteddev/wds';
import { useIsPC } from '../hooks/useBreakpoint';
import {
  IconChevronRight,
  IconSearch,
} from '@wanteddev/wds-icon';
import type { Apartment } from '../types';

export default function HomePage() {
  const navigate = useNavigate();
  const isMobile = !useIsPC();

  // 찜 개수 (헤더 배지용)
  const bookmarkCount = useBookmarkStore((s) => s.bookmarkCount);

  // 핫 아파트 상위 10개
  const { data: hotApartments = [], isLoading: isAptLoading } = useHotApartments(
    undefined,
    10
  );

  // 진행 중인 청약 (마감임박 필터용)
  const { data: subData, isLoading: isSubLoading } = useSubscriptions({
    status: 'ongoing',
    sort: 'deadline',
  });

  // D-14 이내 청약만 필터링
  const urgentSubscriptions = useMemo(() => {
    const all = subData?.data ?? [];
    return all.filter((sub) => {
      const ddayStr = calcDday(sub.deadline);
      if (ddayStr === '마감') return false;
      const n = ddayStr === 'D-day' ? 0 : parseInt(ddayStr.replace('D-', ''), 10);
      return n <= 14;
    });
  }, [subData]);

  const topApt = hotApartments[0] ?? null;
  const restApts = hotApartments.slice(1, 8);

  return (
    <div style={{ minHeight: '100svh', backgroundColor: 'var(--semantic-background-normal-alternative)' }}>

      {/* 모바일 헤더 — useMediaQuery로 조건부 렌더링 */}
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
            {/* 로고 + 찜 배지 행 */}
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

            {/* 검색바 */}
            <SearchBar placeholder="아파트 단지명 또는 지역 검색" />
          </Box>
        </Box>
      )}

      {/* PC 전용 콘텐츠 헤더 */}
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
      <Box
        as="main"
        sx={{ paddingBottom: isMobile ? '96px' : '40px' }}
      >
        <Box sx={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>

          {/* 모바일 슬로건 */}
          {isMobile && (
            <Typography
              variant="caption1"
              weight="medium"
              sx={{ color: 'var(--semantic-label-assistive)', display: 'block', paddingTop: '16px', paddingBottom: '4px' }}
            >
              봄처럼 따뜻하게, 집처럼 포근하게
            </Typography>
          )}

          {/* 데스크탑 2열 레이아웃 */}
          <div
            style={{
              display: isMobile ? 'block' : 'grid',
              gridTemplateColumns: isMobile ? undefined : '1fr 360px',
              gap: isMobile ? undefined : '40px',
              paddingTop: isMobile ? undefined : '32px',
            }}
          >

            {/* 좌측: HOT 랭킹 */}
            <div>
              <Box as="section" sx={{ paddingTop: isMobile ? '20px' : '0' }}>
                {/* 섹션 헤더 */}
                <FlexBox alignItems="flex-end" justifyContent="space-between" style={{ marginBottom: '16px' }}>
                  <div>
                    <Typography
                      variant={isMobile ? 'title3' : 'title2'}
                      weight="bold"
                      sx={{ color: 'var(--semantic-label-normal)', letterSpacing: '-0.03em', display: 'block' }}
                    >
                      이번 주 HOT
                    </Typography>
                    <Typography
                      variant="caption1"
                      weight="medium"
                      sx={{ color: 'var(--semantic-label-assistive)', marginTop: '2px', display: 'block' }}
                    >
                      조회 · 거래량 기준 주간 랭킹
                    </Typography>
                  </div>
                  <TextButton size="small" color="primary" onClick={() => navigate('/trend')}>
                    전체 보기
                  </TextButton>
                </FlexBox>

                {/* 1위 히어로 카드 */}
                {isAptLoading ? (
                  <HotApartmentSkeleton isHero />
                ) : topApt ? (
                  <HeroApartmentCard apartment={topApt} />
                ) : (
                  <HotApartmentEmpty />
                )}

                {/* 2~8위 컴팩트 리스트 */}
                {!isAptLoading && restApts.length > 0 && (
                  <Box
                    sx={{
                      marginTop: '8px',
                      backgroundColor: 'var(--semantic-background-normal-normal)',
                      borderRadius: '16px',
                      border: '1px solid var(--semantic-line-normal)',
                      overflow: 'hidden',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                    }}
                  >
                    {restApts.map((apt, i) => (
                      <CompactApartmentRow
                        key={apt.id}
                        apartment={apt}
                        rank={i + 2}
                        isLast={i === restApts.length - 1}
                      />
                    ))}
                  </Box>
                )}

                {/* 스켈레톤 리스트 (로딩 중) */}
                {isAptLoading && (
                  <Box
                    sx={{
                      marginTop: '8px',
                      backgroundColor: 'var(--semantic-background-normal-normal)',
                      borderRadius: '16px',
                      border: '1px solid var(--semantic-line-normal)',
                      overflow: 'hidden',
                    }}
                  >
                    {[2, 3, 4, 5, 6].map((rank) => (
                      <FlexBox
                        key={rank}
                        alignItems="center"
                        gap="12px"
                        style={{ padding: '12px 16px', borderBottom: '1px solid var(--semantic-background-normal-alternative)' }}
                      >
                        <Skeleton variant="circle" width="24px" height="24px" />
                        <FlexBox flex="1" justifyContent="space-between" gap="12px">
                          <Skeleton variant="text" width="55%" height="13px" />
                          <Skeleton variant="text" width="18%" height="13px" />
                        </FlexBox>
                      </FlexBox>
                    ))}
                  </Box>
                )}

                {/* TOP 10 전체 보기 버튼 */}
                <Button
                  variant="solid"
                  color="primary"
                  fullWidth
                  onClick={() => navigate('/trend')}
                  style={{ marginTop: '12px' }}
                >
                  TOP 10 전체 보기
                </Button>
              </Box>

              {/* 지도 바로가기 배너 (모바일에서만 이쪽에 위치) */}
              {isMobile && (
                <Box sx={{ marginTop: '20px' }}>
                  <MapBanner />
                </Box>
              )}
            </div>

            {/* 우측: 청약 + 지역 시세 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '24px' : '28px' }}>

              {/* Section 2: 마감 임박 청약 */}
              <Box as="section" sx={{ paddingTop: isMobile ? '20px' : '0' }}>
                <FlexBox alignItems="flex-end" justifyContent="space-between" style={{ marginBottom: '16px' }}>
                  <div>
                    <Typography
                      variant="heading1"
                      weight="bold"
                      sx={{ color: 'var(--semantic-label-normal)', letterSpacing: '-0.02em', display: 'block' }}
                    >
                      마감 임박 청약
                    </Typography>
                    <Typography
                      variant="caption1"
                      sx={{ color: 'var(--semantic-label-assistive)', marginTop: '2px', display: 'block' }}
                    >
                      D-14 이내 마감 예정
                    </Typography>
                  </div>
                  <TextButton size="small" color="primary" onClick={() => navigate('/subscription')}>
                    전체 보기
                  </TextButton>
                </FlexBox>

                {isSubLoading ? (
                  <FlexBox flexDirection="column" gap="8px">
                    {[1, 2, 3].map((i) => (
                      <Box
                        key={i}
                        sx={{
                          height: '68px',
                          backgroundColor: 'var(--semantic-background-normal-normal)',
                          borderRadius: '12px',
                          border: '1px solid var(--semantic-line-normal)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '0 16px',
                        }}
                      >
                        <Skeleton variant="rectangle" width="44px" height="28px" />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <Skeleton variant="text" width="65%" height="13px" />
                          <Skeleton variant="text" width="40%" height="11px" />
                        </div>
                      </Box>
                    ))}
                  </FlexBox>
                ) : urgentSubscriptions.length === 0 ? (
                  <Box
                    sx={{
                      padding: '28px 16px',
                      textAlign: 'center',
                      backgroundColor: 'var(--semantic-background-normal-normal)',
                      borderRadius: '16px',
                      border: '1px solid var(--semantic-line-normal)',
                    }}
                  >
                    <Typography variant="body2" weight="medium" sx={{ color: 'var(--semantic-label-assistive)' }}>
                      현재 마감 임박 청약이 없습니다
                    </Typography>
                    <Box sx={{ marginTop: '12px' }}>
                      <TextButton
                        size="small"
                        color="primary"
                        onClick={() => navigate('/subscription')}
                        trailingContent={<IconChevronRight />}
                      >
                        진행 중 청약 보기
                      </TextButton>
                    </Box>
                  </Box>
                ) : (
                  <FlexBox flexDirection="column" gap="8px">
                    {urgentSubscriptions.slice(0, 4).map((sub) => (
                      <UrgentSubscriptionCard key={sub.id} subscription={sub} />
                    ))}
                  </FlexBox>
                )}
              </Box>

              {/* Section 3: 지역 시세 */}
              <Box as="section">
                <FlexBox alignItems="flex-end" justifyContent="space-between" style={{ marginBottom: '12px' }}>
                  <div>
                    <Typography
                      variant="heading1"
                      weight="bold"
                      sx={{ color: 'var(--semantic-label-normal)', letterSpacing: '-0.02em', display: 'block' }}
                    >
                      지역 시세
                    </Typography>
                    <Typography
                      variant="caption1"
                      sx={{ color: 'var(--semantic-label-assistive)', marginTop: '2px', display: 'block' }}
                    >
                      주간 평균 실거래가
                    </Typography>
                  </div>
                  <TextButton size="small" color="primary" onClick={() => navigate('/trend')}>
                    더보기
                  </TextButton>
                </FlexBox>

                {/* 가로 스크롤 pill 칩 */}
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    flexWrap: isMobile ? undefined : 'wrap',
                  } as React.CSSProperties}
                >
                  {MOCK_REGION_TRENDS.map((trend) => (
                    <RegionChip key={trend.region} trend={trend} />
                  ))}
                </div>
              </Box>

              {/* 지도 바로가기 배너 (데스크탑에서만 우측 하단에 위치) */}
              {!isMobile && (
                <Box as="section">
                  <MapBanner />
                </Box>
              )}
            </div>
          </div>
        </Box>
      </Box>

      {/* 단지 비교 바 — AppLayout의 BottomNav 위에 렌더링되도록 z-index 주의 */}
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

// CompactApartmentRow — 2~8위 컴팩트 행
interface CompactApartmentRowProps {
  apartment: Apartment;
  rank: number;
  isLast: boolean;
}

function CompactApartmentRow({ apartment, rank, isLast }: CompactApartmentRowProps) {
  const navigate = useNavigate();

  const isUp = apartment.priceChangeType === 'up';
  const isDown = apartment.priceChangeType === 'down';
  const priceColor = isUp ? '#FF4B4B' : isDown ? '#3B82F6' : 'var(--semantic-label-assistive)';
  const changeArrow = isUp ? '▲' : isDown ? '▼' : '';

  const hasHotTags = apartment.hotTags && apartment.hotTags.length > 0;

  const renderRankBadge = () => {
    const badgeBase: React.CSSProperties = {
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '11px',
      fontWeight: 900,
      color: 'white',
    };

    if (rank === 2) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: '28px' }}>
          <span style={{ ...badgeBase, backgroundColor: '#C0C0C0', boxShadow: '0 2px 4px rgba(192,192,192,0.5)' }}>2</span>
          <RankChange change={apartment.rankChange} />
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: '28px' }}>
          <span style={{ ...badgeBase, backgroundColor: '#CD7F32', boxShadow: '0 2px 4px rgba(205,127,50,0.5)' }}>3</span>
          <RankChange change={apartment.rankChange} />
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: '28px' }}>
        <span style={{ fontSize: '14px', fontWeight: 900, color: '#C9D1D9', textAlign: 'center', lineHeight: 1.3 }}>{rank}</span>
        <RankChange change={apartment.rankChange} />
      </div>
    );
  };

  return (
    <div
      style={{
        minHeight: '54px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 16px',
        cursor: 'pointer',
        transition: 'background-color 100ms',
        borderBottom: isLast ? 'none' : '1px solid var(--semantic-background-normal-alternative)',
      }}
      onClick={() => navigate(`/apartment/${apartment.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/apartment/${apartment.id}`)}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--semantic-background-normal-alternative)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
    >
      {/* 순위 뱃지 */}
      {renderRankBadge()}

      {/* 단지명 + 위치 + HOT 태그 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          weight="medium"
          sx={{ color: 'var(--semantic-label-normal)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}
        >
          {apartment.name}
        </Typography>
        <Typography
          variant="caption2"
          sx={{ color: 'var(--semantic-label-assistive)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}
        >
          {apartment.district} · {apartment.dong}
        </Typography>
        {hasHotTags && (
          <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
            {apartment.hotTags!.slice(0, 2).map((tag) => (
              <HotTag key={tag} tag={tag} />
            ))}
          </div>
        )}
      </div>

      {/* 가격 + 변동률 */}
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--semantic-label-normal)', fontFamily: 'var(--font-jetbrains, monospace)' }}>
          {formatPriceShort(apartment.recentPrice)}
        </span>
        <Typography
          variant="caption2"
          weight="medium"
          sx={{ color: priceColor, display: 'block', marginTop: '2px' }}
        >
          {changeArrow} {formatChange(apartment.priceChange)}
        </Typography>
      </div>
    </div>
  );
}

// HotApartmentSkeleton
function HotApartmentSkeleton({ isHero = false }: { isHero?: boolean }) {
  if (isHero) {
    return (
      <Box
        sx={{
          backgroundColor: 'var(--semantic-background-normal-normal)',
          borderRadius: '16px',
          padding: '20px',
          borderLeft: '4px solid var(--semantic-line-normal)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        }}
      >
        <FlexBox justifyContent="space-between" alignItems="center">
          <Skeleton variant="rectangle" width="36px" height="20px" />
          <Skeleton variant="text" width="28px" height="16px" />
        </FlexBox>
        <Skeleton variant="text" width="58%" height="24px" style={{ marginTop: '12px' }} />
        <Skeleton variant="text" width="38%" height="14px" style={{ marginTop: '8px' }} />
        <FlexBox alignItems="flex-end" gap="8px" style={{ marginTop: '20px' }}>
          <Skeleton variant="text" width="112px" height="32px" />
          <Skeleton variant="text" width="56px" height="16px" style={{ marginBottom: '4px' }} />
        </FlexBox>
        <Skeleton variant="text" width="80px" height="12px" style={{ marginTop: '8px' }} />
      </Box>
    );
  }
  return (
    <Box sx={{ backgroundColor: 'var(--semantic-background-normal-normal)', borderRadius: '12px', border: '1px solid var(--semantic-line-normal)', padding: '14px 16px', height: '70px' }}>
      <FlexBox alignItems="center" gap="12px">
        <Skeleton variant="circle" width="24px" height="24px" />
        <FlexBox flex="1" alignItems="center" justifyContent="space-between" gap="12px">
          <Skeleton variant="text" width="60%" height="13px" />
          <Skeleton variant="text" width="22%" height="13px" />
        </FlexBox>
      </FlexBox>
    </Box>
  );
}

// HotApartmentEmpty
function HotApartmentEmpty() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        backgroundColor: 'var(--semantic-background-normal-normal)',
        borderRadius: '16px',
        border: '1px solid var(--semantic-line-normal)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '40px 16px',
      }}
    >
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--semantic-line-normal)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
      <Typography variant="body2" weight="bold" sx={{ color: 'var(--semantic-label-assistive)', marginTop: '12px', display: 'block' }}>
        이번 주 핫한 아파트를 불러오는 중
      </Typography>
      <Typography variant="caption1" sx={{ color: 'var(--semantic-label-assistive)', marginTop: '4px', display: 'block' }}>
        잠시 후 다시 확인해 주세요
      </Typography>
      <Box sx={{ marginTop: '16px' }}>
        <Button
          variant="outlined"
          color="primary"
          size="small"
          onClick={() => navigate('/map')}
          trailingContent={<IconChevronRight />}
        >
          지도에서 직접 찾기
        </Button>
      </Box>
    </Box>
  );
}

// BottomNav — AppLayout으로 이동됨. 하위 호환을 위해 re-export 유지
export { default as BottomNav } from '../components/layout/BottomNav';
