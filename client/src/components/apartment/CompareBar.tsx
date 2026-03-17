// 화면 하단 고정 비교 바 — 비교 단지 선택 시 표시
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompareStore } from '../../stores/compareStore';
import type { CompareItem } from '../../stores/compareStore';
import { Button, FlexBox, Box, Typography } from '@wanteddev/wds';
import { IconClose, IconArrowRight } from '@wanteddev/wds-icon';

// 단일 썸네일 카드
function CompareThumb({ item }: { item: CompareItem }) {
  const removeCompare = useCompareStore((s) => s.removeCompare);
  const { id, name } = item;

  return (
    <FlexBox
      alignItems="center"
      gap="6px"
      style={{
        backgroundColor: 'var(--semantic-background-normal-normal)',
        border: '1px solid rgba(0,102,255,0.2)',
        borderRadius: '12px',
        padding: '8px 12px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        minWidth: 0,
        maxWidth: '160px',
      }}
    >
      <Typography
        variant="body2"
        weight="medium"
        sx={{ color: 'var(--semantic-label-normal)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        {name}
      </Typography>
      <button
        onClick={(e) => {
          e.stopPropagation();
          removeCompare(id);
        }}
        style={{
          flexShrink: 0,
          width: '16px',
          height: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--semantic-label-assistive)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          transition: 'color 100ms',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#FF4B4B'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--semantic-label-assistive)'; }}
        aria-label={`${name} 비교 제거`}
      >
        <IconClose style={{ width: 12, height: 12 }} />
      </button>
    </FlexBox>
  );
}

// 빈 슬롯 표시
function EmptySlot() {
  return (
    <FlexBox
      alignItems="center"
      justifyContent="center"
      style={{
        backgroundColor: 'var(--semantic-background-normal-alternative)',
        border: '1px dashed #C4C9CF',
        borderRadius: '12px',
        padding: '8px 12px',
        width: '120px',
      }}
    >
      <Typography variant="caption1" sx={{ color: '#C4C9CF' }}>
        단지 선택
      </Typography>
    </FlexBox>
  );
}

// 비교 바 컴포넌트
const CompareBar = React.memo(function CompareBar() {
  const navigate = useNavigate();
  const compareList = useCompareStore((s) => s.compareList);
  const clearCompare = useCompareStore((s) => s.clearCompare);

  if (compareList.length === 0) return null;

  const handleCompare = () => navigate('/compare');
  const emptyCount = 3 - compareList.length;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        backgroundColor: 'var(--semantic-background-normal-normal)',
        borderTop: '1px solid var(--semantic-line-normal)',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
      }}
      role="region"
      aria-label="단지 비교"
    >
      <Box sx={{ maxWidth: '1280px', margin: '0 auto', padding: '12px 16px' }}>
        <FlexBox alignItems="center" gap="12px">
          {/* 선택된 단지 썸네일 목록 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flex: 1,
              overflowX: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            } as React.CSSProperties}
          >
            {compareList.map((item) => (
              <CompareThumb key={item.id} item={item} />
            ))}
            {/* 빈 슬롯 (데스크탑 전용) */}
            {Array.from({ length: emptyCount }).map((_, i) => (
              <div key={`empty-${i}`} style={{ display: 'none' }} className="md-empty-slot">
                <EmptySlot />
              </div>
            ))}
          </div>

          {/* 우측 액션 버튼 그룹 */}
          <FlexBox alignItems="center" gap="8px" style={{ flexShrink: 0 }}>
            <button
              onClick={clearCompare}
              style={{
                fontSize: '12px',
                color: 'var(--semantic-label-assistive)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
                transition: 'color 100ms',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#FF4B4B'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--semantic-label-assistive)'; }}
              aria-label="비교 목록 초기화"
            >
              초기화
            </button>

            <Button
              variant="solid"
              color="primary"
              size="small"
              onClick={handleCompare}
              disabled={compareList.length < 2}
              trailingContent={<IconArrowRight />}
            >
              비교하기 {compareList.length}/3
            </Button>
          </FlexBox>
        </FlexBox>
      </Box>

      {/* 모바일: BottomNavigation 위 안전 영역 */}
      <div style={{ height: '56px', display: 'block' }} id="compare-bar-safe-area" />
    </Box>
  );
});

export default CompareBar;
