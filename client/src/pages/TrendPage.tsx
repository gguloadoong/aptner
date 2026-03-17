import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import ApartmentCard from '../components/apartment/ApartmentCard';
// BottomNav는 AppLayout에서 통합 처리됨
import { MOCK_WEEKLY_RANKING, MOCK_REGION_TRENDS, MOCK_SURGE_ALERTS } from '../mocks/trends.mock';
import { formatPriceShort, formatChange } from '../utils/formatNumber';
import { useHotApartments, useSupplyData } from '../hooks/useApartment';
import type { SupplyDataPoint } from '../services/apartment.service';
import { Chip, Box, FlexBox, Typography, TopNavigation, TopNavigationButton } from '@wanteddev/wds';
import { useIsPC } from '../hooks/useBreakpoint';
import { IconChevronLeft } from '@wanteddev/wds-icon';

const REGIONS = ['전국', '서울', '경기', '인천', '부산'];

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

  const chartData = MOCK_REGION_TRENDS.map((t) => ({
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
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-chart-grid, #E5E8EB)" vertical={false} />
                    <XAxis dataKey="region" tick={{ fontSize: 12, fill: 'var(--color-chart-axis, #8B95A1)' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--color-chart-axis, #8B95A1)' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      formatter={(value) => [`${value}%`, '변동률']}
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: 12 }}
                    />
                    <Bar dataKey="change" fill="var(--color-chart-line, #0066FF)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>

                {/* 지역 요약 카드 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '16px' }}>
                  {MOCK_REGION_TRENDS.map((trend) => (
                    <RegionCard key={trend.region} trend={trend} />
                  ))}
                </div>
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

              {/* 거래량 급등 알림 */}
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
                  <div style={{ width: '8px', height: '8px', backgroundColor: '#FF4B4B', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
                  <Typography variant="body1" weight="bold" sx={{ color: 'var(--semantic-label-normal)' }}>
                    거래량 급등 단지
                  </Typography>
                </FlexBox>
                <FlexBox flexDirection="column" gap="12px">
                  {MOCK_SURGE_ALERTS.map((alert) => (
                    <SurgeAlertCard
                      key={alert.id}
                      alert={alert}
                      onPress={() => navigate(`/apartment/${alert.apartmentId}`)}
                    />
                  ))}
                </FlexBox>
              </Box>
            </FlexBox>
          </div>
        </Box>
      </Box>

    </div>
  );
}

// 지역 요약 카드
function RegionCard({ trend }: { trend: (typeof MOCK_REGION_TRENDS)[0] }) {
  const isUp = trend.priceChange > 0;
  const isDown = trend.priceChange < 0;

  return (
    <Box sx={{ backgroundColor: 'var(--semantic-background-normal-alternative)', borderRadius: '12px', padding: '12px' }}>
      <Typography variant="caption1" weight="bold" sx={{ color: 'var(--semantic-label-normal)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {trend.region}
      </Typography>
      <Typography variant="body2" weight="bold" sx={{ color: 'var(--semantic-label-normal)', display: 'block', marginTop: '4px' }}>
        {formatPriceShort(trend.avgPrice)}
      </Typography>
      <Typography
        variant="caption1"
        weight="medium"
        sx={{ color: isUp ? '#FF4B4B' : isDown ? '#3B82F6' : 'var(--semantic-label-assistive)', display: 'block', marginTop: '2px' }}
      >
        {isUp ? '▲' : isDown ? '▼' : ''} {formatChange(trend.priceChange)}
      </Typography>
      <Typography variant="caption2" sx={{ color: 'var(--semantic-label-assistive)', display: 'block', marginTop: '4px' }}>
        {trend.tradeVolume.toLocaleString()}건
      </Typography>
    </Box>
  );
}

// 거래량 급등 카드
function SurgeAlertCard({
  alert,
  onPress,
}: {
  alert: (typeof MOCK_SURGE_ALERTS)[0];
  onPress: () => void;
}) {
  return (
    <button
      onClick={onPress}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px',
        backgroundColor: '#FFF5F5',
        borderRadius: '12px',
        border: '1px solid rgba(255,75,75,0.1)',
        cursor: 'pointer',
        transition: 'background-color 150ms',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FFEBEB'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FFF5F5'; }}
    >
      <div style={{ textAlign: 'left' }}>
        <FlexBox alignItems="center" gap="8px">
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#FF4B4B', backgroundColor: 'rgba(255,75,75,0.1)', padding: '2px 8px', borderRadius: '9999px' }}>
            급등
          </span>
          <Typography variant="body2" weight="bold" sx={{ color: 'var(--semantic-label-normal)' }}>
            {alert.apartmentName}
          </Typography>
        </FlexBox>
        <Typography variant="caption1" sx={{ color: 'var(--semantic-label-assistive)', display: 'block', marginTop: '4px' }}>
          {alert.district} · {alert.date}
        </Typography>
      </div>
      <div style={{ textAlign: 'right' }}>
        <Typography variant="body1" weight="bold" sx={{ color: '#FF4B4B' }}>
          +{alert.surgeRate.toFixed(0)}%
        </Typography>
        <Typography variant="caption1" sx={{ color: 'var(--semantic-label-assistive)', display: 'block' }}>
          {alert.previousVolume}건 → {alert.currentVolume}건
        </Typography>
      </div>
    </button>
  );
}
