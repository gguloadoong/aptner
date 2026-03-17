import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApartmentDetail, useApartmentHistory } from '../hooks/useApartment';
import api from '../services/api';
import PriceChart from '../components/apartment/PriceChart';
import TradeHistoryTable from '../components/apartment/TradeHistoryTable';
import { Loading, Chip, IconButton, TextButton, useToast } from '@wanteddev/wds';
import { IconChevronLeft, IconHeartFill, IconHeart, IconShare, IconArrowRight, IconSquarePlus, IconSquarePlusFill } from '@wanteddev/wds-icon';
import { AlertButton } from '../components/apartment/PriceAlertModal';
import { formatPriceShort, formatChange, formatUnits, formatArea } from '../utils/formatNumber';
import { MOCK_APARTMENTS } from '../mocks/apartments.mock';
import { useBookmarkStore } from '../stores/bookmarkStore';
import { useCompareStore } from '../stores/compareStore';

// 아파트 상세 페이지 - 데스크탑: 2컬럼 (기본정보 | 차트)
export default function ApartmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedArea, setSelectedArea] = useState<string | undefined>(undefined);

  // 찜하기 스토어
  const { isBookmarked, toggleBookmark } = useBookmarkStore();
  const bookmarked = isBookmarked(id ?? '');

  // WDS useToast 훅 (alert 대체) — handleCompareToggle 정의 전에 선언
  const addToast = useToast();

  // 비교 스토어
  const { isInCompare, addCompare, removeCompare } = useCompareStore();
  const inCompare = isInCompare(id ?? '');

  // 비교 토글 핸들러
  const handleCompareToggle = () => {
    if (!id) return;
    if (inCompare) {
      removeCompare(id);
      addToast({ content: '비교 목록에서 제거되었습니다', variant: 'cautionary', duration: 'short' });
    } else {
      const compareList = useCompareStore.getState().compareList;
      if (compareList.length >= 3) {
        addToast({ content: '최대 3개 단지까지 비교할 수 있습니다', variant: 'negative', duration: 'short' });
        return;
      }
      // name을 함께 저장하여 CompareBar에서 실데이터 모드에서도 단지명 표시 가능
      addCompare({ id, name: apartment?.name ?? id });
      addToast({ content: '비교 목록에 추가되었습니다', variant: 'positive', duration: 'short' });
    }
  };

  const { data: apartment, isLoading, isError } = useApartmentDetail(id);

  // 전세가율 조회
  const [jeonseRate, setJeonseRate] = useState<number | null>(null);
  useEffect(() => {
    if (!apartment?.id || !apartment?.lawdCd) return;
    api.get(`/apartments/${apartment.id}/jeonse-rate?lawdCd=${apartment.lawdCd}`)
      .then((res) => setJeonseRate(res.data?.data?.jeonseRate ?? null))
      .catch(() => {});
  }, [apartment?.id, apartment?.lawdCd]);

  // apartment가 바뀔 때마다 첫 번째 면적으로 초기화
  React.useEffect(() => {
    if (apartment) setSelectedArea(apartment.areas[0]);
  }, [apartment]);

  const { data: tradeHistory = [], isLoading: isHistoryLoading } = useApartmentHistory(
    id,
    selectedArea,
    24
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="32px" />
      </div>
    );
  }

  if (isError || !apartment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-[#FF4B4B] font-semibold">단지 정보를 불러올 수 없습니다</p>
        <TextButton size="small" color="primary" onClick={() => navigate(-1)}>
          돌아가기
        </TextButton>
      </div>
    );
  }

  const priceColor =
    apartment.priceChangeType === 'up'
      ? 'text-[#FF4B4B]'
      : apartment.priceChangeType === 'down'
        ? 'text-[#3B82F6]'
        : 'text-[#8B95A1]';

  const priceArrow =
    apartment.priceChangeType === 'up' ? '▲' : apartment.priceChangeType === 'down' ? '▼' : '';

  // 거래 통계 계산
  const priceStats = calcStats(tradeHistory.map((t) => t.price));

  // 공유 핸들러 — Web Share API 지원 시 사용, 미지원 시 클립보드 복사
  const handleShare = async () => {
    const url = `${window.location.origin}/apartment/${id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: apartment.name,
          text: `봄집 - ${apartment.name} 아파트 정보`,
          url,
        });
      } catch {
        // 공유 취소 등의 경우 무시
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        addToast({ content: '링크가 복사되었습니다', variant: 'positive', duration: 'short' });
      } catch {
        addToast({ content: '링크 복사에 실패했습니다', variant: 'negative', duration: 'short' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FAF8]">
      {/* 헤더 */}
      <header className="bg-white border-b border-[#E5E8EB] sticky top-0 z-30 px-5 py-4 md:px-6">
        <div className="max-w-screen-xl mx-auto flex items-center gap-3">
          <IconButton
            variant="normal"
            onClick={() => navigate(-1)}
            aria-label="뒤로가기"
          >
            <IconChevronLeft />
          </IconButton>
          <h1 className="text-base font-bold text-[#191F28] truncate flex-1">{apartment.name}</h1>
          {/* 비교 추가 버튼 - WDS IconButton */}
          <IconButton
            variant="normal"
            onClick={handleCompareToggle}
            aria-label={inCompare ? '비교 제거' : '비교 추가'}
          >
            {inCompare ? (
              <IconSquarePlusFill style={{ color: '#0066FF' }} />
            ) : (
              <IconSquarePlus />
            )}
          </IconButton>
          {/* 찜하기 버튼 - WDS IconButton */}
          <IconButton
            variant="normal"
            onClick={() => toggleBookmark(id ?? '')}
            aria-label={bookmarked ? '찜 해제' : '찜하기'}
          >
            {bookmarked ? (
              <IconHeartFill style={{ color: '#E53E3E' }} />
            ) : (
              <IconHeart />
            )}
          </IconButton>
          {/* 가격 알림 버튼 */}
          <AlertButton
            apartmentId={id ?? ''}
            apartmentName={apartment.name}
            currentPrice={apartment.recentPrice}
            area={selectedArea ?? apartment.areas[0] ?? '84'}
          />
          {/* 공유 버튼 - WDS IconButton */}
          <IconButton
            variant="normal"
            onClick={handleShare}
            aria-label="공유"
          >
            <IconShare />
          </IconButton>
          {/* 카카오맵 길찾기 링크 */}
          <a
            href={`https://map.kakao.com/link/search/${encodeURIComponent(apartment.name)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <TextButton
              size="small"
              color="primary"
              trailingContent={<IconArrowRight />}
            >
              길찾기
            </TextButton>
          </a>
        </div>
      </header>

      <main className="pb-8">
        <div className="max-w-screen-xl mx-auto md:px-6 md:pt-6">
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
                  <span className="text-sm text-[#8B95A1]">{formatArea(apartment.recentPriceArea)}</span>
                  <span className={`text-base font-bold ${priceColor}`}>
                    {priceArrow} {formatChange(apartment.priceChange)}
                  </span>
                </div>

                {/* 전세가율 */}
                {jeonseRate !== null && (
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-[13px] text-[#8B95A1]">전세가율</span>
                    <span className={`text-[15px] font-bold ${jeonseRate >= 80 ? 'text-[#FF4B4B]' : jeonseRate >= 60 ? 'text-[#F97316]' : 'text-blue-600'}`}>
                      {jeonseRate}%
                    </span>
                    <span className="text-[11px] text-[#8B95A1]">
                      {jeonseRate >= 80 ? '⚠ 갭 주의' : jeonseRate >= 60 ? '보통' : '갭 여유'}
                    </span>
                  </div>
                )}

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

                {/* 면적 탭 - WDS Chip */}
                <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
                  {apartment.areas.map((area) => (
                    <Chip
                      key={area}
                      size="small"
                      variant="outlined"
                      active={selectedArea === area}
                      onClick={() => setSelectedArea(area)}
                      className="flex-shrink-0"
                    >
                      {formatArea(area)}
                    </Chip>
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
    <div className="bg-[#F8FAFC] rounded-xl p-3 text-center">
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
          className="w-full flex items-center justify-between p-3 bg-[#F7FAF8] rounded-xl hover:bg-gray-100 transition-colors"
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
                  ? 'text-[#3B82F6]'
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
