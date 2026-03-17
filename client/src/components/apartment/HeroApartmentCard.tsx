import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Apartment } from '../../types';
import { formatPriceShort, formatChange, formatArea } from '../../utils/formatNumber';

interface HeroApartmentCardProps {
  apartment: Apartment;
}

// 주간 HOT 1위 전용 히어로 카드
const HeroApartmentCard = React.memo<HeroApartmentCardProps>(({ apartment }) => {
  const navigate = useNavigate();

  const isUp = apartment.priceChangeType === 'up';
  const isDown = apartment.priceChangeType === 'down';
  const priceColor = isUp ? 'text-[#FF4B4B]' : isDown ? 'text-[#3B82F6]' : 'text-[#8B95A1]';
  const changeArrow = isUp ? '▲' : isDown ? '▼' : '';

  // 순위 변동 뱃지 (weeklyRankChange)
  const renderRankChange = () => {
    const change = apartment.weeklyRankChange;
    if (change === undefined || change === null) return null;
    if (change === 'new') {
      return (
        <span className="text-[11px] font-bold bg-[#0066FF] text-white px-1.5 py-0.5 rounded-full">
          NEW
        </span>
      );
    }
    if (typeof change === 'number' && change > 0) {
      return (
        <span className="text-[12px] font-bold text-[#FF4B4B]">▲{change}</span>
      );
    }
    if (typeof change === 'number' && change < 0) {
      return (
        <span className="text-[12px] font-bold text-[#3B82F6]">▼{Math.abs(change)}</span>
      );
    }
    return <span className="text-[12px] font-bold text-[#8B95A1]">-</span>;
  };

  return (
    <div
      className={[
        'bg-gradient-to-br from-blue-50 to-white rounded-2xl p-5 cursor-pointer',
        'shadow-[0_4px_20px_rgba(0,0,0,0.10)]',
        'border-l-4 border-[#0066FF]',
        'transition-all duration-200 hover:shadow-[0_8px_32px_rgba(0,0,0,0.14)] active:scale-[0.99]',
        'animate-fadeInUp',
      ].join(' ')}
      onClick={() => navigate(`/apartment/${apartment.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/apartment/${apartment.id}`)}
    >
      {/* 상단 행: 1위 뱃지 + 순위 변동 */}
      <div className="flex items-center justify-between">
        <span className="bg-[#FFD700] text-white text-sm font-black px-3 py-1 rounded-lg shadow-sm">
          1위
        </span>
        {renderRankChange()}
      </div>

      {/* 단지명 + 최고가 경신 뱃지 */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <h3 className="text-[24px] font-black text-[#191F28] leading-tight">
          {apartment.name}
        </h3>
        {apartment.isRecordHigh && (
          <span className="inline-flex items-center gap-1 h-5 px-2 text-[11px] font-bold rounded-full bg-[#FFEBEE] text-[#C62828] border border-[#EF9A9A]/30">
            🔥 최고가 경신
          </span>
        )}
      </div>

      {/* 위치 */}
      <p className="text-[13px] text-[#8B95A1] mt-1">
        {apartment.district} · {apartment.dong}
      </p>

      {/* 가격 + 변동률 행 */}
      <div className="flex items-end mt-4">
        <span className="text-[32px] font-black text-[#191F28] font-mono leading-none" style={{ fontFamily: 'var(--font-jetbrains)' }}>
          {formatPriceShort(apartment.recentPrice)}
        </span>
        <span className={`text-[13px] ml-2 mb-1 font-bold ${priceColor}`}>
          {changeArrow} {formatChange(apartment.priceChange)}
        </span>
      </div>

      {/* 면적 */}
      <p className="text-[11px] text-[#8B95A1] mt-1">
        기준 {formatArea(apartment.recentPriceArea)}
      </p>
    </div>
  );
});

HeroApartmentCard.displayName = 'HeroApartmentCard';
export default HeroApartmentCard;
