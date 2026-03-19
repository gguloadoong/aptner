import { useNavigate } from 'react-router-dom';
import { Box, FlexBox, Typography, Skeleton } from '@wanteddev/wds';
import { useRecentTrades } from '../../hooks/useApartment';
import { formatPriceShort } from '../../utils/formatNumber';
import type { RecentTrade } from '../../types';

// m² → 평 환산 (1평 = 3.3058㎡)
function toPyeong(sqm: number): number {
  return Math.round(sqm / 3.3);
}

// YYYY-MM-DD → MM.DD
function formatDealDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  return `${parts[1]}.${parts[2]}`;
}

interface RecentTradeCardProps {
  trade: RecentTrade;
  isLast: boolean;
  onNavigate: (aptNm: string, umdNm: string) => void;
}

function RecentTradeCard({ trade, isLast, onNavigate }: RecentTradeCardProps) {
  return (
    <FlexBox
      alignItems="center"
      gap="12px"
      style={{
        padding: '14px 16px',
        borderBottom: isLast ? 'none' : '1px solid var(--semantic-background-normal-alternative)',
        cursor: 'pointer',
      }}
      onClick={() => onNavigate(trade.aptNm, trade.umdNm)}
    >
      {/* 단지명 + 위치 */}
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
          {trade.aptNm}
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
          {trade.umdNm} · {toPyeong(trade.area)}평형
        </Typography>
      </Box>

      {/* 거래가 + 거래일 */}
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
          {formatPriceShort(trade.price)}
        </Typography>
        <Typography
          variant="caption2"
          sx={{
            color: 'var(--semantic-label-assistive)',
            display: 'block',
            marginTop: '2px',
          }}
        >
          {formatDealDate(trade.dealDate)}
        </Typography>
      </Box>
    </FlexBox>
  );
}

function RecentTradesSkeleton() {
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
          <FlexBox flex="1" flexDirection="column" gap="6px">
            <Skeleton variant="text" width="50%" height="15px" />
            <Skeleton variant="text" width="35%" height="12px" />
          </FlexBox>
          <FlexBox flexDirection="column" alignItems="flex-end" gap="4px">
            <Skeleton variant="text" width="52px" height="15px" />
            <Skeleton variant="text" width="32px" height="12px" />
          </FlexBox>
        </FlexBox>
      ))}
    </Box>
  );
}

interface RecentTradesSectionProps {
  region?: string;
}

export default function RecentTradesSection({ region = '11' }: RecentTradesSectionProps) {
  const navigate = useNavigate();
  const { data: trades = [], isLoading } = useRecentTrades(region);

  const handleNavigate = (aptNm: string, umdNm: string) => {
    navigate(`/map?search=${encodeURIComponent(aptNm + ' ' + umdNm)}`);
  };

  // 최대 5건만 홈에 표시
  const displayTrades = trades.slice(0, 5);

  return (
    <Box as="section" sx={{ padding: '0 16px' }}>
      {/* 섹션 헤더 */}
      <FlexBox alignItems="flex-end" justifyContent="space-between" style={{ marginBottom: '12px' }}>
        <div>
          <FlexBox alignItems="center" gap="8px">
            <Typography
              variant="title3"
              weight="bold"
              sx={{ color: 'var(--semantic-label-normal)', letterSpacing: '-0.03em', display: 'block' }}
            >
              최근 실거래
            </Typography>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--semantic-primary-normal)',
                backgroundColor: 'var(--semantic-primary-lighten)',
                padding: '2px 8px',
                borderRadius: '9999px',
              }}
            >
              서울
            </span>
          </FlexBox>
          <Typography
            variant="caption2"
            sx={{ color: 'var(--semantic-label-assistive)', display: 'block', marginTop: '2px' }}
          >
            국토부 실거래가 기준 (2~3주 지연)
          </Typography>
        </div>
      </FlexBox>

      {isLoading ? (
        <RecentTradesSkeleton />
      ) : displayTrades.length === 0 ? (
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
            최근 실거래 데이터를 불러오는 중이에요
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
          {displayTrades.map((trade, i) => (
            <RecentTradeCard
              key={trade.id}
              trade={trade}
              isLast={i === displayTrades.length - 1}
              onNavigate={handleNavigate}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
