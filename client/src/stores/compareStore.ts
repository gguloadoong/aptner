// 단지 비교 스토어 — zustand persist 사용
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// id 외에 name을 함께 저장하여 실데이터 모드에서도 단지명 표시 가능
export interface CompareItem {
  id: string;
  name: string;
}

interface CompareStore {
  compareList: CompareItem[]; // 비교할 아파트 { id, name } 배열 (최대 3개)
  addCompare: (item: CompareItem) => void;
  removeCompare: (id: string) => void;
  isInCompare: (id: string) => boolean;
  clearCompare: () => void;
}

export const useCompareStore = create<CompareStore>()(
  persist(
    (set, get) => ({
      compareList: [],

      // 최대 3개 초과 시 무시
      addCompare: (item: CompareItem) => {
        set((state) => {
          if (state.compareList.some((c) => c.id === item.id)) return state;
          if (state.compareList.length >= 3) return state;
          return { compareList: [...state.compareList, item] };
        });
      },

      removeCompare: (id: string) => {
        set((state) => ({
          compareList: state.compareList.filter((item) => item.id !== id),
        }));
      },

      isInCompare: (id: string) => {
        return get().compareList.some((item) => item.id === id);
      },

      clearCompare: () => {
        set({ compareList: [] });
      },
    }),
    {
      name: 'bomzip-compare',
    }
  )
);
