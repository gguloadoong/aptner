// 단지 비교 페이지 — /compare 라우트
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompareStore } from '../stores/compareStore';
import { useApartmentDetail } from '../hooks/useApartment';
import { formatPriceShort, formatChange, formatUnits, formatArea } from '../utils/formatNumber';
import { Button, TextButton, Loading } from '@wanteddev/wds';
import { IconChevronLeft, IconClose, IconArrowRight } from '@wanteddev/wds-icon';

// ─────────────────────────────────────────────────────────
// 비교 행 — 레이블 + 단지별 값 나란히 표시
// ─────────────────────────────────────────────────────────
interface CompareRowProps {
  label: string;
  values: React.ReactNode[];
  highlight?: 'max' | 'min' | 'none'; // 강조 방향
  rawValues?: number[]; // 강조 판단용 숫자 원본값
}

function CompareRow({ label, values, highlight = 'none', rawValues }: CompareRowProps) {
  // 최댓값/최솟값 인덱스 계산
  const highlightIdx = React.useMemo(() => {
    if (highlight === 'none' || !rawValues || rawValues.length === 0) return -1;
    if (highlight === 'max') return rawValues.indexOf(Math.max(...rawValues));
    if (highlight === 'min') return rawValues.indexOf(Math.min(...rawValues));
    return -1;
  }, [highlight, rawValues]);

  return (
    <div className="grid border-b border-[#F2F4F6] last:border-0" style={{ gridTemplateColumns: `120px repeat(${values.length}, 1fr)` }}>
      {/* 레이블 셀 */}
      <div className="py-3 px-3 flex items-center bg-[#F7FAF8]">
        <span className="text-[12px] text-[#8B95A1] font-medium">{label}</span>
      </div>
      {/* 값 셀 */}
      {values.map((val, idx) => (
        <div
          key={idx}
          className={[
            'py-3 px-3 flex items-center justify-center text-center',
            highlightIdx === idx ? 'bg-blue-50' : '',
          ].join(' ')}
        >
          <span
            className={[
              'text-[13px] font-semibold',
              highlightIdx === idx ? 'text-blue-600' : 'text-[#191F28]',
            ].join(' ')}
          >
            {val}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 섹션 헤더 행
// ─────────────────────────────────────────────────────────
function SectionHeader({ label, colCount }: { label: string; colCount: number }) {
  return (
    <div
      className="grid bg-blue-50/50 border-b border-[#E5E8EB]"
      style={{ gridTemplateColumns: `120px repeat(${colCount}, 1fr)` }}
    >
      <div className="py-2 px-3 col-span-full">
        <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wide">{label}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 단지 헤더 — 컬럼 상단 단지명/주소/X버튼
// ─────────────────────────────────────────────────────────
interface AptHeaderCellProps {
  name: string;
  address: string;
  id: string;
  onRemove: (id: string) => void;
}

function AptHeaderCell({ name, address, id, onRemove }: AptHeaderCellProps) {
  const navigate = useNavigate();

  return (
    <div className="py-4 px-3 flex flex-col items-center gap-1 relative border-l border-[#E5E8EB] first:border-l-0">
      {/* X 버튼 */}
      <button
        onClick={() => onRemove(id)}
        className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center text-[#C4C9CF] hover:text-[#FF4B4B] transition-colors rounded-full hover:bg-[#FFF5F5]"
        aria-label={`${name} 제거`}
      >
        <IconClose style={{ width: 12, height: 12 }} />
      </button>
      {/* 단지명 */}
      <button
        onClick={() => navigate(`/apartment/${id}`)}
        className="text-[14px] font-bold text-[#191F28] text-center hover:text-blue-600 transition-colors leading-tight"
      >
        {name}
      </button>
      {/* 주소 */}
      <p className="text-[11px] text-[#8B95A1] text-center leading-tight">{address}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 비교 테이블 — 단지 데이터 로딩 후 렌더링
// compareList가 CompareItem[] 이므로 id만 추출하여 사용
// ─────────────────────────────────────────────────────────
function CompareTable({ ids }: { ids: string[] }) {
  // 각 단지 데이터 로드
  const q0 = useApartmentDetail(ids[0]);
  const q1 = useApartmentDetail(ids[1]);
  const q2 = useApartmentDetail(ids[2]);

  const queries = [q0, q1, q2].slice(0, ids.length);
  const isLoading = queries.some((q) => q.isLoading);
  const apts = queries.map((q) => q.data ?? null);

  const removeCompare = useCompareStore((s) => s.removeCompare);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loading size="32px" />
      </div>
    );
  }

  const validApts = apts.filter(Boolean);
  if (validApts.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-[14px] text-[#8B95A1]">단지 정보를 불러올 수 없습니다</p>
      </div>
    );
  }

  const colCount = ids.length;

  // 가격 변동 색상
  const priceChangeColor = (type: 'up' | 'down' | 'flat') =>
    type === 'up' ? 'text-[#FF4B4B]' : type === 'down' ? 'text-[#3B82F6]' : 'text-[#8B95A1]';
  const priceArrow = (type: 'up' | 'down' | 'flat') =>
    type === 'up' ? '▲ ' : type === 'down' ? '▼ ' : '';

  return (
    <div className="bg-white rounded-2xl border border-[#E5E8EB] overflow-hidden">
      {/* ── 단지 헤더 행 ── */}
      <div
        className="grid border-b-2 border-[#E5E8EB] bg-[#F7FAF8]"
        style={{ gridTemplateColumns: `120px repeat(${colCount}, 1fr)` }}
      >
        {/* 레이블 헤더 셀 */}
        <div className="py-4 px-3 flex items-end">
          <span className="text-[11px] text-[#C4C9CF] font-medium">단지</span>
        </div>
        {/* 단지 헤더 셀 */}
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
            <div key={`empty-${idx}`} className="py-4 px-3 border-l border-[#E5E8EB] flex items-center justify-center">
              <span className="text-[12px] text-[#C4C9CF]">-</span>
            </div>
          )
        )}
      </div>

      {/* ── 기본 정보 섹션 ── */}
      <SectionHeader label="기본 정보" colCount={colCount} />

      <CompareRow
        label="주소"
        values={apts.map((apt) => apt?.address ?? apt ? `${apt?.district} ${apt?.dong}` : '-')}
      />
      <CompareRow
        label="세대수"
        values={apts.map((apt) => apt ? formatUnits(apt.totalUnits) : '-')}
        highlight="max"
        rawValues={apts.map((apt) => apt?.totalUnits ?? 0)}
      />
      <CompareRow
        label="준공년도"
        values={apts.map((apt) => apt ? `${apt.builtYear}년` : '-')}
        highlight="max"
        rawValues={apts.map((apt) => apt?.builtYear ?? 0)}
      />
      <CompareRow
        label="건설사"
        values={apts.map((apt) => apt?.builder ?? '-')}
      />

      {/* ── 가격 정보 섹션 ── */}
      <SectionHeader label="가격 정보" colCount={colCount} />

      <CompareRow
        label="최근 거래가"
        values={apts.map((apt) =>
          apt ? (
            <span>
              {formatPriceShort(apt.recentPrice)}
              <span className="text-[10px] text-[#8B95A1] ml-1">({apt.recentPriceArea}㎡)</span>
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
            <span className={priceChangeColor(apt.priceChangeType)}>
              {priceArrow(apt.priceChangeType)}{formatChange(apt.priceChange)}
            </span>
          ) : '-'
        )}
        highlight="max"
        rawValues={apts.map((apt) => apt?.priceChange ?? 0)}
      />

      {/* ── 면적 정보 섹션 ── */}
      <SectionHeader label="면적 구성" colCount={colCount} />

      <CompareRow
        label="제공 면적"
        values={apts.map((apt) =>
          apt ? apt.areas.map((a) => formatArea(a)).join(', ') : '-'
        )}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// ComparePage — 메인 페이지
// ─────────────────────────────────────────────────────────
export default function ComparePage() {
  const navigate = useNavigate();
  const compareList = useCompareStore((s) => s.compareList);
  const clearCompare = useCompareStore((s) => s.clearCompare);

  return (
    <div className="min-h-screen bg-[#F7FAF8]">
      {/* 헤더 */}
      <header className="bg-white border-b border-[#E5E8EB] sticky top-0 z-30 px-5 py-4 md:px-6">
        <div className="max-w-screen-xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#F7FAF8] transition-colors"
            aria-label="뒤로가기"
          >
            <IconChevronLeft />
          </button>
          <h1 className="text-base font-bold text-[#191F28] flex-1">단지 비교</h1>
          {compareList.length > 0 && (
            <TextButton
              size="small"
              color="assistive"
              onClick={clearCompare}
            >
              초기화
            </TextButton>
          )}
        </div>
      </header>

      <main className="pb-8">
        <div className="max-w-screen-xl mx-auto px-4 md:px-6 pt-5">

          {/* 비교할 단지가 없을 때 */}
          {compareList.length === 0 && (
            <div className="bg-white rounded-2xl border border-[#E5E8EB] flex flex-col items-center justify-center py-16 px-6 text-center">
              {/* 아이콘 */}
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C4C9CF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 17H5a2 2 0 00-2 2" />
                <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v14" />
                <path d="M5 21h14a2 2 0 002-2V9a2 2 0 00-2-2H9" />
              </svg>
              <p className="mt-4 text-[16px] font-bold text-[#4E5968]">비교할 단지를 선택해주세요</p>
              <p className="mt-2 text-[13px] text-[#8B95A1]">
                단지 카드의 + 버튼을 눌러 최대 3개 단지를 비교할 수 있습니다
              </p>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                onClick={() => navigate('/')}
                trailingContent={<IconArrowRight />}
                className="mt-6"
              >
                단지 둘러보기
              </Button>
            </div>
          )}

          {/* 비교할 단지가 1개일 때 — 안내 메시지 */}
          {compareList.length === 1 && (
            <>
              <div className="mb-4 bg-[#FFF9E6] border border-[#F6C90E]/30 rounded-xl px-4 py-3">
                <p className="text-[13px] text-[#856404] font-medium">
                  비교는 최소 2개 단지가 필요합니다. 단지를 하나 더 추가해주세요.
                </p>
              </div>
              <CompareTable ids={compareList.map((item) => item.id)} />
            </>
          )}

          {/* 비교 테이블 (2개 이상) */}
          {compareList.length >= 2 && (
            <CompareTable ids={compareList.map((item) => item.id)} />
          )}
        </div>
      </main>
    </div>
  );
}
