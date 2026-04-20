import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, FlexBox, Typography, Button } from '@wanteddev/wds';
import { IconArrowRight } from '@wanteddev/wds-icon';
import { formatPriceShort, formatChange, formatUnits } from '../../utils/formatNumber';
import { useApartmentDetail } from '../../hooks/useApartment';
import type { MapApartment } from '../../types';

// ────────────────────────────────────────────────────────────
// 필터 UI 공통 컴포넌트
// ────────────────────────────────────────────────────────────

// LNB 섹션 라벨 (데스크탑 사이드패널 전용)
export function LnbSectionLabel({ label, style }: { label: string; style?: React.CSSProperties }) {
  return (
    <Typography
      variant="caption1"
      weight="bold"
      style={{
        color: 'var(--semantic-label-assistive)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        ...style,
      }}
    >
      {label}
    </Typography>
  );
}

// ────────────────────────────────────────────────────────────
// 청약 정보 섹션 (TASK 9 — 섹션 3)
// ────────────────────────────────────────────────────────────

export function SubscriptionInfoSection({
  apt,
  navigate,
}: {
  apt: MapApartment;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const isOngoing = apt.markerType === 'subOngoing';
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // D-Day 계산
  let dDayText = '';
  let dDayColor = '#1B64DA';
  if (isOngoing && apt.subDeadline) {
    const dl = new Date(apt.subDeadline);
    dl.setHours(0, 0, 0, 0);
    const diff = Math.ceil((dl.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) {
      dDayText = 'D-Day';
    } else if (diff > 0) {
      dDayText = `D-${diff}`;
    }
    dDayColor = diff <= 7 ? '#D63031' : '#1B64DA';
  } else if (!isOngoing && apt.subStartDate) {
    const st = new Date(apt.subStartDate);
    st.setHours(0, 0, 0, 0);
    const diff = Math.ceil((st.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) {
      // N-3: D-0 후 시작 → D-Day 시작으로 표시
      dDayText = 'D-Day 시작';
    } else if (diff > 0) {
      dDayText = `D-${diff} 후 시작`;
    }
    dDayColor = '#E67E22';
  }

  return (
    <Box style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--semantic-line-normal)' }}>
      {/* 상태 뱃지 + D-Day */}
      <FlexBox alignItems="center" style={{ gap: '8px', marginBottom: '8px' }}>
        <Box
          style={{
            height: '22px',
            padding: '0 8px',
            borderRadius: '11px',
            fontSize: '11px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            background: isOngoing ? '#E8F1FD' : '#FFF4E5',
            color: isOngoing ? '#1B64DA' : '#E67E22',
          }}
        >
          {isOngoing ? '청약 진행중' : '청약 예정'}
        </Box>
        {dDayText && (
          <Typography variant="body2" weight="bold" style={{ color: dDayColor }}>
            {dDayText}
          </Typography>
        )}
      </FlexBox>

      {/* 분양가 정보 */}
      <FlexBox alignItems="center" style={{ gap: '8px', marginTop: '6px' }}>
        <Typography variant="caption1" weight="medium" style={{ color: 'var(--semantic-label-assistive)' }}>
          분양가
        </Typography>
        <Typography variant="caption1" weight="bold" style={{ color: 'var(--semantic-label-normal)' }}>
          {apt.price > 0 ? formatPriceShort(apt.price) : '미확정'}
        </Typography>
      </FlexBox>

      {/* 청약 상세 보기 버튼 */}
      {apt.subId && (
        <Button
          variant="solid"
          color="primary"
          fullWidth
          size="small"
          onClick={() => navigate(`/subscription/${apt.subId}`)}
          trailingContent={<IconArrowRight />}
          style={{ marginTop: '12px' }}
        >
          청약 상세 보기
        </Button>
      )}
    </Box>
  );
}

// ────────────────────────────────────────────────────────────
// 데스크탑 패널 - 아파트 요약
// ────────────────────────────────────────────────────────────

export function DesktopApartmentSummary({
  apartment,
  onDetailClick,
}: {
  apartment: ReturnType<typeof useApartmentDetail>['data'];
  onDetailClick: () => void;
}) {
  if (!apartment) return null;

  const priceChangeColor =
    apartment.priceChangeType === 'up'
      ? '#FF4B4B'
      : apartment.priceChangeType === 'down'
        ? '#00C896'
        : 'var(--semantic-label-assistive)';

  return (
    <Box>
      <Typography variant="body1" weight="bold" style={{ color: 'var(--semantic-label-normal)', lineHeight: 1.3 }}>
        {apartment.name}
      </Typography>
      <Typography
        variant="caption1"
        style={{ color: 'var(--semantic-label-assistive)', marginTop: '2px' }}
      >
        {apartment.address || `${apartment.district} ${apartment.dong}`}
      </Typography>
      <FlexBox alignItems="baseline" style={{ gap: '8px', marginTop: '8px' }}>
        <Typography variant="title3" weight="bold" style={{ color: 'var(--semantic-label-normal)' }}>
          {formatPriceShort(apartment.recentPrice)}
        </Typography>
        <Typography variant="caption1" style={{ color: 'var(--semantic-label-assistive)' }}>
          {apartment.recentPriceArea}㎡
        </Typography>
        <Typography variant="caption1" weight="bold" style={{ color: priceChangeColor }}>
          {formatChange(apartment.priceChange)}
        </Typography>
      </FlexBox>
      {/* 세대수 / 준공 / 건설사 3열 그리드 */}
      <Box
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          marginTop: '12px',
          paddingTop: '12px',
          textAlign: 'center',
          borderTop: '1px solid var(--semantic-line-normal)',
        }}
      >
        <Box>
          <Typography variant="caption2" style={{ color: 'var(--semantic-label-assistive)' }}>세대수</Typography>
          <Typography variant="caption1" weight="bold" style={{ color: 'var(--semantic-label-normal)', marginTop: '2px' }}>
            {formatUnits(apartment.totalUnits)}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption2" style={{ color: 'var(--semantic-label-assistive)' }}>준공</Typography>
          <Typography variant="caption1" weight="bold" style={{ color: 'var(--semantic-label-normal)', marginTop: '2px' }}>
            {apartment.builtYear}년
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption2" style={{ color: 'var(--semantic-label-assistive)' }}>건설사</Typography>
          <Typography
            variant="caption1"
            weight="bold"
            style={{
              color: 'var(--semantic-label-normal)',
              marginTop: '2px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {apartment.builder}
          </Typography>
        </Box>
      </Box>
      <Button variant="solid" color="primary" fullWidth style={{ marginTop: '12px' }} onClick={onDetailClick}>
        상세보기
      </Button>
    </Box>
  );
}

// ────────────────────────────────────────────────────────────
// 모바일 단지 요약 바텀시트 내용
// ────────────────────────────────────────────────────────────

export function ApartmentSummary({
  apartment,
  selectedMapApt,
  onDetailClick,
  navigate,
}: {
  apartment: ReturnType<typeof useApartmentDetail>['data'];
  selectedMapApt: MapApartment | null | undefined;
  onDetailClick: () => void;
  navigate: ReturnType<typeof useNavigate>;
}) {
  if (!apartment) return null;

  const mobilepriceChangeColor =
    apartment.priceChangeType === 'up'
      ? '#FF4B4B'
      : apartment.priceChangeType === 'down'
        ? '#00C896'
        : 'var(--semantic-label-assistive)';

  return (
    <Box style={{ padding: '20px' }}>
      <Typography variant="title3" weight="bold" style={{ color: 'var(--semantic-label-normal)', lineHeight: 1.3 }}>
        {apartment.name}
      </Typography>
      <Typography
        variant="body2"
        style={{ color: 'var(--semantic-label-assistive)', marginTop: '4px' }}
      >
        {apartment.address || `${apartment.district} ${apartment.dong}`}
      </Typography>

      {/* 청약 정보 섹션 (청약 마커인 경우 상단에 표시) */}
      {selectedMapApt && (selectedMapApt.markerType === 'subOngoing' || selectedMapApt.markerType === 'subUpcoming') && (
        <Box style={{ marginTop: '12px' }}>
          <SubscriptionInfoSection apt={selectedMapApt} navigate={navigate} />
        </Box>
      )}

      <FlexBox alignItems="baseline" style={{ gap: '8px', marginTop: '12px' }}>
        <Typography variant="title1" weight="bold" style={{ color: 'var(--semantic-label-normal)' }}>
          {formatPriceShort(apartment.recentPrice)}
        </Typography>
        <Typography variant="body2" style={{ color: 'var(--semantic-label-assistive)' }}>
          {apartment.recentPriceArea}㎡
        </Typography>
        <Typography variant="body2" weight="bold" style={{ color: mobilepriceChangeColor }}>
          {formatChange(apartment.priceChange)}
        </Typography>
      </FlexBox>

      {/* 세대수 / 준공 / 건설사 3열 그리드 */}
      <Box
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid var(--semantic-line-normal)',
        }}
      >
        <Box>
          <Typography variant="caption1" style={{ color: 'var(--semantic-label-assistive)' }}>세대수</Typography>
          <Typography variant="body2" weight="bold" style={{ color: 'var(--semantic-label-normal)', marginTop: '2px' }}>
            {formatUnits(apartment.totalUnits)}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption1" style={{ color: 'var(--semantic-label-assistive)' }}>준공</Typography>
          <Typography variant="body2" weight="bold" style={{ color: 'var(--semantic-label-normal)', marginTop: '2px' }}>
            {apartment.builtYear}년
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption1" style={{ color: 'var(--semantic-label-assistive)' }}>건설사</Typography>
          <Typography
            variant="body2"
            weight="bold"
            style={{
              color: 'var(--semantic-label-normal)',
              marginTop: '2px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {apartment.builder}
          </Typography>
        </Box>
      </Box>

      <Button variant="solid" color="primary" fullWidth style={{ marginTop: '20px' }} onClick={onDetailClick}>
        상세보기
      </Button>
    </Box>
  );
}

// ────────────────────────────────────────────────────────────
// Mock 지도 배경 (카카오맵 없을 때)
// ────────────────────────────────────────────────────────────

export function MockMapBackground({
  apartments,
  onMarkerClick,
}: {
  apartments: MapApartment[];
  onMarkerClick: (apt: MapApartment) => void;
}) {
  const positions = [
    { top: '20%', left: '25%' },
    { top: '35%', left: '60%' },
    { top: '50%', left: '35%' },
    { top: '65%', left: '55%' },
    { top: '25%', left: '70%' },
    { top: '70%', left: '20%' },
    { top: '45%', left: '80%' },
    { top: '15%', left: '50%' },
  ];

  return (
    <Box style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* 격자 배경 */}
      <Box
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(180, 200, 220, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(180, 200, 220, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          backgroundColor: '#E8EEF4',
        }}
      />
      {/* 도로 모형 */}
      <Box style={{ position: 'absolute', inset: 0, opacity: 0.3 }}>
        <Box style={{ position: 'absolute', backgroundColor: 'white', height: '8px', top: '30%', left: 0, right: 0 }} />
        <Box style={{ position: 'absolute', backgroundColor: 'white', height: '8px', top: '60%', left: 0, right: 0 }} />
        <Box style={{ position: 'absolute', backgroundColor: 'white', width: '8px', left: '40%', top: 0, bottom: 0 }} />
        <Box style={{ position: 'absolute', backgroundColor: 'white', width: '8px', left: '70%', top: 0, bottom: 0 }} />
      </Box>
      {/* 카카오맵 미연동 안내 */}
      <Box
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}
      >
        <Box
          style={{
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            backgroundColor: 'var(--semantic-background-normal-normal)',
          }}
        >
          <Typography variant="body2" weight="bold" style={{ color: 'var(--semantic-label-normal)' }}>
            카카오맵 연동 필요
          </Typography>
          <Typography variant="caption1" style={{ color: 'var(--semantic-label-assistive)', marginTop: '4px' }}>
            .env에 VITE_KAKAO_MAP_KEY 설정
          </Typography>
        </Box>
      </Box>
      {/* 목업 마커 */}
      {apartments.slice(0, 8).map((apt, i) => {
        const eok = apt.price / 10000;
        const markerBgColor =
          eok >= 20 ? '#D63031' : eok >= 10 ? '#FF4B4B' : eok >= 5 ? '#FF9500' : '#8B95A1';
        return (
          <button
            key={apt.id}
            style={{
              position: 'absolute',
              backgroundColor: markerBgColor,
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '999px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.20)',
              border: '2px solid #FFFFFF',
              cursor: 'pointer',
              transition: 'transform 0.15s ease',
              ...positions[i],
            }}
            onClick={() => onMarkerClick(apt)}
          >
            {formatPriceShort(apt.price)}
          </button>
        );
      })}
    </Box>
  );
}
