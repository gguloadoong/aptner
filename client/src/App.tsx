import './App.css';
import { Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoadingSpinner from './components/ui/LoadingSpinner';

// 페이지 lazy loading — 초기 번들 크기 축소
const HomePage = lazy(() => import('./pages/HomePage'));
const MapPage = lazy(() => import('./pages/MapPage'));
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage'));
const SubscriptionDetailPage = lazy(() => import('./pages/SubscriptionDetailPage'));
const ApartmentDetailPage = lazy(() => import('./pages/ApartmentDetailPage'));
const TrendPage = lazy(() => import('./pages/TrendPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));

// React Query 클라이언트 설정
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // API 실패 시 마지막 정상 데이터 유지
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      // 포커스 시 자동 갱신 (창 전환)
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="w-full relative bg-[#F5F6F8] min-h-screen">
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><LoadingSpinner message="페이지 로딩중..." /></div>}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/subscription" element={<SubscriptionPage />} />
              <Route path="/subscription/:id" element={<SubscriptionDetailPage />} />
              <Route path="/apartment/:id" element={<ApartmentDetailPage />} />
              <Route path="/trend" element={<TrendPage />} />
              <Route path="/search" element={<SearchPage />} />
              {/* 404 처리 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
