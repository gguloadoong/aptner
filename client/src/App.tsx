import './App.css';
import { Suspense, lazy, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoadingSpinner from './components/ui/LoadingSpinner';
import ErrorBoundary from './components/ui/ErrorBoundary';
import AppLayout from './components/layout/AppLayout';
import { RegionConfig, useToast } from '@wanteddev/wds';
import { useAlertStore } from './stores/alertStore';
import { getHotApartments } from './services/apartment.service';
import { useBookmarkNotification } from './hooks/useBookmarkNotification';

// 북마크 알림 초기화 — 앱 전체에서 한 번만 실행, 결과를 store에 저장
function BookmarkNotificationInitializer() {
  useBookmarkNotification();
  return null;
}

// 페이지 lazy loading — 초기 번들 크기 축소
const HomePage = lazy(() => import('./pages/HomePage'));
const MapPage = lazy(() => import('./pages/MapPage'));
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage'));
const SubscriptionDetailPage = lazy(() => import('./pages/SubscriptionDetailPage'));
const ApartmentDetailPage = lazy(() => import('./pages/ApartmentDetailPage'));
const TrendPage = lazy(() => import('./pages/TrendPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const ComparePage = lazy(() => import('./pages/ComparePage'));
const BookmarksPage = lazy(() => import('./pages/BookmarksPage'));
const HotRankingPage = lazy(() => import('./pages/HotRankingPage'));
const SubscriptionCalendarPage = lazy(() => import('./pages/SubscriptionCalendarPage'));

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

// 가격 알림 조건 체크 (앱 진입 시)
function PriceAlertChecker() {
  const { alerts, updateTriggered } = useAlertStore();
  const addToast = useToast();

  useEffect(() => {
    if (alerts.length === 0) return;

    // 핫 아파트 현재가로 알림 조건 확인
    getHotApartments(undefined, 50)
      .then((apartments) => {
        alerts.forEach((alert) => {
          if (alert.triggered) return;
          const apt = apartments.find((a) => a.id === alert.apartmentId);
          if (!apt) return;
          if (apt.recentPrice <= alert.targetPrice) {
            updateTriggered(alert.apartmentId, true);
            addToast({
              content: `${alert.apartmentName} 목표가 도달! ${(apt.recentPrice / 10000).toFixed(1)}억`,
              variant: 'positive',
              duration: 'long',
            });
          }
        });
      })
      .catch(() => {});
  // 앱 진입 시 1회만 실행
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <BookmarkNotificationInitializer />
        <AppLayout>
          <div className="w-full relative bg-[#F5F6F8] min-h-screen">
            {/* 전역 에러 바운더리 - Suspense 내부 렌더링 에러 포착 */}
            <ErrorBoundary>
              <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><LoadingSpinner message="페이지 로딩중..." /></div>}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/map" element={<MapPage />} />
                  <Route path="/subscription" element={<SubscriptionPage />} />
                  <Route path="/subscription/calendar" element={<SubscriptionCalendarPage />} />
                  <Route path="/subscription/:id" element={<SubscriptionDetailPage />} />
                  <Route path="/apartment/:id" element={<ApartmentDetailPage />} />
                  <Route path="/trend" element={<TrendPage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/compare" element={<ComparePage />} />
                  <Route path="/bookmarks" element={<BookmarksPage />} />
                  <Route path="/hot" element={<HotRankingPage />} />
                  {/* 404 처리 */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
            {/* WDS RegionConfig - 전역 Toast/Snackbar 렌더링 영역 */}
            <RegionConfig />
            {/* 가격 알림 체크 */}
            <PriceAlertChecker />
          </div>
        </AppLayout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
