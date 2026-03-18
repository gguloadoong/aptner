// 단지 비교 페이지 — /compare 라우트
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompareStore } from '../stores/compareStore';
import { useApartmentDetail, useApartmentHistory } from '../hooks/useApartment';
import { useQuery } from '@tanstack/react-query';
import { getJeonseRate } from '../services/apartment.service';
import { formatPriceShort, formatChange, formatUnits, formatArea } from '../utils/formatNumber';
import {
  Button, TextButton, Loading,
  Box, FlexBox, Typography, TopNavigation, TopNavigationButton,
} from '@wanteddev/wds';
import { IconChevronLeft, IconClose, IconArrowRight } from '@wanteddev/wds-icon';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { TradeHistory } from '../types';

// 비교 행 — 레이블 + 단지별 값 나란히 표시
interface CompareRowProps {
  label: string;
  values: React.ReactNode[];
  highlight?: 'max' | 'min' | 'none';
  rawValues?: number[];
}

function CompareRow({ label, values, highlight = 'none', rawValues }: CompareRowProps) {
  const highlightIdx = React.useMemo(() => {
    if (highlight === 'none' || !rawValues || rawValues.length === 0) return -1;
    if (highlight === 'max') return rawValues.indexOf(Math.max(...rawValues));
    if (highlight === 'min') return rawValues.indexOf(Math.min(...rawValues));
    return -1;
  }, [highlight, rawValues]);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `120px repeat(${values.length}, 1fr)`,
        borderBottom: '1px solid var(--semantic-background-normal-alternative)',
      }}
    >
      {/* 레이블 셀 */}
      <div
        style={{
          padding: '12px',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--semantic-background-normal-alternative)',
        }}
      >
        <Typography variant="caption1" weight="medium" sx={{ color: 'var(--semantic-label-assistive)' }}>
          {label}
        </Typography>
      </div>
      {/* 값 셀 */}
      {values.map((val, idx) => (
        <div
          key={idx}
          style={{
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            backgroundColor: highlightIdx === idx ? 'rgba(0,102,255,0.05)' : undefined,
          }}
        >
          <Typography
            variant="caption1"
            weight="medium"
            sx={{ color: highlightIdx === idx ? 'var(--semantic-primary-normal)' : 'var(--semantic-label-normal)' }}
          >
            {val}
          </Typography>
        </div>
      ))}
    </div>
  );
}

// 섹션 헤더 행
function SectionHeaderRow({ label, colCount }: { label: string; colCount: number }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `120px repeat(${colCount}, 1fr)`,
        backgroundColor: 'rgba(0,102,255,0.04)',
        borderBottom: '1px solid var(--semantic-line-normal)',
      }}
    >
      <div style={{ padding: '8px 12px', gridColumn: '1 / -1' }}>
        <Typography variant="caption2" weight="bold" sx={{ color: 'var(--semantic-primary-normal)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </Typography>
      </div>
    </div>
  );
}

// 단지 헤더 셀
interface AptHeaderCellProps {
  name: string;
  address: string;
  id: string;
  onRemove: (id: string) => void;
}

function AptHeaderCell({ name, address, id, onRemove }: AptHeaderCellProps) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        padding: '16px 12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        position: 'relative',
        borderLeft: '1px solid var(--semantic-line-normal)',
      }}
    >
      {/* X 버튼 */}
      <button
        onClick={() => onRemove(id)}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#C4C9CF',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          borderRadius: '50%',
          transition: 'color 100ms, background-color 100ms',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = '#FF4B4B';
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FFF5F5';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = '#C4C9CF';
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
        }}
        aria-label={`${name} 제거`}
      >
        <IconClose style={{ width: 12, height: 12 }} />
      </button>
      {/* 단지명 */}
      <button
        onClick={() => navigate(`/apartment/${id}`)}
        style={{
          fontSize: '14px',
          fontWeight: 700,
          color: 'var(--semantic-label-normal)',
          textAlign: 'center',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          lineHeight: 1.3,
          transition: 'color 100ms',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--semantic-primary-normal)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--semantic-label-normal)'; }}
      >
        {name}
      </button>
      {/* 주소 */}
      <Typography variant="caption2" sx={{ color: 'var(--semantic-label-assistive)', textAlign: 'center', lineHeight: 1.3 }}>
        {address}
      </Typography>
    </div>
  );
}

// 단지별 전세가율 조회 훅
function useJeonseRate(id: string | undefined, lawdCd: string | undefined) {
  return useQuery({
    queryKey: ['apartment', id, 'jeonse-rate', lawdCd],
    queryFn: () => getJeonseRate(id!, lawdCd),
    enabled: !!id && !!lawdCd,
    staleTime: 10 * 60 * 1000,
  });
}

// 단지별 색상 팔레트 (파랑/오렌지/초록)
const CHART_COLORS = ['#0066FF', '#FF6B2B', '#22C55E'] as const;

// 가격 추이 비교 차트 — recharts LineChart
interface PriceHistoryChartProps {
  ids: string[];
  names: string[];
}

function PriceHistoryChart({ ids, names }: PriceHistoryChartProps) {
  // 각 단지 히스토리를 병렬 조회 (최대 3개)
  const h0 = useApartmentHistory(ids[0], undefined, 24);
  const h1 = useApartmentHistory(ids[1], undefined, 24);
  const h2 = useApartmentHistory(ids[2], undefined, 24);
  const histories = [h0, h1, h2].slice(0, ids.length);

  const isLoading = histories.some((h) => h.isLoading);

  // 히스토리 데이터를 날짜 기준으로 병합
  const chartData = React.useMemo(() => {
    // 각 단지의 날짜 집합 수집
    const dateSet = new Set<string>();
    histories.forEach((h) => {
      (h.data ?? []).forEach((t: TradeHistory) => dateSet.add(t.dealDate));
    });

    // 날짜 오름차순 정렬
    const sortedDates = Array.from(dateSet).sort();

    // 단지별 날짜→가격 맵 생성
    const priceByDateByApt: Record<string, number>[] = histories.map((h) => {
      const map: Record<string, number> = {};
      (h.data ?? []).forEach((t: TradeHistory) => {
        // 같은 날짜에 여러 거래가 있을 경우 마지막 값 사용
        map[t.dealDate] = t.price;
      });
      return map;
    });

    return sortedDates.map((date) => {
      const entry: Record<string, string | number | null> = { date };
      ids.forEach((_, idx) => {
        entry[`apt${idx}`] = priceByDateByApt[idx]?.[date] != null
          ? priceByDateByApt[idx][date] / 10000  // 만원 → 억원
          : null;
      });
      return entry;
    });
  }, [histories, ids]);

  const hasData = chartData.length > 0;

  // 로딩 스켈레톤
  if (isLoading) {
    return (
      <Box
        sx={{
          backgroundColor: 'var(--semantic-background-normal-normal)',
          borderRadius: '16px',
          border: '1px solid var(--semantic-line-normal)',
          padding: '24px',
          marginTop: '16px',
        }}
      >
        <Typography variant="body2" weight="bold" sx={{ color: 'var(--semantic-label-normal)', display: 'block', marginBottom: '16px' }}>
          가격 추이 비교
        </Typography>
        <div
          style={{
            height: '240px',
            borderRadius: '12px',
            backgroundColor: 'var(--semantic-background-normal-alternative)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      </Box>
    );
  }

  // 데이터 없는 경우
  if (!hasData) {
    return (
      <Box
        sx={{
          backgroundColor: 'var(--semantic-background-normal-normal)',
          borderRadius: '16px',
          border: '1px solid var(--semantic-line-normal)',
          padding: '24px',
          marginTop: '16px',
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" weight="bold" sx={{ color: 'var(--semantic-label-normal)', display: 'block', marginBottom: '12px' }}>
          가격 추이 비교
        </Typography>
        <Typography variant="caption1" sx={{ color: 'var(--semantic-label-assistive)' }}>
          거래 데이터가 없습니다
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        backgroundColor: 'var(--semantic-background-normal-normal)',
        borderRadius: '16px',
        border: '1px solid var(--semantic-line-normal)',
        padding: '24px',
        marginTop: '16px',
      }}
    >
      <Typography variant="body2" weight="bold" sx={{ color: 'var(--semantic-label-normal)', display: 'block', marginBottom: '20px' }}>
        가격 추이 비교 (최근 24개월)
      </Typography>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--semantic-line-normal)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: 'var(--semantic-label-assistive)' }}
            tickFormatter={(v: string) => v.slice(0, 7)}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--semantic-label-assistive)' }}
            tickFormatter={(v: number) => `${v.toFixed(0)}억`}
            width={48}
          />
          <Tooltip
            formatter={(value, name) => {
              const nameStr = String(name ?? '');
              const idx = parseInt(nameStr.replace('apt', ''), 10);
              const v = typeof value === 'number' ? value : parseFloat(String(value ?? '0'));
              return [`${v.toFixed(2)}억`, names[idx] ?? nameStr] as [string, string];
            }}
            labelFormatter={(label: unknown) => String(label ?? '')}
            contentStyle={{
              fontSize: '12px',
              borderRadius: '8px',
              border: '1px solid var(--semantic-line-normal)',
              backgroundColor: 'var(--semantic-background-normal-normal)',
            }}
          />
          <Legend
            formatter={(value: string) => {
              const idx = parseInt(value.replace('apt', ''), 10);
              return (
                <span style={{ fontSize: '12px', color: 'var(--semantic-label-alternative)' }}>
                  {names[idx] ?? value}
                </span>
              );
            }}
          />
          {ids.map((_, idx) => (
            <Line
              key={`apt${idx}`}
              type="monotone"
              dataKey={`apt${idx}`}
              stroke={CHART_COLORS[idx]}
              strokeWidth={2}
              dot={false}
              connectNulls
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}

// 비교 테이블
function CompareTable({ ids }: { ids: string[] }) {
  const q0 = useApartmentDetail(ids[0]);
  const q1 = useApartmentDetail(ids[1]);
  const q2 = useApartmentDetail(ids[2]);

  // 전세가율 조회 (단지별) — lawdCd는 상세 조회 후 확보
  const jr0 = useJeonseRate(ids[0], q0.data?.lawdCd);
  const jr1 = useJeonseRate(ids[1], q1.data?.lawdCd);
  const jr2 = useJeonseRate(ids[2], q2.data?.lawdCd);

  const queries = [q0, q1, q2].slice(0, ids.length);
  const isLoading = queries.some((q) => q.isLoading);
  const apts = queries.map((q) => q.data ?? null);

  const removeCompare = useCompareStore((s) => s.removeCompare);

  if (isLoading) {
    return (
      <FlexBox alignItems="center" justifyContent="center" style={{ padding: '64px 0' }}>
        <Loading size="32px" />
      </FlexBox>
    );
  }

  const validApts = apts.filter(Boolean);
  if (validApts.length === 0) {
    return (
      <Box sx={{ padding: '48px 0', textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: 'var(--semantic-label-assistive)' }}>
          단지 정보를 불러올 수 없습니다
        </Typography>
      </Box>
    );
  }

  const colCount = ids.length;

  const priceChangeColor = (type: 'up' | 'down' | 'flat') =>
    type === 'up' ? '#FF4B4B' : type === 'down' ? '#3B82F6' : 'var(--semantic-label-assistive)';
  const priceArrow = (type: 'up' | 'down' | 'flat') =>
    type === 'up' ? '▲ ' : type === 'down' ? '▼ ' : '';

  return (
    <Box
      sx={{
        backgroundColor: 'var(--semantic-background-normal-normal)',
        borderRadius: '16px',
        border: '1px solid var(--semantic-line-normal)',
        overflow: 'hidden',
      }}
    >
      {/* 단지 헤더 행 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `120px repeat(${colCount}, 1fr)`,
          borderBottom: '2px solid var(--semantic-line-normal)',
          backgroundColor: 'var(--semantic-background-normal-alternative)',
        }}
      >
        <div style={{ padding: '16px 12px', display: 'flex', alignItems: 'flex-end' }}>
          <Typography variant="caption2" weight="medium" sx={{ color: '#C4C9CF' }}>단지</Typography>
        </div>
        {apts.map((apt, idx) =>
          apt ? (
            <AptHeaderCell
              key={apt.id}
              id={apt.id}
              name={apt.name}
              address={apt.address || `${apt.district} ${apt.dong}`}
              onRemove={removeCompare}
            />
          ) : (
            <div
              key={`empty-${idx}`}
              style={{ padding: '16px 12px', borderLeft: '1px solid var(--semantic-line-normal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Typography variant="caption1" sx={{ color: '#C4C9CF' }}>-</Typography>
            </div>
          )
        )}
      </div>

      {/* 기본 정보 섹션 */}
      <SectionHeaderRow label="기본 정보" colCount={colCount} />
      <CompareRow label="주소" values={apts.map((apt) => apt?.address ?? (apt ? `${apt?.district} ${apt?.dong}` : '-'))} />
      <CompareRow label="세대수" values={apts.map((apt) => apt ? formatUnits(apt.totalUnits) : '-')} highlight="max" rawValues={apts.map((apt) => apt?.totalUnits ?? 0)} />
      <CompareRow label="준공년도" values={apts.map((apt) => apt ? `${apt.builtYear}년` : '-')} highlight="max" rawValues={apts.map((apt) => apt?.builtYear ?? 0)} />
      <CompareRow label="건설사" values={apts.map((apt) => apt?.builder ?? '-')} />

      {/* 가격 정보 섹션 */}
      <SectionHeaderRow label="가격 정보" colCount={colCount} />
      <CompareRow
        label="최근 거래가"
        values={apts.map((apt) =>
          apt ? (
            <span>
              {formatPriceShort(apt.recentPrice)}
              <span style={{ fontSize: '10px', color: 'var(--semantic-label-assistive)', marginLeft: '4px' }}>({apt.recentPriceArea}㎡)</span>
            </span>
          ) : '-'
        )}
        highlight="max"
        rawValues={apts.map((apt) => apt?.recentPrice ?? 0)}
      />
      <CompareRow
        label="가격 변동률"
        values={apts.map((apt) =>
          apt ? (
            <span style={{ color: priceChangeColor(apt.priceChangeType) }}>
              {priceArrow(apt.priceChangeType)}{formatChange(apt.priceChange)}
            </span>
          ) : '-'
        )}
        highlight="max"
        rawValues={apts.map((apt) => apt?.priceChange ?? 0)}
      />
      {/* 전세가율 행 — 낮을수록 투자 위험 낮음 → min 강조 */}
      <CompareRow
        label="전세가율"
        values={[jr0, jr1, jr2].slice(0, ids.length).map((jr) => {
          if (jr.isLoading) return <span style={{ color: 'var(--semantic-label-assistive)' }}>...</span>;
          if (jr.data == null) return '-';
          return `${jr.data.toFixed(1)}%`;
        })}
        highlight="min"
        rawValues={[jr0, jr1, jr2].slice(0, ids.length).map((jr) =>
          jr.data != null ? jr.data : Infinity
        )}
      />

      {/* 면적 정보 섹션 */}
      <SectionHeaderRow label="면적 구성" colCount={colCount} />
      <CompareRow
        label="제공 면적"
        values={apts.map((apt) => apt ? apt.areas.map((a) => formatArea(a)).join(', ') : '-')}
      />
    </Box>
  );
}

// ComparePage — 메인 페이지
export default function ComparePage() {
  const navigate = useNavigate();
  const compareList = useCompareStore((s) => s.compareList);
  const clearCompare = useCompareStore((s) => s.clearCompare);

  return (
    <div style={{ minHeight: '100svh', backgroundColor: 'var(--semantic-background-normal-alternative)' }}>
      {/* 헤더 — WDS TopNavigation */}
      <TopNavigation
        leadingContent={
          <TopNavigationButton onClick={() => navigate(-1)} aria-label="뒤로가기">
            <IconChevronLeft />
          </TopNavigationButton>
        }
        trailingContent={
          compareList.length > 0 ? (
            <TextButton size="small" color="assistive" onClick={clearCompare}>
              초기화
            </TextButton>
          ) : undefined
        }
      >
        단지 비교
      </TopNavigation>

      <Box as="main" sx={{ paddingBottom: '32px' }}>
        <Box sx={{ maxWidth: '1280px', margin: '0 auto', padding: '20px 16px' }}>

          {/* 비교할 단지가 없을 때 */}
          {compareList.length === 0 && (
            <Box
              sx={{
                backgroundColor: 'var(--semantic-background-normal-normal)',
                borderRadius: '16px',
                border: '1px solid var(--semantic-line-normal)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '64px 24px',
                textAlign: 'center',
              }}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C4C9CF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 17H5a2 2 0 00-2 2" />
                <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v14" />
                <path d="M5 21h14a2 2 0 002-2V9a2 2 0 00-2-2H9" />
              </svg>
              <Typography variant="body1" weight="bold" sx={{ color: 'var(--semantic-label-alternative)', display: 'block', marginTop: '16px' }}>
                비교할 단지를 선택해주세요
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--semantic-label-assistive)', display: 'block', marginTop: '8px' }}>
                단지 카드의 + 버튼을 눌러 최대 3개 단지를 비교할 수 있습니다
              </Typography>
              <Box sx={{ marginTop: '24px' }}>
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  onClick={() => navigate('/')}
                  trailingContent={<IconArrowRight />}
                >
                  단지 둘러보기
                </Button>
              </Box>
            </Box>
          )}

          {/* 비교할 단지가 1개일 때 */}
          {compareList.length === 1 && (
            <>
              <Box
                sx={{
                  marginBottom: '16px',
                  backgroundColor: '#FFF9E6',
                  border: '1px solid rgba(246,201,14,0.3)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                }}
              >
                <Typography variant="body2" weight="medium" sx={{ color: '#856404' }}>
                  비교는 최소 2개 단지가 필요합니다. 단지를 하나 더 추가해주세요.
                </Typography>
              </Box>
              <CompareTable ids={compareList.map((item) => item.id)} />
            </>
          )}

          {/* 비교 테이블 (2개 이상) + 가격 추이 차트 */}
          {compareList.length >= 2 && (
            <>
              <CompareTable ids={compareList.map((item) => item.id)} />
              <PriceHistoryChart
                ids={compareList.map((item) => item.id)}
                names={compareList.map((item) => item.name)}
              />
            </>
          )}
        </Box>
      </Box>
    </div>
  );
}
