import React from 'react';
import type { TradeHistory } from '../../types';
import { formatPrice, formatYearMonth } from '../../utils/formatNumber';
import { Box, Typography } from '@wanteddev/wds';

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
        <Box sx={{ padding: '32px 0', textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: 'var(--semantic-label-assistive)' }}>
            거래 내역이 없습니다
          </Typography>
        </Box>
      );
    }

    const colStyle: React.CSSProperties = {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
    };

    return (
      <div style={{ overflow: 'hidden' }}>
        {/* 테이블 헤더 */}
        <div
          style={{
            ...colStyle,
            padding: '8px 16px',
            backgroundColor: 'var(--semantic-background-normal-alternative)',
            borderRadius: '8px',
            marginBottom: '4px',
          }}
        >
          {['거래일', '면적', '층', '거래가'].map((label, i) => (
            <Typography
              key={label}
              variant="caption1"
              weight="medium"
              sx={{ color: 'var(--semantic-label-assistive)', textAlign: i === 3 ? 'right' : i === 1 || i === 2 ? 'center' : 'left' }}
            >
              {label}
            </Typography>
          ))}
        </div>

        {/* 거래 내역 */}
        <div style={{ borderTop: '1px solid var(--semantic-line-normal)' }}>
          {displayTrades.map((trade) => (
            <div
              key={trade.id}
              style={{
                ...colStyle,
                padding: '12px 16px',
                borderBottom: '1px solid var(--semantic-line-normal)',
              }}
            >
              <Typography variant="caption1" sx={{ color: 'var(--semantic-label-assistive)' }}>
                {formatYearMonth(trade.date)}
              </Typography>
              <Typography variant="caption1" weight="medium" sx={{ color: 'var(--semantic-label-normal)', textAlign: 'center' }}>
                {trade.area}㎡
              </Typography>
              <Typography variant="caption1" sx={{ color: 'var(--semantic-label-normal)', textAlign: 'center' }}>
                {trade.floor}층
              </Typography>
              <Typography variant="caption1" weight="bold" sx={{ color: 'var(--semantic-label-normal)', textAlign: 'right' }}>
                {formatPrice(trade.price)}
              </Typography>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

TradeHistoryTable.displayName = 'TradeHistoryTable';
export default TradeHistoryTable;
