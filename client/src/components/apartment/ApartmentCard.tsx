import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Apartment } from '../../types';
import { formatPriceShort, formatChange, formatUnits } from '../../utils/formatNumber';
import Card from '../ui/Card';

interface ApartmentCardProps {
  apartment: Apartment;
  rank?: number;
  showRankChange?: boolean;
  compact?: boolean;
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
          ? 'text-[#00C896]'
          : 'text-[#8B95A1]';

    const priceArrow =
      apartment.priceChangeType === 'up'
        ? '▲'
        : apartment.priceChangeType === 'down'
          ? '▼'
          : '';

    if (compact) {
      return (
        <Card hoverable onClick={handleClick} padding="sm" className="flex items-center gap-3">
          {rank && (
            <span className="text-xs font-bold text-[#8B95A1] w-5 text-center flex-shrink-0">
              {rank}
            </span>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#191F28] truncate">{apartment.name}</p>
            <p className="text-xs text-[#8B95A1] truncate">{apartment.district}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-bold text-[#191F28]">
              {formatPriceShort(apartment.recentPrice)}
            </p>
            <p className={`text-xs font-medium ${priceColor}`}>
              {priceArrow} {formatChange(apartment.priceChange)}
            </p>
          </div>
        </Card>
      );
    }

    return (
      <Card hoverable onClick={handleClick}>
        <div className="flex items-start gap-3">
          {/* 순위 표시 */}
          {rank && (
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <span
                className={`text-xl font-black ${rank <= 3 ? 'text-[#1B64DA]' : 'text-[#8B95A1]'}`}
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
            <p className="text-xs text-[#8B95A1] mt-0.5 truncate">
              {apartment.district} · {apartment.dong}
            </p>
            <p className="text-xs text-[#8B95A1] mt-0.5">
              {formatUnits(apartment.totalUnits)} · {apartment.builtYear}년
            </p>
          </div>

          {/* 가격 정보 */}
          <div className="text-right flex-shrink-0">
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
      </Card>
    );
  }
);

ApartmentCard.displayName = 'ApartmentCard';
export default ApartmentCard;

// 순위 변동 뱃지
function RankChangeBadge({ change }: { change: number | 'new' }) {
  if (change === 'new') {
    return (
      <span className="text-[10px] font-bold bg-[#1B64DA] text-white px-1.5 py-0.5 rounded-full">
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
      <span className="text-[10px] font-bold text-[#00C896]">
        ▼{Math.abs(change)}
      </span>
    );
  }
  return <span className="text-[10px] font-bold text-[#8B95A1]">-</span>;
}
