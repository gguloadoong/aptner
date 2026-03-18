import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, FlexBox, Typography, Skeleton } from '@wanteddev/wds';
import { getHotApartmentRanking } from '../services/apartment.service';
import type { HotApartment } from '../types';

// 지역 필터 탭 정의
const REGION_TABS = [
  { label: '전국', value: '전국' },
  { label: '서울', value: '서울' },
  { label: '경기', value: '경기' },
  { label: '인천', value: '인천' },
] as const;

type RegionValue = (typeof REGION_TABS)[number]['value'];

// 원 단위 → "N억 N,000만원" 변환
function formatPrice(won: number): string {
  const eok = Math.floor(won / 100_000_000);
  const man = Math.floor((won % 100_000_000) / 10_000);
  if (eok > 0 && man > 0) {
    return `${eok}억 ${man.toLocaleString('ko-KR')}만원`;
  }
  if (eok > 0) {
    return `${eok}억`;
  }
  return `${man.toLocaleString('ko-KR')}만원`;
}

// 순위 변동 뱃지 — WDS Badge가 숫자 배지가 아닌 텍스트 배지라 inline style 유지
function RankChangeBadge({ rankChange }: { rankChange: number | null }) {
  if (rankChange === null) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 700,
          backgroundColor: '#EBF1FC',
          color: '#1B64DA',
        }}
      >
        NEW
      </span>
    );
  }
  if (rankChange > 0) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 700,
          backgroundColor: '#FF4B4B',
          color: '#fff',
        }}
      >
        ▲ {rankChange}
      </span>
    );
  }
  if (rankChange < 0) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 700,
          backgroundColor: '#00C896',
          color: '#fff',
        }}
      >
        ▼ {Math.abs(rankChange)}
      </span>
    );
  }
  // rankChange === 0
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 700,
        backgroundColor: '#E5E7EB',
        color: '#9CA3AF',
      }}
    >
      -
    </span>
  );
}

// 개별 아파트 카드
function HotApartmentCard({ apt }: { apt: HotApartment }) {
  const isTopThree = apt.rank <= 3;

  return (
    <Box
      sx={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        padding: '16px 20px',
      }}
    >
      <FlexBox alignItems="center" gap="16px">
        {/* 순위 숫자 — 원형 배지 아닌 숫자 표기, inline style 유지 */}
        <Box
          sx={{
            minWidth: '36px',
            lineHeight: 1,
            textAlign: 'center',
          }}
        >
          <Typography
            variant="title3"
            weight="bold"
            sx={{ color: isTopThree ? '#1B64DA' : '#9CA3AF' }}
          >
            {apt.rank}
          </Typography>
        </Box>

        {/* 단지 정보 */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <FlexBox alignItems="center" gap="8px" style={{ marginBottom: 4 }}>
            <Typography
              variant="body1"
              weight="bold"
              sx={{
                color: '#111827',
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {apt.name}
            </Typography>
            <RankChangeBadge rankChange={apt.rankChange} />
          </FlexBox>

          <Typography
            variant="caption1"
            sx={{
              color: '#6B7280',
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginBottom: '6px',
            }}
          >
            {apt.location}
          </Typography>

          <FlexBox alignItems="center" justifyContent="space-between" gap="8px">
            {/* 최근 거래가 — monospace 폰트 적용을 위해 sx로 fontFamily 유지 */}
            <Typography
              variant="body2"
              weight="bold"
              sx={{
                color: '#111827',
                fontFamily: "'JetBrains Mono', 'Courier New', monospace",
              }}
            >
              {formatPrice(Math.round(apt.recentPrice / 10000))}
            </Typography>

            {/* 거래량 급등률 */}
            {apt.tradeSurgeRate > 0 && (
              <Typography
                variant="caption1"
                weight="bold"
                sx={{ color: '#FF4B4B' }}
              >
                거래 +{apt.tradeSurgeRate}%
              </Typography>
            )}
          </FlexBox>
        </Box>
      </FlexBox>
    </Box>
  );
}

// 지역 필터 pill 버튼 — WDS Tab이 pathname 기반이라 직접 구현 유지
function RegionTabs({
  selected,
  onChange,
}: {
  selected: RegionValue;
  onChange: (v: RegionValue) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {REGION_TABS.map((tab) => {
        const isActive = selected === tab.value;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            style={{
              padding: '8px 18px',
              borderRadius: 20,
              border: isActive ? '1.5px solid #1B64DA' : '1.5px solid #E5E7EB',
              backgroundColor: isActive ? '#EBF1FC' : '#fff',
              color: isActive ? '#1B64DA' : '#6B7280',
              fontWeight: isActive ? 700 : 400,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default function HotRankingPage() {
  const [region, setRegion] = useState<RegionValue>('전국');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['hotRanking', region],
    queryFn: () => getHotApartmentRanking(region, 20),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div
      style={{
        maxWidth: 640,
        margin: '0 auto',
        padding: '24px 16px 100px',
        backgroundColor: '#F5F6F8',
        minHeight: '100vh',
      }}
    >
      {/* 페이지 제목 */}
      <Typography
        variant="title2"
        weight="bold"
        sx={{ color: '#111827', display: 'block', marginBottom: '20px' }}
      >
        핫 아파트 TOP 20
      </Typography>

      {/* 지역 필터 */}
      <Box sx={{ marginBottom: '20px' }}>
        <RegionTabs selected={region} onChange={setRegion} />
      </Box>

      {/* 로딩 */}
      {isLoading && (
        <FlexBox flexDirection="column" gap="10px">
          {Array.from({ length: 5 }).map((_, i) => (
            <Box
              key={i}
              sx={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                padding: '16px 20px',
              }}
            >
              <FlexBox alignItems="center" gap="16px">
                <Skeleton variant="text" width="36px" height="28px" />
                <FlexBox flex="1" flexDirection="column" gap="8px">
                  <Skeleton variant="text" width="55%" height="17px" />
                  <Skeleton variant="text" width="35%" height="13px" />
                  <Skeleton variant="text" width="45%" height="15px" />
                </FlexBox>
              </FlexBox>
            </Box>
          ))}
        </FlexBox>
      )}

      {/* 에러 */}
      {isError && (
        <FlexBox
          justifyContent="center"
          alignItems="center"
          style={{ minHeight: 240 }}
        >
          <Typography variant="body2" sx={{ color: '#EF4444' }}>
            데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </Typography>
        </FlexBox>
      )}

      {/* 빈 상태 */}
      {!isLoading && !isError && (!data || data.length === 0) && (
        <FlexBox
          justifyContent="center"
          alignItems="center"
          style={{ minHeight: 240 }}
        >
          <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
            데이터가 없습니다.
          </Typography>
        </FlexBox>
      )}

      {/* 랭킹 리스트 */}
      {!isLoading && !isError && data && data.length > 0 && (
        <FlexBox flexDirection="column" gap="10px">
          {data.map((apt) => (
            <HotApartmentCard key={apt.aptCode} apt={apt} />
          ))}
        </FlexBox>
      )}
    </div>
  );
}
