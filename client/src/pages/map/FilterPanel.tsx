import { Box, FlexBox, Chip } from '@wanteddev/wds';
import { useMapStore } from '../../stores/mapStore';
import type { PriceFilter, AreaFilter } from '../../types';
import { PRICE_FILTERS, AREA_FILTERS, PYEONG_FILTER_OPTIONS, UNIT_COUNT_OPTIONS, COMPLEX_FEATURE_OPTIONS } from './constants';
import { LnbSectionLabel } from './ApartmentDetails';

interface FilterPanelProps {
  isPC: boolean;
  pyeongFilter: 'all' | '20s' | '30s' | '40s' | '50plus';
  setPyeongFilter: (v: 'all' | '20s' | '30s' | '40s' | '50plus') => void;
}

export default function FilterPanel({ isPC, pyeongFilter, setPyeongFilter }: FilterPanelProps) {
  const {
    priceFilter,
    layerFilters,
    areaFilter,
    unitCountFilter,
    complexFeatures,
    setPriceFilter,
    setLayerFilter,
    setAreaFilter,
    setUnitCountFilter,
    toggleComplexFeature,
  } = useMapStore();

  const activeLayerCount = [layerFilters.hot, layerFilters.allTimeHigh, layerFilters.subscription]
    .filter(Boolean).length;

  if (isPC) {
    return (
      <>
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
      </>
    );
  }

  // 모바일: 가로 스크롤 행 레이아웃
  return (
    <>
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
    </>
  );
}
