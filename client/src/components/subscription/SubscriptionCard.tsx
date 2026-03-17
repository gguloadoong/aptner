import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Subscription } from '../../types';
import { formatPrice, calcDday } from '../../utils/formatNumber';
import Card from '../ui/Card';
import SubscriptionBadge from './SubscriptionBadge';

interface SubscriptionCardProps {
  subscription: Subscription;
}

// 청약 카드 컴포넌트
const SubscriptionCard = React.memo<SubscriptionCardProps>(({ subscription }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/subscription/${subscription.id}`);
  };

  const dday = calcDday(subscription.deadline);
  const isDdayUrgent = dday !== '마감' && dday !== 'D-day' && parseInt(dday.replace('D-', '')) <= 3;

  return (
    <Card hoverable onClick={handleClick}>
      {/* 헤더: 상태 뱃지 + D-day */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <SubscriptionBadge status={subscription.status} />
          {subscription.type === 'special' && (
            <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 font-semibold rounded-full">
              특별
            </span>
          )}
        </div>
        <span
          className={[
            'text-sm font-black',
            isDdayUrgent ? 'text-[#FF4B4B]' : subscription.status === 'closed' ? 'text-[#8B95A1]' : 'text-[#191F28]',
          ].join(' ')}
        >
          {dday}
        </span>
      </div>

      {/* 단지명 */}
      <h3 className="font-bold text-[#191F28] text-base leading-snug mb-1">
        {subscription.name}
      </h3>

      {/* 위치 */}
      <p className="text-xs text-[#8B95A1] mb-3">{subscription.location}</p>

      {/* 정보 그리드 */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#E5E8EB]">
        <div>
          <p className="text-[10px] text-[#8B95A1] mb-0.5">최저 분양가</p>
          <p className="text-sm font-bold text-[#191F28]">
            {subscription.startPrice ? formatPrice(subscription.startPrice) : '분양가 미정'}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-[#8B95A1] mb-0.5">공급세대</p>
          <p className="text-sm font-bold text-[#191F28]">
            {subscription.supplyUnits ? subscription.supplyUnits.toLocaleString() : '--'}세대
          </p>
        </div>
        <div>
          <p className="text-[10px] text-[#8B95A1] mb-0.5">청약 마감</p>
          <p className="text-sm font-bold text-[#191F28]">
            {subscription.deadline.slice(5).replace('-', '/')}
          </p>
        </div>
      </div>
    </Card>
  );
});

SubscriptionCard.displayName = 'SubscriptionCard';
export default SubscriptionCard;
