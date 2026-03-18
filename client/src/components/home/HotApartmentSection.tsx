import { useNavigate } from 'react-router-dom';
import { useHotRanking } from '../../hooks/useApartment';
import {
  Box,
  FlexBox,
  Typography,
  TextButton,
  Button,
  Skeleton,
} from '@wanteddev/wds';
import { IconChevronRight } from '@wanteddev/wds-icon';
import type { HotApartment } from '../../types';
import { formatPriceShort } from '../../utils/formatNumber';

// 순위별 배지 색상
const RANK_BADGE_COLORS: Record<number, { bg: string; shadow: string }> = {
  1: { bg: '#FFD700', shadow: 'rgba(255,215,0,0.5)' },
  2: { bg: '#C0C0C0', shadow: 'rgba(192,192,192,0.5)' },
  3: { bg: '#CD7F32', shadow: 'rgba(205,127,50,0.5)' },
};

// rankChange 뱃지
function RankChangeBadge({ change }: { change: number | null }) {
  if (change === null) {
    return (
      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--semantic-primary-normal)', backgroundColor: '#EBF1FC', padding: '2px 6px', borderRadius: '9999px' }}>
        NEW
      </span>
    );
  }
  if (change > 0) {
    return <span style={{ fontSize: '11px', fontWeight: 700, color: '#E53E3E' }}>▲{change}</span>;
  }
  if (change < 0) {
    return <span style={{ fontSize: '11px', fontWeight: 700, color: '#00C896' }}>▼{Math.abs(change)}</span>;
  }
  return <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--semantic-label-assistive)' }}>-</span>;
}

interface CompactHotCardProps {
  apartment: HotApartment;
  isLast: boolean;
}

function CompactHotCard({ apartment, isLast }: CompactHotCardProps) {
  const badgeColor = RANK_BADGE_COLORS[apartment.rank];

  // recentPrice: HotApartment는 원 단위 → 만원 단위로 변환
  const priceManwon = Math.round(apartment.recentPrice / 10000);

  return (
    <FlexBox
      alignItems="center"
      gap="12px"
      style={{
        padding: '14px 16px',
        borderBottom: isLast ? 'none' : '1px solid var(--semantic-background-normal-alternative)',
      }}
    >
      {/* 순위 번호 — 원형 배지는 WDS Badge가 숫자 배지가 아니라 inline style 유지 */}
      <FlexBox
        flexDirection="column"
        alignItems="center"
        gap="2px"
        style={{ flexShrink: 0, width: '32px' }}
      >
        {badgeColor ? (
          <span style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 900,
            color: 'white',
            backgroundColor: badgeColor.bg,
            boxShadow: `0 2px 4px ${badgeColor.shadow}`,
          }}>
            {apartment.rank}
          </span>
        ) : (
          <Typography
            variant="body1"
            weight="bold"
            sx={{ color: 'var(--semantic-primary-normal)', lineHeight: 1 }}
          >
            {apartment.rank}
          </Typography>
        )}
        <RankChangeBadge change={apartment.rankChange} />
      </FlexBox>

      {/* 단지명 + 위치 */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="title3"
          weight="bold"
          sx={{
            color: 'var(--semantic-label-normal)',
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: 1.3,
          }}
        >
          {apartment.name}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'var(--semantic-label-assistive)',
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginTop: '2px',
          }}
        >
          {apartment.location}
        </Typography>
      </Box>

      {/* 거래가 */}
      <Box sx={{ flexShrink: 0, textAlign: 'right' }}>
        <Typography
          variant="body2"
          weight="bold"
          sx={{
            color: 'var(--semantic-label-normal)',
            fontFamily: 'var(--font-jetbrains, monospace)',
            display: 'block',
          }}
        >
          {formatPriceShort(priceManwon)}
        </Typography>
        {apartment.tradeSurgeRate > 0 && (
          <Typography
            variant="caption2"
            weight="bold"
            sx={{ color: '#E53E3E', display: 'block', marginTop: '2px' }}
          >
            거래 +{apartment.tradeSurgeRate}%
          </Typography>
        )}
      </Box>
    </FlexBox>
  );
}

function HotSectionSkeleton() {
  return (
    <Box
      sx={{
        backgroundColor: 'var(--semantic-background-normal-normal)',
        borderRadius: '16px',
        border: '1px solid var(--semantic-line-normal)',
        overflow: 'hidden',
      }}
    >
      {[1, 2, 3].map((rank) => (
        <FlexBox
          key={rank}
          alignItems="center"
          gap="12px"
          style={{ padding: '14px 16px', borderBottom: rank < 3 ? '1px solid var(--semantic-background-normal-alternative)' : 'none' }}
        >
          <Skeleton variant="circle" width="24px" height="24px" />
          <FlexBox flex="1" flexDirection="column" gap="6px">
            <Skeleton variant="text" width="55%" height="17px" />
            <Skeleton variant="text" width="35%" height="13px" />
          </FlexBox>
          <Skeleton variant="text" width="48px" height="15px" />
        </FlexBox>
      ))}
    </Box>
  );
}

function HotSectionEmpty() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        backgroundColor: 'var(--semantic-background-normal-normal)',
        borderRadius: '16px',
        border: '1px solid var(--semantic-line-normal)',
        padding: '32px 16px',
        textAlign: 'center',
      }}
    >
      <Typography variant="body2" weight="medium" sx={{ color: 'var(--semantic-label-assistive)', display: 'block' }}>
        이번 주 HOT 데이터를 불러오는 중이에요
      </Typography>
      <Box sx={{ marginTop: '12px' }}>
        <Button
          variant="outlined"
          color="primary"
          size="small"
          onClick={() => navigate('/map')}
          trailingContent={<IconChevronRight />}
        >
          지도에서 직접 찾기
        </Button>
      </Box>
    </Box>
  );
}

interface HotApartmentSectionProps {
  region?: string;
}

export default function HotApartmentSection({ region }: HotApartmentSectionProps) {
  const navigate = useNavigate();
  const { data: hotApartments = [], isLoading } = useHotRanking(region, 3);

  return (
    <Box as="section">
      <FlexBox alignItems="flex-end" justifyContent="space-between" style={{ marginBottom: '12px' }}>
        <div>
          <Typography
            variant="title3"
            weight="bold"
            sx={{ color: 'var(--semantic-label-normal)', letterSpacing: '-0.03em', display: 'block' }}
          >
            이번 주 HOT
          </Typography>
          <Typography
            variant="caption1"
            weight="medium"
            sx={{ color: 'var(--semantic-label-assistive)', marginTop: '2px', display: 'block' }}
          >
            조회 · 거래량 기준 주간 랭킹
          </Typography>
        </div>
        <TextButton size="small" color="primary" onClick={() => navigate('/hot')}>
          더보기
        </TextButton>
      </FlexBox>

      {isLoading ? (
        <HotSectionSkeleton />
      ) : hotApartments.length === 0 ? (
        <HotSectionEmpty />
      ) : (
        <Box
          sx={{
            backgroundColor: 'var(--semantic-background-normal-normal)',
            borderRadius: '16px',
            border: '1px solid var(--semantic-line-normal)',
            overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}
        >
          {hotApartments.slice(0, 3).map((apt, i) => (
            <CompactHotCard
              key={apt.aptCode}
              apartment={apt}
              isLast={i === Math.min(hotApartments.length, 3) - 1}
            />
          ))}
        </Box>
      )}

      <Button
        variant="solid"
        color="primary"
        fullWidth
        onClick={() => navigate('/hot')}
        style={{ marginTop: '12px' }}
      >
        HOT 랭킹 전체 보기
      </Button>
    </Box>
  );
}
