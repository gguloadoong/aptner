import { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  BottomNavigation,
  BottomNavigationItem,
  Button,
  TextButton,
  IconButton,
} from '@wanteddev/wds';
import {
  IconHome,
  IconHomeFill,
  IconLocation,
  IconLocationFill,
  IconCalendar,
  IconChevronRight,
  IconSearch,
} from '@wanteddev/wds-icon';
import type { Apartment } from '../types';

// ─────────────────────────────────────────────────────────
// 홈 페이지 — 상업용 수준 UI 개편
// 토스증권/호갱노노 스타일 미니멀리즘 적용
// ─────────────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate();

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

  // 1위 히어로 / 2~10위 컴팩트
  const topApt = hotApartments[0] ?? null;
  const restApts = hotApartments.slice(1, 8);

  return (
    <div className="min-h-screen bg-[#F7FAF8]">
      {/* ───────── 모바일 헤더 (lg에서 사이드바가 대체) — div로 래핑해야 WDS header CSS 충돌 방지 ───────── */}
      <div className="lg:hidden">
        <div className="bg-white sticky top-0 z-30 border-b border-[#E5E8EB] shadow-[0_1px_6px_rgba(0,0,0,0.05)]">
          <div className="px-5 pt-4 pb-3">
            {/* 로고 + 찜 배지 행 */}
            <div className="flex items-center justify-between mb-3">
              <BomzipLogo size="md" showText={true} />
              <div className="flex items-center gap-1.5">
                {bookmarkCount > 0 && (
                  <button
                    onClick={() => navigate('/bookmarks')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FFF3F3] transition-colors"
                    aria-label="찜 목록"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="#FF4B4B" stroke="none">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    <span className="text-[12px] font-bold text-[#FF4B4B]">{bookmarkCount}</span>
                  </button>
                )}
                <IconButton
                  variant="normal"
                  onClick={() => navigate('/search')}
                  aria-label="검색"
                >
                  <IconSearch />
                </IconButton>
              </div>
            </div>

            {/* 검색바 */}
            <SearchBar placeholder="아파트 단지명 또는 지역 검색" />
          </div>
        </div>
      </div>

      {/* ───────── PC 전용 콘텐츠 헤더 (lg에서만 표시) ───────── */}
      <div className="hidden lg:block sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-[#E5E8EB]">
        <div className="max-w-[1200px] mx-auto px-8 py-4">
          <SearchBar placeholder="아파트 단지명 또는 지역 검색" />
        </div>
      </div>

      {/* ───────── 메인 콘텐츠 ───────── */}
      <main className="pb-24 lg:pb-10">
        <div className="max-w-[1200px] mx-auto px-5 md:px-6 lg:px-8">

          {/* 모바일 슬로건 */}
          <p className="lg:hidden text-[12px] text-[#8B95A1] font-medium pt-4 pb-1">
            봄처럼 따뜻하게, 집처럼 포근하게
          </p>

          {/* ─── 데스크탑 2열 레이아웃 ─── */}
          <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-10 lg:pt-8">

            {/* ── 좌측: HOT 랭킹 ── */}
            <div>
              <section className="pt-5 lg:pt-0">
                {/* 섹션 헤더 */}
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <h2 className="text-[20px] lg:text-[22px] font-black tracking-[-0.03em] text-[#191F28]">
                      이번 주 HOT
                    </h2>
                    <p className="text-[12px] text-[#8B95A1] mt-0.5 font-medium">
                      조회 · 거래량 기준 주간 랭킹
                    </p>
                  </div>
                  <TextButton
                    size="small"
                    color="primary"
                    onClick={() => navigate('/trend')}
                  >
                    전체 보기
                  </TextButton>
                </div>

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
                  <div className="mt-2 bg-white rounded-2xl border border-[#E5E8EB] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                    {restApts.map((apt, i) => (
                      <CompactApartmentRow
                        key={apt.id}
                        apartment={apt}
                        rank={i + 2}
                        isLast={i === restApts.length - 1}
                      />
                    ))}
                  </div>
                )}

                {/* 스켈레톤 리스트 (로딩 중) */}
                {isAptLoading && (
                  <div className="mt-2 bg-white rounded-2xl border border-[#E5E8EB] overflow-hidden">
                    {[2, 3, 4, 5, 6].map((rank) => (
                      <div
                        key={rank}
                        className="h-14 border-b border-[#F2F4F6] last:border-0 flex items-center gap-3 px-4"
                      >
                        <div className="skeleton-shimmer w-6 h-6 rounded-full flex-shrink-0" />
                        <div className="flex-1 flex justify-between gap-3">
                          <div className="skeleton-shimmer rounded h-[13px] w-[55%]" />
                          <div className="skeleton-shimmer rounded h-[13px] w-[18%]" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TOP 10 전체 보기 버튼 */}
                <Button
                  variant="solid"
                  color="primary"
                  fullWidth
                  onClick={() => navigate('/trend')}
                  className="mt-3"
                >
                  TOP 10 전체 보기
                </Button>
              </section>

              {/* 지도 바로가기 배너 (모바일에서만 이쪽에 위치) */}
              <div className="mt-5 lg:hidden">
                <MapBanner />
              </div>
            </div>

            {/* ── 우측: 청약 + 지역 시세 ── */}
            <div className="space-y-6 lg:space-y-7">

              {/* Section 2: 마감 임박 청약 */}
              <section className="pt-5 lg:pt-0">
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <h2 className="text-[17px] font-bold tracking-[-0.02em] text-[#191F28]">
                      마감 임박 청약
                    </h2>
                    <p className="text-[12px] text-[#8B95A1] mt-0.5">D-14 이내 마감 예정</p>
                  </div>
                  <TextButton
                    size="small"
                    color="primary"
                    onClick={() => navigate('/subscription')}
                  >
                    전체 보기
                  </TextButton>
                </div>

                {isSubLoading ? (
                  /* 로딩 스켈레톤 */
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-[68px] bg-white rounded-xl border border-[#E5E8EB] flex items-center gap-3 px-4"
                      >
                        <div className="skeleton-shimmer w-11 h-7 rounded-lg flex-shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <div className="skeleton-shimmer rounded h-[13px] w-[65%]" />
                          <div className="skeleton-shimmer rounded h-[11px] w-[40%]" />
                        </div>
                        <div className="flex-shrink-0 space-y-1.5 items-end flex flex-col">
                          <div className="skeleton-shimmer rounded h-[13px] w-[52px]" />
                          <div className="skeleton-shimmer rounded h-[11px] w-[38px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : urgentSubscriptions.length === 0 ? (
                  /* 빈 상태 */
                  <div className="py-7 text-center bg-white rounded-2xl border border-[#E5E8EB]">
                    <p className="text-[13px] font-semibold text-[#8B95A1]">
                      현재 마감 임박 청약이 없습니다
                    </p>
                    <TextButton
                      size="small"
                      color="primary"
                      onClick={() => navigate('/subscription')}
                      trailingContent={<IconChevronRight />}
                      className="mt-3"
                    >
                      진행 중 청약 보기
                    </TextButton>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {urgentSubscriptions.slice(0, 4).map((sub) => (
                      <UrgentSubscriptionCard key={sub.id} subscription={sub} />
                    ))}
                  </div>
                )}
              </section>

              {/* Section 3: 지역 시세 */}
              <section>
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <h2 className="text-[17px] font-bold tracking-[-0.02em] text-[#191F28]">
                      지역 시세
                    </h2>
                    <p className="text-[12px] text-[#8B95A1] mt-0.5">주간 평균 실거래가</p>
                  </div>
                  <TextButton
                    size="small"
                    color="primary"
                    onClick={() => navigate('/trend')}
                  >
                    더보기
                  </TextButton>
                </div>

                {/* 가로 스크롤 pill 칩 */}
                <div
                  className={[
                    'flex gap-2 overflow-x-auto -mx-5 px-5 lg:mx-0 lg:px-0',
                    'lg:flex-wrap',
                    '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
                  ].join(' ')}
                >
                  {MOCK_REGION_TRENDS.map((trend) => (
                    <RegionChip key={trend.region} trend={trend} />
                  ))}
                </div>
              </section>

              {/* 지도 바로가기 배너 (데스크탑에서만 우측 하단에 위치) */}
              <section className="hidden lg:block">
                <MapBanner />
              </section>
            </div>
          </div>
        </div>
      </main>

      {/* 모바일 하단 내비게이션 — lg 이상은 사이드바가 대체 */}
      <div className="lg:hidden">
        <BottomNav />
      </div>

      {/* 단지 비교 바 — 선택 0개면 자동 숨김 */}
      <CompareBar />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// MapBanner — 지도 바로가기 배너
// ─────────────────────────────────────────────────────────
function MapBanner() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/map')}
      className="w-full bg-gradient-to-r from-[#0066FF] to-[#3B82F6] rounded-2xl p-5 text-left hover:opacity-95 active:scale-[0.99] transition-all duration-150"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[16px] font-black text-white leading-tight">
            지도로 아파트 찾기
          </h3>
          <p className="text-[12px] text-white/75 mt-1">
            서울 주요 아파트 실거래가를 지도에서 확인
          </p>
        </div>
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 ml-3">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────
// CompactApartmentRow — 2~8위 컴팩트 행
// ─────────────────────────────────────────────────────────
interface CompactApartmentRowProps {
  apartment: Apartment;
  rank: number;
  isLast: boolean;
}

function CompactApartmentRow({ apartment, rank, isLast }: CompactApartmentRowProps) {
  const navigate = useNavigate();

  const isUp = apartment.priceChangeType === 'up';
  const isDown = apartment.priceChangeType === 'down';
  const priceColor = isUp ? 'text-[#FF4B4B]' : isDown ? 'text-[#3B82F6]' : 'text-[#8B95A1]';
  const changeArrow = isUp ? '▲' : isDown ? '▼' : '';

  const hasHotTags = apartment.hotTags && apartment.hotTags.length > 0;

  // 순위 번호 스타일 결정
  const renderRankBadge = () => {
    if (rank === 2) {
      return (
        <div className="flex flex-col items-center flex-shrink-0 w-7">
          <span className="w-6 h-6 rounded-full bg-[#C0C0C0] text-white text-[11px] font-black flex items-center justify-center shadow-[0_2px_4px_rgba(192,192,192,0.5)]">
            2
          </span>
          <RankChange change={apartment.rankChange} />
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="flex flex-col items-center flex-shrink-0 w-7">
          <span className="w-6 h-6 rounded-full bg-[#CD7F32] text-white text-[11px] font-black flex items-center justify-center shadow-[0_2px_4px_rgba(205,127,50,0.5)]">
            3
          </span>
          <RankChange change={apartment.rankChange} />
        </div>
      );
    }
    // 4~8위: 일반 숫자 텍스트
    return (
      <div className="flex flex-col items-center flex-shrink-0 w-7">
        <span className="text-[14px] font-black text-[#C9D1D9] text-center leading-tight">
          {rank}
        </span>
        <RankChange change={apartment.rankChange} />
      </div>
    );
  };

  return (
    <div
      className={[
        'min-h-[54px] flex items-center gap-3 px-4 py-2.5 cursor-pointer',
        'transition-colors duration-100 hover:bg-[#F7FAF8] active:bg-blue-50',
        isLast ? '' : 'border-b border-[#F5F6F8]',
      ].join(' ')}
      onClick={() => navigate(`/apartment/${apartment.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/apartment/${apartment.id}`)}
    >
      {/* 순위 뱃지 */}
      {renderRankBadge()}

      {/* 단지명 + 위치 + HOT 태그 */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-[#191F28] truncate leading-tight">
          {apartment.name}
        </p>
        <p className="text-[11px] text-[#8B95A1] truncate mt-0.5">
          {apartment.district} · {apartment.dong}
        </p>
        {/* HOT 이유 태그 (최대 2개) */}
        {hasHotTags && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {apartment.hotTags!.slice(0, 2).map((tag) => (
              <HotTag key={tag} tag={tag} />
            ))}
          </div>
        )}
      </div>

      {/* 가격 + 변동률 */}
      <div className="flex-shrink-0 text-right">
        <p className="text-[14px] font-bold text-[#191F28]"
          style={{ fontFamily: 'var(--font-jetbrains, monospace)' }}>
          {formatPriceShort(apartment.recentPrice)}
        </p>
        <p className={`text-[11px] font-semibold ${priceColor} mt-0.5`}>
          {changeArrow} {formatChange(apartment.priceChange)}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// HotApartmentSkeleton — 히어로 or 컴팩트 로딩 shimmer
// ─────────────────────────────────────────────────────────
function HotApartmentSkeleton({ isHero = false }: { isHero?: boolean }) {
  if (isHero) {
    return (
      <div className="bg-white rounded-2xl p-5 border-l-4 border-[#E5E8EB] shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex justify-between items-center">
          <div className="skeleton-shimmer rounded-md w-9 h-5" />
          <div className="skeleton-shimmer rounded w-7 h-4" />
        </div>
        <div className="skeleton-shimmer rounded mt-3 w-[58%] h-6" />
        <div className="skeleton-shimmer rounded mt-2 w-[38%] h-3.5" />
        <div className="flex items-end mt-5 gap-2">
          <div className="skeleton-shimmer rounded w-28 h-8" />
          <div className="skeleton-shimmer rounded w-14 h-4 mb-1" />
        </div>
        <div className="skeleton-shimmer rounded mt-2 w-20 h-3" />
      </div>
    );
  }
  return (
    <div className="bg-white rounded-xl border border-[#E5E8EB] px-4 py-3.5 h-[70px]">
      <div className="flex items-center gap-3">
        <div className="skeleton-shimmer rounded-full w-6 h-6 flex-shrink-0" />
        <div className="flex-1 flex items-center justify-between gap-3">
          <div className="skeleton-shimmer rounded w-[60%] h-[13px]" />
          <div className="skeleton-shimmer rounded flex-shrink-0 w-[22%] h-[13px]" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// HotApartmentEmpty — 핫 아파트 빈 상태 UI
// ─────────────────────────────────────────────────────────
function HotApartmentEmpty() {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-[#E5E8EB] flex flex-col items-center justify-center text-center py-10 px-4">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
      <p className="mt-3 text-[13px] font-bold text-[#8B95A1]">이번 주 핫한 아파트를 불러오는 중</p>
      <p className="mt-1 text-[11px] text-[#8B95A1]">잠시 후 다시 확인해 주세요</p>
      <Button
        variant="outlined"
        color="primary"
        size="small"
        onClick={() => navigate('/map')}
        trailingContent={<IconChevronRight />}
        className="mt-4"
      >
        지도에서 직접 찾기
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// BottomNav — WDS BottomNavigation 적용 (모바일 전용)
// ─────────────────────────────────────────────────────────
export function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30">
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
