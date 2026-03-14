import { useNavigate, useLocation } from 'react-router-dom';
import { useHotApartments } from '../hooks/useApartment';
import { useSubscriptions } from '../hooks/useSubscription';
import ApartmentCard from '../components/apartment/ApartmentCard';
import SubscriptionCard from '../components/subscription/SubscriptionCard';
import SearchBar from '../components/ui/SearchBar';
import { CardSkeleton } from '../components/ui/LoadingSpinner';
import { formatPriceShort, formatChange } from '../utils/formatNumber';
import { MOCK_REGION_TRENDS } from '../mocks/trends.mock';

// 홈 페이지
export default function HomePage() {
  const navigate = useNavigate();

  // 핫 아파트 상위 10개
  const { data: hotApartments = [], isLoading: isAptLoading } = useHotApartments(undefined, 10);

  // 진행 중인 청약 3개
  const { data: subData, isLoading: isSubLoading } = useSubscriptions({
    status: 'ongoing',
    sort: 'deadline',
  });
  const ongoingSubscriptions = subData?.data.slice(0, 3) ?? [];

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      {/* 모바일 헤더 (md 미만) */}
      <header className="md:hidden bg-white border-b border-[#E5E8EB] sticky top-0 z-30 px-5 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#1B64DA] rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-black">A</span>
            </div>
            <span className="text-lg font-black text-[#191F28]">Aptner</span>
          </div>
          <button
            onClick={() => navigate('/map')}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#1B64DA] bg-blue-50 px-3 py-1.5 rounded-full"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            지도 보기
          </button>
        </div>
        <SearchBar placeholder="아파트명, 지역 검색 (ex. 반포 래미안)" />
      </header>

      {/* 데스크탑 헤더 (md 이상) */}
      <header className="hidden md:block bg-white border-b border-[#E5E8EB] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-6">
          {/* 로고 */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-[#1B64DA] rounded-xl flex items-center justify-center">
              <span className="text-white text-sm font-black">A</span>
            </div>
            <span className="text-xl font-black text-[#191F28]">Aptner</span>
          </div>

          {/* 검색바 - 중앙 */}
          <div className="flex-1 max-w-xl">
            <SearchBar placeholder="아파트명, 지역 검색 (ex. 반포 래미안)" />
          </div>

          {/* 네비 링크 - 우측 */}
          <nav className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => navigate('/map')}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-[#8B95A1] hover:text-[#1B64DA] hover:bg-blue-50 rounded-xl transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              지도
            </button>
            <button
              onClick={() => navigate('/subscription')}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-[#8B95A1] hover:text-[#1B64DA] hover:bg-blue-50 rounded-xl transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              청약
            </button>
            <button
              onClick={() => navigate('/trend')}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-[#8B95A1] hover:text-[#1B64DA] hover:bg-blue-50 rounded-xl transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              트렌드
            </button>
          </nav>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="pb-24 md:pb-8">
        <div className="md:max-w-7xl md:mx-auto md:px-6">

          {/* 지역별 시세 섹션 */}
          <section className="px-5 pt-5 md:px-0 md:pt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-[#191F28]">지역별 시세</h2>
              <button
                onClick={() => navigate('/trend')}
                className="text-xs text-[#1B64DA] font-medium hover:underline"
              >
                더보기
              </button>
            </div>
            {/* 모바일: 3열, 데스크탑: 6열 */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {MOCK_REGION_TRENDS.map((trend) => (
                <RegionTrendCard key={trend.region} trend={trend} />
              ))}
            </div>
          </section>

          {/* 진행 중 청약 배너 */}
          <section className="px-5 pt-6 md:px-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-[#191F28]">진행 중 청약</h2>
              <button
                onClick={() => navigate('/subscription')}
                className="text-xs text-[#1B64DA] font-medium hover:underline"
              >
                전체보기
              </button>
            </div>

            {isSubLoading ? (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex-shrink-0 w-72">
                    <CardSkeleton />
                  </div>
                ))}
              </div>
            ) : ongoingSubscriptions.length === 0 ? (
              <EmptyState message="진행 중인 청약이 없습니다" />
            ) : (
              /* 모바일: 가로 스크롤, 데스크탑: 3열 그리드 */
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 md:mx-0 md:px-0 md:overflow-visible md:grid md:grid-cols-3">
                {ongoingSubscriptions.map((sub) => (
                  <div key={sub.id} className="flex-shrink-0 w-72 md:w-auto md:flex-shrink">
                    <SubscriptionCard subscription={sub} />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 핫한 아파트 TOP 10 */}
          <section className="px-5 pt-6 md:px-0">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-bold text-[#191F28]">핫한 아파트 TOP 10</h2>
                <p className="text-xs text-[#8B95A1] mt-0.5">조회수 + 거래량 기준 주간 랭킹</p>
              </div>
              <button
                onClick={() => navigate('/trend')}
                className="text-xs text-[#1B64DA] font-medium hover:underline"
              >
                더보기
              </button>
            </div>

            {isAptLoading ? (
              /* 모바일: 1열, 데스크탑: 2열 스켈레톤 */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : (
              /* 모바일: 1열, 데스크탑: 2열 그리드 */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {hotApartments.map((apt, index) => (
                  <ApartmentCard
                    key={apt.id}
                    apartment={apt}
                    rank={index + 1}
                    showRankChange
                  />
                ))}
              </div>
            )}
          </section>

          {/* 지도 바로가기 배너 (데스크탑) */}
          <section className="hidden md:block px-0 pt-6">
            <button
              onClick={() => navigate('/map')}
              className="w-full bg-gradient-to-r from-[#1B64DA] to-[#3B82F6] rounded-2xl p-6 text-left hover:opacity-95 transition-opacity"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white">지도로 아파트 찾기</h3>
                  <p className="text-sm text-blue-100 mt-1">서울 주요 아파트 실거래가를 지도에서 확인하세요</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
              </div>
            </button>
          </section>
        </div>
      </main>

      {/* 모바일 하단 내비게이션 */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}

// 지역 트렌드 카드
function RegionTrendCard({ trend }: { trend: (typeof MOCK_REGION_TRENDS)[0] }) {
  const isUp = trend.priceChange > 0;
  const isDown = trend.priceChange < 0;

  return (
    <div className="bg-white rounded-xl border border-[#E5E8EB] p-3 hover:border-[#1B64DA] transition-colors cursor-pointer">
      <p className="text-xs font-bold text-[#191F28] mb-1 truncate">{trend.region}</p>
      <p className="text-sm font-black text-[#191F28]">
        {formatPriceShort(trend.avgPrice)}
      </p>
      <p className={[
        'text-xs font-semibold mt-0.5',
        isUp ? 'text-[#FF4B4B]' : isDown ? 'text-[#00C896]' : 'text-[#8B95A1]',
      ].join(' ')}>
        {isUp ? '▲' : isDown ? '▼' : ''} {formatChange(trend.priceChange)}
      </p>
    </div>
  );
}

// 빈 상태
function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-8 text-center bg-white rounded-xl border border-[#E5E8EB]">
      <p className="text-sm text-[#8B95A1]">{message}</p>
    </div>
  );
}

// 하단 내비게이션 (모바일 전용)
export function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const navItems = [
    {
      path: '/',
      label: '홈',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      path: '/map',
      label: '지도',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
    },
    {
      path: '/subscription',
      label: '청약',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      path: '/trend',
      label: '트렌드',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E8EB] z-30 pb-safe">
      <div className="flex">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={[
                'flex-1 flex flex-col items-center gap-1 py-3 transition-colors',
                isActive ? 'text-[#1B64DA]' : 'text-[#8B95A1]',
              ].join(' ')}
            >
              {item.icon}
              <span className="text-[10px] font-semibold">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
