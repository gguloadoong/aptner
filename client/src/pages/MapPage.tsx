import { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKakaoMap } from '../hooks/useKakaoMap';
import { useMapStore } from '../stores/mapStore';
import { useApartmentDetail } from '../hooks/useApartment';
import BottomSheet from '../components/ui/BottomSheet';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { formatPriceShort, formatChange, formatUnits } from '../utils/formatNumber';
import type { MapApartment, PriceFilter } from '../types';
import { MOCK_MAP_APARTMENTS } from '../mocks/apartments.mock';
import { useToastStore } from '../stores/toastStore';

// 지도 페이지 - 모바일: 지도 전체 + 바텀시트, 데스크탑: 좌측 패널 + 우측 지도
export default function MapPage() {
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const { priceFilter, selectedApartment, isBottomSheetOpen, setPriceFilter, setSelectedApartment, closeBottomSheet } = useMapStore();
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
      areas: [apt.area],
      recentPrice: apt.price,
      recentPriceArea: apt.area,
      priceChange: 0,
      priceChangeType: apt.priceChangeType,
    });
  }, [setSelectedApartment]);

  // 뷰포트 변경 핸들러 - 필터 적용하여 마커 표시
  const handleBoundsChange = useCallback(
    (swLat: number, swLng: number, neLat: number, neLng: number) => {
      let filtered = MOCK_MAP_APARTMENTS.filter(
        (apt) => apt.lat >= swLat && apt.lat <= neLat && apt.lng >= swLng && apt.lng <= neLng
      );

      if (priceFilter !== 'all') {
        filtered = filtered.filter((apt) => {
          const eok = apt.price / 10000;
          if (priceFilter === 'under5') return eok < 5;
          if (priceFilter === '5to10') return eok >= 5 && eok < 10;
          if (priceFilter === 'over10') return eok >= 10;
          return true;
        });
      }

      setMapApartments(filtered);
    },
    [priceFilter]
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

  // 마커 업데이트
  useEffect(() => {
    if (isLoaded) {
      updateMarkers(mapApartments);
    }
  }, [isLoaded, mapApartments, updateMarkers]);

  // 검색어로 필터된 아파트 목록 (좌측 패널용)
  const filteredList = MOCK_MAP_APARTMENTS.filter((apt) => {
    const matchSearch = !searchValue || apt.name.includes(searchValue);
    const eok = apt.price / 10000;
    const matchPrice =
      priceFilter === 'all' ||
      (priceFilter === 'under5' && eok < 5) ||
      (priceFilter === '5to10' && eok >= 5 && eok < 10) ||
      (priceFilter === 'over10' && eok >= 10);
    return matchSearch && matchPrice;
  });

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

  return (
    <div className="relative w-full h-screen bg-gray-200 flex">
      {/* 데스크탑 좌측 사이드 패널 */}
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

          {/* 가격대 필터 칩 */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {PRICE_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setPriceFilter(filter.value as PriceFilter)}
                className={[
                  'px-3 py-1.5 rounded-full text-xs font-semibold transition-all border',
                  priceFilter === filter.value
                    ? 'bg-[#1B64DA] text-white border-[#1B64DA]'
                    : 'bg-white text-[#8B95A1] border-[#E5E8EB] hover:border-[#1B64DA] hover:text-[#1B64DA]',
                ].join(' ')}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* 아파트 목록 */}
        <div className="flex-1 overflow-y-auto">
          {/* 결과 건수 */}
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
                const markerBg = eok >= 15 ? 'bg-[#FF4B4B]' : eok >= 5 ? 'bg-[#FF9500]' : 'bg-[#8B95A1]';

                return (
                  <li key={apt.id}>
                    <button
                      onClick={() => handleMarkerClick(apt)}
                      className={[
                        'w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors border-b border-[#E5E8EB]',
                        isSelected ? 'bg-blue-50' : 'hover:bg-[#F5F6F8]',
                      ].join(' ')}
                    >
                      {/* 가격 배지 */}
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

      {/* 지도 영역 */}
      <div className="relative flex-1 h-full">
        {/* 카카오맵 컨테이너 */}
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* 카카오맵 미사용 시 Mock 맵 UI */}
        {(!isLoaded || isError) && (
          <div className="absolute inset-0 bg-[#E8EEF4] flex flex-col">
            <MockMapBackground apartments={mapApartments} onMarkerClick={handleMarkerClick} />
          </div>
        )}

        {/* 모바일 상단 검색바 (md 미만에서만 표시) */}
        <div className="md:hidden absolute top-0 left-0 right-0 z-20 p-4 pt-safe">
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

          {/* 모바일 가격대 필터 칩 */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {PRICE_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setPriceFilter(filter.value as PriceFilter)}
                className={[
                  'flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold shadow-sm transition-all',
                  priceFilter === filter.value
                    ? 'bg-[#1B64DA] text-white'
                    : 'bg-white text-[#8B95A1] hover:bg-gray-50',
                ].join(' ')}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* 마커 범례 (데스크탑에서 지도 우상단) */}
        <div className="hidden md:flex absolute top-4 right-4 z-20 bg-white rounded-xl shadow-md px-3 py-2 gap-3 items-center">
          <span className="text-xs text-[#8B95A1] font-semibold">가격 범례</span>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-[#8B95A1]" />
            <span className="text-[11px] text-[#8B95A1]">5억 미만</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF9500]" />
            <span className="text-[11px] text-[#8B95A1]">5~15억</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF4B4B]" />
            <span className="text-[11px] text-[#8B95A1]">15억+</span>
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

      {/* 모바일 선택된 단지 바텀시트 */}
      <div className="md:hidden">
        <BottomSheet
          isOpen={isBottomSheetOpen}
          onClose={closeBottomSheet}
          snapPoints="auto"
        >
          {selectedDetail ? (
            <ApartmentSummary
              apartment={selectedDetail}
              onDetailClick={() => navigate(`/apartment/${selectedDetail.id}`)}
            />
          ) : selectedApartment ? (
            <div className="p-5">
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

// 데스크탑 패널 - 아파트 요약
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

// 모바일 단지 요약 바텀시트 내용
function ApartmentSummary({
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
    <div className="p-5">
      <h3 className="font-black text-[#191F28] text-lg leading-snug">{apartment.name}</h3>
      <p className="text-sm text-[#8B95A1] mt-1">{apartment.address || `${apartment.district} ${apartment.dong}`}</p>

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

// Mock 지도 배경 (카카오맵 없을 때)
function MockMapBackground({
  apartments,
  onMarkerClick,
}: {
  apartments: MapApartment[];
  onMarkerClick: (apt: MapApartment) => void;
}) {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* 격자 배경 */}
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

      {/* 도로 시뮬레이션 */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute bg-white h-2" style={{ top: '30%', left: 0, right: 0 }} />
        <div className="absolute bg-white h-2" style={{ top: '60%', left: 0, right: 0 }} />
        <div className="absolute bg-white w-2" style={{ left: '40%', top: 0, bottom: 0 }} />
        <div className="absolute bg-white w-2" style={{ left: '70%', top: 0, bottom: 0 }} />
      </div>

      {/* 안내 텍스트 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <div className="bg-white/90 rounded-2xl p-4 shadow-lg">
          <p className="text-sm font-bold text-[#191F28]">카카오맵 연동 필요</p>
          <p className="text-xs text-[#8B95A1] mt-1">.env에 VITE_KAKAO_MAP_KEY 설정</p>
        </div>
      </div>

      {/* Mock 마커들 */}
      {apartments.slice(0, 8).map((apt, i) => {
        const eok = apt.price / 10000;
        const markerBg =
          eok >= 15 ? 'bg-[#FF4B4B]' : eok >= 5 ? 'bg-[#FF9500]' : 'bg-[#8B95A1]';

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

const PRICE_FILTERS = [
  { value: 'all', label: '전체' },
  { value: 'under5', label: '5억 이하' },
  { value: '5to10', label: '5~10억' },
  { value: 'over10', label: '10억 이상' },
];
