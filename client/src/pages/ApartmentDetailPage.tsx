import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApartmentDetail, useApartmentHistory } from '../hooks/useApartment';
import api from '../services/api';
import PriceChart from '../components/apartment/PriceChart';
import TradeHistoryTable from '../components/apartment/TradeHistoryTable';
import {
  Loading, Chip, IconButton, TextButton, useToast,
  Box, FlexBox, Typography, Grid, GridItem, Skeleton,
  TopNavigation, TopNavigationButton,
} from '@wanteddev/wds';
import {
  IconChevronLeft, IconHeartFill, IconHeart, IconShare,
  IconArrowRight, IconSquarePlus, IconSquarePlusFill,
} from '@wanteddev/wds-icon';
import { AlertButton } from '../components/apartment/PriceAlertModal';
import { formatPriceShort, formatChange, formatUnits, formatArea } from '../utils/formatNumber';
import { useApartmentSearch } from '../hooks/useApartment';
// MOCK_APARTMENTS 제거 — NearbyApartments가 API 기반으로 전환됨
import { useBookmarkStore } from '../stores/bookmarkStore';
import { useCompareStore } from '../stores/compareStore';

// 아파트 상세 페이지 — WDS 컴포넌트 전면 적용
export default function ApartmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedArea, setSelectedArea] = useState<string | undefined>(undefined);

  const { isBookmarked, toggleBookmark } = useBookmarkStore();
  const bookmarked = isBookmarked(id ?? '');

  const addToast = useToast();

  const { isInCompare, addCompare, removeCompare } = useCompareStore();
  const inCompare = isInCompare(id ?? '');

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
      addCompare({ id, name: apartment?.name ?? id });
      addToast({ content: '비교 목록에 추가되었습니다', variant: 'positive', duration: 'short' });
    }
  };

  const { data: apartment, isLoading, isError } = useApartmentDetail(id);

  const [jeonseRate, setJeonseRate] = useState<number | null>(null);
  useEffect(() => {
    if (!apartment?.id || !apartment?.lawdCd) return;
    api.get(`/apartments/${apartment.id}/jeonse-rate?lawdCd=${apartment.lawdCd}`)
      .then((res) => setJeonseRate(res.data?.data?.jeonseRate ?? null))
      .catch(() => {});
  }, [apartment?.id, apartment?.lawdCd]);

  useEffect(() => {
    // areas 배열이 비어있을 수 있으므로 안전하게 접근
    if (apartment && apartment.areas.length > 0) setSelectedArea(apartment.areas[0]);
  }, [apartment?.id, apartment?.areas]);

  const { data: tradeHistory = [], isLoading: isHistoryLoading } = useApartmentHistory(
    id,
    selectedArea,
    24
  );

  if (isLoading) {
    return (
      <FlexBox alignItems="center" justifyContent="center" style={{ minHeight: '100svh' }}>
        <Loading size="32px" />
      </FlexBox>
    );
  }

  if (isError || !apartment) {
    return (
      <FlexBox flexDirection="column" alignItems="center" justifyContent="center" gap="16px" style={{ minHeight: '100svh' }}>
        <Typography variant="body1" weight="medium" sx={{ color: '#FF4B4B' }}>
          단지 정보를 불러올 수 없습니다
        </Typography>
        <TextButton size="small" color="primary" onClick={() => navigate(-1)}>
          돌아가기
        </TextButton>
      </FlexBox>
    );
  }

  const priceColor =
    apartment.priceChangeType === 'up'
      ? '#FF4B4B'
      : apartment.priceChangeType === 'down'
        ? '#00C896'
        : 'var(--semantic-label-assistive)';

  const priceArrow =
    apartment.priceChangeType === 'up' ? '▲' : apartment.priceChangeType === 'down' ? '▼' : '';

  const priceStats = calcStats(tradeHistory.map((t) => t.price));

  const handleShare = async () => {
    const url = `${window.location.origin}/apartment/${id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: apartment.name, text: `봄집 - ${apartment.name} 아파트 정보`, url });
      } catch { /* 공유 취소 무시 */ }
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
    <div style={{ minHeight: '100svh', backgroundColor: 'var(--semantic-background-normal-alternative)' }}>

      {/* 헤더 — WDS TopNavigation */}
      <TopNavigation
        leadingContent={
          <TopNavigationButton onClick={() => navigate(-1)} aria-label="뒤로가기">
            <IconChevronLeft />
          </TopNavigationButton>
        }
        trailingContent={
          <FlexBox alignItems="center" gap="4px">
            {/* 비교 추가 버튼 */}
            <IconButton variant="normal" onClick={handleCompareToggle} aria-label={inCompare ? '비교 제거' : '비교 추가'}>
              {inCompare ? <IconSquarePlusFill style={{ color: 'var(--semantic-primary-normal)' }} /> : <IconSquarePlus />}
            </IconButton>
            {/* 찜하기 버튼 */}
            <IconButton variant="normal" onClick={() => toggleBookmark(id ?? '')} aria-label={bookmarked ? '찜 해제' : '찜하기'}>
              {bookmarked ? <IconHeartFill style={{ color: '#E53E3E' }} /> : <IconHeart />}
            </IconButton>
            {/* 가격 알림 버튼 */}
            <AlertButton
              apartmentId={id ?? ''}
              apartmentName={apartment.name}
              currentPrice={apartment.recentPrice}
              area={selectedArea ?? apartment.areas?.[0] ?? '84'}
            />
            {/* 공유 버튼 */}
            <IconButton variant="normal" onClick={handleShare} aria-label="공유">
              <IconShare />
            </IconButton>
            {/* 카카오맵 길찾기 */}
            <a
              href={`https://map.kakao.com/link/search/${encodeURIComponent(apartment.name)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <TextButton size="small" color="primary" trailingContent={<IconArrowRight />}>
                길찾기
              </TextButton>
            </a>
          </FlexBox>
        }
      >
        <Typography
          variant="body1"
          weight="bold"
          sx={{ color: 'var(--semantic-label-normal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {apartment.name}
        </Typography>
      </TopNavigation>

      <Box as="main" sx={{ paddingBottom: '32px' }}>
        <Box sx={{ maxWidth: '1280px', margin: '0 auto', padding: '0 0 0 0' }}>
          {/* 데스크탑: 2컬럼 레이아웃 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '0',
            }}
          >
            {/* 단지 기본 정보 */}
            <Box
              sx={{
                backgroundColor: 'var(--semantic-background-normal-normal)',
                padding: '20px',
                marginBottom: '12px',
              }}
            >
              <Typography variant="title3" weight="bold" sx={{ color: 'var(--semantic-label-normal)', display: 'block', lineHeight: 1.3 }}>
                {apartment.name}
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--semantic-label-assistive)', display: 'block', marginTop: '4px' }}>
                {apartment.address || `${apartment.district} ${apartment.dong}`}
              </Typography>

              {/* 최근 거래가 */}
              <FlexBox alignItems="baseline" gap="8px" style={{ marginTop: '16px' }}>
                <span style={{ fontSize: '30px', fontWeight: 900, color: 'var(--semantic-label-normal)' }}>
                  {formatPriceShort(apartment.recentPrice)}
                </span>
                <Typography variant="body2" sx={{ color: 'var(--semantic-label-assistive)' }}>
                  {formatArea(apartment.recentPriceArea)}
                </Typography>
                <Typography variant="body1" weight="bold" sx={{ color: priceColor }}>
                  {priceArrow} {formatChange(apartment.priceChange)}
                </Typography>
              </FlexBox>

              {/* 전세가율 */}
              {jeonseRate !== null && (
                <FlexBox alignItems="center" gap="8px" style={{ marginTop: '12px' }}>
                  <Typography variant="body2" sx={{ color: 'var(--semantic-label-assistive)' }}>전세가율</Typography>
                  <Typography
                    variant="body1"
                    weight="bold"
                    sx={{ color: jeonseRate >= 80 ? '#FF4B4B' : jeonseRate >= 60 ? '#F97316' : 'var(--semantic-primary-normal)' }}
                  >
                    {jeonseRate}%
                  </Typography>
                  <Typography variant="caption1" sx={{ color: 'var(--semantic-label-assistive)' }}>
                    {jeonseRate >= 80 ? '⚠ 갭 주의' : jeonseRate >= 60 ? '보통' : '갭 여유'}
                  </Typography>
                </FlexBox>
              )}

              {/* 단지 정보 그리드 */}
              <Box sx={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--semantic-line-normal)' }}>
                <Grid spacing={4}>
                  <GridItem columns={4}>
                    <InfoItem label="세대수" value={formatUnits(apartment.totalUnits)} />
                  </GridItem>
                  <GridItem columns={4}>
                    <InfoItem label="준공년도" value={`${apartment.builtYear}년`} />
                  </GridItem>
                  <GridItem columns={4}>
                    <InfoItem label="건설사" value={apartment.builder} />
                  </GridItem>
                </Grid>
              </Box>
            </Box>

            {/* 주변 단지 */}
            <Box
              sx={{
                backgroundColor: 'var(--semantic-background-normal-normal)',
                padding: '20px',
                marginBottom: '12px',
              }}
            >
              <Typography variant="body1" weight="bold" sx={{ color: 'var(--semantic-label-normal)', display: 'block', marginBottom: '16px' }}>
                주변 단지
              </Typography>
              <NearbyApartments currentId={apartment.id} district={apartment.district} />
            </Box>

            {/* 면적 탭 + 가격 차트 */}
            <Box
              sx={{
                backgroundColor: 'var(--semantic-background-normal-normal)',
                padding: '20px',
                marginBottom: '12px',
              }}
            >
              <Typography variant="body1" weight="bold" sx={{ color: 'var(--semantic-label-normal)', display: 'block', marginBottom: '16px' }}>
                실거래가 추이
              </Typography>

              {/* 면적 탭 — WDS Chip */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '20px',
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                } as React.CSSProperties}
              >
                {apartment.areas.map((area) => (
                  <Chip
                    key={area}
                    size="small"
                    variant="outlined"
                    active={selectedArea === area}
                    onClick={() => setSelectedArea(area)}
                    style={{ flexShrink: 0 }}
                  >
                    {formatArea(area)}
                  </Chip>
                ))}
              </div>

              {/* 가격 요약 */}
              {!isHistoryLoading && tradeHistory.length > 0 && (
                <Grid spacing={4} style={{ marginBottom: '20px' }}>
                  <GridItem columns={4}><PriceSummaryItem label="최저" value={priceStats.min} /></GridItem>
                  <GridItem columns={4}><PriceSummaryItem label="평균" value={priceStats.avg} /></GridItem>
                  <GridItem columns={4}><PriceSummaryItem label="최고" value={priceStats.max} /></GridItem>
                </Grid>
              )}

              {/* 차트 */}
              <PriceChart data={tradeHistory} isLoading={isHistoryLoading} />
            </Box>

            {/* 최근 거래 내역 */}
            <Box
              sx={{
                backgroundColor: 'var(--semantic-background-normal-normal)',
                padding: '20px',
                marginBottom: '12px',
              }}
            >
              <FlexBox alignItems="center" justifyContent="space-between" style={{ marginBottom: '16px' }}>
                <Typography variant="body1" weight="bold" sx={{ color: 'var(--semantic-label-normal)' }}>
                  최근 거래 내역
                </Typography>
                <Typography variant="caption1" sx={{ color: 'var(--semantic-label-assistive)' }}>
                  최근 20건
                </Typography>
              </FlexBox>

              {isHistoryLoading ? (
                <FlexBox flexDirection="column" gap="8px">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} variant="rectangle" width="100%" height="40px" />
                  ))}
                </FlexBox>
              ) : (
                <TradeHistoryTable trades={tradeHistory} limit={20} />
              )}
            </Box>
          </div>
        </Box>
      </Box>
    </div>
  );
}

// 정보 아이템
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Typography variant="caption1" sx={{ color: 'var(--semantic-label-assistive)', display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="body2" weight="bold" sx={{ color: 'var(--semantic-label-normal)', display: 'block', marginTop: '2px' }}>
        {value}
      </Typography>
    </div>
  );
}

// 가격 요약 아이템
function PriceSummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <Box
      sx={{
        backgroundColor: 'var(--semantic-background-normal-alternative)',
        borderRadius: '12px',
        padding: '12px',
        textAlign: 'center',
      }}
    >
      <Typography variant="caption2" sx={{ color: 'var(--semantic-label-assistive)', display: 'block', marginBottom: '4px' }}>
        {label}
      </Typography>
      <Typography variant="body2" weight="bold" sx={{ color: 'var(--semantic-label-normal)' }}>
        {formatPriceShort(value)}
      </Typography>
    </Box>
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

// 주변 단지 카드 — district 기반 API 검색으로 교체 (MOCK 제거)
function NearbyApartments({ currentId, district }: { currentId: string; district: string }) {
  const navigate = useNavigate();
  const { data: searchResult, isLoading } = useApartmentSearch(district);

  // 현재 단지를 제외한 최대 3개 표시
  const nearby = (searchResult ?? [])
    .filter((apt) => apt.id !== currentId)
    .slice(0, 3);

  if (isLoading) {
    return (
      <FlexBox flexDirection="column" gap="8px">
        {[1, 2, 3].map((i) => <Skeleton key={i} variant="rectangle" width="100%" height="56px" />)}
      </FlexBox>
    );
  }

  if (nearby.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: 'var(--semantic-label-assistive)' }}>
        주변 단지 정보가 없습니다
      </Typography>
    );
  }

  return (
    <FlexBox flexDirection="column" gap="12px">
      {nearby.map((apt) => (
        <button
          key={apt.id}
          onClick={() => navigate(`/apartment/${apt.id}`)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px',
            backgroundColor: 'var(--semantic-background-normal-alternative)',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 150ms',
            textAlign: 'left',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--semantic-fill-normal, #e5e8eb)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--semantic-background-normal-alternative)'; }}
        >
          <div>
            <Typography variant="body2" weight="bold" sx={{ color: 'var(--semantic-label-normal)', display: 'block' }}>
              {apt.name}
            </Typography>
            <Typography variant="caption1" sx={{ color: 'var(--semantic-label-assistive)', display: 'block' }}>
              {apt.dong}
            </Typography>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Typography variant="body2" weight="bold" sx={{ color: 'var(--semantic-label-normal)', display: 'block' }}>
              {formatPriceShort(apt.recentPrice)}
            </Typography>
            <Typography
              variant="caption1"
              weight="medium"
              sx={{
                color: apt.priceChangeType === 'up' ? '#FF4B4B' : apt.priceChangeType === 'down' ? '#00C896' : 'var(--semantic-label-assistive)',
                display: 'block',
              }}
            >
              {formatChange(apt.priceChange)}
            </Typography>
          </div>
        </button>
      ))}
    </FlexBox>
  );
}
