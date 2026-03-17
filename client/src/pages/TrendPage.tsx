import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import api from '../services/api';
import ApartmentCard from '../components/apartment/ApartmentCard';
// BottomNav는 AppLayout에서 통합 처리됨
// MOCK_SURGE_ALERTS는 사용자 신뢰도 문제로 skeleton UI로 대체
import { MOCK_WEEKLY_RANKING } from '../mocks/trends.mock';
import { useHotApartments, useSupplyData } from '../hooks/useApartment';
import type { SupplyDataPoint } from '../services/apartment.service';
import { Chip, Box, FlexBox, Typography, TopNavigation, TopNavigationButton, Skeleton } from '@wanteddev/wds';
import { useIsPC } from '../hooks/useBreakpoint';
import { IconChevronLeft } from '@wanteddev/wds-icon';

const REGIONS = ['전국', '서울', '경기', '인천', '부산'];

// 지역 코드 맵 — BE /trends/region API 쿼리 파라미터용
const REGION_CODE_MAP: Record<string, string> = {
  '전국': '00', '서울': '11', '경기': '41', '인천': '28',
  '부산': '26', '대구': '27', '대전': '30', '광주': '29',
};

// 거래량 급등 단지 섹션 — 실 데이터 준비 전까지 숨김 처리
const SHOW_HOT_TRADES = false;

// 트렌드 페이지 — Tailwind 제거, WDS Box/FlexBox/Typography 사용
export default function TrendPage() {
  const navigate = useNavigate();
  const isMobile = !useIsPC();
  const [selectedRegion, setSelectedRegion] = useState('전국');
  const [supplyRegion, setSupplyRegion] = useState('전국');

  const hotRegionParam = selectedRegion === '전국' ? undefined : selectedRegion;
  const { data: hotApartments, isLoading: isHotLoading } = useHotApartments(hotRegionParam, 20);

  const rankingSource = hotApartments ?? MOCK_WEEKLY_RANKING;
  const filteredRanking = isHotLoading
    ? selectedRegion === '전국'
      ? MOCK_WEEKLY_RANKING
      : MOCK_WEEKLY_RANKING.filter((apt) => apt.address.includes(selectedRegion))
    : rankingSource;

  const { data: supplyData = [] } = useSupplyData(supplyRegion, 12);

  // 지역별 가격 변동률 — 실 API 연동 (BE /trends/region)
  const {
    data: regionTrends,
    isLoading: isRegionLoading,
    isError: isRegionError,
  } = useQuery({
    queryKey: ['trends', 'region', selectedRegion],
    queryFn: () =>
      api
        .get<{ success: true; data: Array<{ region: string; priceChange: number; avgPrice: number }> }>(
          `/trends/region?regionCode=${REGION_CODE_MAP[selectedRegion] ?? '00'}`
        )
        .then((r) => r.data.data),
    staleTime: 5 * 60 * 1000, // 5분 캐시
  });

  // API 응답을 차트 데이터로 변환
  const chartData = (regionTrends ?? []).map((t) => ({
    region: t.region,
    change: t.priceChange,
    avg: Math.round(t.avgPrice / 10000),
  }));

  return (
    <div style={{ minHeight: '100svh', backgroundColor: 'var(--semantic-background-normal-alternative)' }}>

      {/* 헤더 — 모바일: TopNavigation / PC: 인라인 헤더 */}
      {isMobile ? (
        <TopNavigation
          leadingContent={
            <TopNavigationButton onClick={() => navigate(-1)}>
              <IconChevronLeft />
            </TopNavigationButton>
          }
        >
          트렌드
        </TopNavigation>
      ) : (
        <Box
          as="header"
          sx={{
            backgroundColor: 'var(--semantic-background-normal-normal)',
            borderBottom: '1px solid var(--semantic-line-normal)',
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}
        >
          <Box sx={{ maxWidth: '1280px', margin: '0 auto', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Typography variant="body1" weight="bold" sx={{ color: 'var(--semantic-label-normal)', display: 'block' }}>
                트렌드
              </Typography>
              <Typography variant="caption1" sx={{ color: 'var(--semantic-label-assistive)', marginTop: '2px', display: 'block' }}>
                {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} 기준
              </Typography>
            </div>
          </Box>
        </Box>
      )}

      <Box as="main" sx={{ paddingBottom: isMobile ? '112px' : '32px' }}>
        <Box sx={{ maxWidth: '1280px', margin: '0 auto', padding: isMobile ? '0' : '0 24px' }}>

          {/* 데스크탑 2컬럼 레이아웃 */}
          <div
            style={{
              display: isMobile ? 'block' : 'grid',
              gridTemplateColumns: isMobile ? undefined : '1fr 420px',
              gap: isMobile ? undefined : '24px',
              paddingTop: isMobile ? undefined : '24px',
            }}
          >

            {/* 좌측 컬럼: 주간 HOT 랭킹 */}
            <div>
              <Box
                as="section"
                sx={{
                  padding: isMobile ? '20px' : '24px',
                  backgroundColor: 'var(--semantic-background-normal-normal)',
                  borderRadius: isMobile ? '0' : '16px',
                  border: isMobile ? 'none' : '1px solid var(--semantic-line-normal)',
                  marginBottom: isMobile ? '12px' : '0',
                }}
              >
                <FlexBox alignItems="center" justifyContent="space-between" style={{ marginBottom: '16px' }}>
                  <div>
                    <Typography variant="body1" weight="bold" sx={{ color: 'var(--semantic-label-normal)', display: 'block' }}>
                      주간 HOT 아파트
                    </Typography>
                    <Typography variant="caption1" sx={{ color: 'var(--semantic-label-assistive)', marginTop: '2px', display: 'block' }}>
                      조회수 + 거래량 기준
                    </Typography>
                  </div>
                </FlexBox>

                {/* 지역 필터 — WDS Chip */}
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    overflowX: 'auto',
                    paddingBottom: '12px',
                    scrollbarWidth: 'none',
                    flexWrap: isMobile ? undefined : 'wrap',
                  } as React.CSSProperties}
                >
                  {REGIONS.map((region) => (
                    <Chip
                      key={region}
                      size="small"
                      variant="outlined"
                      active={selectedRegion === region}
                      onClick={() => setSelectedRegion(region)}
                      style={{ flexShrink: 0 }}
                    >
                      {region}
                    </Chip>
                  ))}
                </div>

                <FlexBox flexDirection="column" gap="12px" style={{ marginTop: '12px' }}>
                  {filteredRanking.length === 0 ? (
                    <Box sx={{ padding: '32px 0', textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ color: 'var(--semantic-label-assistive)' }}>
                        {selectedRegion} 지역 데이터가 없습니다
                      </Typography>
                    </Box>
                  ) : (
                    filteredRanking.slice(0, 20).map((apt, index) => (
                      <ApartmentCard
                        key={apt.id}
                        apartment={apt}
                        rank={index + 1}
                        showRankChange
                      />
                    ))
                  )}
                </FlexBox>
              </Box>
            </div>

            {/* 우측 컬럼: 차트 + 급등 알림 */}
            <FlexBox flexDirection="column" gap="16px">

              {/* 지역별 가격 변동 차트 */}
              <Box
                as="section"
                sx={{
                  padding: isMobile ? '20px' : '24px',
                  backgroundColor: 'var(--semantic-background-normal-normal)',
                  borderRadius: isMobile ? '0' : '16px',
                  border: isMobile ? 'none' : '1px solid var(--semantic-line-normal)',
                  marginBottom: isMobile ? '12px' : '0',
                }}
              >
                <Typography variant="body1" weight="bold" sx={{ color: 'var(--semantic-label-normal)', display: 'block', marginBottom: '16px' }}>
                  지역별 가격 변동률
                </Typography>

                {/* 로딩 중 스켈레톤 */}
                {isRegionLoading && (
                  <Box sx={{ height: '200px', display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'flex-end' }}>
                    <FlexBox alignItems="flex-end" gap="8px" style={{ height: '160px' }}>
                      {[70, 45, 90, 55, 80].map((h, i) => (
                        <Skeleton key={i} variant="rectangle" width="100%" height={`${h}%`} style={{ borderRadius: '4px 4px 0 0', flex: 1 }} />
                      ))}
                    </FlexBox>
                    <FlexBox gap="8px">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} variant="text" width="100%" height="12px" style={{ flex: 1 }} />
                      ))}
                    </FlexBox>
                  </Box>
                )}

                {/* 에러 상태 */}
                {isRegionError && !isRegionLoading && (
                  <Box
                    sx={{
                      height: '200px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'var(--semantic-background-normal-alternative)',
                      borderRadius: '12px',
                    }}
                  >
                    <Typography variant="caption1" sx={{ color: 'var(--semantic-label-assistive)' }}>
                      데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
                    </Typography>
                  </Box>
                )}

                {/* 빈 상태 */}
                {!isRegionLoading && !isRegionError && chartData.length === 0 && (
                  <Box
                    sx={{
                      height: '200px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'var(--semantic-background-normal-alternative)',
                      borderRadius: '12px',
                    }}
                  >
                    <Typography variant="caption1" sx={{ color: 'var(--semantic-label-assistive)' }}>
                      {selectedRegion} 지역 변동률 데이터가 없습니다
                    </Typography>
                  </Box>
                )}

                {/* 차트 — 데이터 있을 때만 렌더링 */}
                {!isRegionLoading && !isRegionError && chartData.length > 0 && (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-chart-grid, #E5E8EB)" vertical={false} />
                      <XAxis dataKey="region" tick={{ fontSize: 12, fill: 'var(--color-chart-axis, #8B95A1)' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--color-chart-axis, #8B95A1)' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                      <Tooltip
                        formatter={(value) => [`${value}%`, '변동률']}
                        contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: 12 }}
                      />
                      <Bar dataKey="change" radius={[4, 4, 0, 0]} maxBarSize={40}>
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.change > 0 ? '#FF4B4B' : entry.change < 0 ? '#3B82F6' : 'var(--color-chart-line, #0066FF)'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>

              {/* 입주 물량 예정 차트 */}
              <Box
                as="section"
                sx={{
                  padding: isMobile ? '20px' : '24px',
                  backgroundColor: 'var(--semantic-background-normal-normal)',
                  borderRadius: isMobile ? '0' : '16px',
                  border: isMobile ? 'none' : '1px solid var(--semantic-line-normal)',
                  marginBottom: isMobile ? '12px' : '0',
                }}
              >
                <FlexBox alignItems="flex-start" justifyContent="space-between" style={{ marginBottom: '4px' }}>
                  <div>
                    <Typography variant="body1" weight="bold" sx={{ color: 'var(--semantic-label-normal)', display: 'block' }}>
                      입주 물량 예정
                    </Typography>
                    <Typography variant="caption1" sx={{ color: 'var(--semantic-label-assistive)', marginTop: '2px', display: 'block' }}>
                      향후 12개월 입주 예정 세대수 (단위: 세대)
                    </Typography>
                  </div>
                </FlexBox>

                {/* 지역 선택 필터 */}
                <Box sx={{ marginTop: '12px', marginBottom: '16px' }}>
                  <Typography variant="caption1" weight="medium" sx={{ color: 'var(--semantic-label-alternative)', display: 'block', marginBottom: '8px' }}>
                    지역 선택
                  </Typography>
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      overflowX: 'auto',
                      scrollbarWidth: 'none',
                    } as React.CSSProperties}
                  >
                    {REGIONS.map((r) => (
                      <Chip
                        key={r}
                        size="small"
                        variant="outlined"
                        active={supplyRegion === r}
                        onClick={() => setSupplyRegion(r)}
                        style={{ flexShrink: 0 }}
                      >
                        {r}
                      </Chip>
                    ))}
                  </div>
                </Box>

                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={supplyData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-chart-grid, #E5E8EB)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--color-chart-axis, #8B95A1)' }} tickLine={false} axisLine={false} tickFormatter={(v: string) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--color-chart-axis, #8B95A1)' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => v >= 10000 ? `${(v / 10000).toFixed(1)}만` : `${v.toLocaleString()}`} />
                    <Tooltip
                      formatter={(value) => [`${Number(value).toLocaleString()}세대`, '입주 예정']}
                      labelFormatter={(label) => String(label)}
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: 12 }}
                    />
                    <Bar dataKey="units" radius={[4, 4, 0, 0]} maxBarSize={32}>
                      {supplyData.map((entry: SupplyDataPoint, index) => {
                        const now = new Date();
                        const entryDate = new Date(entry.year, entry.monthNum - 1);
                        const diffMonths = (entryDate.getFullYear() - now.getFullYear()) * 12 + (entryDate.getMonth() - now.getMonth());
                        return <Cell key={`cell-${index}`} fill={diffMonths <= 2 ? 'var(--color-chart-line, #0066FF)' : '#BFDBFE'} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                {/* 범례 */}
                <FlexBox alignItems="center" gap="16px" style={{ marginTop: '8px' }}>
                  <FlexBox alignItems="center" gap="6px">
                    <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'var(--color-chart-line, #0066FF)' }} />
                    <Typography variant="caption2" sx={{ color: 'var(--semantic-label-assistive)' }}>3개월 내</Typography>
                  </FlexBox>
                  <FlexBox alignItems="center" gap="6px">
                    <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#BFDBFE' }} />
                    <Typography variant="caption2" sx={{ color: 'var(--semantic-label-assistive)' }}>이후 예정</Typography>
                  </FlexBox>
                </FlexBox>
              </Box>

              {/* 거래량 급등 단지 — 실 데이터 준비 완료 전까지 숨김 처리 */}
              {SHOW_HOT_TRADES && (
                <Box
                  as="section"
                  sx={{
                    padding: isMobile ? '20px' : '24px',
                    backgroundColor: 'var(--semantic-background-normal-normal)',
                    borderRadius: isMobile ? '0' : '16px',
                    border: isMobile ? 'none' : '1px solid var(--semantic-line-normal)',
                    marginBottom: isMobile ? '12px' : '0',
                  }}
                >
                  <FlexBox alignItems="center" gap="8px" style={{ marginBottom: '16px' }}>
                    <div style={{ width: '8px', height: '8px', backgroundColor: 'var(--semantic-line-normal)', borderRadius: '50%' }} />
                    <Typography variant="body1" weight="bold" sx={{ color: 'var(--semantic-label-normal)' }}>
                      거래량 급등 단지
                    </Typography>
                  </FlexBox>
                  <FlexBox flexDirection="column" gap="12px">
                    {[1, 2, 3].map((i) => (
                      <Box
                        key={i}
                        sx={{
                          padding: '16px',
                          backgroundColor: 'var(--semantic-background-normal-alternative)',
                          borderRadius: '12px',
                          border: '1px solid var(--semantic-line-normal)',
                        }}
                      >
                        <FlexBox alignItems="center" justifyContent="space-between">
                          <div style={{ flex: 1 }}>
                            <Skeleton variant="text" width="60%" height="14px" />
                            <Skeleton variant="text" width="40%" height="11px" style={{ marginTop: '6px' }} />
                          </div>
                          <Skeleton variant="rectangle" width="44px" height="24px" />
                        </FlexBox>
                      </Box>
                    ))}
                    <Typography variant="caption1" sx={{ color: 'var(--semantic-label-assistive)', textAlign: 'center', display: 'block', marginTop: '4px' }}>
                      거래량 데이터 준비 중입니다
                    </Typography>
                  </FlexBox>
                </Box>
              )}
            </FlexBox>
          </div>
        </Box>
      </Box>

    </div>
  );
}


