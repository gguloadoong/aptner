import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscriptions } from '../hooks/useSubscription';
import SubscriptionCard from '../components/subscription/SubscriptionCard';
import { CardSkeleton } from '../components/ui/LoadingSpinner';
import { BottomNav } from './HomePage';
import { Tab, TabList, TabListItem, Chip, Button } from '@wanteddev/wds';
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

// 청약 페이지 — 통일된 헤더 스타일 + 개선된 그리드 적용
export default function SubscriptionPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<SubscriptionStatus>('ongoing');
  const [region, setRegion] = useState('전국');
  const [sort, setSort] = useState<SortOrder>('deadline');

  const { data, isLoading, isError } = useSubscriptions({ status, region, sort });
  const subscriptions = data?.data ?? [];

  return (
    <div className="min-h-screen bg-[#F7FAF8]">
      {/* ── 헤더 — 통일된 py-4, text-base font-bold ── */}
      <header className="bg-white border-b border-[#E5E8EB] sticky top-0 z-30">
        <div className="max-w-screen-xl mx-auto px-5 lg:px-8 py-4">
          {/* 타이틀 행 */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-base font-bold text-[#191F28]">청약 정보</h1>
              <p className="text-[11px] text-[#8B95A1] mt-0.5">
                청약홈 공식 데이터 기준
              </p>
            </div>
            {/* 홈 이동 (PC) */}
            <button
              onClick={() => navigate('/')}
              className="hidden lg:flex items-center gap-1.5 text-[13px] text-[#8B95A1] hover:text-blue-600 transition-colors duration-150"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              홈으로
            </button>
          </div>

          {/* 상태 탭 — WDS Tab */}
          <Tab value={status} onValueChange={(v) => setStatus(v as SubscriptionStatus)}>
            <TabList size="medium">
              {STATUS_TABS.map((tab) => (
                <TabListItem key={tab.value} value={tab.value}>
                  {tab.label}
                </TabListItem>
              ))}
            </TabList>
          </Tab>
        </div>
      </header>

      {/* ── 필터 바 ── */}
      <div className="bg-white border-b border-[#E5E8EB]">
        <div className="max-w-screen-xl mx-auto px-5 lg:px-8 py-3 flex items-center gap-3">
          {/* 지역 필터 — WDS Chip */}
          <div className="flex gap-2 overflow-x-auto flex-1 pb-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {REGIONS.map((r) => (
              <Chip
                key={r}
                size="small"
                variant="outlined"
                active={region === r}
                onClick={() => setRegion(r)}
                className="flex-shrink-0"
              >
                {r}
              </Chip>
            ))}
          </div>

          {/* 정렬 선택 */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOrder)}
            className="flex-shrink-0 text-[12px] text-[#4E5968] border border-[#E5E8EB] rounded-lg px-2.5 py-1.5 bg-white outline-none cursor-pointer font-medium hover:border-blue-400 transition-colors duration-150"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── 청약 목록 ── */}
      <main className="py-4 pb-28 lg:pb-10">
        <div className="max-w-screen-xl mx-auto px-5 lg:px-8">
          {/* 건수 표시 */}
          {!isLoading && (
            <p className="text-[11px] text-[#8B95A1] mb-3 font-medium">
              총 {data?.total ?? 0}건
            </p>
          )}

          {isLoading ? (
            /* 로딩: 모바일 1열 / 데스크탑 2열 */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <ErrorState />
          ) : subscriptions.length === 0 ? (
            <EmptyState status={status} />
          ) : (
            /* 모바일 1열 / 데스크탑 2열 그리드 — gap-4 */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subscriptions.map((sub) => (
                <SubscriptionCard key={sub.id} subscription={sub} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 모바일 하단 내비게이션 — lg 이상은 사이드바가 대체 */}
      <div className="lg:hidden">
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
      <div className="w-14 h-14 rounded-full bg-[#F2F4F6] flex items-center justify-center">
        <svg className="w-7 h-7 text-[#C9D1D9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <p className="text-[13px] text-[#8B95A1] text-center font-medium">{messages[status]}</p>
    </div>
  );
}

// 에러 상태
function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-14 h-14 rounded-full bg-[#FFF3F3] flex items-center justify-center">
        <svg className="w-7 h-7 text-[#FF4B4B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v4m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
        </svg>
      </div>
      <p className="text-[13px] text-[#8B95A1] font-medium">데이터를 불러오는데 실패했습니다</p>
      <Button
        variant="outlined"
        color="primary"
        size="small"
        onClick={() => window.location.reload()}
      >
        다시 시도
      </Button>
    </div>
  );
}
