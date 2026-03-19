import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@wanteddev/wds';
import api from '../../services/api';

interface MarketSummary {
  avgPrice: number;       // 전국 평균가 (만원)
  priceChangeRate: number; // 전월 대비 변동률 (%)
  tradeCount: number;     // 이번 달 거래량 (건)
}

async function fetchMarketSummary(): Promise<MarketSummary> {
  const res = await api.get<{ success: boolean; data: MarketSummary }>('/trends/summary');
  return res.data.data;
}

// 만원 단위 → "N억 N,NNN만" 형식
function formatAvgPrice(manwon: number): string {
  if (manwon < 10000) return `${manwon.toLocaleString()}만`;
  const eok = Math.floor(manwon / 10000);
  const remainder = manwon % 10000;
  if (remainder === 0) return `${eok}억`;
  return `${eok}억 ${remainder.toLocaleString()}만`;
}

export default function MarketSummaryBanner() {
  const [hidden, setHidden] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['trends', 'region', '전국', 'monthly'],
    queryFn: fetchMarketSummary,
    staleTime: 10 * 60 * 1000, // 10분
    gcTime: 20 * 60 * 1000,
  });

  // 에러 시 3초 후 unmount
  useEffect(() => {
    if (!isError) return;
    const timer = setTimeout(() => setHidden(true), 3000);
    return () => clearTimeout(timer);
  }, [isError]);

  if (hidden) return null;

  if (isLoading) {
    return (
      <Skeleton
        variant="rectangle"
        width="100%"
        height="72px"
        style={{ borderRadius: 0 }}
      />
    );
  }

  if (isError) {
    return (
      <div
        style={{
          height: '72px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--semantic-background-normal-alternative)',
          borderBottom: '1px solid var(--semantic-line-normal)',
        }}
      >
        <span style={{ fontSize: '13px', color: 'var(--semantic-label-assistive)' }}>
          시장 데이터를 불러오는 중
        </span>
      </div>
    );
  }

  const isEmpty = !data || (data.avgPrice === 0 && data.tradeCount === 0);

  if (isEmpty) {
    return (
      <div
        style={{
          height: '72px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--semantic-background-normal-alternative)',
          borderBottom: '1px solid var(--semantic-line-normal)',
        }}
      >
        <span style={{ fontSize: '13px', color: 'var(--semantic-label-assistive)' }}>
          시장 데이터를 불러오는 중
        </span>
      </div>
    );
  }

  const rate = data.priceChangeRate;
  const rateSymbol = rate > 0 ? '▲' : rate < 0 ? '▼' : '—';
  const rateColor =
    rate > 0 ? '#FF4B4B' : rate < 0 ? '#3B82F6' : 'var(--semantic-label-assistive)';
  const rateText =
    rate === 0
      ? '—'
      : `${rate > 0 ? '+' : ''}${rate.toFixed(1)}%`;

  return (
    <section
      aria-label="전국 아파트 시장 요약"
      style={{
        height: '72px',
        display: 'flex',
        alignItems: 'stretch',
        backgroundColor: 'var(--semantic-background-normal-normal)',
        borderBottom: '1px solid var(--semantic-line-normal)',
      }}
    >
      <dl
        style={{
          display: 'flex',
          width: '100%',
          margin: 0,
          padding: '0 20px',
        }}
      >
        {/* 전국 평균 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px' }}>
          <dt style={{ fontSize: '11px', fontWeight: 400, color: 'var(--semantic-label-assistive)', margin: 0 }}>
            전국 평균
          </dt>
          <dd style={{ fontSize: '17px', fontWeight: 700, color: 'var(--semantic-label-normal)', fontFamily: 'var(--font-jetbrains, monospace)', margin: 0 }}>
            {data.avgPrice === 0 ? '—' : formatAvgPrice(data.avgPrice)}
          </dd>
        </div>

        {/* 전월 대비 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px', textAlign: 'center' }}>
          <dt style={{ fontSize: '11px', fontWeight: 400, color: 'var(--semantic-label-assistive)', margin: 0 }}>
            전월 대비
          </dt>
          <dd style={{ margin: 0 }}>
            {rate !== 0 && (
              <span style={{ fontSize: '11px', fontWeight: 600, color: rateColor }}>{rateSymbol} </span>
            )}
            <span style={{ fontSize: '17px', fontWeight: 700, color: rateColor, fontFamily: 'var(--font-jetbrains, monospace)' }}>
              {rateText}
            </span>
          </dd>
        </div>

        {/* 이번달 거래 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px', textAlign: 'right' }}>
          <dt style={{ fontSize: '11px', fontWeight: 400, color: 'var(--semantic-label-assistive)', margin: 0 }}>
            이번달 거래
          </dt>
          <dd style={{ fontSize: '17px', fontWeight: 700, color: 'var(--semantic-label-normal)', fontFamily: 'var(--font-jetbrains, monospace)', margin: 0 }}>
            {data.tradeCount === 0 ? '—' : `${data.tradeCount.toLocaleString()}건`}
          </dd>
        </div>
      </dl>
    </section>
  );
}
