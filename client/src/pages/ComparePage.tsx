// 단지 비교 페이지 — /compare 라우트
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompareStore } from '../stores/compareStore';
import { useApartmentDetail } from '../hooks/useApartment';
import { formatPriceShort, formatChange, formatUnits, formatArea } from '../utils/formatNumber';
import {
  Button, TextButton, Loading,
  Box, FlexBox, Typography, TopNavigation, TopNavigationButton,
} from '@wanteddev/wds';
import { IconChevronLeft, IconClose, IconArrowRight } from '@wanteddev/wds-icon';

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

// 비교 테이블
function CompareTable({ ids }: { ids: string[] }) {
  const q0 = useApartmentDetail(ids[0]);
  const q1 = useApartmentDetail(ids[1]);
  const q2 = useApartmentDetail(ids[2]);

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

          {/* 비교 테이블 (2개 이상) */}
          {compareList.length >= 2 && (
            <CompareTable ids={compareList.map((item) => item.id)} />
          )}
        </Box>
      </Box>
    </div>
  );
}
