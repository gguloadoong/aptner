import { create } from 'zustand';

// 토스트 타입 정의
export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastState {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

// 유니크 ID 생성 헬퍼
function generateId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  // 토스트 추가 - 3초 후 자동 제거
  addToast: (message, type = 'info') => {
    const id = generateId();
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));

    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3000);
  },

  // 토스트 수동 제거
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));
