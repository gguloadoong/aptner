import React, { useId, useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { TradeHistory } from '../../types';
import { formatYearMonth } from '../../utils/formatNumber';
import { Box, FlexBox, Typography, Loading } from '@wanteddev/wds';

interface PriceChartProps {
  data: TradeHistory[];
  isLoading?: boolean;
}

type DateRange = 6 | 12 | 24;

// 차트 포인트 타입
interface ChartPoint {
  date: string;
  label: string;
  price: number | null;
  count: number;
}

// 실거래가 에어리어 차트 컴포넌트
const PriceChart = React.memo<PriceChartProps>(({ data, isLoading = false }) => {
  const [dateRange, setDateRange] = useState<DateRange>(24);

  // 동일 페이지에 PriceChart가 여러 개 마운트될 때 linearGradient id 충돌 방지
  const rawId = useId();
  const gradientId = `priceGradient-${rawId.replace(/:/g, '')}`;

  // 날짜 범위에 따라 데이터 필터링 후 월별 평균 집계
  const chartData = useMemo<ChartPoint[]>(() => {
    const now = new Date();
    const cutoff = new Date(now.getFullYear(), now.getMonth() - dateRange, 1);

    const filtered = data.filter((t) => {
      const [year, month] = t.dealDate.split('-').map(Number);
      return new Date(year, month - 1, 1) >= cutoff;
    });

    const byMonth: Record<string, number[]> = {};
    filtered.forEach((t) => {
      if (!byMonth[t.dealDate]) byMonth[t.dealDate] = [];
      byMonth[t.dealDate].push(t.price);
    });

    const result: ChartPoint[] = [];
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

  // 실제 거래 데이터가 하나라도 있는지 확인
  const hasData = chartData.some((d) => d.price !== null);

  // y축 도메인 계산 — 여백 10% 추가
  const yDomain = useMemo<[number, number] | undefined>(() => {
    const prices = chartData.filter((d) => d.price !== null).map((d) => d.price as number);
    if (prices.length === 0) return undefined;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const pad = Math.round((max - min) * 0.15) || Math.round(min * 0.05);
    return [Math.max(0, min - pad), max + pad];
  }, [chartData]);

  if (isLoading) {
    return (
      <FlexBox alignItems="center" justifyContent="center" style={{ height: '256px' }}>
        <Loading size="32px" />
      </FlexBox>
    );
  }

  if (!hasData) {
    return (
      <FlexBox flexDirection="column" alignItems="center" justifyContent="center" gap="8px" style={{ height: '256px' }}>
        <svg width="48" height="48" fill="none" stroke="var(--semantic-line-normal)" viewBox="0 0 24 24">
          <path
            strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <Typography variant="body2" sx={{ color: 'var(--semantic-label-assistive)' }}>
          거래 데이터가 없습니다
        </Typography>
        <Typography variant="caption1" sx={{ color: 'var(--semantic-label-assistive)' }}>
          다른 면적을 선택하거나 나중에 다시 확인해 주세요
        </Typography>
      </FlexBox>
    );
  }

  // 평균가 기준선 계산
  const avgPrice = useMemo(() => {
    const prices = chartData.filter((d) => d.price !== null).map((d) => d.price as number);
    if (prices.length === 0) return null;
    return Math.round(prices.reduce((s, v) => s + v, 0) / prices.length);
  }, [chartData]);

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
              backgroundColor:
                dateRange === range
                  ? 'var(--semantic-primary-normal)'
                  : 'var(--semantic-background-normal-alternative)',
              color:
                dateRange === range ? 'white' : 'var(--semantic-label-assistive)',
            }}
          >
            {range}개월
          </button>
        ))}
      </FlexBox>

      {/* 에어리어 차트 */}
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0066FF" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#0066FF" stopOpacity={0.01} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-chart-grid, #E5E8EB)"
            vertical={false}
          />

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
            tickFormatter={(value: number) => {
              const eok = value / 10000;
              return eok >= 1 ? `${eok.toFixed(0)}억` : `${value.toLocaleString()}만`;
            }}
            width={44}
            domain={yDomain}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* 평균가 기준선 */}
          {avgPrice !== null && (
            <ReferenceLine
              y={avgPrice}
              stroke="#8B95A1"
              strokeDasharray="4 3"
              strokeWidth={1}
              label={{
                value: `평균 ${avgPrice / 10000 % 1 === 0 ? avgPrice / 10000 : (avgPrice / 10000).toFixed(1)}억`,
                fill: '#8B95A1',
                fontSize: 10,
                position: 'insideTopRight',
              }}
            />
          )}

          <Area
            type="monotone"
            dataKey="price"
            stroke="#0066FF"
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{
              r: 5,
              fill: '#0066FF',
              stroke: 'white',
              strokeWidth: 2,
            }}
            connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
});

PriceChart.displayName = 'PriceChart';
export default PriceChart;

// 차트 툴팁
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: ChartPoint }>;
}) {
  if (!active || !payload || !payload[0]) return null;
  const { value, payload: data } = payload[0];
  if (!value) return null;

  const eok = Math.floor(value / 10000);
  const rest = value % 10000;
  const priceText =
    rest > 0 ? `${eok}억 ${rest.toLocaleString()}만` : `${eok}억`;

  return (
    <div
      style={{
        backgroundColor: '#191F28',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '8px',
        fontSize: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <p style={{ color: '#8B95A1', marginBottom: '4px', fontSize: '11px' }}>
        {formatYearMonth(data.date)}
      </p>
      <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>
        {priceText}
      </p>
      <p style={{ color: '#8B95A1', fontSize: '11px' }}>
        거래 {data.count}건
      </p>
    </div>
  );
}

// X축 레이블 포맷
function formatLabel(yearMonth: string, range: number): string {
  const [year, month] = yearMonth.split('-');
  if (range <= 12) return `${month}월`;
  return parseInt(month) === 1 ? `${year.slice(2)}년` : `${month}월`;
}
