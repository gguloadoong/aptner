import { Box, FlexBox, Typography, Skeleton } from '@wanteddev/wds';
import { useQuery } from '@tanstack/react-query';
import { formatPrice } from '../../utils/formatNumber';
import { getMarketSummary, MARKET_SUMMARY_QUERY_OPTIONS } from '../../services/trends.service';

export default function MarketSummaryBanner() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['trends', 'summary'],
    queryFn: getMarketSummary,
    ...MARKET_SUMMARY_QUERY_OPTIONS,
  });

  // API 오류 시 배너 자체를 숨김 (데이터 없는 상태 노출 방지)
  if (isError) {
    return null;
  }

  // BE priceChange → FE priceChangeRate 로 매핑
  const priceChangeRate = data?.priceChange ?? 0;

  const changeColor =
    priceChangeRate > 0
      ? '#FF4B4B'
      : priceChangeRate < 0
        ? '#00C896'
        : 'var(--semantic-label-normal)';

  const changeSign = priceChangeRate > 0 ? '+' : '';

  return (
    <Box
      as="section"
      sx={{
        padding: '0 16px',
      }}
    >
      <Box
        sx={{
          backgroundColor: 'var(--semantic-background-normal-normal)',
          border: '1px solid var(--semantic-line-normal)',
          borderRadius: '12px',
          padding: '16px 20px',
        }}
      >
        <FlexBox alignItems="center" justifyContent="space-around">
          {/* 전국 평균 */}
          <StatItem label="전국 평균">
            {isLoading ? (
              <Skeleton variant="rectangle" width="60px" height="20px" style={{ borderRadius: '4px' }} />
            ) : (
              <Typography
                variant="body2"
                weight="bold"
                sx={{
                  color: 'var(--semantic-label-normal)',
                  fontFamily: 'var(--font-jetbrains, monospace)',
                  display: 'block',
                }}
              >
                {formatPrice(data?.avgPrice ?? 0)}
              </Typography>
            )}
          </StatItem>

          <Divider />

          {/* 전월 대비 */}
          <StatItem label="전월 대비">
            {isLoading ? (
              <Skeleton variant="rectangle" width="60px" height="20px" style={{ borderRadius: '4px' }} />
            ) : (
              <Typography
                variant="body2"
                weight="bold"
                sx={{
                  color: changeColor,
                  fontFamily: 'var(--font-jetbrains, monospace)',
                  display: 'block',
                }}
              >
                {changeSign}{priceChangeRate.toFixed(1)}%
              </Typography>
            )}
          </StatItem>

          <Divider />

          {/* 이번 달 거래 */}
          <StatItem label="이번 달 거래">
            {isLoading ? (
              <Skeleton variant="rectangle" width="60px" height="20px" style={{ borderRadius: '4px' }} />
            ) : (
              <Typography
                variant="body2"
                weight="bold"
                sx={{
                  color: 'var(--semantic-label-normal)',
                  fontFamily: 'var(--font-jetbrains, monospace)',
                  display: 'block',
                }}
              >
                {(data?.tradeCount ?? 0).toLocaleString('ko-KR')}건
              </Typography>
            )}
          </StatItem>
        </FlexBox>

        {/* scope 필드가 있을 때만 기준 지역 캡션 표시 */}
        {!isLoading && data?.scope && (
          <Typography
            variant="caption2"
            sx={{
              color: 'var(--semantic-label-assistive)',
              display: 'block',
              textAlign: 'center',
              marginTop: '10px',
            }}
          >
            {data.scope} 기준
          </Typography>
        )}
      </Box>
    </Box>
  );
}

function StatItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ textAlign: 'center' }}>
      <Typography
        variant="caption2"
        sx={{
          color: 'var(--semantic-label-assistive)',
          display: 'block',
          marginBottom: '4px',
        }}
      >
        {label}
      </Typography>
      {children}
    </div>
  );
}

function Divider() {
  return (
    <div
      style={{
        width: '1px',
        height: '32px',
        backgroundColor: 'var(--semantic-line-normal)',
        flexShrink: 0,
      }}
    />
  );
}
