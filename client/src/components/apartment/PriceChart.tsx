import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { TradeHistory } from '../../types';
import { formatYearMonth } from '../../utils/formatNumber';
import { Box, FlexBox, Typography, Loading } from '@wanteddev/wds';

interface PriceChartProps {
  data: TradeHistory[];
  isLoading?: boolean;
}

type DateRange = 6 | 12 | 24;

// 실거래가 라인 차트 컴포넌트
const PriceChart = React.memo<PriceChartProps>(({ data, isLoading = false }) => {
  const [dateRange, setDateRange] = useState<DateRange>(24);

  // 날짜 범위에 따라 데이터 필터링 후 월별 평균 집계
  const chartData = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now.getFullYear(), now.getMonth() - dateRange, 1);

    const filtered = data.filter((t) => {
      const [year, month] = t.date.split('-').map(Number);
      return new Date(year, month - 1, 1) >= cutoff;
    });

    const byMonth: Record<string, number[]> = {};
    filtered.forEach((t) => {
      if (!byMonth[t.date]) byMonth[t.date] = [];
      byMonth[t.date].push(t.price);
    });

    const result = [];
    for (let i = dateRange - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const prices = byMonth[yearMonth];
      const avg = prices ? Math.round(prices.reduce((s, v) => s + v, 0) / prices.length) : null;

      result.push({
        date: yearMonth,
        label: formatLabel(yearMonth, dateRange),
        price: avg,
        count: prices?.length ?? 0,
      });
    }

    return result;
  }, [data, dateRange]);

  if (isLoading) {
    return (
      <FlexBox alignItems="center" justifyContent="center" style={{ height: '256px' }}>
        <Loading size="32px" />
      </FlexBox>
    );
  }

  if (data.length === 0) {
    return (
      <FlexBox flexDirection="column" alignItems="center" justifyContent="center" gap="8px" style={{ height: '256px' }}>
        <svg width="48" height="48" fill="none" stroke="var(--semantic-line-normal)" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <Typography variant="body2" sx={{ color: 'var(--semantic-label-assistive)' }}>
          거래 데이터가 없습니다
        </Typography>
      </FlexBox>
    );
  }

  return (
    <Box>
      {/* 날짜 범위 토글 */}
      <FlexBox gap="8px" style={{ marginBottom: '16px' }}>
        {([6, 12, 24] as DateRange[]).map((range) => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            style={{
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 150ms, color 150ms',
              backgroundColor: dateRange === range ? 'var(--semantic-primary-normal)' : 'var(--semantic-background-normal-alternative)',
              color: dateRange === range ? 'white' : 'var(--semantic-label-assistive)',
            }}
          >
            {range}개월
          </button>
        ))}
      </FlexBox>

      {/* 차트 — Recharts 그대로 유지 */}
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-chart-grid, #E5E8EB)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: 'var(--color-chart-axis, #8B95A1)' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--color-chart-axis, #8B95A1)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${(value / 10000).toFixed(0)}억`}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="price"
            stroke="var(--color-chart-line, #0066FF)"
            strokeWidth={2}
            dot={{ r: 3, fill: 'var(--color-chart-line, #0066FF)', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: 'var(--color-chart-line, #0066FF)' }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
});

PriceChart.displayName = 'PriceChart';
export default PriceChart;

// 차트 툴팁
function CustomTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { count: number; date: string } }>;
}) {
  if (!active || !payload || !payload[0]) return null;
  const { value, payload: data } = payload[0];
  if (!value) return null;

  const eok = Math.floor(value / 10000);
  const rest = value % 10000;
  const priceText = rest > 0 ? `${eok}억 ${rest.toLocaleString()}만` : `${eok}억`;

  return (
    <div style={{ backgroundColor: '#191F28', color: 'white', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
      <p style={{ color: '#8B95A1', marginBottom: '2px' }}>{formatYearMonth(data.date)}</p>
      <p style={{ fontWeight: 700, fontSize: '14px' }}>{priceText}</p>
      <p style={{ color: '#8B95A1' }}>거래 {data.count}건</p>
    </div>
  );
}

// X축 레이블 포맷
function formatLabel(yearMonth: string, range: number): string {
  const [year, month] = yearMonth.split('-');
  if (range <= 12) return `${month}월`;
  return parseInt(month) === 1 ? `${year.slice(2)}년` : `${month}월`;
}
