import { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useKakaoMap, isVisible } from '../hooks/useKakaoMap';
import { useMapStore } from '../stores/mapStore';
import { useApartmentDetail } from '../hooks/useApartment';
import { useGeocoder } from '../hooks/useGeocoder';
import BottomSheet from '../components/ui/BottomSheet';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Button, Chip, IconButton, useToast } from '@wanteddev/wds';
import { IconChevronLeft, IconArrowRight } from '@wanteddev/wds-icon';
import { formatPriceShort, formatChange, formatUnits } from '../utils/formatNumber';
import type { MapApartment, PriceFilter, AreaFilter, UnitCountFilter, ComplexFeature, ApartmentComplex } from '../types';
import { getApartmentsByBounds, getComplexesByBounds } from '../services/apartment.service';

// 지도 페이지 - 모바일: 지도 전체 + 바텀시트, 데스크탑: 좌측 패널 + 우측 지도
export default function MapPage() {
  const navigate = useNavigate();
  // SubscriptionDetailPage 등에서 /map?search=단지명+위치 형태로 진입 시 자동 검색
  const [searchParams] = useSearchParams();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const {
    priceFilter,
    layerFilters,
    areaFilter,
    unitCountFilter,
    complexFeatures,
    selectedApartment,
    isBottomSheetOpen,
    setPriceFilter,
    setLayerFilter,
    setAreaFilter,
    setUnitCountFilter,
    toggleComplexFeature,
    setSelectedApartment,
    closeBottomSheet,
  } = useMapStore();
  const addToast = useToast();
  // queryString의 search 파라미터로 초기값 세팅
  const [searchValue, setSearchValue] = useState(() => searchParams.get('search') ?? '');
  // 평형대 필터 (20/30/40/50평대 구분): 지도 상단 오버레이 칩용
  const [pyeongFilter, setPyeongFilter] = useState<'all' | '20s' | '30s' | '40s' | '50plus'>('all');
  const [mapApartments, setMapApartments] = useState<MapApartment[]>([]);
  // 호갱노노 스타일 실 단지 데이터 (Geocoder 변환 후 좌표 포함)
  const [complexes, setComplexes] = useState<ApartmentComplex[]>([]);
  // 단지 데이터 로딩 중 여부 (로딩 중 기존 마커 유지, 향후 스켈레톤 UI용)
  const [, setIsComplexLoading] = useState(false);

  const { geocodeAddress, batchGeocode } = useGeocoder();

  // 바텀시트용 선택 아파트 상세 정보
  const { data: selectedDetail, isLoading: isDetailLoading } = useApartmentDetail(selectedApartment?.id);

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

  // 단지 마커 클릭 핸들러 (ApartmentComplex → selectedApartment 변환)
  const handleComplexClick = useCallback((complex: ApartmentComplex) => {
    setSelectedApartment({
      id: complex.id,
      name: complex.name,
      address: complex.address,
      district: complex.umdNm,
      dong: complex.umdNm,
      lat: complex.lat ?? 0,
      lng: complex.lng ?? 0,
      totalUnits: 0,
      builtYear: complex.buildYear ?? 0,
      builder: '',
      areas: [String(complex.area)],
      recentPrice: complex.latestPrice,
      recentPriceArea: String(complex.area),
      priceChange: complex.priceChange ?? 0,
      priceChangeType: complex.priceChangeType ?? 'flat',
    });
  }, [setSelectedApartment]);

  // 뷰포트 변경 핸들러
  // 1) 기존 MapApartment 마커 갱신 (청약 포함)
  // 2) 호갱노노 스타일 단지 데이터 갱신 + Geocoder 변환
  const handleBoundsChange = useCallback(
    async (swLat: number, swLng: number, neLat: number, neLng: number, zoom: number) => {
      // 줌 레벨 상태 업데이트 (구 단위 오버레이 표시 여부 판단)
      setCurrentZoom(zoom);

      // 병렬 처리: 기존 마커 데이터 + 단지 데이터 동시 요청
      try {
        // 기존 마커 데이터 갱신
        const merged = await getApartmentsByBounds(swLat, swLng, neLat, neLng);
        setMapApartments(merged);
      } catch (err) {
        console.warn('[handleBoundsChange] 마커 데이터 갱신 실패, 기존 데이터 유지:', err);
      }

      // 호갱노노 스타일 단지 데이터 갱신 (zoom 10~14 범위에서만 — 개별 단지 표시)
      if (zoom >= 10 && zoom <= 14) {
        setIsComplexLoading(true);
        try {
          const rawComplexes = await getComplexesByBounds({ swLat, swLng, neLat, neLng, zoom });
          // Geocoder로 주소 → 좌표 변환 (로딩 중 기존 마커 유지)
          const geocoded = await batchGeocode(rawComplexes);
          setComplexes(geocoded);
        } catch (err) {
          console.warn('[handleBoundsChange] 단지 데이터 갱신 실패, 기존 데이터 유지:', err);
        } finally {
          setIsComplexLoading(false);
        }
      } else {
        // 줌아웃 시 단지 마커 초기화
        setComplexes([]);
      }
    },
    [batchGeocode]
  );

  const { isLoaded, isError, updateMarkers, updateComplexMarkers, moveToLocation, updateHeatmapOverlays, clearHeatmapOverlays, updateDistrictOverlays, clearDistrictOverlays } = useKakaoMap(
    mapContainerRef,
    {
      initialLat: 37.5665,
      initialLng: 126.978,
      initialLevel: 7,
      onMarkerClick: handleMarkerClick,
      onBoundsChange: handleBoundsChange,
    }
  );

  // 카카오맵 로드 실패 또는 미로드 시 서울 전역 기본 데이터 로드 (목록 패널 빈 화면 방지)
  useEffect(() => {
    // 지도가 정상 로드된 경우에는 handleBoundsChange가 데이터를 채우므로 스킵
    if (isLoaded) return;

    // 서울 전역 바운더리 (SW: 37.41, 126.76 / NE: 37.70, 127.18)
    const SEOUL_SW_LAT = 37.41;
    const SEOUL_SW_LNG = 126.76;
    const SEOUL_NE_LAT = 37.70;
    const SEOUL_NE_LNG = 127.18;

    getApartmentsByBounds(SEOUL_SW_LAT, SEOUL_SW_LNG, SEOUL_NE_LAT, SEOUL_NE_LNG)
      .then((data) => {
        // 이미 handleBoundsChange가 데이터를 채운 경우(isLoaded 전환 후) 덮어쓰지 않음
        setMapApartments((prev) => (prev.length > 0 ? prev : data));
      })
      .catch((err) => console.warn('[MapPage] 기본 데이터 로드 실패:', err));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  // queryString ?search= 파라미터가 있을 때 지도 로드 후 Geocoder 자동 실행
  useEffect(() => {
    if (!isLoaded) return;
    const query = searchParams.get('search');
    if (!query) return;
    geocodeAddress(query).then((coords) => {
      if (coords) {
        // level 5: 단지 수준에서 표시
        moveToLocation(coords.lat, coords.lng, 5);
      } else {
        addToast({ content: `'${query}' 위치를 찾을 수 없습니다.`, variant: 'cautionary', duration: 'short' });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  // 마커 뷰 / 히트맵 뷰 토글 상태
  const [viewMode, setViewMode] = useState<'marker' | 'heatmap'>('marker');
  // 현재 줌 레벨 상태 (구 단위 오버레이 표시 여부 판단용)
  const [currentZoom, setCurrentZoom] = useState<number>(7);

  // 기존 마커 업데이트 — 히트맵 모드 또는 광역 줌(<=9)일 때 마커 숨김
  useEffect(() => {
    if (!isLoaded) return;
    // 마커 모드이고 줌 레벨이 10 이상일 때만 개별 마커 표시
    if (viewMode === 'marker' && currentZoom >= 10) {
      updateMarkers(mapApartments, { priceFilter, areaFilter, layerFilters, unitCountFilter, complexFeatures });
    } else {
      // 히트맵 모드 또는 줌아웃 시: 개별 마커 전부 제거 (구 단위 오버레이가 대신 표시)
      updateMarkers([], { priceFilter, areaFilter, layerFilters, unitCountFilter, complexFeatures });
    }
  }, [isLoaded, viewMode, currentZoom, mapApartments, updateMarkers, priceFilter, areaFilter, layerFilters, unitCountFilter, complexFeatures]);

  // 호갱노노 스타일 단지 마커 업데이트 (히트맵 모드 또는 광역 줌 시 숨김)
  useEffect(() => {
    if (!isLoaded) return;
    // 마커 모드이고 줌 레벨이 10 이상일 때만 단지 마커 표시
    if (viewMode === 'marker' && currentZoom >= 10) {
      updateComplexMarkers(complexes, handleComplexClick);
    } else {
      updateComplexMarkers([], handleComplexClick);
    }
  }, [isLoaded, viewMode, currentZoom, complexes, updateComplexMarkers, handleComplexClick]);

  // 히트맵 오버레이 업데이트 — 히트맵 모드 진입/데이터 변경 시
  useEffect(() => {
    if (!isLoaded) return;
    if (viewMode === 'heatmap') {
      updateHeatmapOverlays(mapApartments);
    } else {
      clearHeatmapOverlays();
    }
  }, [isLoaded, viewMode, mapApartments, updateHeatmapOverlays, clearHeatmapOverlays]);

  // 구 단위 평균가 오버레이 업데이트 — 줌 레벨 <= 9 이고 마커 모드일 때
  // zoom <= 9: 광역 뷰 → 구 단위 레이블 표시
  // zoom >= 10: 개별 단지 뷰 → 구 오버레이 제거
  useEffect(() => {
    if (!isLoaded) return;
    if (viewMode === 'marker' && currentZoom <= 9) {
      updateDistrictOverlays(mapApartments);
    } else {
      clearDistrictOverlays();
    }
  }, [isLoaded, viewMode, currentZoom, mapApartments, updateDistrictOverlays, clearDistrictOverlays]);

  // 평형대(㎡) 범위 기준: 20평대=60~85㎡, 30평대=85~115㎡, 40평대=115~135㎡, 50평대+=135㎡+
  // apt.area는 string("84" 등)이므로 parseFloat으로 수치 변환 후 비교
  const matchPyeongFilter = (areaStr: string): boolean => {
    const area = parseFloat(areaStr);
    if (isNaN(area)) return true;
    switch (pyeongFilter) {
      case '20s': return area >= 60 && area < 85;
      case '30s': return area >= 85 && area < 115;
      case '40s': return area >= 115 && area < 135;
      case '50plus': return area >= 135;
      default: return true; // 'all'
    }
  };

  // 데스크탑 패널용 필터된 아파트 목록 (API 응답 mapApartments 기준 — MOCK 단일화)
  const filteredList = mapApartments.filter((apt) => {
    const matchSearch = !searchValue || apt.name.includes(searchValue);
    const matchPyeong = matchPyeongFilter(String(apt.area));
    return matchSearch && matchPyeong && isVisible(apt, { priceFilter, areaFilter, layerFilters, unitCountFilter, complexFeatures });
  });

  // 활성 레이어 개수
  const activeLayerCount = [layerFilters.hot, layerFilters.allTimeHigh, layerFilters.subscription]
    .filter(Boolean).length;

  // 현재 위치로 이동
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      addToast({ content: '이 브라우저는 위치 서비스를 지원하지 않습니다.', variant: 'negative', duration: 'short' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        moveToLocation(pos.coords.latitude, pos.coords.longitude, 5);
      },
      () => addToast({ content: '위치 정보를 가져올 수 없습니다.', variant: 'negative', duration: 'short' })
    );
  };

  // 선택된 MapApartment (청약 정보 패널 렌더링용)
  // C-1: MOCK_MAP_APARTMENTS 대신 동적으로 관리되는 mapApartments state를 조회 소스로 사용
  const selectedMapApt = selectedApartment
    ? mapApartments.find((a) => a.id === selectedApartment.id)
    : null;

  return (
    <div
      className="relative w-full flex"
      style={{ height: '100svh', backgroundColor: 'var(--semantic-background-alternative)' }}
    >
      {/* ─── 데스크탑 좌측 사이드 패널 ─── */}
      <aside
        className="hidden md:flex flex-col w-[380px] flex-shrink-0 z-20 h-full overflow-hidden"
        style={{
          backgroundColor: 'var(--semantic-background-normal-normal)',
          borderRight: '1px solid var(--semantic-line-normal)',
        }}
      >
        {/* 패널 헤더 */}
        <div
          className="px-4 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--semantic-line-normal)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <IconButton
              variant="normal"
              onClick={() => navigate(-1)}
              aria-label="뒤로가기"
            >
              <IconChevronLeft />
            </IconButton>
            <div className="flex items-center gap-1.5">
              <img src="/favicon.svg" alt="봄집" width={24} height={24} className="rounded-md" />
              <span
                className="text-base font-black"
                style={{ color: 'var(--semantic-label-normal)' }}
              >
                봄집 지도
              </span>
            </div>
          </div>

          {/* 검색바 */}
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2.5"
            style={{ backgroundColor: 'var(--semantic-background-alternative)' }}
          >
            <svg
              className="w-4 h-4 flex-shrink-0"
              style={{ color: 'var(--semantic-label-assistive)' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="단지명 검색"
              className="flex-1 text-sm bg-transparent outline-none"
              style={{ color: 'var(--semantic-label-normal)' }}
            />
          </div>

          {/* ── 필터 그룹 1: 가격대 ── */}
          <LnbSectionLabel label="가격대" className="mt-3" />
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            {PRICE_FILTERS.map((filter) => (
              <Chip
                key={filter.value}
                size="small"
                variant="outlined"
                active={priceFilter === filter.value}
                onClick={() => setPriceFilter(filter.value as PriceFilter)}
              >
                {filter.label}
              </Chip>
            ))}
          </div>

          {/* ── 필터 그룹 2: 레이어 ── */}
          <div className="flex items-center gap-2 mt-3">
            <LnbSectionLabel label="레이어" />
            {activeLayerCount > 0 && (
              <span
                className="inline-flex items-center px-1.5 rounded-full text-[10px] font-bold"
                style={{ background: 'var(--semantic-primary-normal)', color: 'var(--semantic-static-white)', height: '16px' }}
              >
                {activeLayerCount} 활성
              </span>
            )}
          </div>
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            <Chip
              size="small"
              variant="outlined"
              active={layerFilters.hot}
              onClick={() => setLayerFilter('hot', !layerFilters.hot)}
            >
              HOT
            </Chip>
            <Chip
              size="small"
              variant="outlined"
              active={layerFilters.allTimeHigh}
              onClick={() => setLayerFilter('allTimeHigh', !layerFilters.allTimeHigh)}
            >
              최고가
            </Chip>
            <Chip
              size="small"
              variant="outlined"
              active={layerFilters.subscription}
              onClick={() => setLayerFilter('subscription', !layerFilters.subscription)}
            >
              청약
            </Chip>
          </div>

          {/* ── 필터 그룹 3: 평형대 칩 (20/30/40/50평대) ── */}
          <LnbSectionLabel label="평형대" className="mt-3" />
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            {PYEONG_FILTER_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                size="small"
                variant="outlined"
                active={pyeongFilter === opt.value}
                onClick={() => setPyeongFilter(opt.value as typeof pyeongFilter)}
              >
                {opt.label}
              </Chip>
            ))}
          </div>

          {/* ── 필터 그룹 4: 세부 평형 (59/74/84/109㎡) ── */}
          <LnbSectionLabel label="평형(㎡)" className="mt-3" />
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            {AREA_FILTERS.map((filter) => (
              <Chip
                key={filter.value}
                size="small"
                variant="outlined"
                active={areaFilter === filter.value}
                onClick={() =>
                  setAreaFilter(areaFilter === filter.value ? 'all' : (filter.value as AreaFilter))
                }
              >
                {filter.label}
              </Chip>
            ))}
          </div>

          {/* ── 필터 그룹 5: 세대수 ── */}
          <LnbSectionLabel label="세대수" className="mt-3" />
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {UNIT_COUNT_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                size="small"
                variant="outlined"
                active={unitCountFilter === opt.value}
                onClick={() => setUnitCountFilter(opt.value)}
              >
                {opt.label}
              </Chip>
            ))}
          </div>

          {/* ── 필터 그룹 6: 단지특성 ── */}
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <LnbSectionLabel label="단지특성" />
              {complexFeatures.size > 0 && (
                <span
                  className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold"
                  style={{ backgroundColor: 'var(--semantic-primary-normal)', color: 'var(--semantic-static-white)' }}
                >
                  {complexFeatures.size}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {COMPLEX_FEATURE_OPTIONS.map((opt) => (
                <Chip
                  key={opt.value}
                  size="small"
                  variant="outlined"
                  active={complexFeatures.has(opt.value)}
                  onClick={() => toggleComplexFeature(opt.value)}
                >
                  {opt.label}
                </Chip>
              ))}
            </div>
          </div>
        </div>

        {/* 아파트 목록 */}
        <div className="flex-1 overflow-y-auto">
          <div
            className="px-4 py-2.5"
            style={{ borderBottom: '1px solid var(--semantic-line-normal)' }}
          >
            <p
              className="text-xs"
              style={{ color: 'var(--semantic-label-assistive)' }}
            >
              총 {filteredList.length}개 단지
            </p>
          </div>

          {filteredList.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', gap: '8px' }}>
              <svg width="40" height="40" style={{ color: 'var(--semantic-line-normal)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p style={{ fontSize: '14px', color: 'var(--semantic-label-assistive)' }}>검색 결과가 없습니다</p>
            </div>
          ) : (
            <ul>
              {filteredList.map((apt) => {
                const isSelected = selectedApartment?.id === apt.id;
                const eok = apt.price / 10000;
                const markerBgColor =
                  eok >= 20 ? '#D63031' : eok >= 10 ? '#FF4B4B' : eok >= 5 ? '#FF9500' : '#8B95A1';

                return (
                  <li key={apt.id}>
                    <button
                      onClick={() => handleMarkerClick(apt)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '14px 16px',
                        textAlign: 'left',
                        background: isSelected ? 'var(--semantic-primary-weak)' : 'var(--semantic-background-normal-normal)',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s',
                        border: 'none',
                        borderBottomWidth: '1px',
                        borderBottomStyle: 'solid',
                        borderBottomColor: 'var(--semantic-line-normal)',
                      }}
                      onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--semantic-background-alternative)'; }}
                      onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--semantic-background-normal-normal)'; }}
                    >
                      <div style={{
                        flexShrink: 0,
                        backgroundColor: markerBgColor,
                        color: '#FFFFFF',
                        fontSize: '12px',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: '999px',
                        minWidth: '52px',
                        textAlign: 'center',
                      }}>
                        {formatPriceShort(apt.price)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--semantic-label-normal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{apt.name}</p>
                        <p style={{ fontSize: '12px', color: 'var(--semantic-label-assistive)', marginTop: '2px' }}>{apt.area}㎡ 기준</p>
                      </div>
                      {isSelected && (
                        <svg width="16" height="16" style={{ color: 'var(--semantic-primary-normal)', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div
            className="flex-shrink-0 p-4"
            style={{
              borderTop: '1px solid var(--semantic-line-normal)',
              backgroundColor: 'var(--semantic-background-normal-normal)',
            }}
          >
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
                <h3 className="font-bold text-base" style={{ color: 'var(--semantic-label-normal)' }}>{selectedApartment.name}</h3>
                <p className="text-xl font-black mt-1" style={{ color: 'var(--semantic-label-normal)' }}>
                  {formatPriceShort(selectedApartment.recentPrice)}
                </p>
                {/* 상세 데이터 로딩 중 스피너 표시 */}
                {isDetailLoading && (
                  <div className="flex items-center justify-center py-2">
                    <LoadingSpinner message="상세 정보 로딩중..." />
                  </div>
                )}
                <Button variant="solid" color="primary" fullWidth className="mt-3" onClick={() => navigate(`/apartment/${selectedApartment.id}`)}>
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

        {/* ── 모바일 상단 오버레이 (검색바 + 필터 행) ── */}
        <div className="md:hidden absolute top-0 left-0 right-0 z-20 p-4 pt-safe">
          {/* 검색바 + 뒤로가기 */}
          <div className="flex items-center gap-2">
            <div className="rounded-xl shadow-md flex-shrink-0" style={{ backgroundColor: 'var(--semantic-background-normal-normal)' }}>
              <IconButton
                variant="normal"
                onClick={() => navigate(-1)}
                aria-label="뒤로가기"
              >
                <IconChevronLeft />
              </IconButton>
            </div>
            <div
              className="flex-1 rounded-xl shadow-md flex items-center gap-2 px-4 py-3"
              style={{ backgroundColor: 'var(--semantic-background-normal-normal)' }}
            >
              <svg
                className="w-4 h-4"
                style={{ color: 'var(--semantic-label-assistive)' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="주소, 단지명 검색"
                className="flex-1 text-sm outline-none bg-transparent"
                style={{ color: 'var(--semantic-label-normal)' }}
              />
            </div>
          </div>

          {/* 행 1: 가격대 필터 (가로 스크롤) */}
          <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {PRICE_FILTERS.map((filter) => (
              <Chip
                key={filter.value}
                size="small"
                variant="outlined"
                active={priceFilter === filter.value}
                onClick={() => setPriceFilter(filter.value as PriceFilter)}
                sx={{ flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.10)' }}
              >
                {filter.label}
              </Chip>
            ))}
          </div>

          {/* 행 2: 레이어 필터 (가로 스크롤) */}
          <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            <Chip
              size="small"
              variant="outlined"
              active={layerFilters.hot}
              onClick={() => setLayerFilter('hot', !layerFilters.hot)}
              sx={{ flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.10)' }}
            >
              HOT
            </Chip>
            <Chip
              size="small"
              variant="outlined"
              active={layerFilters.allTimeHigh}
              onClick={() => setLayerFilter('allTimeHigh', !layerFilters.allTimeHigh)}
              sx={{ flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.10)' }}
            >
              최고가
            </Chip>
            <Chip
              size="small"
              variant="outlined"
              active={layerFilters.subscription}
              onClick={() => setLayerFilter('subscription', !layerFilters.subscription)}
              sx={{ flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.10)' }}
            >
              청약
            </Chip>
            {activeLayerCount > 0 && (
              <span
                className="flex-shrink-0 flex items-center px-2 rounded-full text-[10px] font-bold shadow-sm"
                style={{
                  backgroundColor: 'var(--semantic-primary-normal)',
                  color: 'var(--semantic-static-white)',
                  height: '32px',
                }}
              >
                {activeLayerCount} 활성
              </span>
            )}
          </div>

          {/* 행 3: 평형대 필터 칩 (20/30/40/50평대) */}
          <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {PYEONG_FILTER_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                size="small"
                variant="outlined"
                active={pyeongFilter === opt.value}
                onClick={() => setPyeongFilter(opt.value as typeof pyeongFilter)}
                sx={{ flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.10)' }}
              >
                {opt.label}
              </Chip>
            ))}
          </div>

          {/* 행 4: 세부 평형 필터 (59/74/84/109㎡) */}
          <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {AREA_FILTERS.map((filter) => (
              <Chip
                key={filter.value}
                size="small"
                variant="outlined"
                active={areaFilter === filter.value}
                onClick={() =>
                  setAreaFilter(areaFilter === filter.value ? 'all' : (filter.value as AreaFilter))
                }
                sx={{ flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.10)' }}
              >
                {filter.label}
              </Chip>
            ))}
          </div>

          {/* 행 5: 세대수 필터 (가로 스크롤) */}
          <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {UNIT_COUNT_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                size="small"
                variant="outlined"
                active={unitCountFilter === opt.value}
                onClick={() => setUnitCountFilter(opt.value)}
                sx={{ flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.10)' }}
              >
                {opt.label}
              </Chip>
            ))}
          </div>

          {/* 행 6: 단지특성 필터 (가로 스크롤) */}
          <div className="flex gap-1.5 mt-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {COMPLEX_FEATURE_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                size="small"
                variant="outlined"
                active={complexFeatures.has(opt.value)}
                onClick={() => toggleComplexFeature(opt.value)}
                sx={{ flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.10)' }}
              >
                {opt.label}
              </Chip>
            ))}
          </div>
        </div>

        {/* ── 마커/히트맵 뷰 토글 버튼 (지도 우상단) ── */}
        <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
          {/* 토글 버튼 */}
          <div
            className="flex rounded-lg overflow-hidden shadow-md"
            style={{ border: '1px solid var(--semantic-line-normal)' }}
          >
            <button
              onClick={() => setViewMode('marker')}
              className="px-3 py-2 text-[13px] font-medium transition-colors"
              style={{
                backgroundColor: viewMode === 'marker' ? 'var(--semantic-primary-normal)' : 'var(--semantic-background-normal-normal)',
                color: viewMode === 'marker' ? 'var(--semantic-static-white)' : 'var(--semantic-label-alternative)',
              }}
              aria-label="마커 뷰"
            >
              마커
            </button>
            <button
              onClick={() => setViewMode('heatmap')}
              className="px-3 py-2 text-[13px] font-medium transition-colors"
              style={{
                backgroundColor: viewMode === 'heatmap' ? 'var(--semantic-primary-normal)' : 'var(--semantic-background-normal-normal)',
                color: viewMode === 'heatmap' ? 'var(--semantic-static-white)' : 'var(--semantic-label-alternative)',
              }}
              aria-label="히트맵 뷰"
            >
              히트맵
            </button>
          </div>

          {/* 마커 모드 가격 범례 */}
          {viewMode === 'marker' && (
            <div
              className="hidden md:flex rounded-xl px-3 py-2 gap-3 items-center"
              style={{
                backgroundColor: 'var(--semantic-background-normal-normal)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                border: '1px solid var(--semantic-line-normal)',
              }}
            >
              <span
                className="text-xs font-semibold"
                style={{ color: 'var(--semantic-label-assistive)' }}
              >
                가격 범례
              </span>
              {PRICE_LEGEND_ITEMS.map((item) => (
                <div key={item.label} className="flex items-center gap-1">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span
                    className="text-[11px]"
                    style={{ color: 'var(--semantic-label-assistive)' }}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 히트맵 모드 거래량 범례 */}
          {viewMode === 'heatmap' && (
            <div
              className="hidden md:flex rounded-xl px-3 py-2 gap-3 items-center"
              style={{
                backgroundColor: 'var(--semantic-background-normal-normal)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                border: '1px solid var(--semantic-line-normal)',
              }}
            >
              <span
                className="text-xs font-semibold"
                style={{ color: 'var(--semantic-label-assistive)' }}
              >
                거래량
              </span>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(209,213,219,0.6)' }} />
                <span className="text-[11px]" style={{ color: 'var(--semantic-label-assistive)' }}>적음</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(251,191,36,0.7)' }} />
                <span className="text-[11px]" style={{ color: 'var(--semantic-label-assistive)' }}>보통</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(249,115,22,0.8)' }} />
                <span className="text-[11px]" style={{ color: 'var(--semantic-label-assistive)' }}>많음</span>
              </div>
            </div>
          )}
        </div>

        {/* 현재 위치 버튼 */}
        <button
          onClick={handleCurrentLocation}
          className="absolute right-4 bottom-32 md:bottom-8 z-20 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors"
          style={{ backgroundColor: 'var(--semantic-background-normal-normal)' }}
          aria-label="현재 위치"
        >
          <svg
            className="w-5 h-5"
            style={{ color: 'var(--semantic-primary-normal)' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
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
              <h3 className="font-bold text-lg" style={{ color: 'var(--semantic-label-normal)' }}>{selectedApartment.name}</h3>
              <p className="text-2xl font-black mt-2" style={{ color: 'var(--semantic-label-normal)' }}>
                {formatPriceShort(selectedApartment.recentPrice)}
              </p>
              {/* 상세 데이터 로딩 중 스피너 표시 */}
              {isDetailLoading && (
                <div className="flex items-center justify-center py-2">
                  <LoadingSpinner message="상세 정보 로딩중..." />
                </div>
              )}
              <Button
                variant="solid"
                color="primary"
                fullWidth
                className="mt-4"
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

// LNB 섹션 라벨 (데스크탑 사이드패널 전용)
function LnbSectionLabel({ label, className = '' }: { label: string; className?: string }) {
  return (
    <p
      className={className}
      style={{ fontSize: '11px', fontWeight: 600, color: 'var(--semantic-label-assistive)', textTransform: 'uppercase', letterSpacing: '0.05em' }}
    >
      {label}
    </p>
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
  let dDayColor = '#0066FF';
  if (isOngoing && apt.subDeadline) {
    const dl = new Date(apt.subDeadline);
    dl.setHours(0, 0, 0, 0);
    const diff = Math.ceil((dl.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) {
      dDayText = 'D-Day';
    } else if (diff > 0) {
      dDayText = `D-${diff}`;
    }
    dDayColor = diff <= 7 ? '#D63031' : '#0066FF';
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
    <div className="mb-3 pb-3" style={{ borderBottom: '1px solid var(--semantic-line-normal)' }}>
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
            color: isOngoing ? '#0066FF' : '#E67E22',
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
        <span style={{ fontSize: '12px', color: 'var(--semantic-label-assistive)', fontWeight: 500 }}>분양가</span>
        <span style={{ fontSize: '13px', color: 'var(--semantic-label-normal)', fontWeight: 700 }}>
          {formatPriceShort(apt.price)}
        </span>
      </div>

      {/* 청약 상세 보기 버튼 */}
      {apt.subId && (
        <Button
          variant="solid"
          color="primary"
          fullWidth
          size="small"
          onClick={() => navigate(`/subscription/${apt.subId}`)}
          trailingContent={<IconArrowRight />}
          className="mt-3"
        >
          청약 상세 보기
        </Button>
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

  const priceChangeColor =
    apartment.priceChangeType === 'up'
      ? '#FF4B4B'
      : apartment.priceChangeType === 'down'
        ? '#3B82F6'
        : 'var(--semantic-label-assistive)';

  return (
    <div>
      <h3
        className="font-black text-base leading-snug"
        style={{ color: 'var(--semantic-label-normal)' }}
      >
        {apartment.name}
      </h3>
      <p
        className="text-xs mt-0.5"
        style={{ color: 'var(--semantic-label-assistive)' }}
      >
        {apartment.address || `${apartment.district} ${apartment.dong}`}
      </p>
      <div className="flex items-baseline gap-2 mt-2">
        <span
          className="text-xl font-black"
          style={{ color: 'var(--semantic-label-normal)' }}
        >
          {formatPriceShort(apartment.recentPrice)}
        </span>
        <span
          className="text-xs"
          style={{ color: 'var(--semantic-label-assistive)' }}
        >
          {apartment.recentPriceArea}㎡
        </span>
        <span
          className="text-xs font-bold"
          style={{ color: priceChangeColor }}
        >
          {formatChange(apartment.priceChange)}
        </span>
      </div>
      <div
        className="grid grid-cols-3 gap-2 mt-3 pt-3 text-center"
        style={{ borderTop: '1px solid var(--semantic-line-normal)' }}
      >
        <div>
          <p className="text-[10px]" style={{ color: 'var(--semantic-label-assistive)' }}>세대수</p>
          <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--semantic-label-normal)' }}>{formatUnits(apartment.totalUnits)}</p>
        </div>
        <div>
          <p className="text-[10px]" style={{ color: 'var(--semantic-label-assistive)' }}>준공</p>
          <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--semantic-label-normal)' }}>{apartment.builtYear}년</p>
        </div>
        <div>
          <p className="text-[10px]" style={{ color: 'var(--semantic-label-assistive)' }}>건설사</p>
          <p className="text-xs font-bold mt-0.5 truncate" style={{ color: 'var(--semantic-label-normal)' }}>{apartment.builder}</p>
        </div>
      </div>
      <Button variant="solid" color="primary" fullWidth className="mt-3" onClick={onDetailClick}>
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

  const mobilepriceChangeColor =
    apartment.priceChangeType === 'up'
      ? '#FF4B4B'
      : apartment.priceChangeType === 'down'
        ? '#3B82F6'
        : 'var(--semantic-label-assistive)';

  return (
    <div className="p-5">
      <h3
        className="font-black text-lg leading-snug"
        style={{ color: 'var(--semantic-label-normal)' }}
      >
        {apartment.name}
      </h3>
      <p
        className="text-sm mt-1"
        style={{ color: 'var(--semantic-label-assistive)' }}
      >
        {apartment.address || `${apartment.district} ${apartment.dong}`}
      </p>

      {/* 청약 정보 섹션 (청약 마커인 경우 상단에 표시) */}
      {selectedMapApt && (selectedMapApt.markerType === 'subOngoing' || selectedMapApt.markerType === 'subUpcoming') && (
        <div className="mt-3">
          <SubscriptionInfoSection apt={selectedMapApt} navigate={navigate} />
        </div>
      )}

      <div className="flex items-baseline gap-2 mt-3">
        <span
          className="text-2xl font-black"
          style={{ color: 'var(--semantic-label-normal)' }}
        >
          {formatPriceShort(apartment.recentPrice)}
        </span>
        <span
          className="text-sm"
          style={{ color: 'var(--semantic-label-assistive)' }}
        >
          {apartment.recentPriceArea}㎡
        </span>
        <span
          className="text-sm font-bold"
          style={{ color: mobilepriceChangeColor }}
        >
          {formatChange(apartment.priceChange)}
        </span>
      </div>

      <div
        className="grid grid-cols-3 gap-3 mt-4 pt-4"
        style={{ borderTop: '1px solid var(--semantic-line-normal)' }}
      >
        <div>
          <p className="text-xs" style={{ color: 'var(--semantic-label-assistive)' }}>세대수</p>
          <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--semantic-label-normal)' }}>{formatUnits(apartment.totalUnits)}</p>
        </div>
        <div>
          <p className="text-xs" style={{ color: 'var(--semantic-label-assistive)' }}>준공</p>
          <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--semantic-label-normal)' }}>{apartment.builtYear}년</p>
        </div>
        <div>
          <p className="text-xs" style={{ color: 'var(--semantic-label-assistive)' }}>건설사</p>
          <p className="text-sm font-bold mt-0.5 truncate" style={{ color: 'var(--semantic-label-normal)' }}>{apartment.builder}</p>
        </div>
      </div>

      <Button variant="solid" color="primary" fullWidth className="mt-5" onClick={onDetailClick}>
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
        <div className="rounded-2xl p-4 shadow-lg" style={{ backgroundColor: 'var(--semantic-background-normal-normal)' }}>
          <p className="text-sm font-bold" style={{ color: 'var(--semantic-label-normal)' }}>카카오맵 연동 필요</p>
          <p className="text-xs mt-1" style={{ color: 'var(--semantic-label-assistive)' }}>.env에 VITE_KAKAO_MAP_KEY 설정</p>
        </div>
      </div>
      {apartments.slice(0, 8).map((apt, i) => {
        const eok = apt.price / 10000;
        const markerBgColor =
          eok >= 20 ? '#D63031' : eok >= 10 ? '#FF4B4B' : eok >= 5 ? '#FF9500' : '#8B95A1';
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
            style={{
              position: 'absolute',
              backgroundColor: markerBgColor,
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '999px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.20)',
              border: '2px solid #FFFFFF',
              cursor: 'pointer',
              transition: 'transform 0.15s ease',
              ...positions[i],
            }}
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

// 평형대 칩 옵션 (20/30/40/50평대 — 60~85/85~115/115~135/135㎡+ 범위)
const PYEONG_FILTER_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: '20s', label: '20평대' },
  { value: '30s', label: '30평대' },
  { value: '40s', label: '40평대' },
  { value: '50plus', label: '50평대+' },
];

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

const UNIT_COUNT_OPTIONS = [
  { value: 'all' as UnitCountFilter, label: '전체' },
  { value: '500plus' as UnitCountFilter, label: '500세대+' },
  { value: '1000plus' as UnitCountFilter, label: '1000세대+' },
  { value: '2000plus' as UnitCountFilter, label: '2000세대+' },
];

const COMPLEX_FEATURE_OPTIONS: { value: ComplexFeature; label: string }[] = [
  { value: 'brand', label: '브랜드' },
  { value: 'station', label: '역세권' },
  { value: 'large', label: '대단지' },
  { value: 'new', label: '신축' },
  { value: 'flat', label: '평지' },
  { value: 'school', label: '초품아' },
];

// 가격 범례 아이템 (마커 색상과 동일한 4단계 기준)
const PRICE_LEGEND_ITEMS = [
  { color: '#8B95A1', label: '5억 미만' },
  { color: '#FF9500', label: '5~10억' },
  { color: '#FF4B4B', label: '10~20억' },
  { color: '#D63031', label: '20억+' },
];
