import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Apartment } from '../../types';
import { formatPriceShort, formatChange, formatUnits } from '../../utils/formatNumber';
import { ActionArea } from '@wanteddev/wds';
import HotTag from './HotTag';
import { useCompareStore } from '../../stores/compareStore';

interface ApartmentCardProps {
  apartment: Apartment;
  rank?: number;
  showRankChange?: boolean;
  compact?: boolean;
}

// 카드 우하단 비교 추가 버튼 (작은 + 버튼)
function CompareAddButton({ id, name }: { id: string; name: string }) {
  const { isInCompare, addCompare, removeCompare, compareList } = useCompareStore();
  const inCompare = isInCompare(id);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 이벤트 전파 차단
    if (inCompare) {
      removeCompare(id);
    } else {
      if (compareList.length >= 3) return; // 최대 3개 초과 시 무시
      // name을 함께 저장하여 CompareBar에서 실데이터 모드에서도 단지명 표시 가능
      addCompare({ id, name });
    }
  };

  return (
    <button
      onClick={handleClick}
      className={[
        'absolute bottom-3 right-3 w-6 h-6 rounded-full flex items-center justify-center',
        'text-[12px] font-bold transition-all duration-150 shadow-sm border',
        inCompare
          ? 'bg-[#0066FF] border-[#0066FF] text-white'
          : 'bg-white border-[#C4C9CF] text-[#8B95A1] hover:border-[#0066FF] hover:text-[#0066FF]',
        compareList.length >= 3 && !inCompare ? 'opacity-30 cursor-not-allowed' : '',
      ].join(' ')}
      aria-label={inCompare ? `${name} 비교 제거` : `${name} 비교 추가`}
      title={inCompare ? '비교 제거' : '비교 추가'}
    >
      {inCompare ? '✓' : '+'}
    </button>
  );
}

// 아파트 카드 컴포넌트
const ApartmentCard = React.memo<ApartmentCardProps>(
  ({ apartment, rank, showRankChange = false, compact = false }) => {
    const navigate = useNavigate();

    const handleClick = () => {
      navigate(`/apartment/${apartment.id}`);
    };

    const priceColor =
      apartment.priceChangeType === 'up'
        ? 'text-[#FF4B4B]'
        : apartment.priceChangeType === 'down'
          ? 'text-[#3B82F6]'
          : 'text-[#8B95A1]';

    const priceArrow =
      apartment.priceChangeType === 'up'
        ? '▲'
        : apartment.priceChangeType === 'down'
          ? '▼'
          : '';

    if (compact) {
      return (
        <ActionArea
          onClick={handleClick}
          className="w-full bg-white rounded-xl border border-[#E5E8EB] shadow-sm p-3 flex items-center gap-3 transition-all duration-200 hover:shadow-md hover:border-blue-200 relative"
        >
          {rank && (
            <span className="text-xs font-bold text-[#8B95A1] w-5 text-center flex-shrink-0">
              {rank}
            </span>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#191F28] truncate">{apartment.name}</p>
            <p className="text-xs text-[#8B95A1] truncate">{apartment.district}</p>
          </div>
          <div className="text-right flex-shrink-0 pr-7">
            <p className="text-sm font-bold text-[#191F28]">
              {formatPriceShort(apartment.recentPrice)}
            </p>
            <p className={`text-xs font-medium ${priceColor}`}>
              {priceArrow} {formatChange(apartment.priceChange)}
            </p>
          </div>
          {/* 비교 추가 버튼 */}
          <CompareAddButton id={apartment.id} name={apartment.name} />
        </ActionArea>
      );
    }

    return (
      <ActionArea
        onClick={handleClick}
        className="w-full bg-white rounded-xl border border-[#E5E8EB] shadow-sm p-4 transition-all duration-200 hover:shadow-md hover:border-blue-200 relative"
      >
        <div className="flex items-start gap-3">
          {/* 순위 표시 */}
          {rank && (
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <span
                className={`text-xl font-black ${rank <= 3 ? 'text-blue-600' : 'text-[#8B95A1]'}`}
              >
                {rank}
              </span>
              {showRankChange && apartment.weeklyRankChange !== undefined && (
                <RankChangeBadge change={apartment.weeklyRankChange} />
              )}
            </div>
          )}

          {/* 단지 정보 */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[#191F28] text-base leading-tight truncate">
              {apartment.name}
            </h3>
            {apartment.hotTags && apartment.hotTags.length > 0 && (
              <div className="flex gap-1 mt-1 flex-wrap">
                {apartment.hotTags.slice(0, 2).map(tag => <HotTag key={tag} tag={tag} />)}
              </div>
            )}
            <p className="text-xs text-[#8B95A1] mt-0.5 truncate">
              {apartment.district} · {apartment.dong}
            </p>
            <p className="text-xs text-[#8B95A1] mt-0.5">
              {formatUnits(apartment.totalUnits)} · {apartment.builtYear}년
            </p>
          </div>

          {/* 가격 정보 */}
          <div className="text-right flex-shrink-0 pr-1 pb-5">
            <p className="text-lg font-black text-[#191F28]">
              {formatPriceShort(apartment.recentPrice)}
            </p>
            <p className="text-xs text-[#8B95A1] mt-0.5">
              {apartment.recentPriceArea}㎡
            </p>
            <p className={`text-sm font-bold mt-1 ${priceColor}`}>
              {priceArrow} {formatChange(apartment.priceChange)}
            </p>
          </div>
        </div>
        {/* 비교 추가 버튼 */}
        <CompareAddButton id={apartment.id} name={apartment.name} />
      </ActionArea>
    );
  }
);

ApartmentCard.displayName = 'ApartmentCard';
export default ApartmentCard;

// 순위 변동 뱃지
function RankChangeBadge({ change }: { change: number | 'new' }) {
  if (change === 'new') {
    return (
      <span className="text-[10px] font-bold bg-[#0066FF] text-white px-1.5 py-0.5 rounded-full">
        NEW
      </span>
    );
  }
  if (change > 0) {
    return (
      <span className="text-[10px] font-bold text-[#FF4B4B]">
        ▲{change}
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="text-[10px] font-bold text-[#3B82F6]">
        ▼{Math.abs(change)}
      </span>
    );
  }
  return <span className="text-[10px] font-bold text-[#8B95A1]">-</span>;
}
