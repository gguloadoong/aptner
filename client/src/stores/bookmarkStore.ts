// 찜하기(북마크) 로컬 저장소 — zustand persist 사용
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BookmarkStore {
  bookmarks: Set<string>;  // 찜한 아파트 ID 집합
  bookmarkCount: number;   // 찜 개수 (헤더 배지용)
  isBookmarked: (id: string) => boolean;
  toggleBookmark: (id: string) => void;
}

export const useBookmarkStore = create<BookmarkStore>()(
  persist(
    (set, get) => ({
      bookmarks: new Set<string>(),
      bookmarkCount: 0,
      isBookmarked: (id: string) => get().bookmarks.has(id),
      toggleBookmark: (id: string) => {
        set((state) => {
          const newBookmarks = new Set(state.bookmarks);
          if (newBookmarks.has(id)) {
            newBookmarks.delete(id);
          } else {
            newBookmarks.add(id);
          }
          return { bookmarks: newBookmarks, bookmarkCount: newBookmarks.size };
        });
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
          parsed.state.bookmarks = new Set(parsed.state.bookmarks);
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
