import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useKakaoMap, isVisible } from '../hooks/useKakaoMap';
import { useMapStore } from '../stores/mapStore';
import { useApartmentDetail } from '../hooks/useApartment';
import { useGeocoder } from '../hooks/useGeocoder';
import { useIsPC } from '../hooks/useBreakpoint';
import BottomSheet from '../components/ui/BottomSheet';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Box, FlexBox, Typography, Button, Chip, IconButton, useToast } from '@wanteddev/wds';
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

  // PC 여부 (md:hidden / hidden md:flex Tailwind 패턴 대체)
  const isPC = useIsPC();

  // 선택된 MapApartment (청약 정보 패널 렌더링용)
  // C-1: MOCK_MAP_APARTMENTS 대신 동적으로 관리되는 mapApartments state를 조회 소스로 사용
  const selectedMapApt = selectedApartment
    ? mapApartments.find((a) => a.id === selectedApartment.id)
    : null;

  return (
    <Box
      style={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        height: '100svh',
        backgroundColor: 'var(--semantic-background-alternative)',
      }}
    >
      {/* ─── 데스크탑 좌측 사이드 패널 ─── */}
      <Box
        as="aside"
        style={{
          display: isPC ? 'flex' : 'none',
          flexDirection: 'column',
          width: '380px',
          flexShrink: 0,
          zIndex: 20,
          height: '100%',
          overflow: 'hidden',
          backgroundColor: 'var(--semantic-background-normal-normal)',
          borderRight: '1px solid var(--semantic-line-normal)',
        }}
      >
        {/* 패널 헤더 */}
        <Box
          style={{
            padding: '16px',
            flexShrink: 0,
            borderBottom: '1px solid var(--semantic-line-normal)',
          }}
        >
          {/* 뒤로가기 + 로고 */}
          <FlexBox alignItems="center" style={{ gap: '8px', marginBottom: '12px' }}>
            <IconButton
              variant="normal"
              onClick={() => navigate(-1)}
              aria-label="뒤로가기"
            >
              <IconChevronLeft />
            </IconButton>
            <FlexBox alignItems="center" style={{ gap: '6px' }}>
              <img src="/favicon.svg" alt="봄집" style={{ width: '24px', height: '24px', borderRadius: '6px' }} />
              <Typography variant="body1" weight="bold" style={{ color: 'var(--semantic-label-normal)' }}>
                봄집 지도
              </Typography>
            </FlexBox>
          </FlexBox>

          {/* 검색바 */}
          <FlexBox
            alignItems="center"
            style={{
              gap: '8px',
              borderRadius: '12px',
              padding: '10px 12px',
              backgroundColor: 'var(--semantic-background-alternative)',
            }}
          >
            <svg
              style={{ width: '16px', height: '16px', flexShrink: 0, color: 'var(--semantic-label-assistive)' }}
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
              style={{
                flex: 1,
                fontSize: '14px',
                backgroundColor: 'transparent',
                outline: 'none',
                border: 'none',
                color: 'var(--semantic-label-normal)',
              }}
            />
          </FlexBox>

          {/* ── 필터 그룹 1: 가격대 ── */}
          <LnbSectionLabel label="가격대" style={{ marginTop: '12px' }} />
          <FlexBox style={{ gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
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
          </FlexBox>

          {/* ── 필터 그룹 2: 레이어 ── */}
          <FlexBox alignItems="center" style={{ gap: '8px', marginTop: '12px' }}>
            <LnbSectionLabel label="레이어" />
            {activeLayerCount > 0 && (
              <Box
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0 6px',
                  borderRadius: '999px',
                  height: '16px',
                  background: 'var(--semantic-primary-normal)',
                  color: 'var(--semantic-static-white)',
                  fontSize: '10px',
                  fontWeight: 700,
                }}
              >
                {activeLayerCount} 활성
              </Box>
            )}
          </FlexBox>
          <FlexBox style={{ gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
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
          </FlexBox>

          {/* ── 필터 그룹 3: 평형대 칩 (20/30/40/50평대) ── */}
          <LnbSectionLabel label="평형대" style={{ marginTop: '12px' }} />
          <FlexBox style={{ gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
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
          </FlexBox>

          {/* ── 필터 그룹 4: 세부 평형 (59/74/84/109㎡) ── */}
          <LnbSectionLabel label="평형(㎡)" style={{ marginTop: '12px' }} />
          <FlexBox style={{ gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
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
          </FlexBox>

          {/* ── 필터 그룹 5: 세대수 ── */}
          <LnbSectionLabel label="세대수" style={{ marginTop: '12px' }} />
          <FlexBox style={{ gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
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
          </FlexBox>

          {/* ── 필터 그룹 6: 단지특성 ── */}
          <Box style={{ marginTop: '12px' }}>
            <FlexBox alignItems="center" style={{ gap: '8px' }}>
              <LnbSectionLabel label="단지특성" />
              {complexFeatures.size > 0 && (
                <Box
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '16px',
                    height: '16px',
                    borderRadius: '999px',
                    fontSize: '9px',
                    fontWeight: 700,
                    backgroundColor: 'var(--semantic-primary-normal)',
                    color: 'var(--semantic-static-white)',
                  }}
                >
                  {complexFeatures.size}
                </Box>
              )}
            </FlexBox>
            <FlexBox style={{ gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
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
            </FlexBox>
          </Box>
        </Box>

        {/* 아파트 목록 */}
        <Box style={{ flex: 1, overflowY: 'auto' }}>
          <Box
            style={{
              padding: '10px 16px',
              borderBottom: '1px solid var(--semantic-line-normal)',
            }}
          >
            <Typography variant="caption1" style={{ color: 'var(--semantic-label-assistive)' }}>
              총 {filteredList.length}개 단지
            </Typography>
          </Box>

          {filteredList.length === 0 ? (
            <FlexBox
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              style={{ padding: '64px 0', gap: '8px' }}
            >
              <svg width="40" height="40" style={{ color: 'var(--semantic-line-normal)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <Typography variant="body2" style={{ color: 'var(--semantic-label-assistive)' }}>
                검색 결과가 없습니다
              </Typography>
            </FlexBox>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
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
                      {/* 가격 뱃지 */}
                      <Box
                        style={{
                          flexShrink: 0,
                          backgroundColor: markerBgColor,
                          color: '#FFFFFF',
                          fontSize: '12px',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: '999px',
                          minWidth: '52px',
                          textAlign: 'center',
                        }}
                      >
                        {formatPriceShort(apt.price)}
                      </Box>
                      {/* 단지명 + 평형 */}
                      <Box style={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          weight="bold"
                          style={{
                            color: 'var(--semantic-label-normal)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {apt.name}
                        </Typography>
                        <Typography
                          variant="caption1"
                          style={{ color: 'var(--semantic-label-assistive)', marginTop: '2px' }}
                        >
                          {apt.area}㎡ 기준
                        </Typography>
                      </Box>
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
        </Box>

        {/* 선택된 아파트 상세 (데스크탑 패널 하단) */}
        {selectedApartment && (
          <Box
            style={{
              flexShrink: 0,
              padding: '16px',
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
              <Box>
                <Typography variant="body1" weight="bold" style={{ color: 'var(--semantic-label-normal)' }}>
                  {selectedApartment.name}
                </Typography>
                <Typography
                  variant="title2"
                  weight="bold"
                  style={{ color: 'var(--semantic-label-normal)', marginTop: '4px' }}
                >
                  {formatPriceShort(selectedApartment.recentPrice)}
                </Typography>
                {/* 상세 데이터 로딩 중 스피너 표시 */}
                {isDetailLoading && (
                  <FlexBox alignItems="center" justifyContent="center" style={{ padding: '8px 0' }}>
                    <LoadingSpinner message="상세 정보 로딩중..." />
                  </FlexBox>
                )}
                <Button
                  variant="solid"
                  color="primary"
                  fullWidth
                  style={{ marginTop: '12px' }}
                  onClick={() => navigate(`/apartment/${selectedApartment.id}`)}
                >
                  상세보기
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* ─── 지도 영역 ─── */}
      <Box style={{ position: 'relative', flex: 1, height: '100%' }}>
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

        {/* 카카오맵 미사용 시 Mock 맵 UI */}
        {(!isLoaded || isError) && (
          <Box
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: '#E8EEF4',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <MockMapBackground apartments={mapApartments} onMarkerClick={handleMarkerClick} />
          </Box>
        )}

        {/* ── 모바일 상단 오버레이 (검색바 + 필터 행) ── */}
        <Box
          style={{
            display: isPC ? 'none' : 'block',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 20,
            padding: '16px',
          }}
        >
          {/* 검색바 + 뒤로가기 */}
          <FlexBox alignItems="center" style={{ gap: '8px' }}>
            <Box
              style={{
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                flexShrink: 0,
                backgroundColor: 'var(--semantic-background-normal-normal)',
              }}
            >
              <IconButton
                variant="normal"
                onClick={() => navigate(-1)}
                aria-label="뒤로가기"
              >
                <IconChevronLeft />
              </IconButton>
            </Box>
            <FlexBox
              alignItems="center"
              style={{
                flex: 1,
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                gap: '8px',
                padding: '12px 16px',
                backgroundColor: 'var(--semantic-background-normal-normal)',
              }}
            >
              <svg
                style={{ width: '16px', height: '16px', color: 'var(--semantic-label-assistive)' }}
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
                style={{
                  flex: 1,
                  fontSize: '14px',
                  outline: 'none',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--semantic-label-normal)',
                }}
              />
            </FlexBox>
          </FlexBox>

          {/* 행 1: 가격대 필터 (가로 스크롤) */}
          <Box style={{ display: 'flex', gap: '6px', marginTop: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
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
          </Box>

          {/* 행 2: 레이어 필터 (가로 스크롤) */}
          <Box style={{ display: 'flex', gap: '6px', marginTop: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
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
              <Box
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 8px',
                  borderRadius: '999px',
                  height: '32px',
                  fontSize: '10px',
                  fontWeight: 700,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
                  backgroundColor: 'var(--semantic-primary-normal)',
                  color: 'var(--semantic-static-white)',
                }}
              >
                {activeLayerCount} 활성
              </Box>
            )}
          </Box>

          {/* 행 3: 평형대 필터 칩 (20/30/40/50평대) */}
          <Box style={{ display: 'flex', gap: '6px', marginTop: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
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
          </Box>

          {/* 행 4: 세부 평형 필터 (59/74/84/109㎡) */}
          <Box style={{ display: 'flex', gap: '6px', marginTop: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
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
          </Box>

          {/* 행 5: 세대수 필터 (가로 스크롤) */}
          <Box style={{ display: 'flex', gap: '6px', marginTop: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
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
          </Box>

          {/* 행 6: 단지특성 필터 (가로 스크롤) */}
          <Box style={{ display: 'flex', gap: '6px', marginTop: '6px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
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
          </Box>
        </Box>

        {/* ── 마커/히트맵 뷰 토글 버튼 (지도 우상단) ── */}
        <FlexBox
          flexDirection="column"
          alignItems="flex-end"
          style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 20, gap: '8px' }}
        >
          {/* 토글 버튼 */}
          <FlexBox
            style={{
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              border: '1px solid var(--semantic-line-normal)',
            }}
          >
            <button
              onClick={() => setViewMode('marker')}
              style={{
                padding: '8px 12px',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'background-color 0.15s, color 0.15s',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'marker' ? 'var(--semantic-primary-normal)' : 'var(--semantic-background-normal-normal)',
                color: viewMode === 'marker' ? 'var(--semantic-static-white)' : 'var(--semantic-label-alternative)',
              }}
              aria-label="마커 뷰"
            >
              마커
            </button>
            <button
              onClick={() => setViewMode('heatmap')}
              style={{
                padding: '8px 12px',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'background-color 0.15s, color 0.15s',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'heatmap' ? 'var(--semantic-primary-normal)' : 'var(--semantic-background-normal-normal)',
                color: viewMode === 'heatmap' ? 'var(--semantic-static-white)' : 'var(--semantic-label-alternative)',
              }}
              aria-label="히트맵 뷰"
            >
              히트맵
            </button>
          </FlexBox>

          {/* 마커 모드 가격 범례 (PC만 표시) */}
          {viewMode === 'marker' && isPC && (
            <FlexBox
              alignItems="center"
              style={{
                borderRadius: '12px',
                padding: '8px 12px',
                gap: '12px',
                backgroundColor: 'var(--semantic-background-normal-normal)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                border: '1px solid var(--semantic-line-normal)',
              }}
            >
              <Typography variant="caption1" weight="bold" style={{ color: 'var(--semantic-label-assistive)' }}>
                가격 범례
              </Typography>
              {PRICE_LEGEND_ITEMS.map((item) => (
                <FlexBox key={item.label} alignItems="center" style={{ gap: '4px' }}>
                  <Box
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '999px',
                      flexShrink: 0,
                      backgroundColor: item.color,
                    }}
                  />
                  <Typography variant="caption2" style={{ color: 'var(--semantic-label-assistive)' }}>
                    {item.label}
                  </Typography>
                </FlexBox>
              ))}
            </FlexBox>
          )}

          {/* 히트맵 모드 거래량 범례 (PC만 표시) */}
          {viewMode === 'heatmap' && isPC && (
            <FlexBox
              alignItems="center"
              style={{
                borderRadius: '12px',
                padding: '8px 12px',
                gap: '12px',
                backgroundColor: 'var(--semantic-background-normal-normal)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                border: '1px solid var(--semantic-line-normal)',
              }}
            >
              <Typography variant="caption1" weight="bold" style={{ color: 'var(--semantic-label-assistive)' }}>
                거래량
              </Typography>
              {[
                { color: 'rgba(209,213,219,0.6)', label: '적음' },
                { color: 'rgba(251,191,36,0.7)', label: '보통' },
                { color: 'rgba(249,115,22,0.8)', label: '많음' },
              ].map((item) => (
                <FlexBox key={item.label} alignItems="center" style={{ gap: '4px' }}>
                  <Box
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '999px',
                      background: item.color,
                    }}
                  />
                  <Typography variant="caption2" style={{ color: 'var(--semantic-label-assistive)' }}>
                    {item.label}
                  </Typography>
                </FlexBox>
              ))}
            </FlexBox>
          )}
        </FlexBox>

        {/* 현재 위치 버튼 */}
        <button
          onClick={handleCurrentLocation}
          style={{
            position: 'absolute',
            right: '16px',
            bottom: isPC ? '32px' : '128px',
            zIndex: 20,
            width: '48px',
            height: '48px',
            borderRadius: '999px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.15s',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: 'var(--semantic-background-normal-normal)',
          }}
          aria-label="현재 위치"
        >
          <svg
            style={{ width: '20px', height: '20px', color: 'var(--semantic-primary-normal)' }}
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
          <FlexBox
            alignItems="center"
            justifyContent="center"
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(255,255,255,0.5)',
              zIndex: 10,
            }}
          >
            <LoadingSpinner message="지도 로딩중..." />
          </FlexBox>
        )}
      </Box>

      {/* ─── 모바일 선택된 단지 바텀시트 ─── */}
      <Box style={{ display: isPC ? 'none' : 'block' }}>
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
            <Box style={{ padding: '20px' }}>
              {/* 청약 정보 섹션 (청약 마커인 경우) */}
              {selectedMapApt && (selectedMapApt.markerType === 'subOngoing' || selectedMapApt.markerType === 'subUpcoming') && (
                <SubscriptionInfoSection apt={selectedMapApt} navigate={navigate} />
              )}
              <Typography variant="title3" weight="bold" style={{ color: 'var(--semantic-label-normal)' }}>
                {selectedApartment.name}
              </Typography>
              <Typography
                variant="title1"
                weight="bold"
                style={{ color: 'var(--semantic-label-normal)', marginTop: '8px' }}
              >
                {formatPriceShort(selectedApartment.recentPrice)}
              </Typography>
              {/* 상세 데이터 로딩 중 스피너 표시 */}
              {isDetailLoading && (
                <FlexBox alignItems="center" justifyContent="center" style={{ padding: '8px 0' }}>
                  <LoadingSpinner message="상세 정보 로딩중..." />
                </FlexBox>
              )}
              <Button
                variant="solid"
                color="primary"
                fullWidth
                style={{ marginTop: '16px' }}
                onClick={() => navigate(`/apartment/${selectedApartment.id}`)}
              >
                상세보기
              </Button>
            </Box>
          ) : null}
        </BottomSheet>
      </Box>
    </Box>
  );
}

// ────────────────────────────────────────────────────────────
// 필터 UI 공통 컴포넌트
// ────────────────────────────────────────────────────────────

// LNB 섹션 라벨 (데스크탑 사이드패널 전용)
function LnbSectionLabel({ label, style }: { label: string; style?: React.CSSProperties }) {
  return (
    <Typography
      variant="caption1"
      weight="bold"
      style={{
        color: 'var(--semantic-label-assistive)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        ...style,
      }}
    >
      {label}
    </Typography>
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
    <Box style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--semantic-line-normal)' }}>
      {/* 상태 뱃지 + D-Day */}
      <FlexBox alignItems="center" style={{ gap: '8px', marginBottom: '8px' }}>
        <Box
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
        </Box>
        {dDayText && (
          <Typography variant="body2" weight="bold" style={{ color: dDayColor }}>
            {dDayText}
          </Typography>
        )}
      </FlexBox>

      {/* 분양가 정보 */}
      <FlexBox alignItems="center" style={{ gap: '8px', marginTop: '6px' }}>
        <Typography variant="caption1" weight="medium" style={{ color: 'var(--semantic-label-assistive)' }}>
          분양가
        </Typography>
        <Typography variant="caption1" weight="bold" style={{ color: 'var(--semantic-label-normal)' }}>
          {formatPriceShort(apt.price)}
        </Typography>
      </FlexBox>

      {/* 청약 상세 보기 버튼 */}
      {apt.subId && (
        <Button
          variant="solid"
          color="primary"
          fullWidth
          size="small"
          onClick={() => navigate(`/subscription/${apt.subId}`)}
          trailingContent={<IconArrowRight />}
          style={{ marginTop: '12px' }}
        >
          청약 상세 보기
        </Button>
      )}
    </Box>
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
    <Box>
      <Typography variant="body1" weight="bold" style={{ color: 'var(--semantic-label-normal)', lineHeight: 1.3 }}>
        {apartment.name}
      </Typography>
      <Typography
        variant="caption1"
        style={{ color: 'var(--semantic-label-assistive)', marginTop: '2px' }}
      >
        {apartment.address || `${apartment.district} ${apartment.dong}`}
      </Typography>
      <FlexBox alignItems="baseline" style={{ gap: '8px', marginTop: '8px' }}>
        <Typography variant="title3" weight="bold" style={{ color: 'var(--semantic-label-normal)' }}>
          {formatPriceShort(apartment.recentPrice)}
        </Typography>
        <Typography variant="caption1" style={{ color: 'var(--semantic-label-assistive)' }}>
          {apartment.recentPriceArea}㎡
        </Typography>
        <Typography variant="caption1" weight="bold" style={{ color: priceChangeColor }}>
          {formatChange(apartment.priceChange)}
        </Typography>
      </FlexBox>
      {/* 세대수 / 준공 / 건설사 3열 그리드 */}
      <Box
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          marginTop: '12px',
          paddingTop: '12px',
          textAlign: 'center',
          borderTop: '1px solid var(--semantic-line-normal)',
        }}
      >
        <Box>
          <Typography variant="caption2" style={{ color: 'var(--semantic-label-assistive)' }}>세대수</Typography>
          <Typography variant="caption1" weight="bold" style={{ color: 'var(--semantic-label-normal)', marginTop: '2px' }}>
            {formatUnits(apartment.totalUnits)}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption2" style={{ color: 'var(--semantic-label-assistive)' }}>준공</Typography>
          <Typography variant="caption1" weight="bold" style={{ color: 'var(--semantic-label-normal)', marginTop: '2px' }}>
            {apartment.builtYear}년
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption2" style={{ color: 'var(--semantic-label-assistive)' }}>건설사</Typography>
          <Typography
            variant="caption1"
            weight="bold"
            style={{
              color: 'var(--semantic-label-normal)',
              marginTop: '2px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {apartment.builder}
          </Typography>
        </Box>
      </Box>
      <Button variant="solid" color="primary" fullWidth style={{ marginTop: '12px' }} onClick={onDetailClick}>
        상세보기
      </Button>
    </Box>
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
    <Box style={{ padding: '20px' }}>
      <Typography variant="title3" weight="bold" style={{ color: 'var(--semantic-label-normal)', lineHeight: 1.3 }}>
        {apartment.name}
      </Typography>
      <Typography
        variant="body2"
        style={{ color: 'var(--semantic-label-assistive)', marginTop: '4px' }}
      >
        {apartment.address || `${apartment.district} ${apartment.dong}`}
      </Typography>

      {/* 청약 정보 섹션 (청약 마커인 경우 상단에 표시) */}
      {selectedMapApt && (selectedMapApt.markerType === 'subOngoing' || selectedMapApt.markerType === 'subUpcoming') && (
        <Box style={{ marginTop: '12px' }}>
          <SubscriptionInfoSection apt={selectedMapApt} navigate={navigate} />
        </Box>
      )}

      <FlexBox alignItems="baseline" style={{ gap: '8px', marginTop: '12px' }}>
        <Typography variant="title1" weight="bold" style={{ color: 'var(--semantic-label-normal)' }}>
          {formatPriceShort(apartment.recentPrice)}
        </Typography>
        <Typography variant="body2" style={{ color: 'var(--semantic-label-assistive)' }}>
          {apartment.recentPriceArea}㎡
        </Typography>
        <Typography variant="body2" weight="bold" style={{ color: mobilepriceChangeColor }}>
          {formatChange(apartment.priceChange)}
        </Typography>
      </FlexBox>

      {/* 세대수 / 준공 / 건설사 3열 그리드 */}
      <Box
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid var(--semantic-line-normal)',
        }}
      >
        <Box>
          <Typography variant="caption1" style={{ color: 'var(--semantic-label-assistive)' }}>세대수</Typography>
          <Typography variant="body2" weight="bold" style={{ color: 'var(--semantic-label-normal)', marginTop: '2px' }}>
            {formatUnits(apartment.totalUnits)}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption1" style={{ color: 'var(--semantic-label-assistive)' }}>준공</Typography>
          <Typography variant="body2" weight="bold" style={{ color: 'var(--semantic-label-normal)', marginTop: '2px' }}>
            {apartment.builtYear}년
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption1" style={{ color: 'var(--semantic-label-assistive)' }}>건설사</Typography>
          <Typography
            variant="body2"
            weight="bold"
            style={{
              color: 'var(--semantic-label-normal)',
              marginTop: '2px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {apartment.builder}
          </Typography>
        </Box>
      </Box>

      <Button variant="solid" color="primary" fullWidth style={{ marginTop: '20px' }} onClick={onDetailClick}>
        상세보기
      </Button>
    </Box>
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
    <Box style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* 격자 배경 */}
      <Box
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(180, 200, 220, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(180, 200, 220, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          backgroundColor: '#E8EEF4',
        }}
      />
      {/* 도로 모형 */}
      <Box style={{ position: 'absolute', inset: 0, opacity: 0.3 }}>
        <Box style={{ position: 'absolute', backgroundColor: 'white', height: '8px', top: '30%', left: 0, right: 0 }} />
        <Box style={{ position: 'absolute', backgroundColor: 'white', height: '8px', top: '60%', left: 0, right: 0 }} />
        <Box style={{ position: 'absolute', backgroundColor: 'white', width: '8px', left: '40%', top: 0, bottom: 0 }} />
        <Box style={{ position: 'absolute', backgroundColor: 'white', width: '8px', left: '70%', top: 0, bottom: 0 }} />
      </Box>
      {/* 카카오맵 미연동 안내 */}
      <Box
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}
      >
        <Box
          style={{
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            backgroundColor: 'var(--semantic-background-normal-normal)',
          }}
        >
          <Typography variant="body2" weight="bold" style={{ color: 'var(--semantic-label-normal)' }}>
            카카오맵 연동 필요
          </Typography>
          <Typography variant="caption1" style={{ color: 'var(--semantic-label-assistive)', marginTop: '4px' }}>
            .env에 VITE_KAKAO_MAP_KEY 설정
          </Typography>
        </Box>
      </Box>
      {/* 목업 마커 */}
      {apartments.slice(0, 8).map((apt, i) => {
        const eok = apt.price / 10000;
        const markerBgColor =
          eok >= 20 ? '#D63031' : eok >= 10 ? '#FF4B4B' : eok >= 5 ? '#FF9500' : '#8B95A1';
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
    </Box>
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
