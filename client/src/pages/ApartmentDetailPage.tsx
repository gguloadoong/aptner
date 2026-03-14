import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApartmentDetail, useApartmentHistory } from '../hooks/useApartment';
import PriceChart from '../components/apartment/PriceChart';
import TradeHistoryTable from '../components/apartment/TradeHistoryTable';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { formatPriceShort, formatChange, formatUnits } from '../utils/formatNumber';
import { MOCK_APARTMENTS } from '../mocks/apartments.mock';

// 아파트 상세 페이지 - 데스크탑: 2컬럼 (기본정보 | 차트)
export default function ApartmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedArea, setSelectedArea] = useState<string | undefined>(undefined);

  const { data: apartment, isLoading, isError } = useApartmentDetail(id);

  // 면적이 로드되면 첫 번째 면적 선택
  React.useEffect(() => {
    if (apartment && !selectedArea) {
      setSelectedArea(apartment.areas[0]);
    }
  }, [apartment, selectedArea]);

  const { data: tradeHistory = [], isLoading: isHistoryLoading } = useApartmentHistory(
    id,
    selectedArea,
    24
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="단지 정보 로딩중..." />
      </div>
    );
  }

  if (isError || !apartment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-[#FF4B4B] font-semibold">단지 정보를 불러올 수 없습니다</p>
        <button onClick={() => navigate(-1)} className="text-[#1B64DA] text-sm">
          돌아가기
        </button>
      </div>
    );
  }

  const priceColor =
    apartment.priceChangeType === 'up'
      ? 'text-[#FF4B4B]'
      : apartment.priceChangeType === 'down'
        ? 'text-[#00C896]'
        : 'text-[#8B95A1]';

  const priceArrow =
    apartment.priceChangeType === 'up' ? '▲' : apartment.priceChangeType === 'down' ? '▼' : '';

  // 거래 통계 계산
  const priceStats = calcStats(tradeHistory.map((t) => t.price));

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      {/* 헤더 */}
      <header className="bg-white border-b border-[#E5E8EB] sticky top-0 z-30 px-5 py-4 md:px-6">
        <div className="md:max-w-6xl md:mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-[#191F28]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-base font-bold text-[#191F28] truncate flex-1">{apartment.name}</h1>
          {/* 카카오맵 길찾기 링크 */}
          <a
            href={`https://map.kakao.com/link/search/${encodeURIComponent(apartment.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#1B64DA] font-semibold bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
          >
            길찾기
          </a>
        </div>
      </header>

      <main className="pb-8">
        <div className="md:max-w-6xl md:mx-auto md:px-6 md:pt-6">
          {/* 데스크탑: 2컬럼 레이아웃 */}
          <div className="md:grid md:grid-cols-[380px_1fr] md:gap-6">

            {/* 좌측: 단지 기본 정보 */}
            <div>
              {/* 단지 기본 정보 카드 */}
              <div className="bg-white px-5 py-5 mb-3 md:rounded-2xl md:border md:border-[#E5E8EB]">
                <h2 className="text-xl font-black text-[#191F28] leading-snug">{apartment.name}</h2>
                <p className="text-sm text-[#8B95A1] mt-1">
                  {apartment.address || `${apartment.district} ${apartment.dong}`}
                </p>

                {/* 최근 거래가 */}
                <div className="flex items-baseline gap-2 mt-4">
                  <span className="text-3xl font-black text-[#191F28]">
                    {formatPriceShort(apartment.recentPrice)}
                  </span>
                  <span className="text-sm text-[#8B95A1]">{apartment.recentPriceArea}㎡</span>
                  <span className={`text-base font-bold ${priceColor}`}>
                    {priceArrow} {formatChange(apartment.priceChange)}
                  </span>
                </div>

                {/* 단지 정보 그리드 */}
                <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-[#E5E8EB]">
                  <InfoItem label="세대수" value={formatUnits(apartment.totalUnits)} />
                  <InfoItem label="준공년도" value={`${apartment.builtYear}년`} />
                  <InfoItem label="건설사" value={apartment.builder} />
                </div>
              </div>

              {/* 주변 단지 비교 (데스크탑에서는 좌측 하단) */}
              <div className="bg-white px-5 py-5 md:rounded-2xl md:border md:border-[#E5E8EB]">
                <h3 className="text-base font-bold text-[#191F28] mb-4">주변 단지</h3>
                <NearbyApartments currentId={apartment.id} district={apartment.district} />
              </div>
            </div>

            {/* 우측: 차트 + 거래 내역 */}
            <div>
              {/* 면적 탭 + 가격 차트 */}
              <div className="bg-white px-5 py-5 mb-3 md:rounded-2xl md:border md:border-[#E5E8EB]">
                <h3 className="text-base font-bold text-[#191F28] mb-4">실거래가 추이</h3>

                {/* 면적 탭 */}
                <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
                  {apartment.areas.map((area) => (
                    <button
                      key={area}
                      onClick={() => setSelectedArea(area)}
                      className={[
                        'flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors border',
                        selectedArea === area
                          ? 'bg-[#1B64DA] text-white border-[#1B64DA]'
                          : 'bg-white text-[#8B95A1] border-[#E5E8EB] hover:border-[#1B64DA] hover:text-[#1B64DA]',
                      ].join(' ')}
                    >
                      {area}㎡
                    </button>
                  ))}
                </div>

                {/* 가격 요약 */}
                {!isHistoryLoading && tradeHistory.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    <PriceSummaryItem label="최저" value={priceStats.min} />
                    <PriceSummaryItem label="평균" value={priceStats.avg} />
                    <PriceSummaryItem label="최고" value={priceStats.max} />
                  </div>
                )}

                {/* 차트 */}
                <PriceChart data={tradeHistory} isLoading={isHistoryLoading} />
              </div>

              {/* 최근 거래 내역 */}
              <div className="bg-white px-5 py-5 md:rounded-2xl md:border md:border-[#E5E8EB]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-[#191F28]">최근 거래 내역</h3>
                  <span className="text-xs text-[#8B95A1]">최근 20건</span>
                </div>

                {isHistoryLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <TradeHistoryTable trades={tradeHistory} limit={20} />
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// 정보 아이템
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[#8B95A1]">{label}</p>
      <p className="text-sm font-bold text-[#191F28] mt-0.5">{value}</p>
    </div>
  );
}

// 가격 요약 아이템
function PriceSummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-[#F5F6F8] rounded-xl p-3 text-center">
      <p className="text-[10px] text-[#8B95A1] mb-1">{label}</p>
      <p className="text-sm font-bold text-[#191F28]">{formatPriceShort(value)}</p>
    </div>
  );
}

// 거래 통계 계산
function calcStats(prices: number[]) {
  if (prices.length === 0) return { min: 0, max: 0, avg: 0 };
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const avg = Math.round(prices.reduce((s, v) => s + v, 0) / prices.length);
  return { min, max, avg };
}

// 주변 단지 카드
function NearbyApartments({ currentId, district }: { currentId: string; district: string }) {
  const navigate = useNavigate();

  const nearby = MOCK_APARTMENTS
    .filter((apt: { id: string; district: string }) => apt.id !== currentId && apt.district === district)
    .slice(0, 3);

  if (nearby.length === 0) {
    return <p className="text-sm text-[#8B95A1]">주변 단지 정보가 없습니다</p>;
  }

  return (
    <div className="space-y-3">
      {nearby.map((apt: {
        id: string;
        name: string;
        dong: string;
        recentPrice: number;
        recentPriceArea: string;
        priceChange: number;
        priceChangeType: 'up' | 'down' | 'flat';
      }) => (
        <button
          key={apt.id}
          onClick={() => navigate(`/apartment/${apt.id}`)}
          className="w-full flex items-center justify-between p-3 bg-[#F5F6F8] rounded-xl hover:bg-gray-100 transition-colors"
        >
          <div className="text-left">
            <p className="text-sm font-bold text-[#191F28]">{apt.name}</p>
            <p className="text-xs text-[#8B95A1]">{apt.dong}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-[#191F28]">
              {formatPriceShort(apt.recentPrice)}
            </p>
            <p className={[
              'text-xs font-semibold',
              apt.priceChangeType === 'up'
                ? 'text-[#FF4B4B]'
                : apt.priceChangeType === 'down'
                  ? 'text-[#00C896]'
                  : 'text-[#8B95A1]',
            ].join(' ')}>
              {formatChange(apt.priceChange)}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
