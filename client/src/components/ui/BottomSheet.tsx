import React, { useEffect } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapPoints?: 'half' | 'full' | 'auto';
}

// 모바일 바텀시트 컴포넌트
const BottomSheet = React.memo<BottomSheetProps>(
  ({ isOpen, onClose, title, children, snapPoints = 'auto' }) => {
    // 바텀시트 열릴 때 스크롤 방지
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
      return () => {
        document.body.style.overflow = '';
      };
    }, [isOpen]);

    const heightStyles = {
      half: 'h-1/2',
      full: 'h-[90vh]',
      auto: 'max-h-[80vh]',
    };

    return (
      <>
        {/* 배경 오버레이 */}
        <div
          className={[
            'fixed inset-0 bg-black/40 z-40 transition-opacity duration-300',
            isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
          ].join(' ')}
          onClick={onClose}
        />

        {/* 바텀시트 본체 */}
        <div
          className={[
            'fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl',
            'transition-transform duration-300 ease-out',
            'flex flex-col',
            heightStyles[snapPoints],
            isOpen ? 'translate-y-0' : 'translate-y-full',
          ].join(' ')}
        >
          {/* 드래그 핸들 */}
          <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* 헤더 */}
          {title && (
            <div className="flex items-center justify-between px-5 pb-3 flex-shrink-0 border-b border-[#E5E8EB]">
              <h3 className="text-base font-bold text-[#191F28]">{title}</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                aria-label="닫기"
              >
                <svg className="w-5 h-5 text-[#8B95A1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* 콘텐츠 */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {children}
          </div>
        </div>
      </>
    );
  }
);

BottomSheet.displayName = 'BottomSheet';
export default BottomSheet;
