import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PriceFilter, SubscriptionStatus, SortOrder } from '../types';

interface FilterState {
  // 지도 필터
  priceRange: PriceFilter;
  selectedArea: string; // 면적 필터 (전체/59/84/114)
  selectedRegion: string; // 지역 필터

  // 청약 필터
  subscriptionStatus: SubscriptionStatus;
  subscriptionSort: SortOrder;
  subscriptionRegion: string;

  // 검색어
  searchKeyword: string;
  recentSearches: string[];

  // 액션
  setPriceRange: (range: PriceFilter) => void;
  setSelectedArea: (area: string) => void;
  setSelectedRegion: (region: string) => void;
  setSubscriptionStatus: (status: SubscriptionStatus) => void;
  setSubscriptionSort: (sort: SortOrder) => void;
  setSubscriptionRegion: (region: string) => void;
  setSearchKeyword: (keyword: string) => void;
  addRecentSearch: (keyword: string) => void;
  clearRecentSearches: () => void;
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      priceRange: 'all',
      selectedArea: '전체',
      selectedRegion: '전국',
      subscriptionStatus: 'ongoing',
      subscriptionSort: 'deadline',
      subscriptionRegion: '전국',
      searchKeyword: '',
      recentSearches: [],

      setPriceRange: (range) => set({ priceRange: range }),
      setSelectedArea: (area) => set({ selectedArea: area }),
      setSelectedRegion: (region) => set({ selectedRegion: region }),
      setSubscriptionStatus: (status) => set({ subscriptionStatus: status }),
      setSubscriptionSort: (sort) => set({ subscriptionSort: sort }),
      setSubscriptionRegion: (region) => set({ subscriptionRegion: region }),
      setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),

      addRecentSearch: (keyword) => {
        if (!keyword.trim()) return;
        const current = get().recentSearches;
        const filtered = current.filter((k) => k !== keyword);
        set({ recentSearches: [keyword, ...filtered].slice(0, 5) });
      },

      clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    {
      name: 'aptner-filter-store',
    }
  )
);
