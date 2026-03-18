// 찜하기(북마크) 로컬 저장소 — zustand persist 사용
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface NewTradeItem {
  id: string;
  name: string;
  oldPrice: number; // 만원
  newPrice: number; // 만원
}

interface BookmarkStore {
  bookmarks: Set<string>;  // 찜한 아파트 ID 집합
  bookmarkCount: number;   // 찜 개수 (헤더 배지용)
  lastCheckedPrices: Record<string, number>; // apartmentId → 마지막 확인 가격 (만원)
  newTrades: NewTradeItem[]; // 가격 변동 감지된 단지 (비영속성 — 앱 로드마다 재계산)
  isBookmarked: (id: string) => boolean;
  toggleBookmark: (id: string) => void;
  updateLastCheckedPrice: (id: string, price: number) => void;
  setNewTrades: (trades: NewTradeItem[]) => void;
  clearNewTrades: () => void;
}

export const useBookmarkStore = create<BookmarkStore>()(
  persist(
    (set, get) => ({
      bookmarks: new Set<string>(),
      bookmarkCount: 0,
      lastCheckedPrices: {},
      newTrades: [],
      isBookmarked: (id: string) => get().bookmarks.has(id),
      toggleBookmark: (id: string) => {
        set((state) => {
          const newBookmarks = new Set(state.bookmarks);
          if (newBookmarks.has(id)) {
            newBookmarks.delete(id);
            // 북마크 해제 시 lastCheckedPrices에서도 제거
            const newLastCheckedPrices = { ...state.lastCheckedPrices };
            delete newLastCheckedPrices[id];
            return {
              bookmarks: newBookmarks,
              bookmarkCount: newBookmarks.size,
              lastCheckedPrices: newLastCheckedPrices,
            };
          } else {
            newBookmarks.add(id);
            return { bookmarks: newBookmarks, bookmarkCount: newBookmarks.size };
          }
        });
      },
      updateLastCheckedPrice: (id: string, price: number) => {
        set((state) => ({
          lastCheckedPrices: { ...state.lastCheckedPrices, [id]: price },
        }));
      },
      setNewTrades: (trades: NewTradeItem[]) => {
        set({ newTrades: trades });
      },
      clearNewTrades: () => {
        set({ newTrades: [] });
      },
    }),
    {
      name: 'bomzip-bookmarks',
      // Set은 JSON 직렬화가 안 되므로 Array 변환 처리
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          // Array로 저장된 bookmarks를 Set으로 복원
          parsed.state.bookmarks = new Set(parsed.state.bookmarks ?? []);
          // lastCheckedPrices가 없는 구버전 스토리지 호환
          if (!parsed.state.lastCheckedPrices) {
            parsed.state.lastCheckedPrices = {};
          }
          return parsed;
        },
        setItem: (name, value) => {
          // Set을 Array로 변환하여 저장
          const toStore = {
            ...value,
            state: {
              ...value.state,
              bookmarks: Array.from(value.state.bookmarks),
            },
          };
          localStorage.setItem(name, JSON.stringify(toStore));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
