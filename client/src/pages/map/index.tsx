import { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useKakaoMap, isVisible } from '../../hooks/useKakaoMap';
import { useMapStore } from '../../stores/mapStore';
import { useApartmentDetail } from '../../hooks/useApartment';
import { useGeocoder } from '../../hooks/useGeocoder';
import { useIsPC } from '../../hooks/useBreakpoint';
import { Box, useToast } from '@wanteddev/wds';
import type { MapApartment, ApartmentComplex } from '../../types';
import { MAP_ZOOM } from './constants';
import { getApartmentsByBounds, getComplexesByBounds, searchApartments } from '../../services/apartment.service';
import { useMapApartments } from '../../hooks/useMapApartments';
import type { PlaceMarkerData } from '../../hooks/useMapApartments';
import ApartmentList from './ApartmentList';
import MapCanvas from './MapCanvas';

const normalizeAptName = (value: string) => value.replace(/\s+/g, '').replace(/[()（）]/g, '').toLowerCase();

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
    setSelectedApartment,
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

  // Places 마커 데이터 상태 (useMapApartments 훅보다 먼저 선언 — handleBoundsChange에서 참조)
  const [placeMarkers, setPlaceMarkers] = useState<PlaceMarkerData[]>([]);

  // 바텀시트용 선택 아파트 상세 정보 (청약 마커 sub- prefix ID는 상세 조회 불필요)
  const aptDetailId = selectedApartment?.id?.startsWith('sub-') ? undefined : selectedApartment?.id;
  const { data: selectedDetail, isLoading: isDetailLoading } = useApartmentDetail(aptDetailId);

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
  const handleComplexClick = useCallback(async (complex: ApartmentComplex) => {
    const normalizedComplexName = normalizeAptName(complex.name);
    const matchedMapApt = mapApartments.find((apt) => normalizeAptName(apt.name) === normalizedComplexName);

    let resolvedId = matchedMapApt?.id ?? complex.id;
    if (!matchedMapApt) {
      try {
        const searchResults = await searchApartments(complex.name);
        const matchedSearch = searchResults.find((apt) => normalizeAptName(apt.name) === normalizedComplexName);
        if (matchedSearch?.id) {
          resolvedId = matchedSearch.id;
        }
      } catch (err) {
        console.warn('[handleComplexClick] 단지 상세 ID 탐색 실패:', err);
      }
    }

    setSelectedApartment({
      id: resolvedId,
      name: complex.name,
      address: complex.address,
      district: complex.umdNm,
      dong: complex.umdNm,
      lat: complex.lat ?? 0,
      lng: complex.lng ?? 0,
      totalUnits: matchedMapApt?.totalUnits ?? 0,
      builtYear: complex.buildYear ?? 0,
      builder: '',
      areas: matchedMapApt?.areas ?? [String(complex.area)],
      recentPrice: complex.latestPrice,
      recentPriceArea: String(complex.area),
      priceChange: complex.priceChange ?? 0,
      priceChangeType: complex.priceChangeType ?? 'flat',
    });
  }, [mapApartments, setSelectedApartment]);

  // fetchPlaceMarkers를 ref로 안정화 — handleBoundsChange 선언 시점에
  // useMapApartments 훅이 아직 초기화되지 않으므로 ref를 통해 late-binding
  const fetchPlaceMarkersRef = useRef<((lat: number, lng: number) => Promise<PlaceMarkerData[]>) | null>(null);

  // 뷰포트 변경 핸들러
  // 1) 기존 MapApartment 마커 갱신 (청약 포함)
  // 2) 호갱노노 스타일 단지 데이터 갱신 + Geocoder 변환
  // 3) Places AT4 검색 + 거래가 매칭
  const handleBoundsChange = useCallback(
    async (swLat: number, swLng: number, neLat: number, neLng: number, zoom: number) => {
      // 줌 레벨 상태 업데이트 (구 단위 오버레이 표시 여부 판단)
      setCurrentZoom(zoom);

      // 병렬 처리: 기존 마커 데이터 + 단지 데이터 동시 요청
      try {
        // 기존 마커 데이터 갱신
        const merged = await getApartmentsByBounds(swLat, swLng, neLat, neLng, priceFilter);
        setMapApartments(merged);
      } catch (err) {
        console.warn('[handleBoundsChange] 마커 데이터 갱신 실패, 기존 데이터 유지:', err);
      }

      // Places AT4(아파트) 검색 — INDIVIDUAL_MARKERS 임계값까지 표시하므로 같은 조건으로 fetch
      if (zoom <= MAP_ZOOM.INDIVIDUAL_MARKERS) {
        const centerLat = (swLat + neLat) / 2;
        const centerLng = (swLng + neLng) / 2;
        fetchPlaceMarkersRef.current?.(centerLat, centerLng)
          .then((markers) => setPlaceMarkers(markers))
          .catch((err) => console.warn('[handleBoundsChange] Places 마커 갱신 실패:', err));
      } else {
        setPlaceMarkers([]);
      }

      // 충분히 줌인한 경우에만 MOLIT 단지 집계 마커 조회
      if (zoom <= MAP_ZOOM.COMPLEX_DATA_FETCH) {
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
        setComplexes([]);
      }
    },
    [batchGeocode, priceFilter]
  );

  const { isLoaded, isError, getMap, updateMarkers, updateComplexMarkers, updatePlaceMarkers, moveToLocation, updateHeatmapOverlays, clearHeatmapOverlays, updateDistrictOverlays, clearDistrictOverlays } = useKakaoMap(
    mapContainerRef,
    {
      initialLat: 37.5665,
      initialLng: 126.978,
      initialLevel: 7,
      onMarkerClick: handleMarkerClick,
      onBoundsChange: handleBoundsChange,
    }
  );

  // Places AT4 기반 아파트 좌표 + 거래가 매칭 훅
  // fetchPlaceMarkers를 ref에 등록하여 handleBoundsChange에서 late-binding으로 사용
  const { fetchPlaceMarkers } = useMapApartments({ getMap });
  fetchPlaceMarkersRef.current = fetchPlaceMarkers;

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
        moveToLocation(coords.lat, coords.lng, 3);
      } else {
        addToast({ content: `'${query}' 위치를 찾을 수 없습니다.`, variant: 'cautionary', duration: 'short' });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, searchParams]);

  // 마커 뷰 / 히트맵 뷰 토글 상태
  const [viewMode, setViewMode] = useState<'marker' | 'heatmap'>('marker');
  // 현재 줌 레벨 상태 (구 단위 오버레이 표시 여부 판단용)
  const [currentZoom, setCurrentZoom] = useState<number>(7);

  // 기존 마커 업데이트 — 충분히 줌인한 경우에만 개별 마커 표시
  useEffect(() => {
    if (!isLoaded) return;
    if (viewMode === 'marker' && currentZoom <= MAP_ZOOM.INDIVIDUAL_MARKERS) {
      updateMarkers(mapApartments, { priceFilter, areaFilter, layerFilters, unitCountFilter, complexFeatures });
    } else {
      updateMarkers([], { priceFilter, areaFilter, layerFilters, unitCountFilter, complexFeatures });
    }
  }, [isLoaded, viewMode, currentZoom, mapApartments, updateMarkers, priceFilter, areaFilter, layerFilters, unitCountFilter, complexFeatures]);

  // 호갱노노 스타일 단지 마커 업데이트
  useEffect(() => {
    if (!isLoaded) return;
    if (viewMode === 'marker' && currentZoom <= MAP_ZOOM.COMPLEX_MARKERS) {
      updateComplexMarkers(complexes, handleComplexClick);
    } else {
      updateComplexMarkers([], handleComplexClick);
    }
  }, [isLoaded, viewMode, currentZoom, complexes, updateComplexMarkers, handleComplexClick]);

  // Places AT4 가격 마커 클릭 핸들러 — 단지명 검색으로 상세 이동
  const handlePlaceMarkerClick = useCallback(
    (_id: string, placeName: string) => {
      // place_name으로 검색 페이지 이동 (단지 코드가 없으므로 검색 경유)
      navigate(`/search?q=${encodeURIComponent(placeName)}`);
    },
    [navigate]
  );

  // Places AT4 마커 업데이트 — 단지 뷰에서만 표시
  useEffect(() => {
    if (!isLoaded) return;
    if (viewMode === 'marker' && currentZoom <= MAP_ZOOM.INDIVIDUAL_MARKERS) {
      updatePlaceMarkers(placeMarkers, handlePlaceMarkerClick);
    } else {
      updatePlaceMarkers([], handlePlaceMarkerClick);
    }
  }, [isLoaded, viewMode, currentZoom, placeMarkers, updatePlaceMarkers, handlePlaceMarkerClick]);

  // 히트맵 오버레이 업데이트 — 히트맵 모드 진입/데이터 변경 시
  useEffect(() => {
    if (!isLoaded) return;
    if (viewMode === 'heatmap') {
      updateHeatmapOverlays(mapApartments);
    } else {
      clearHeatmapOverlays();
    }
  }, [isLoaded, viewMode, mapApartments, updateHeatmapOverlays, clearHeatmapOverlays]);

  // 줌 단계별 평균가 오버레이 업데이트
  useEffect(() => {
    if (!isLoaded) return;
    if (viewMode === 'marker' && currentZoom >= MAP_ZOOM.DISTRICT_OVERLAYS) {
      updateDistrictOverlays(mapApartments, currentZoom);
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
      <ApartmentList
        isPC={isPC}
        filteredList={filteredList}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        pyeongFilter={pyeongFilter}
        setPyeongFilter={setPyeongFilter}
        selectedDetail={selectedDetail}
        isDetailLoading={isDetailLoading}
        selectedMapApt={selectedMapApt ?? null}
        onMarkerClick={handleMarkerClick}
        onNavigateBack={() => navigate(-1)}
        onDetailClick={() => navigate(-1)}
        onNavigateToDetail={(id) => navigate(`/apartment/${id}`)}
      />

      {/* ─── 지도 영역 + 모바일 바텀시트 ─── */}
      <MapCanvas
        mapContainerRef={mapContainerRef}
        isLoaded={isLoaded}
        isError={isError}
        isPC={isPC}
        viewMode={viewMode}
        setViewMode={setViewMode}
        pyeongFilter={pyeongFilter}
        setPyeongFilter={setPyeongFilter}
        mapApartments={mapApartments}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        selectedDetail={selectedDetail}
        selectedMapApt={selectedMapApt ?? null}
        isDetailLoading={isDetailLoading}
        onCurrentLocation={handleCurrentLocation}
        onNavigateBack={() => navigate(-1)}
        onDetailClick={() => navigate(-1)}
        onNavigateToDetail={(id) => navigate(`/apartment/${id}`)}
      />
    </Box>
  );
}
