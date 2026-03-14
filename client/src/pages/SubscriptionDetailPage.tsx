import { useNavigate, useParams } from 'react-router-dom';
import { useSubscriptionDetail } from '../hooks/useSubscription';
import SubscriptionBadge from '../components/subscription/SubscriptionBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { formatPrice, calcDday } from '../utils/formatNumber';
import type { SubscriptionSchedule } from '../types';

// 청약 상세 페이지
export default function SubscriptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: subscription, isLoading, isError } = useSubscriptionDetail(id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="청약 정보 로딩중..." />
      </div>
    );
  }

  if (isError || !subscription) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-[#FF4B4B] font-semibold">청약 정보를 불러올 수 없습니다</p>
        <button onClick={() => navigate(-1)} className="text-[#1B64DA] text-sm">
          돌아가기
        </button>
      </div>
    );
  }

  const dday = calcDday(subscription.deadline);
  const isDdayUrgent =
    dday !== '마감' && dday !== 'D-day' && parseInt(dday.replace('D-', '')) <= 3;

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      {/* 헤더 */}
      <header className="bg-white border-b border-[#E5E8EB] sticky top-0 z-30 px-5 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="뒤로가기"
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-[#191F28]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-base font-bold text-[#191F28] truncate flex-1">{subscription.name}</h1>
        </div>
      </header>

      <main className="pb-8">
        {/* 기본 정보 섹션 */}
        <div className="bg-white px-5 py-5 mb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <SubscriptionBadge status={subscription.status} />
              {subscription.type === 'special' && (
                <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 font-semibold rounded-full">
                  특별공급
                </span>
              )}
            </div>
            <span
              className={[
                'text-lg font-black',
                isDdayUrgent
                  ? 'text-[#FF4B4B]'
                  : subscription.status === 'closed'
                    ? 'text-[#8B95A1]'
                    : 'text-[#191F28]',
              ].join(' ')}
            >
              {dday}
            </span>
          </div>

          <h2 className="text-xl font-black text-[#191F28] leading-snug mb-1">
            {subscription.name}
          </h2>
          <p className="text-sm text-[#8B95A1]">{subscription.location}</p>

          {/* 핵심 수치 */}
          <div className="grid grid-cols-2 gap-4 mt-5">
            <div className="bg-[#F5F6F8] rounded-xl p-4">
              <p className="text-xs text-[#8B95A1] mb-1">최저 분양가</p>
              <p className="text-lg font-black text-[#191F28]">
                {formatPrice(subscription.startPrice)}
              </p>
            </div>
            <div className="bg-[#F5F6F8] rounded-xl p-4">
              <p className="text-xs text-[#8B95A1] mb-1">최고 분양가</p>
              <p className="text-lg font-black text-[#191F28]">
                {formatPrice(subscription.maxPrice)}
              </p>
            </div>
          </div>
        </div>

        {/* 청약 일정 */}
        <div className="bg-white px-5 py-5 mb-3">
          <h3 className="text-base font-bold text-[#191F28] mb-4">청약 일정</h3>
          <SubscriptionTimeline
            startDate={subscription.startDate}
            deadline={subscription.deadline}
            schedule={subscription.schedule}
          />
        </div>

        {/* 면적별 분양가 */}
        <div className="bg-white px-5 py-5 mb-3">
          <h3 className="text-base font-bold text-[#191F28] mb-4">면적별 공급 현황</h3>
          <div className="space-y-3">
            {subscription.areas.map((area) => (
              <div
                key={area.area}
                className="border border-[#E5E8EB] rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-base font-bold text-[#191F28]">{area.area}㎡</span>
                  <span className="text-sm font-black text-[#1B64DA]">
                    {formatPrice(area.price)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] text-[#8B95A1]">공급세대</p>
                    <p className="text-xs font-bold text-[#191F28] mt-0.5">
                      {area.units}세대
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#8B95A1]">가점</p>
                    <p className="text-xs font-bold text-[#191F28] mt-0.5">
                      {area.generalRatio}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#8B95A1]">추첨</p>
                    <p className="text-xs font-bold text-[#191F28] mt-0.5">
                      {area.lotteryRatio}%
                    </p>
                  </div>
                </div>

                {/* 가점/추첨 비율 바 */}
                <div className="mt-2 h-1.5 bg-[#E5E8EB] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1B64DA] rounded-full"
                    style={{ width: `${area.generalRatio}%` }}
                  />
                </div>
                <div className="flex justify-between mt-0.5">
                  <span className="text-[10px] text-[#1B64DA]">가점 {area.generalRatio}%</span>
                  <span className="text-[10px] text-[#8B95A1]">추첨 {area.lotteryRatio}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 총 공급 정보 */}
        <div className="bg-white px-5 py-5">
          <h3 className="text-base font-bold text-[#191F28] mb-3">총 공급 현황</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#F5F6F8] rounded-xl p-3">
              <p className="text-xs text-[#8B95A1]">총 공급세대</p>
              <p className="text-lg font-black text-[#191F28] mt-1">
                {subscription.supplyUnits.toLocaleString()}세대
              </p>
            </div>
            <div className="bg-[#F5F6F8] rounded-xl p-3">
              <p className="text-xs text-[#8B95A1]">면적 종류</p>
              <p className="text-lg font-black text-[#191F28] mt-1">
                {subscription.areas.length}가지
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// 청약 일정 타임라인
// MAJOR-03: BE schedule 필드를 직접 사용하도록 수정 (추정 계산 제거)
function SubscriptionTimeline({
  startDate,
  deadline,
  schedule,
}: {
  startDate: string;
  deadline: string;
  schedule?: SubscriptionSchedule;
}) {
  const now = new Date();

  // 계약 기간 표시: 시작~종료가 모두 있으면 범위로, 시작만 있으면 단일 날짜로 표시
  const contractDateLabel = schedule?.contractStartDate
    ? schedule.contractEndDate
      ? `${schedule.contractStartDate} ~ ${schedule.contractEndDate}`
      : schedule.contractStartDate
    : undefined;

  const steps: Array<{ label: string; date: string | undefined; done: boolean }> = [
    {
      label: '청약 시작',
      date: startDate,
      done: !!startDate && new Date(startDate) <= now,
    },
    {
      label: '청약 마감',
      date: deadline,
      done: !!deadline && new Date(deadline) < now,
    },
    {
      label: '당첨자 발표',
      date: schedule?.announceDate,
      done: !!schedule?.announceDate && new Date(schedule.announceDate) < now,
    },
    {
      label: '계약 기간',
      date: contractDateLabel,
      done: !!schedule?.contractEndDate && new Date(schedule.contractEndDate) < now,
    },
  ];

  return (
    <div className="relative">
      {steps.map((step, index) => (
        <div key={step.label} className="flex gap-4 pb-6 last:pb-0">
          {/* 타임라인 선 */}
          <div className="flex flex-col items-center">
            <div
              className={[
                'w-3 h-3 rounded-full border-2 flex-shrink-0 z-10',
                step.done
                  ? 'bg-[#1B64DA] border-[#1B64DA]'
                  : 'bg-white border-[#E5E8EB]',
              ].join(' ')}
            />
            {index < steps.length - 1 && (
              <div className="w-0.5 flex-1 bg-[#E5E8EB] mt-1" />
            )}
          </div>

          {/* 내용 */}
          <div className="flex-1 pb-1">
            <p className={`text-sm font-semibold ${step.done ? 'text-[#1B64DA]' : 'text-[#191F28]'}`}>
              {step.label}
            </p>
            <p className="text-xs text-[#8B95A1] mt-0.5">
              {step.date ?? '일정 미정'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
