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
} from 'recharts';
import ApartmentCard from '../components/apartment/ApartmentCard';
import { BottomNav } from './HomePage';
import { MOCK_WEEKLY_RANKING, MOCK_REGION_TRENDS, MOCK_SURGE_ALERTS } from '../mocks/trends.mock';
import { formatPriceShort, formatChange } from '../utils/formatNumber';

const REGIONS = ['전국', '서울', '경기', '인천', '부산'];

// 트렌드 페이지
export default function TrendPage() {
  const navigate = useNavigate();
  const [selectedRegion, setSelectedRegion] = useState('전국');

  // 지역 필터 적용
  const filteredRanking =
    selectedRegion === '전국'
      ? MOCK_WEEKLY_RANKING
      : MOCK_WEEKLY_RANKING.filter((apt) => apt.address.includes(selectedRegion));

  // 지역별 가격 변동 차트 데이터
  const chartData = MOCK_REGION_TRENDS.map((t) => ({
    region: t.region,
    change: t.priceChange,
    avg: Math.round(t.avgPrice / 10000), // 억 단위
  }));

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      {/* 헤더 */}
      <header className="bg-white border-b border-[#E5E8EB] sticky top-0 z-30 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-[#191F28]">트렌드</h1>
            <p className="text-xs text-[#8B95A1] mt-0.5">{new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} 기준</p>
          </div>
        </div>
      </header>

      <main className="pb-28">
        {/* 지역별 가격 변동 차트 */}
        <section className="bg-white px-5 py-5 mb-3">
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
                fill="#1B64DA"
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

        {/* 거래량 급등 알림 */}
        <section className="bg-white px-5 py-5 mb-3">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-[#FF4B4B] rounded-full animate-pulse" />
            <h2 className="text-base font-bold text-[#191F28]">거래량 급등 단지</h2>
          </div>
          <div className="space-y-3">
            {MOCK_SURGE_ALERTS.map((alert) => (
              <SurgeAlertCard key={alert.id} alert={alert} onPress={() => navigate(`/apartment/${alert.apartmentId}`)} />
            ))}
          </div>
        </section>

        {/* 주간 핫 아파트 TOP 20 */}
        <section className="px-5 py-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[#191F28]">주간 HOT 아파트</h2>
              <p className="text-xs text-[#8B95A1] mt-0.5">조회수 + 거래량 기준</p>
            </div>
          </div>

          {/* 지역 필터 */}
          <div className="flex gap-2 overflow-x-auto pb-3 -mx-5 px-5">
            {REGIONS.map((region) => (
              <button
                key={region}
                onClick={() => setSelectedRegion(region)}
                className={[
                  'flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-colors',
                  selectedRegion === region
                    ? 'bg-[#1B64DA] text-white'
                    : 'bg-white text-[#8B95A1] border border-[#E5E8EB]',
                ].join(' ')}
              >
                {region}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3">
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
      </main>

      <BottomNav />
    </div>
  );
}

// 지역 요약 카드
function RegionCard({ trend }: { trend: (typeof MOCK_REGION_TRENDS)[0] }) {
  const isUp = trend.priceChange > 0;
  const isDown = trend.priceChange < 0;

  return (
    <div className="bg-[#F5F6F8] rounded-xl p-3">
      <p className="text-xs font-bold text-[#191F28]">{trend.region}</p>
      <p className="text-sm font-black text-[#191F28] mt-1">
        {formatPriceShort(trend.avgPrice)}
      </p>
      <p
        className={[
          'text-xs font-semibold mt-0.5',
          isUp ? 'text-[#FF4B4B]' : isDown ? 'text-[#00C896]' : 'text-[#8B95A1]',
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
