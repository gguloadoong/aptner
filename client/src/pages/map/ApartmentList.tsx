import { Box, FlexBox, Typography, Button, IconButton } from '@wanteddev/wds';
import { IconChevronLeft } from '@wanteddev/wds-icon';
import { useNavigate } from 'react-router-dom';
import { useMapStore } from '../../stores/mapStore';
import { useApartmentDetail } from '../../hooks/useApartment';
import { formatPriceShort } from '../../utils/formatNumber';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import type { MapApartment } from '../../types';
import FilterPanel from './FilterPanel';
import { DesktopApartmentSummary, SubscriptionInfoSection } from './ApartmentDetails';

interface ApartmentListProps {
  isPC: boolean;
  filteredList: MapApartment[];
  searchValue: string;
  setSearchValue: (v: string) => void;
  pyeongFilter: 'all' | '20s' | '30s' | '40s' | '50plus';
  setPyeongFilter: (v: 'all' | '20s' | '30s' | '40s' | '50plus') => void;
  selectedDetail: ReturnType<typeof useApartmentDetail>['data'];
  isDetailLoading: boolean;
  selectedMapApt: MapApartment | null | undefined;
  onMarkerClick: (apt: MapApartment) => void;
  onNavigateBack: () => void;
  onDetailClick: () => void;
  onNavigateToDetail: (id: string | number) => void;
}

export default function ApartmentList({
  isPC,
  filteredList,
  searchValue,
  setSearchValue,
  pyeongFilter,
  setPyeongFilter,
  selectedDetail,
  isDetailLoading,
  selectedMapApt,
  onMarkerClick,
  onNavigateBack,
  onNavigateToDetail,
}: ApartmentListProps) {
  const { selectedApartment } = useMapStore();
  const navigate = useNavigate();

  return (
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
            onClick={onNavigateBack}
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

        {/* 필터 패널 (데스크탑) */}
        <FilterPanel isPC={true} pyeongFilter={pyeongFilter} setPyeongFilter={setPyeongFilter} />
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
                    onClick={() => onMarkerClick(apt)}
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
              onDetailClick={() => onNavigateToDetail(selectedDetail.id)}
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
                onClick={() => onNavigateToDetail(selectedApartment.id)}
              >
                상세보기
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
