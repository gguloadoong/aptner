import { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKakaoMap, isVisible } from '../hooks/useKakaoMap';
import { useMapStore } from '../stores/mapStore';
import { useApartmentDetail } from '../hooks/useApartment';
import BottomSheet from '../components/ui/BottomSheet';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { formatPriceShort, formatChange, formatUnits } from '../utils/formatNumber';
import type { MapApartment, PriceFilter, AreaFilter } from '../types';
import { MOCK_MAP_APARTMENTS } from '../mocks/apartments.mock';
import { getApartmentsByBounds } from '../services/apartment.service';
import { useToastStore } from '../stores/toastStore';

// 지도 페이지 - 모바일: 지도 전체 + 바텀시트, 데스크탑: 좌측 패널 + 우측 지도
export default function MapPage() {
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const {
    priceFilter,
    layerFilters,
    areaFilter,
    selectedApartment,
    isBottomSheetOpen,
    setPriceFilter,
    setLayerFilter,
    setAreaFilter,
    setSelectedApartment,
    closeBottomSheet,
  } = useMapStore();
  const addToast = useToastStore((s) => s.addToast);
  const [searchValue, setSearchValue] = useState('');
  const [mapApartments, setMapApartments] = useState<MapApartment[]>(MOCK_MAP_APARTMENTS);

  // 바텀시트용 선택 아파트 상세 정보
  const { data: selectedDetail } = useApartmentDetail(selectedApartment?.id);

  // 마커 클릭 핸들러
  const handleMarkerClick = useCallback((apt: MapApartment) => {
    setSelectedApartment({
      id: apt.id,
      name: apt.name,
      address: '',
      district: '',
      dong: '',
      lat: apt.lat,
      lng: apt.lng,
      totalUnits: 0,
      builtYear: 0,
      builder: '',
      areas: apt.areas ?? [apt.area],
      recentPrice: apt.price,
      recentPriceArea: apt.area,
      priceChange: 0,
      priceChangeType: apt.priceChangeType,
      // 청약 관련 필드는 selectedApartment(Apartment)에 없으므로 별도 상태로 관리
    });
  }, [setSelectedApartment]);

  // 뷰포트 변경 핸들러 - 청약 마커 포함하여 병합된 데이터로 갱신
  // M-4: getApartmentsByBounds 내부에서 청약 데이터를 병합하므로 마커 소실 방지
  const handleBoundsChange = useCallback(
    async (swLat: number, swLng: number, neLat: number, neLng: number) => {
      try {
        const merged = await getApartmentsByBounds(swLat, swLng, neLat, neLng);
        setMapApartments(merged);
      } catch (err) {
        // API 실패 시 기존 mapApartments 유지 (경고만 출력)
        console.warn('[handleBoundsChange] 마커 데이터 갱신 실패, 기존 데이터 유지:', err);
      }
    },
    []
  );

  const { isLoaded, isError, updateMarkers, moveToLocation } = useKakaoMap(
    mapContainerRef,
    {
      initialLat: 37.5665,
      initialLng: 126.978,
      initialLevel: 7,
      onMarkerClick: handleMarkerClick,
      onBoundsChange: handleBoundsChange,
    }
  );

  // 마커 업데이트 — 필터 옵션 전달
  useEffect(() => {
    if (isLoaded) {
      updateMarkers(mapApartments, { priceFilter, areaFilter, layerFilters });
    }
  }, [isLoaded, mapApartments, updateMarkers, priceFilter, areaFilter, layerFilters]);

  // 데스크탑 패널용 필터된 아파트 목록
  const filteredList = MOCK_MAP_APARTMENTS.filter((apt) => {
    const matchSearch = !searchValue || apt.name.includes(searchValue);
    return matchSearch && isVisible(apt, { priceFilter, areaFilter, layerFilters });
  });

  // 활성 레이어 개수
  const activeLayerCount = [layerFilters.hot, layerFilters.allTimeHigh, layerFilters.subscription]
    .filter(Boolean).length;

  // 현재 위치로 이동
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      addToast('이 브라우저는 위치 서비스를 지원하지 않습니다.', 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        moveToLocation(pos.coords.latitude, pos.coords.longitude, 5);
      },
      () => addToast('위치 정보를 가져올 수 없습니다.', 'error')
    );
  };

  // 선택된 MapApartment (청약 정보 패널 렌더링용)
  // C-1: MOCK_MAP_APARTMENTS 대신 동적으로 관리되는 mapApartments state를 조회 소스로 사용
  const selectedMapApt = selectedApartment
    ? mapApartments.find((a) => a.id === selectedApartment.id)
    : null;

  return (
    <div className="relative w-full h-screen bg-gray-200 flex">
      {/* ─── 데스크탑 좌측 사이드 패널 ─── */}
      <aside className="hidden md:flex flex-col w-[380px] flex-shrink-0 bg-white border-r border-[#E5E8EB] z-20 h-full overflow-hidden">
        {/* 패널 헤더 */}
        <div className="px-4 py-4 border-b border-[#E5E8EB] flex-shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-[#191F28]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 bg-[#1B64DA] rounded-md flex items-center justify-center">
                <span className="text-white text-xs font-black">A</span>
              </div>
              <span className="text-base font-black text-[#191F28]">Aptner 지도</span>
            </div>
          </div>

          {/* 검색바 */}
          <div className="flex items-center gap-2 bg-[#F5F6F8] rounded-xl px-3 py-2.5">
            <svg className="w-4 h-4 text-[#8B95A1] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="단지명 검색"
              className="flex-1 text-sm bg-transparent outline-none text-[#191F28] placeholder-[#8B95A1]"
            />
          </div>

          {/* ── 필터 그룹 1: 가격대 ── */}
          <FilterGroupLabel label="가격대" className="mt-3" />
          <div className="flex gap-2 mt-1.5 flex-wrap">
            {PRICE_FILTERS.map((filter) => (
              <FilterChip
                key={filter.value}
                label={filter.label}
                active={priceFilter === filter.value}
                onClick={() => setPriceFilter(filter.value as PriceFilter)}
              />
            ))}
          </div>

          {/* ── 필터 그룹 2: 레이어 ── */}
          <div className="flex items-center gap-2 mt-3">
            <FilterGroupLabel label="레이어" />
            {activeLayerCount > 0 && (
              <span
                className="inline-flex items-center px-1.5 rounded-full text-white text-[10px] font-bold"
                style={{ background: '#1B64DA', height: '16px' }}
              >
                {activeLayerCount} 활성
              </span>
            )}
          </div>
          <div className="flex gap-2 mt-1.5 flex-wrap">
            <FilterChip
              label="HOT"
              active={layerFilters.hot}
              activeColor="#FF4136"
              onClick={() => setLayerFilter('hot', !layerFilters.hot)}
            />
            <FilterChip
              label="신고가"
              active={layerFilters.allTimeHigh}
              activeColor="#F39C12"
              onClick={() => setLayerFilter('allTimeHigh', !layerFilters.allTimeHigh)}
            />
            <FilterChip
              label="청약"
              active={layerFilters.subscription}
              activeColor="#1B64DA"
              onClick={() => setLayerFilter('subscription', !layerFilters.subscription)}
            />
          </div>

          {/* ── 필터 그룹 3: 평형 ── */}
          <FilterGroupLabel label="평형" className="mt-3" />
          <div className="flex gap-2 mt-1.5 flex-wrap">
            {AREA_FILTERS.map((filter) => (
              <FilterChip
                key={filter.value}
                label={filter.label}
                active={areaFilter === filter.value}
                onClick={() =>
                  setAreaFilter(areaFilter === filter.value ? 'all' : (filter.value as AreaFilter))
                }
              />
            ))}
          </div>
        </div>

        {/* 아파트 목록 */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-2.5 border-b border-[#E5E8EB]">
            <p className="text-xs text-[#8B95A1]">총 {filteredList.length}개 단지</p>
          </div>

          {filteredList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <svg className="w-10 h-10 text-[#E5E8EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="text-sm text-[#8B95A1]">검색 결과가 없습니다</p>
            </div>
          ) : (
            <ul>
              {filteredList.map((apt) => {
                const isSelected = selectedApartment?.id === apt.id;
                const eok = apt.price / 10000;
                const markerBg =
                  eok >= 20
                    ? 'bg-[#D63031]'
                    : eok >= 10
                    ? 'bg-[#FF4B4B]'
                    : eok >= 5
                    ? 'bg-[#FF9500]'
                    : 'bg-[#8B95A1]';

                return (
                  <li key={apt.id}>
                    <button
                      onClick={() => handleMarkerClick(apt)}
                      className={[
                        'w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors border-b border-[#E5E8EB]',
                        isSelected ? 'bg-blue-50' : 'hover:bg-[#F5F6F8]',
                      ].join(' ')}
                    >
                      <div className={`flex-shrink-0 ${markerBg} text-white text-xs font-bold px-2.5 py-1 rounded-full min-w-[52px] text-center`}>
                        {formatPriceShort(apt.price)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#191F28] truncate">{apt.name}</p>
                        <p className="text-xs text-[#8B95A1] mt-0.5">{apt.area}㎡ 기준</p>
                      </div>
                      {isSelected && (
                        <svg className="w-4 h-4 text-[#1B64DA] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* 선택된 아파트 상세 (데스크탑 패널 하단) */}
        {selectedApartment && (
          <div className="flex-shrink-0 border-t border-[#E5E8EB] bg-white p-4">
            {/* 청약 정보 섹션 (청약 마커 선택 시) */}
            {selectedMapApt && (selectedMapApt.markerType === 'subOngoing' || selectedMapApt.markerType === 'subUpcoming') && (
              <SubscriptionInfoSection apt={selectedMapApt} navigate={navigate} />
            )}
            {selectedDetail ? (
              <DesktopApartmentSummary
                apartment={selectedDetail}
                onDetailClick={() => navigate(`/apartment/${selectedDetail.id}`)}
              />
            ) : (
              <div>
                <h3 className="font-bold text-[#191F28] text-base">{selectedApartment.name}</h3>
                <p className="text-xl font-black text-[#191F28] mt-1">
                  {formatPriceShort(selectedApartment.recentPrice)}
                </p>
                <Button className="mt-3 w-full" onClick={() => navigate(`/apartment/${selectedApartment.id}`)}>
                  상세보기
                </Button>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* ─── 지도 영역 ─── */}
      <div className="relative flex-1 h-full">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* 카카오맵 미사용 시 Mock 맵 UI */}
        {(!isLoaded || isError) && (
          <div className="absolute inset-0 bg-[#E8EEF4] flex flex-col">
            <MockMapBackground apartments={mapApartments} onMarkerClick={handleMarkerClick} />
          </div>
        )}

        {/* ── 모바일 상단 오버레이 (검색바 + 3행 필터) ── */}
        <div className="md:hidden absolute top-0 left-0 right-0 z-20 p-4 pt-safe">
          {/* 검색바 + 뒤로가기 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center flex-shrink-0"
            >
              <svg className="w-5 h-5 text-[#191F28]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 bg-white rounded-xl shadow-md flex items-center gap-2 px-4 py-3">
              <svg className="w-4 h-4 text-[#8B95A1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="주소, 단지명 검색"
                className="flex-1 text-sm outline-none text-[#191F28] placeholder-[#8B95A1]"
              />
            </div>
          </div>

          {/* 행 1: 가격대 필터 (가로 스크롤) */}
          <div className="flex gap-2 mt-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {PRICE_FILTERS.map((filter) => (
              <MobileFilterChip
                key={filter.value}
                label={filter.label}
                active={priceFilter === filter.value}
                onClick={() => setPriceFilter(filter.value as PriceFilter)}
              />
            ))}
          </div>

          {/* 행 2: 레이어 필터 (가로 스크롤) */}
          <div className="flex gap-2 mt-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            <MobileFilterChip
              label="HOT"
              active={layerFilters.hot}
              activeColor="#FF4136"
              onClick={() => setLayerFilter('hot', !layerFilters.hot)}
            />
            <MobileFilterChip
              label="신고가"
              active={layerFilters.allTimeHigh}
              activeColor="#F39C12"
              onClick={() => setLayerFilter('allTimeHigh', !layerFilters.allTimeHigh)}
            />
            <MobileFilterChip
              label="청약"
              active={layerFilters.subscription}
              activeColor="#1B64DA"
              onClick={() => setLayerFilter('subscription', !layerFilters.subscription)}
            />
            {activeLayerCount > 0 && (
              <span
                className="flex-shrink-0 flex items-center px-2 rounded-full text-white text-[10px] font-bold shadow-sm"
                style={{ background: '#1B64DA', height: '32px' }}
              >
                {activeLayerCount} 활성
              </span>
            )}
          </div>

          {/* 행 3: 평형 필터 (가로 스크롤) */}
          <div className="flex gap-2 mt-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {AREA_FILTERS.map((filter) => (
              <MobileFilterChip
                key={filter.value}
                label={filter.label}
                active={areaFilter === filter.value}
                onClick={() =>
                  setAreaFilter(areaFilter === filter.value ? 'all' : (filter.value as AreaFilter))
                }
              />
            ))}
          </div>
        </div>

        {/* 마커 범례 (데스크탑 지도 우상단) */}
        <div className="hidden md:flex absolute top-4 right-4 z-20 bg-white rounded-xl shadow-md px-3 py-2 gap-3 items-center">
          <span className="text-xs text-[#8B95A1] font-semibold">가격 범례</span>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-[#8B95A1]" />
            <span className="text-[11px] text-[#8B95A1]">5억 미만</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF9500]" />
            <span className="text-[11px] text-[#8B95A1]">5~10억</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF4B4B]" />
            <span className="text-[11px] text-[#8B95A1]">10~20억</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-[#D63031]" />
            <span className="text-[11px] text-[#8B95A1]">20억+</span>
          </div>
        </div>

        {/* 현재 위치 버튼 */}
        <button
          onClick={handleCurrentLocation}
          className="absolute right-4 bottom-32 md:bottom-8 z-20 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
          aria-label="현재 위치"
        >
          <svg className="w-5 h-5 text-[#1B64DA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* 지도 로딩 표시 */}
        {!isLoaded && !isError && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
            <LoadingSpinner message="지도 로딩중..." />
          </div>
        )}
      </div>

      {/* ─── 모바일 선택된 단지 바텀시트 ─── */}
      <div className="md:hidden">
        <BottomSheet
          isOpen={isBottomSheetOpen}
          onClose={closeBottomSheet}
          snapPoints="auto"
        >
          {selectedDetail ? (
            <ApartmentSummary
              apartment={selectedDetail}
              selectedMapApt={selectedMapApt}
              onDetailClick={() => navigate(`/apartment/${selectedDetail.id}`)}
              navigate={navigate}
            />
          ) : selectedApartment ? (
            <div className="p-5">
              {/* 청약 정보 섹션 (청약 마커인 경우) */}
              {selectedMapApt && (selectedMapApt.markerType === 'subOngoing' || selectedMapApt.markerType === 'subUpcoming') && (
                <SubscriptionInfoSection apt={selectedMapApt} navigate={navigate} />
              )}
              <h3 className="font-bold text-[#191F28] text-lg">{selectedApartment.name}</h3>
              <p className="text-2xl font-black text-[#191F28] mt-2">
                {formatPriceShort(selectedApartment.recentPrice)}
              </p>
              <Button
                className="mt-4 w-full"
                onClick={() => navigate(`/apartment/${selectedApartment.id}`)}
              >
                상세보기
              </Button>
            </div>
          ) : null}
        </BottomSheet>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 필터 UI 공통 컴포넌트
// ────────────────────────────────────────────────────────────

// 그룹 라벨 (데스크탑 사이드패널 전용)
function FilterGroupLabel({ label, className = '' }: { label: string; className?: string }) {
  return (
    <p
      className={className}
      style={{ fontSize: '11px', fontWeight: 600, color: '#8B95A1' }}
    >
      {label}
    </p>
  );
}

// 데스크탑 필터 칩 (height 28px)
function FilterChip({
  label,
  active,
  activeColor = '#1B64DA',
  onClick,
}: {
  label: string;
  active: boolean;
  activeColor?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        height: '28px',
        padding: '0 10px',
        borderRadius: '14px',
        fontSize: '12px',
        fontWeight: 600,
        border: `1px solid ${active ? activeColor : '#E5E8EB'}`,
        background: active ? activeColor : '#FFFFFF',
        color: active ? '#FFFFFF' : '#8B95A1',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

// 모바일 필터 칩 (height 32px, 터치 타겟 확보)
function MobileFilterChip({
  label,
  active,
  activeColor = '#1B64DA',
  onClick,
}: {
  label: string;
  active: boolean;
  activeColor?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        height: '32px',
        padding: '0 12px',
        borderRadius: '16px',
        fontSize: '12px',
        fontWeight: 600,
        border: `1px solid ${active ? activeColor : 'transparent'}`,
        background: active ? activeColor : '#FFFFFF',
        color: active ? '#FFFFFF' : '#8B95A1',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
      }}
    >
      {label}
    </button>
  );
}

// ────────────────────────────────────────────────────────────
// 청약 정보 섹션 (TASK 9 — 섹션 3)
// ────────────────────────────────────────────────────────────

function SubscriptionInfoSection({
  apt,
  navigate,
}: {
  apt: MapApartment;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const isOngoing = apt.markerType === 'subOngoing';
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // D-Day 계산
  let dDayText = '';
  let dDayColor = '#1B64DA';
  if (isOngoing && apt.subDeadline) {
    const dl = new Date(apt.subDeadline);
    dl.setHours(0, 0, 0, 0);
    const diff = Math.ceil((dl.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) {
      dDayText = 'D-Day';
    } else if (diff > 0) {
      dDayText = `D-${diff}`;
    }
    dDayColor = diff <= 7 ? '#D63031' : '#1B64DA';
  } else if (!isOngoing && apt.subStartDate) {
    const st = new Date(apt.subStartDate);
    st.setHours(0, 0, 0, 0);
    const diff = Math.ceil((st.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) {
      // N-3: D-0 후 시작 → D-Day 시작으로 표시
      dDayText = 'D-Day 시작';
    } else if (diff > 0) {
      dDayText = `D-${diff} 후 시작`;
    }
    dDayColor = '#E67E22';
  }

  return (
    <div className="mb-3 pb-3 border-b border-[#E5E8EB]">
      {/* 상태 뱃지 + D-Day */}
      <div className="flex items-center gap-2 mb-2">
        <span
          style={{
            height: '22px',
            padding: '0 8px',
            borderRadius: '11px',
            fontSize: '11px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            background: isOngoing ? '#E8F1FD' : '#FFF4E5',
            color: isOngoing ? '#1B64DA' : '#E67E22',
          }}
        >
          {isOngoing ? '청약 진행중' : '청약 예정'}
        </span>
        {dDayText && (
          <span style={{ fontSize: '14px', fontWeight: 800, color: dDayColor }}>
            {dDayText}
          </span>
        )}
      </div>

      {/* 분양가 정보 */}
      <div className="flex items-center gap-2 mt-1.5">
        <span style={{ fontSize: '12px', color: '#8B95A1', fontWeight: 500 }}>분양가</span>
        <span style={{ fontSize: '13px', color: '#191F28', fontWeight: 700 }}>
          {formatPriceShort(apt.price)}
        </span>
      </div>

      {/* 청약 상세 보기 버튼 */}
      {apt.subId && (
        <button
          onClick={() => navigate(`/subscription/${apt.subId}`)}
          style={{
            marginTop: '10px',
            width: '100%',
            height: '40px',
            borderRadius: '10px',
            background: '#1B64DA',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          청약 상세 보기
        </button>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 데스크탑 패널 - 아파트 요약
// ────────────────────────────────────────────────────────────

function DesktopApartmentSummary({
  apartment,
  onDetailClick,
}: {
  apartment: ReturnType<typeof useApartmentDetail>['data'];
  onDetailClick: () => void;
}) {
  if (!apartment) return null;

  const priceColor =
    apartment.priceChangeType === 'up'
      ? 'text-[#FF4B4B]'
      : apartment.priceChangeType === 'down'
        ? 'text-[#00C896]'
        : 'text-[#8B95A1]';

  return (
    <div>
      <h3 className="font-black text-[#191F28] text-base leading-snug">{apartment.name}</h3>
      <p className="text-xs text-[#8B95A1] mt-0.5">{apartment.address || `${apartment.district} ${apartment.dong}`}</p>
      <div className="flex items-baseline gap-2 mt-2">
        <span className="text-xl font-black text-[#191F28]">
          {formatPriceShort(apartment.recentPrice)}
        </span>
        <span className="text-xs text-[#8B95A1]">{apartment.recentPriceArea}㎡</span>
        <span className={`text-xs font-bold ${priceColor}`}>
          {formatChange(apartment.priceChange)}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#E5E8EB] text-center">
        <div>
          <p className="text-[10px] text-[#8B95A1]">세대수</p>
          <p className="text-xs font-bold text-[#191F28] mt-0.5">{formatUnits(apartment.totalUnits)}</p>
        </div>
        <div>
          <p className="text-[10px] text-[#8B95A1]">준공</p>
          <p className="text-xs font-bold text-[#191F28] mt-0.5">{apartment.builtYear}년</p>
        </div>
        <div>
          <p className="text-[10px] text-[#8B95A1]">건설사</p>
          <p className="text-xs font-bold text-[#191F28] mt-0.5 truncate">{apartment.builder}</p>
        </div>
      </div>
      <Button fullWidth className="mt-3" onClick={onDetailClick}>
        상세보기
      </Button>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 모바일 단지 요약 바텀시트 내용
// ────────────────────────────────────────────────────────────

function ApartmentSummary({
  apartment,
  selectedMapApt,
  onDetailClick,
  navigate,
}: {
  apartment: ReturnType<typeof useApartmentDetail>['data'];
  selectedMapApt: MapApartment | null | undefined;
  onDetailClick: () => void;
  navigate: ReturnType<typeof useNavigate>;
}) {
  if (!apartment) return null;

  const priceColor =
    apartment.priceChangeType === 'up'
      ? 'text-[#FF4B4B]'
      : apartment.priceChangeType === 'down'
        ? 'text-[#00C896]'
        : 'text-[#8B95A1]';

  return (
    <div className="p-5">
      <h3 className="font-black text-[#191F28] text-lg leading-snug">{apartment.name}</h3>
      <p className="text-sm text-[#8B95A1] mt-1">{apartment.address || `${apartment.district} ${apartment.dong}`}</p>

      {/* 청약 정보 섹션 (청약 마커인 경우 상단에 표시) */}
      {selectedMapApt && (selectedMapApt.markerType === 'subOngoing' || selectedMapApt.markerType === 'subUpcoming') && (
        <div className="mt-3">
          <SubscriptionInfoSection apt={selectedMapApt} navigate={navigate} />
        </div>
      )}

      <div className="flex items-baseline gap-2 mt-3">
        <span className="text-2xl font-black text-[#191F28]">
          {formatPriceShort(apartment.recentPrice)}
        </span>
        <span className="text-sm text-[#8B95A1]">{apartment.recentPriceArea}㎡</span>
        <span className={`text-sm font-bold ${priceColor}`}>
          {formatChange(apartment.priceChange)}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#E5E8EB]">
        <div>
          <p className="text-xs text-[#8B95A1]">세대수</p>
          <p className="text-sm font-bold text-[#191F28] mt-0.5">{formatUnits(apartment.totalUnits)}</p>
        </div>
        <div>
          <p className="text-xs text-[#8B95A1]">준공</p>
          <p className="text-sm font-bold text-[#191F28] mt-0.5">{apartment.builtYear}년</p>
        </div>
        <div>
          <p className="text-xs text-[#8B95A1]">건설사</p>
          <p className="text-sm font-bold text-[#191F28] mt-0.5 truncate">{apartment.builder}</p>
        </div>
      </div>

      <Button fullWidth className="mt-5" onClick={onDetailClick}>
        상세보기
      </Button>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Mock 지도 배경 (카카오맵 없을 때)
// ────────────────────────────────────────────────────────────

function MockMapBackground({
  apartments,
  onMarkerClick,
}: {
  apartments: MapApartment[];
  onMarkerClick: (apt: MapApartment) => void;
}) {
  return (
    <div className="relative w-full h-full overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(180, 200, 220, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(180, 200, 220, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          backgroundColor: '#E8EEF4',
        }}
      />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute bg-white h-2" style={{ top: '30%', left: 0, right: 0 }} />
        <div className="absolute bg-white h-2" style={{ top: '60%', left: 0, right: 0 }} />
        <div className="absolute bg-white w-2" style={{ left: '40%', top: 0, bottom: 0 }} />
        <div className="absolute bg-white w-2" style={{ left: '70%', top: 0, bottom: 0 }} />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <div className="bg-white/90 rounded-2xl p-4 shadow-lg">
          <p className="text-sm font-bold text-[#191F28]">카카오맵 연동 필요</p>
          <p className="text-xs text-[#8B95A1] mt-1">.env에 VITE_KAKAO_MAP_KEY 설정</p>
        </div>
      </div>
      {apartments.slice(0, 8).map((apt, i) => {
        const eok = apt.price / 10000;
        const markerBg =
          eok >= 20
            ? 'bg-[#D63031]'
            : eok >= 10
            ? 'bg-[#FF4B4B]'
            : eok >= 5
            ? 'bg-[#FF9500]'
            : 'bg-[#8B95A1]';
        const positions = [
          { top: '20%', left: '25%' },
          { top: '35%', left: '60%' },
          { top: '50%', left: '35%' },
          { top: '65%', left: '55%' },
          { top: '25%', left: '70%' },
          { top: '70%', left: '20%' },
          { top: '45%', left: '80%' },
          { top: '15%', left: '50%' },
        ];
        return (
          <button
            key={apt.id}
            className={`absolute ${markerBg} text-white text-xs font-bold px-2.5 py-1.5 rounded-full shadow-md border-2 border-white cursor-pointer hover:scale-110 transition-transform`}
            style={positions[i]}
            onClick={() => onMarkerClick(apt)}
          >
            {formatPriceShort(apt.price)}
          </button>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 상수 정의
// ────────────────────────────────────────────────────────────

const PRICE_FILTERS = [
  { value: 'all', label: '전체' },
  { value: 'under5', label: '5억 이하' },
  { value: '5to10', label: '5~10억' },
  { value: 'over10', label: '10억 이상' },
];

const AREA_FILTERS = [
  { value: '59', label: '59㎡' },
  { value: '74', label: '74㎡' },
  { value: '84', label: '84㎡' },
  { value: '109plus', label: '109㎡+' },
];
