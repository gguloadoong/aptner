import { useQuery } from '@tanstack/react-query';
import { Box, FlexBox, Typography, Skeleton } from '@wanteddev/wds';
import { getRecordHighs } from '../../services/apartment.service';
import { formatPrice } from '../../utils/formatNumber';
import type { RecordHighApartment } from '../../types';

// 순위 배지 색상
const RANK_COLORS: Record<number, { bg: string; color: string }> = {
  1: { bg: '#FFD700', color: '#7A5800' },
  2: { bg: '#C0C0C0', color: '#4A4A4A' },
  3: { bg: '#CD7F32', color: '#5C3300' },
};

interface RecordHighCardProps {
  rank: number;
  apt: RecordHighApartment;
  isLast: boolean;
}

function RecordHighCard({ rank, apt, isLast }: RecordHighCardProps) {
  const badgeStyle = RANK_COLORS[rank];

  return (
    <FlexBox
      alignItems="center"
      gap="12px"
      style={{
        padding: '14px 16px',
        borderBottom: isLast ? 'none' : '1px solid var(--semantic-background-normal-alternative)',
      }}
    >
      {/* 순위 배지 */}
      <div
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          backgroundColor: badgeStyle?.bg ?? 'var(--semantic-background-normal-alternative)',
        }}
      >
        <Typography
          variant="caption2"
          weight="bold"
          sx={{ color: badgeStyle?.color ?? 'var(--semantic-label-normal)', lineHeight: 1 }}
        >
          {rank}
        </Typography>
      </div>

      {/* 단지명 + 위치 + 면적 */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          weight="bold"
          sx={{
            color: 'var(--semantic-label-normal)',
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {apt.aptName}
        </Typography>
        <Typography
          variant="caption2"
          sx={{
            color: 'var(--semantic-label-assistive)',
            display: 'block',
            marginTop: '2px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {apt.location} · {apt.area}㎡
        </Typography>
      </Box>

      {/* 가격 + 상승률 */}
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
          {formatPrice(apt.recentPrice)}
        </Typography>
        <Typography
          variant="caption2"
          weight="bold"
          sx={{ color: '#FF4B4B', display: 'block', marginTop: '2px' }}
        >
          +{apt.priceChangeRate.toFixed(1)}%
        </Typography>
      </Box>
    </FlexBox>
  );
}

function RecordHighSkeleton() {
  return (
    <Box
      sx={{
        backgroundColor: 'var(--semantic-background-normal-normal)',
        borderRadius: '16px',
        border: '1px solid var(--semantic-line-normal)',
        overflow: 'hidden',
      }}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <FlexBox
          key={i}
          alignItems="center"
          gap="12px"
          style={{
            padding: '14px 16px',
            borderBottom: i < 5 ? '1px solid var(--semantic-background-normal-alternative)' : 'none',
          }}
        >
          <Skeleton variant="circle" width="24px" height="24px" />
          <FlexBox flex="1" flexDirection="column" gap="6px">
            <Skeleton variant="text" width="50%" height="15px" />
            <Skeleton variant="text" width="35%" height="12px" />
          </FlexBox>
          <FlexBox flexDirection="column" alignItems="flex-end" gap="4px">
            <Skeleton variant="text" width="56px" height="15px" />
            <Skeleton variant="text" width="36px" height="12px" />
          </FlexBox>
        </FlexBox>
      ))}
    </Box>
  );
}

// 데이터 시점 캡션 — 현재 월 기준
function getDataCaption(): string {
  const now = new Date();
  return `${now.getFullYear()}년 ${now.getMonth() + 1}월 기준`;
}

export default function RecordHighSection() {
  const { data: recordHighs = [], isLoading } = useQuery({
    queryKey: ['apartments', 'recordHighs'],
    queryFn: () => getRecordHighs('수도권', 5),
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });

  return (
    <Box as="section" sx={{ padding: '0 16px' }}>
      {/* 섹션 헤더 */}
      <FlexBox alignItems="flex-end" justifyContent="space-between" style={{ marginBottom: '12px' }}>
        <Typography
          variant="title3"
          weight="bold"
          sx={{ color: 'var(--semantic-label-normal)', letterSpacing: '-0.03em', display: 'block' }}
        >
          이달의 신고가
        </Typography>
        <Typography
          variant="caption2"
          sx={{ color: 'var(--semantic-label-assistive)', display: 'block' }}
        >
          {getDataCaption()}
        </Typography>
      </FlexBox>

      {isLoading ? (
        <RecordHighSkeleton />
      ) : recordHighs.length === 0 ? (
        <Box
          sx={{
            padding: '28px 16px',
            textAlign: 'center',
            backgroundColor: 'var(--semantic-background-normal-normal)',
            borderRadius: '16px',
            border: '1px solid var(--semantic-line-normal)',
          }}
        >
          <Typography variant="body2" weight="medium" sx={{ color: 'var(--semantic-label-assistive)' }}>
            이달 신고가 데이터를 불러오는 중이에요
          </Typography>
        </Box>
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
          {recordHighs.map((apt, i) => (
            <RecordHighCard
              key={`${apt.aptName}-${apt.dealDate}`}
              rank={i + 1}
              apt={apt}
              isLast={i === recordHighs.length - 1}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
