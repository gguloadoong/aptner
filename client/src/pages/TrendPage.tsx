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
import { BottomNav } from './HomePage';
import { MOCK_WEEKLY_RANKING, MOCK_REGION_TRENDS, MOCK_SURGE_ALERTS } from '../mocks/trends.mock';
import { formatPriceShort, formatChange } from '../utils/formatNumber';
import { useHotApartments, useSupplyData } from '../hooks/useApartment';
import type { SupplyDataPoint } from '../services/apartment.service';
import { Chip } from '@wanteddev/wds';

const REGIONS = ['전국', '서울', '경기', '인천', '부산'];

// 트렌드 페이지 - 데스크탑: 2컬럼 (랭킹 | 차트 + 급등)
export default function TrendPage() {
  const navigate = useNavigate();
  const [selectedRegion, setSelectedRegion] = useState('전국');
  const [supplyRegion, setSupplyRegion] = useState('전국');

  // MAJOR-04: useHotApartments로 실 데이터 페칭 (selectedRegion 파라미터 전달)
  const hotRegionParam = selectedRegion === '전국' ? undefined : selectedRegion;
  const { data: hotApartments, isLoading: isHotLoading } = useHotApartments(hotRegionParam, 20);

  // 로딩 중에는 MOCK 데이터를 폴백으로 사용하여 빈 화면 방지
  const rankingSource = hotApartments ?? MOCK_WEEKLY_RANKING;
  const filteredRanking = isHotLoading
    ? selectedRegion === '전국'
      ? MOCK_WEEKLY_RANKING
      : MOCK_WEEKLY_RANKING.filter((apt) => apt.address.includes(selectedRegion))
    : rankingSource;

  // 입주 물량 예정 데이터
  const { data: supplyData = [] } = useSupplyData(supplyRegion, 12);

  // 지역별 가격 변동 차트 데이터 (MOCK_REGION_TRENDS는 BE API 미제공으로 유지)
  const chartData = MOCK_REGION_TRENDS.map((t) => ({
    region: t.region,
    change: t.priceChange,
    avg: Math.round(t.avgPrice / 10000), // 억 단위
  }));

  return (
    <div className="min-h-screen bg-[#F7FAF8]">
      {/* 헤더 — 통일된 py-4, text-base font-bold */}
      <header className="bg-white border-b border-[#E5E8EB] sticky top-0 z-30">
        <div className="max-w-screen-xl mx-auto px-5 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-[#191F28]">트렌드</h1>
            <p className="text-[11px] text-[#8B95A1] mt-0.5">
              {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} 기준
            </p>
          </div>
          {/* 홈으로 (PC) */}
          <button
            onClick={() => navigate('/')}
            className="hidden lg:flex items-center gap-1.5 text-[13px] text-[#8B95A1] hover:text-blue-600 transition-colors duration-150"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            홈으로
          </button>
        </div>
      </header>

      <main className="pb-28 md:pb-8">
        <div className="max-w-screen-xl mx-auto md:px-6">

          {/* 데스크탑 2컬럼 레이아웃 */}
          <div className="md:grid md:grid-cols-[1fr_420px] md:gap-6 md:pt-6">

            {/* 좌측 컬럼: 주간 HOT 랭킹 */}
            <div>
              {/* 주간 핫 아파트 TOP 20 */}
              <section className="px-5 py-5 md:px-0 md:py-0 md:bg-white md:rounded-2xl md:border md:border-[#E5E8EB] md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-[#191F28]">주간 HOT 아파트</h2>
                    <p className="text-xs text-[#8B95A1] mt-0.5">조회수 + 거래량 기준</p>
                  </div>
                </div>

                {/* 지역 필터 - WDS Chip */}
                <div className="flex gap-2 overflow-x-auto pb-3 -mx-5 px-5 md:mx-0 md:px-0 md:overflow-visible md:flex-wrap">
                  {REGIONS.map((region) => (
                    <Chip
                      key={region}
                      size="small"
                      variant="outlined"
                      active={selectedRegion === region}
                      onClick={() => setSelectedRegion(region)}
                      className="flex-shrink-0"
                    >
                      {region}
                    </Chip>
                  ))}
                </div>

                <div className="flex flex-col gap-3 mt-3">
                  {filteredRanking.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-[#8B95A1]">{selectedRegion} 지역 데이터가 없습니다</p>
                    </div>
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
                </div>
              </section>
            </div>

            {/* 우측 컬럼: 차트 + 급등 알림 */}
            <div className="space-y-4 md:space-y-4">
              {/* 지역별 가격 변동 차트 */}
              <section className="bg-white px-5 py-5 mb-3 md:mb-0 md:rounded-2xl md:border md:border-[#E5E8EB] md:p-6">
                <h2 className="text-base font-bold text-[#191F28] mb-4">지역별 가격 변동률</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E8EB" vertical={false} />
                    <XAxis
                      dataKey="region"
                      tick={{ fontSize: 12, fill: '#8B95A1' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#8B95A1' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      formatter={(value) => [`${value}%`, '변동률']}
                      contentStyle={{
                        borderRadius: 12,
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="change"
                      fill="#0066FF"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>

                {/* 지역 요약 카드 */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {MOCK_REGION_TRENDS.map((trend) => (
                    <RegionCard key={trend.region} trend={trend} />
                  ))}
                </div>
              </section>

              {/* 입주 물량 예정 차트 */}
              <section className="bg-white px-5 py-5 mb-3 md:mb-0 md:rounded-2xl md:border md:border-[#E5E8EB] md:p-6">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <h2 className="text-base font-bold text-[#191F28]">입주 물량 예정</h2>
                    <p className="text-xs text-[#8B95A1] mt-0.5">
                      향후 12개월 입주 예정 세대수 (단위: 세대)
                    </p>
                  </div>
                </div>
                {/* 지역 선택 라벨 + 필터 */}
                <div className="mt-3 mb-4">
                  <p className="text-[11px] font-semibold text-[#4E5968] mb-2">지역 선택</p>
                  <div className="flex gap-2 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {REGIONS.map((r) => (
                      <Chip
                        key={r}
                        size="small"
                        variant="outlined"
                        active={supplyRegion === r}
                        onClick={() => setSupplyRegion(r)}
                        className="flex-shrink-0"
                      >
                        {r}
                      </Chip>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={supplyData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E8EB" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 10, fill: '#8B95A1' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: string) => v.slice(5)} // MM만 표시
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#8B95A1' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => v >= 10000 ? `${(v/10000).toFixed(1)}만` : `${v.toLocaleString()}`}
                    />
                    <Tooltip
                      formatter={(value) => [`${Number(value).toLocaleString()}세대`, '입주 예정']}
                      labelFormatter={(label) => String(label)}
                      contentStyle={{
                        borderRadius: 12,
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="units" radius={[4, 4, 0, 0]} maxBarSize={32}>
                      {supplyData.map((entry: SupplyDataPoint, index) => {
                        // 현재 달 기준으로 3개월 내는 강조 색상
                        const now = new Date();
                        const entryDate = new Date(entry.year, entry.monthNum - 1);
                        const diffMonths = (entryDate.getFullYear() - now.getFullYear()) * 12 + (entryDate.getMonth() - now.getMonth());
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={diffMonths <= 2 ? '#0066FF' : '#BFDBFE'}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-[#0066FF]" />
                    <span className="text-[11px] text-[#8B95A1]">3개월 내</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-[#BFDBFE]" />
                    <span className="text-[11px] text-[#8B95A1]">이후 예정</span>
                  </div>
                </div>
              </section>

              {/* 거래량 급등 알림 */}
              <section className="bg-white px-5 py-5 mb-3 md:mb-0 md:rounded-2xl md:border md:border-[#E5E8EB] md:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-[#FF4B4B] rounded-full animate-pulse" />
                  <h2 className="text-base font-bold text-[#191F28]">거래량 급등 단지</h2>
                </div>
                <div className="space-y-3">
                  {MOCK_SURGE_ALERTS.map((alert) => (
                    <SurgeAlertCard
                      key={alert.id}
                      alert={alert}
                      onPress={() => navigate(`/apartment/${alert.apartmentId}`)}
                    />
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      {/* 모바일 하단 내비게이션 — lg 이상은 사이드바가 대체 */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
}

// 지역 요약 카드
function RegionCard({ trend }: { trend: (typeof MOCK_REGION_TRENDS)[0] }) {
  const isUp = trend.priceChange > 0;
  const isDown = trend.priceChange < 0;

  return (
    <div className="bg-[#F7FAF8] rounded-xl p-3">
      <p className="text-xs font-bold text-[#191F28] truncate">{trend.region}</p>
      <p className="text-sm font-black text-[#191F28] mt-1">
        {formatPriceShort(trend.avgPrice)}
      </p>
      <p
        className={[
          'text-xs font-semibold mt-0.5',
          isUp ? 'text-[#FF4B4B]' : isDown ? 'text-[#3B82F6]' : 'text-[#8B95A1]',
        ].join(' ')}
      >
        {isUp ? '▲' : isDown ? '▼' : ''} {formatChange(trend.priceChange)}
      </p>
      <p className="text-[10px] text-[#8B95A1] mt-1">{trend.tradeVolume.toLocaleString()}건</p>
    </div>
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
      className="w-full flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100 hover:bg-red-100 transition-colors"
    >
      <div className="text-left">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#FF4B4B] bg-red-100 px-2 py-0.5 rounded-full">
            급등
          </span>
          <span className="text-sm font-bold text-[#191F28]">{alert.apartmentName}</span>
        </div>
        <p className="text-xs text-[#8B95A1] mt-1">{alert.district} · {alert.date}</p>
      </div>
      <div className="text-right">
        <p className="text-base font-black text-[#FF4B4B]">+{alert.surgeRate.toFixed(0)}%</p>
        <p className="text-xs text-[#8B95A1]">
          {alert.previousVolume}건 → {alert.currentVolume}건
        </p>
      </div>
    </button>
  );
}
