import React from 'react';
import { Box, FlexBox, Typography, Button, IconButton } from '@wanteddev/wds';
import { IconChevronLeft } from '@wanteddev/wds-icon';
import { useMapStore } from '../../stores/mapStore';
import { useApartmentDetail } from '../../hooks/useApartment';
import { formatPriceShort } from '../../utils/formatNumber';
import BottomSheet from '../../components/ui/BottomSheet';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import type { MapApartment } from '../../types';
import FilterPanel from './FilterPanel';
import { MockMapBackground, SubscriptionInfoSection, ApartmentSummary } from './ApartmentDetails';
import { PRICE_LEGEND_ITEMS } from './constants';
import { useNavigate } from 'react-router-dom';

interface MapCanvasProps {
  mapContainerRef: React.RefObject<HTMLDivElement | null>;
  isLoaded: boolean;
  isError: boolean;
  isPC: boolean;
  viewMode: 'marker' | 'heatmap';
  setViewMode: (v: 'marker' | 'heatmap') => void;
  pyeongFilter: 'all' | '20s' | '30s' | '40s' | '50plus';
  setPyeongFilter: (v: 'all' | '20s' | '30s' | '40s' | '50plus') => void;
  mapApartments: MapApartment[];
  searchValue: string;
  setSearchValue: (v: string) => void;
  selectedDetail: ReturnType<typeof useApartmentDetail>['data'];
  selectedMapApt: MapApartment | null | undefined;
  isDetailLoading: boolean;
  onCurrentLocation: () => void;
  onNavigateBack: () => void;
  onDetailClick?: () => void;
  onNavigateToDetail: (id: string | number) => void;
}

export default function MapCanvas({
  mapContainerRef,
  isLoaded,
  isError,
  isPC,
  viewMode,
  setViewMode,
  pyeongFilter,
  setPyeongFilter,
  mapApartments,
  searchValue,
  setSearchValue,
  selectedDetail,
  selectedMapApt,
  isDetailLoading,
  onCurrentLocation,
  onNavigateBack,
  onNavigateToDetail,
}: MapCanvasProps) {
  const { isBottomSheetOpen, closeBottomSheet, selectedApartment } = useMapStore();
  const navigate = useNavigate();

  return (
    <>
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
            <MockMapBackground apartments={mapApartments} onMarkerClick={(apt) => {
              // handleMarkerClick은 index에서 처리 — 여기선 onDetailClick 트리거용 더미
              void apt;
            }} />
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
                onClick={onNavigateBack}
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

          {/* 필터 패널 (모바일) */}
          <FilterPanel isPC={false} pyeongFilter={pyeongFilter} setPyeongFilter={setPyeongFilter} />
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
          onClick={onCurrentLocation}
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
              onDetailClick={() => onNavigateToDetail(selectedDetail.id)}
              navigate={navigate}
            />
          ) : selectedApartment ? (
            <Box style={{ padding: '20px' }}>
              {/* 청약 마커인 경우 — 청약 전용 UI */}
              {selectedApartment.id.startsWith('sub-') ? (
                <>
                  {/* 청약 단지 배지 */}
                  <FlexBox alignItems="center" style={{ gap: '8px', marginBottom: '12px' }}>
                    <Box
                      style={{
                        height: '22px',
                        padding: '0 8px',
                        borderRadius: '11px',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        background: selectedMapApt?.markerType === 'subOngoing' ? '#E8F1FD' : '#FFF4E5',
                        color: selectedMapApt?.markerType === 'subOngoing' ? '#0066FF' : '#E67E22',
                      }}
                    >
                      {selectedMapApt?.markerType === 'subOngoing' ? '청약 진행중' : '청약 예정'}
                    </Box>
                    <Typography variant="caption2" style={{ color: 'var(--semantic-label-assistive)' }}>
                      청약 단지
                    </Typography>
                  </FlexBox>
                  {/* 단지명 */}
                  <Typography variant="title3" weight="bold" style={{ color: 'var(--semantic-label-normal)', lineHeight: 1.3 }}>
                    {selectedApartment.name}
                  </Typography>
                  {/* 청약 상세 정보 (SubscriptionInfoSection 재사용) */}
                  {selectedMapApt && (
                    <Box style={{ marginTop: '12px' }}>
                      <SubscriptionInfoSection apt={selectedMapApt} navigate={navigate} />
                    </Box>
                  )}
                  {/* subId 없는 경우 대비 — subId가 있으면 SubscriptionInfoSection 내부 버튼으로 처리됨 */}
                  {selectedMapApt && !selectedMapApt.subId && (
                    <Button
                      variant="solid"
                      color="primary"
                      fullWidth
                      style={{ marginTop: '12px' }}
                      onClick={() => navigate('/subscription')}
                    >
                      청약 목록 보기
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {/* 일반 마커 fallback — 상세 API 로딩 전 임시 표시 */}
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
                    onClick={() => onNavigateToDetail(selectedApartment.id)}
                  >
                    상세보기
                  </Button>
                </>
              )}
            </Box>
          ) : null}
        </BottomSheet>
      </Box>
    </>
  );
}
