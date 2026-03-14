import React from 'react';
import type { TradeHistory } from '../../types';
import { formatPrice, formatYearMonth } from '../../utils/formatNumber';

interface TradeHistoryTableProps {
  trades: TradeHistory[];
  limit?: number;
}

// 실거래 내역 테이블 컴포넌트
const TradeHistoryTable = React.memo<TradeHistoryTableProps>(
  ({ trades, limit = 20 }) => {
    const displayTrades = [...trades]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, limit);

    if (displayTrades.length === 0) {
      return (
        <div className="py-8 text-center">
          <p className="text-sm text-[#8B95A1]">거래 내역이 없습니다</p>
        </div>
      );
    }

    return (
      <div className="overflow-hidden">
        {/* 테이블 헤더 */}
        <div className="grid grid-cols-4 px-4 py-2 bg-[#F5F6F8] rounded-lg mb-1">
          <span className="text-xs font-medium text-[#8B95A1]">거래일</span>
          <span className="text-xs font-medium text-[#8B95A1] text-center">면적</span>
          <span className="text-xs font-medium text-[#8B95A1] text-center">층</span>
          <span className="text-xs font-medium text-[#8B95A1] text-right">거래가</span>
        </div>

        {/* 거래 내역 */}
        <div className="divide-y divide-[#E5E8EB]">
          {displayTrades.map((trade) => (
            <div key={trade.id} className="grid grid-cols-4 px-4 py-3">
              <span className="text-xs text-[#8B95A1]">
                {formatYearMonth(trade.date)}
              </span>
              <span className="text-xs text-[#191F28] text-center font-medium">
                {trade.area}㎡
              </span>
              <span className="text-xs text-[#191F28] text-center">
                {trade.floor}층
              </span>
              <span className="text-xs font-bold text-[#191F28] text-right">
                {formatPrice(trade.price)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

TradeHistoryTable.displayName = 'TradeHistoryTable';
export default TradeHistoryTable;
