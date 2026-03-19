import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, FlexBox, Typography, Skeleton } from '@wanteddev/wds';
import { useRecentTrades } from '../../hooks/useApartment';
import { formatPriceShort } from '../../utils/formatNumber';
import type { RecentTrade } from '../../types';

type SortOrder = 'latest' | 'price';

const REGION_LABEL: Record<string, string> = {
  '11': '서울', '41': '경기', '28': '인천', '26': '부산',
  '27': '대구', '29': '광주', '30': '대전', '31': '울산', '36': '세종',
};

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
  const [sortOrder, setSortOrder] = useState<SortOrder>('latest');

  const handleNavigate = (aptNm: string, umdNm: string) => {
    navigate(`/map?search=${encodeURIComponent(aptNm + ' ' + umdNm)}`);
  };

  // 정렬 후 최대 5건만 홈에 표시
  const sortedTrades = [...trades].sort((a, b) => {
    if (sortOrder === 'price') return b.price - a.price;
    return b.dealDate.localeCompare(a.dealDate);
  });
  const displayTrades = sortedTrades.slice(0, 5);

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
              {REGION_LABEL[region] ?? region}
            </span>
          </FlexBox>
          <Typography
            variant="caption2"
            sx={{ color: 'var(--semantic-label-assistive)', display: 'block', marginTop: '2px' }}
          >
            국토부 실거래가 기준 (2~3주 지연)
          </Typography>
        </div>
        {/* 정렬 토글 */}
        <FlexBox alignItems="center" gap="0px" style={{ marginBottom: '2px' }}>
          {(['latest', 'price'] as SortOrder[]).map((order, idx) => {
            const isActive = sortOrder === order;
            const label = order === 'latest' ? '최신순' : '고가순';
            return (
              <button
                key={order}
                onClick={() => setSortOrder(order)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: isActive ? 700 : 400,
                  color: isActive
                    ? 'var(--semantic-label-normal)'
                    : 'var(--semantic-label-assistive)',
                  borderBottom: isActive
                    ? '2px solid var(--semantic-label-normal)'
                    : '2px solid transparent',
                  borderRight: idx === 0 ? '1px solid var(--semantic-line-normal)' : 'none',
                  lineHeight: '1.4',
                  transition: 'color 0.15s, border-bottom-color 0.15s',
                }}
              >
                {label}
              </button>
            );
          })}
        </FlexBox>
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
