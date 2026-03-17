// 가격 알림 로컬 저장소 — zustand persist
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PriceAlert {
  apartmentId: string;
  apartmentName: string;
  targetPrice: number;   // 만원. 이 가격 이하로 떨어지면 알림
  currentPrice: number;  // 알림 설정 시점 현재가
  area: string;          // 기준 면적 (예: '84')
  createdAt: string;     // ISO 날짜 문자열
  triggered: boolean;    // 이미 발동됐는지 여부
}

interface AlertStore {
  alerts: PriceAlert[];
  addAlert: (alert: Omit<PriceAlert, 'createdAt' | 'triggered'>) => void;
  removeAlert: (apartmentId: string) => void;
  updateTriggered: (apartmentId: string, triggered: boolean) => void;
  hasAlert: (apartmentId: string) => boolean;
  getAlert: (apartmentId: string) => PriceAlert | undefined;
}

export const useAlertStore = create<AlertStore>()(
  persist(
    (set, get) => ({
      alerts: [],
      addAlert: (alert) => {
        set((state) => {
          // 중복 제거: 같은 아파트면 업데이트
          const filtered = state.alerts.filter((a) => a.apartmentId !== alert.apartmentId);
          return {
            alerts: [
              ...filtered,
              { ...alert, createdAt: new Date().toISOString(), triggered: false },
            ],
          };
        });
      },
      removeAlert: (apartmentId) =>
        set((state) => ({ alerts: state.alerts.filter((a) => a.apartmentId !== apartmentId) })),
      updateTriggered: (apartmentId, triggered) =>
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.apartmentId === apartmentId ? { ...a, triggered } : a
          ),
        })),
      hasAlert: (apartmentId) => get().alerts.some((a) => a.apartmentId === apartmentId),
      getAlert: (apartmentId) => get().alerts.find((a) => a.apartmentId === apartmentId),
    }),
    { name: 'bomzip-alerts' }
  )
);
