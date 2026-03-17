import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Subscription } from '../../types';
import { formatPrice, calcDday } from '../../utils/formatNumber';
import DdayBadge from './DdayBadge';

interface UrgentSubscriptionCardProps {
  subscription: Subscription;
}

// D-day 강화 컴팩트 청약 카드 (세로 스택용)
const UrgentSubscriptionCard = React.memo<UrgentSubscriptionCardProps>(
  ({ subscription }) => {
    const navigate = useNavigate();

    // D-day 숫자 계산 (음수=마감, 0=D-Day, 양수=남은 일수)
    const ddayStr = calcDday(subscription.deadline);
    const dDay =
      ddayStr === '마감'
        ? -1
        : ddayStr === 'D-day'
          ? 0
          : parseInt(ddayStr.replace('D-', ''), 10);

    const isUrgent = dDay >= 0 && dDay <= 3;

    // 긴박 여부에 따른 카드 스타일 (flex-col: 상단 정보행 + 하단 CTA행)
    const cardClass = [
      'min-h-[72px] rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)]',
      'flex flex-col px-4 py-3 cursor-pointer',
      'transition-all duration-150 active:scale-[0.98]',
      isUrgent
        ? 'bg-gradient-to-br from-[#FFF8F8] to-white border-l-[3px] border-[#FF4B4B]'
        : 'bg-white border border-[#E5E8EB]',
    ].join(' ');

    // 지도 CTA: location을 쿼리로 전달 (lat/lng 없는 경우 location 기반 검색)
    const handleMapLinkClick = (e: React.MouseEvent) => {
      e.stopPropagation(); // 카드 클릭(상세 이동) 이벤트 전파 차단
      const searchQuery = encodeURIComponent(`${subscription.name} ${subscription.location}`);
      navigate(`/map?search=${searchQuery}`);
    };

    return (
      <div
        className={cardClass}
        onClick={() => navigate(`/subscription/${subscription.id}`)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && navigate(`/subscription/${subscription.id}`)}
      >
        {/* 상단 행: D-day + 단지명 + 가격 */}
        <div className="flex items-center gap-3">
          {/* D-day 배지 */}
          <div className="flex-shrink-0 w-12 flex justify-center">
            <DdayBadge dDay={dDay} />
          </div>

          {/* 단지명 + 위치·유형 */}
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-[#191F28] leading-tight truncate">
              {subscription.name}
            </p>
            <p className="text-[12px] text-[#8B95A1] mt-0.5 truncate">
              {subscription.location} · {subscription.type === 'special' ? '특별공급' : '일반공급'}
            </p>
          </div>

          {/* 분양가 + 공급세대 */}
          <div className="flex-shrink-0 text-right">
            <p className="text-[15px] font-bold text-blue-600 font-mono">
              {subscription.startPrice ? formatPrice(subscription.startPrice) : '분양가 미정'}
            </p>
            <p className="text-[11px] text-[#8B95A1] mt-0.5">
              {subscription.supplyUnits ? subscription.supplyUnits.toLocaleString() : '--'}세대
            </p>
          </div>
        </div>

        {/* 하단 행: 주변 시세 보기 CTA */}
        <div className="flex justify-end mt-2 pt-2 border-t border-[#F0F2F5]">
          <button
            className="text-[12px] text-blue-600 font-medium hover:underline"
            onClick={handleMapLinkClick}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleMapLinkClick(e as unknown as React.MouseEvent);
            }}
          >
            주변 시세 보기 →
          </button>
        </div>
      </div>
    );
  }
);

UrgentSubscriptionCard.displayName = 'UrgentSubscriptionCard';
export default UrgentSubscriptionCard;
