import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscriptions } from '../hooks/useSubscription';
import SubscriptionCard from '../components/subscription/SubscriptionCard';
import { CardSkeleton } from '../components/ui/LoadingSpinner';
import { BottomNav } from './HomePage';
import type { SubscriptionStatus, SortOrder } from '../types';

const REGIONS = ['전국', '서울', '경기', '인천', '부산', '대구', '대전', '광주'];

const STATUS_TABS: { value: SubscriptionStatus; label: string }[] = [
  { value: 'ongoing', label: '진행중' },
  { value: 'upcoming', label: '예정' },
  { value: 'closed', label: '마감' },
];

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: 'deadline', label: '마감임박순' },
  { value: 'price', label: '분양가순' },
  { value: 'latest', label: '최신순' },
];

// 청약 페이지
export default function SubscriptionPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<SubscriptionStatus>('ongoing');
  const [region, setRegion] = useState('전국');
  const [sort, setSort] = useState<SortOrder>('deadline');

  const { data, isLoading, isError } = useSubscriptions({ status, region, sort });
  const subscriptions = data?.data ?? [];

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      {/* 헤더 */}
      <header className="bg-white border-b border-[#E5E8EB] sticky top-0 z-30">
        <div className="md:max-w-4xl md:mx-auto px-5 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-[#191F28]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-black text-[#191F28]">청약 정보</h1>
          </div>

          {/* 상태 탭 */}
          <div className="flex border-b border-[#E5E8EB]">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatus(tab.value)}
                className={[
                  'flex-1 py-2.5 text-sm font-semibold transition-colors relative',
                  status === tab.value
                    ? 'text-[#1B64DA]'
                    : 'text-[#8B95A1]',
                ].join(' ')}
              >
                {tab.label}
                {status === tab.value && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1B64DA] rounded-t" />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* 필터 바 */}
      <div className="bg-white border-b border-[#E5E8EB]">
        <div className="md:max-w-4xl md:mx-auto px-5 py-3 flex items-center gap-3">
          {/* 지역 필터 */}
          <div className="flex gap-2 overflow-x-auto flex-1 pb-1 scrollbar-hide">
            {REGIONS.map((r) => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                className={[
                  'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors',
                  region === r
                    ? 'bg-[#1B64DA] text-white'
                    : 'bg-[#F5F6F8] text-[#8B95A1] hover:bg-gray-100',
                ].join(' ')}
              >
                {r}
              </button>
            ))}
          </div>

          {/* 정렬 선택 */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOrder)}
            className="flex-shrink-0 text-xs text-[#191F28] border border-[#E5E8EB] rounded-lg px-2 py-1.5 bg-white outline-none cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 청약 목록 */}
      <main className="py-4 pb-28 md:pb-8">
        <div className="md:max-w-4xl md:mx-auto px-5 md:px-6">
          {/* 건수 표시 */}
          {!isLoading && (
            <p className="text-xs text-[#8B95A1] mb-3">
              총 {data?.total ?? 0}건
            </p>
          )}

          {isLoading ? (
            /* 모바일: 1열, 데스크탑: 2열 */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <ErrorState />
          ) : subscriptions.length === 0 ? (
            <EmptyState status={status} />
          ) : (
            /* 모바일: 1열, 데스크탑: 2열 그리드 */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {subscriptions.map((sub) => (
                <SubscriptionCard key={sub.id} subscription={sub} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 모바일 하단 내비게이션 */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}

// 빈 상태
function EmptyState({ status }: { status: SubscriptionStatus }) {
  const messages = {
    ongoing: '현재 진행 중인 청약이 없습니다',
    upcoming: '예정된 청약이 없습니다',
    closed: '마감된 청약이 없습니다',
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <svg className="w-16 h-16 text-[#E5E8EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <p className="text-sm text-[#8B95A1] text-center">{messages[status]}</p>
    </div>
  );
}

// 에러 상태
function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <p className="text-sm text-[#FF4B4B]">데이터를 불러오는데 실패했습니다</p>
      <button
        onClick={() => window.location.reload()}
        className="text-xs text-[#1B64DA] font-semibold"
      >
        다시 시도
      </button>
    </div>
  );
}
