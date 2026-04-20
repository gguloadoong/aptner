import { useEffect, useState } from 'react';
import { useToastStore, type Toast, type ToastType } from '../../stores/toastStore';

// 타입별 스타일 설정
const TYPE_STYLES: Record<ToastType, { bg: string; border: string; icon: string; iconColor: string }> = {
  success: {
    bg: 'bg-white',
    border: 'border-l-4 border-l-[#1B64DA]',
    icon: 'M5 13l4 4L19 7',
    iconColor: 'text-[#1B64DA]',
  },
  error: {
    bg: 'bg-white',
    border: 'border-l-4 border-l-[#FF4B4B]',
    icon: 'M6 18L18 6M6 6l12 12',
    iconColor: 'text-[#FF4B4B]',
  },
  info: {
    bg: 'bg-white',
    border: 'border-l-4 border-l-[#1B64DA]',
    icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    iconColor: 'text-[#1B64DA]',
  },
};

// 개별 토스트 아이템 - 마운트 시 슬라이드인 애니메이션
function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useToastStore((s) => s.removeToast);
  const [visible, setVisible] = useState(false);

  // 마운트 직후 visible=true로 전환하여 CSS transition 트리거
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const styles = TYPE_STYLES[toast.type];

  return (
    <div
      className={[
        'flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border border-[#E5E8EB] min-w-[260px] max-w-[360px]',
        styles.bg,
        styles.border,
        // 슬라이드인 애니메이션: translate + opacity CSS transition
        'transition-all duration-300',
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8',
      ].join(' ')}
    >
      {/* 타입 아이콘 */}
      <div className="flex-shrink-0 mt-0.5">
        <svg
          className={`w-4 h-4 ${styles.iconColor}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={styles.icon} />
        </svg>
      </div>

      {/* 메시지 */}
      <p className="flex-1 text-sm text-[#191F28] font-medium leading-snug">{toast.message}</p>

      {/* 닫기 버튼 */}
      <button
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-[#8B95A1] hover:text-[#191F28] transition-colors"
        aria-label="토스트 닫기"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// 토스트 컨테이너 - 우측 상단 고정
export default function Toast() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-5 right-5 z-[9999] flex flex-col gap-2"
      role="region"
      aria-label="알림"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
