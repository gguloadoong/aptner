// 북마크 단지 신규 거래 알림 훅
// App.tsx에서 한 번만 호출 — 결과를 bookmarkStore에 저장해 컴포넌트 간 공유
import { useEffect } from 'react';
import { useBookmarkStore } from '../stores/bookmarkStore';
import { getApartmentDetail } from '../services/apartment.service';

export function useBookmarkNotification(): void {
  const bookmarks = useBookmarkStore((s) => s.bookmarks);
  const lastCheckedPrices = useBookmarkStore((s) => s.lastCheckedPrices);
  const updateLastCheckedPrice = useBookmarkStore((s) => s.updateLastCheckedPrice);
  const setNewTrades = useBookmarkStore((s) => s.setNewTrades);

  useEffect(() => {
    const bookmarkIds = Array.from(bookmarks);
    if (bookmarkIds.length === 0) {
      setNewTrades([]);
      return;
    }

    let cancelled = false;

    async function checkNewTrades() {
      const results = await Promise.allSettled(
        bookmarkIds.map((id) => getApartmentDetail(id))
      );

      if (cancelled) return;

      const trades = results.flatMap((result, index) => {
        if (result.status === 'rejected') return []; // API 실패 시 조용히 무시
        const apartment = result.value;
        if (!apartment) return [];

        const id = bookmarkIds[index];
        const currentPrice = apartment.recentPrice;
        const lastPrice = lastCheckedPrices[id];

        if (lastPrice === undefined) {
          // 처음 북마크한 단지: 알림 없이 현재가로 초기화
          updateLastCheckedPrice(id, currentPrice);
          return [];
        }

        if (currentPrice !== lastPrice) {
          return [{ id, name: apartment.name, oldPrice: lastPrice, newPrice: currentPrice }];
        }
        return [];
      });

      setNewTrades(trades);
    }

    checkNewTrades();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookmarks]); // lastCheckedPrices 의도적 제외 — 포함 시 무한루프
}
