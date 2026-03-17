// 화면 하단 고정 비교 바 — 비교 단지 선택 시 표시
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompareStore } from '../../stores/compareStore';
import type { CompareItem } from '../../stores/compareStore';
import { Button } from '@wanteddev/wds';
import { IconClose, IconArrowRight } from '@wanteddev/wds-icon';

// 단일 썸네일 카드 — compareList에 저장된 name 직접 사용 (실/Mock 모드 모두 동작)
function CompareThumb({ item }: { item: CompareItem }) {
  const removeCompare = useCompareStore((s) => s.removeCompare);
  const { id, name } = item;

  return (
    <div className="flex items-center gap-1.5 bg-white border border-blue-200 rounded-xl px-3 py-2 shadow-sm min-w-0 max-w-[160px]">
      {/* 단지명 */}
      <span className="text-[13px] font-semibold text-[#191F28] truncate flex-1">{name}</span>
      {/* X 버튼 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          removeCompare(id);
        }}
        className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-[#8B95A1] hover:text-[#FF4B4B] transition-colors"
        aria-label={`${name} 비교 제거`}
      >
        <IconClose style={{ width: 12, height: 12 }} />
      </button>
    </div>
  );
}

// 빈 슬롯 표시
function EmptySlot() {
  return (
    <div className="flex items-center justify-center bg-[#F7FAF8] border border-dashed border-[#C4C9CF] rounded-xl px-3 py-2 w-[120px]">
      <span className="text-[12px] text-[#C4C9CF]">단지 선택</span>
    </div>
  );
}

// 비교 바 컴포넌트
const CompareBar = React.memo(function CompareBar() {
  const navigate = useNavigate();
  const compareList = useCompareStore((s) => s.compareList);
  const clearCompare = useCompareStore((s) => s.clearCompare);

  // 0개 선택 시 숨김
  if (compareList.length === 0) return null;

  // 비교하기 버튼 핸들러
  const handleCompare = () => {
    navigate('/compare');
  };

  // 빈 슬롯 개수 계산 (최대 3개 기준)
  const emptyCount = 3 - compareList.length;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E5E8EB] shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
      role="region"
      aria-label="단지 비교"
    >
      {/* 모바일 하단 네비게이션 위로 올라오도록 pb 처리 — BottomNavigation 높이 약 56px */}
      <div className="max-w-[1280px] mx-auto px-4 py-3 md:py-4 flex items-center gap-3">
        {/* 선택된 단지 썸네일 목록 */}
        <div className="flex items-center gap-2 flex-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {compareList.map((item) => (
            <CompareThumb key={item.id} item={item} />
          ))}
          {/* 빈 슬롯 (데스크탑 전용) */}
          {Array.from({ length: emptyCount }).map((_, i) => (
            <div key={`empty-${i}`} className="hidden md:flex">
              <EmptySlot />
            </div>
          ))}
        </div>

        {/* 우측 액션 버튼 그룹 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* 초기화 버튼 */}
          <button
            onClick={clearCompare}
            className="text-[12px] text-[#8B95A1] hover:text-[#FF4B4B] transition-colors px-2 py-1 hidden md:block"
            aria-label="비교 목록 초기화"
          >
            초기화
          </button>

          {/* 비교하기 버튼 — 2개 이상 선택 시 활성화 */}
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
        </div>
      </div>

      {/* 모바일: BottomNavigation 위 안전 영역 */}
      <div className="lg:hidden h-14" />
    </div>
  );
});

export default CompareBar;
