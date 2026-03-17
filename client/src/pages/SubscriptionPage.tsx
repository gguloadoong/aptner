import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscriptions } from '../hooks/useSubscription';
import SubscriptionCard from '../components/subscription/SubscriptionCard';
import { CardSkeleton } from '../components/ui/LoadingSpinner';
// BottomNav는 AppLayout에서 통합 처리됨
import {
  Tab, TabList, TabListItem, Chip, Button,
  Box, FlexBox, Typography, TopNavigation, TopNavigationButton,
} from '@wanteddev/wds';
import { useIsPC } from '../hooks/useBreakpoint';
import { IconChevronLeft } from '@wanteddev/wds-icon';
import type { SubscriptionStatus, SortOrder } from '../types';

const REGIONS = ['전국', '서울', '경기', '인천', '부산', '대구', '대전', '광주'];

const STATUS_TABS: { value: SubscriptionStatus; label: string }[] = [
  { value: 'ongoing', label: '진행중' },
  { value: 'upcoming', label: '예정' },
  { value: 'closed', label: '마감' },
];

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: 'deadline', label: '마감임박순' },
  { value: 'price', label: '분양가순' },
  { value: 'latest', label: '최신순' },
];

// 청약 페이지 — WDS 컴포넌트 전면 적용
export default function SubscriptionPage() {
  const navigate = useNavigate();
  const isMobile = !useIsPC();
  const [status, setStatus] = useState<SubscriptionStatus>('ongoing');
  const [region, setRegion] = useState('전국');
  const [sort, setSort] = useState<SortOrder>('deadline');

  const { data, isLoading, isError } = useSubscriptions({ status, region, sort });
  const subscriptions = data?.data ?? [];

  return (
    <div style={{ minHeight: '100svh', backgroundColor: 'var(--semantic-background-normal-alternative)' }}>

      {/* 헤더 */}
      {isMobile ? (
        <TopNavigation
          leadingContent={
            <TopNavigationButton onClick={() => navigate(-1)}>
              <IconChevronLeft />
            </TopNavigationButton>
          }
        >
          청약 정보
        </TopNavigation>
      ) : (
        <Box
          as="header"
          sx={{
            backgroundColor: 'var(--semantic-background-normal-normal)',
            borderBottom: '1px solid var(--semantic-line-normal)',
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}
        >
          <Box sx={{ maxWidth: '1280px', margin: '0 auto', padding: '16px 32px' }}>
            <FlexBox alignItems="center" justifyContent="space-between" style={{ marginBottom: '12px' }}>
              <div>
                <Typography variant="body1" weight="bold" sx={{ color: 'var(--semantic-label-normal)', display: 'block' }}>
                  청약 정보
                </Typography>
                <Typography variant="caption1" sx={{ color: 'var(--semantic-label-assistive)', marginTop: '2px', display: 'block' }}>
                  청약홈 공식 데이터 기준
                </Typography>
              </div>
            </FlexBox>

            {/* 상태 탭 — WDS Tab */}
            <Tab value={status} onValueChange={(v) => setStatus(v as SubscriptionStatus)}>
              <TabList size="medium">
                {STATUS_TABS.map((tab) => (
                  <TabListItem key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabListItem>
                ))}
              </TabList>
            </Tab>
          </Box>
        </Box>
      )}

      {/* 모바일: 탭을 헤더 아래 별도 배치 */}
      {isMobile && (
        <Box
          sx={{
            backgroundColor: 'var(--semantic-background-normal-normal)',
            borderBottom: '1px solid var(--semantic-line-normal)',
            position: 'sticky',
            top: '56px',
            zIndex: 29,
          }}
        >
          <Box sx={{ padding: '0 20px' }}>
            <Tab value={status} onValueChange={(v) => setStatus(v as SubscriptionStatus)}>
              <TabList size="medium">
                {STATUS_TABS.map((tab) => (
                  <TabListItem key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabListItem>
                ))}
              </TabList>
            </Tab>
          </Box>
        </Box>
      )}

      {/* 필터 바 */}
      <Box
        sx={{
          backgroundColor: 'var(--semantic-background-normal-normal)',
          borderBottom: '1px solid var(--semantic-line-normal)',
        }}
      >
        <Box sx={{ maxWidth: '1280px', margin: '0 auto', padding: '12px 20px' }}>
          <FlexBox alignItems="center" gap="12px">
            {/* 지역 필터 — WDS Chip */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                flex: 1,
                scrollbarWidth: 'none',
              } as React.CSSProperties}
            >
              {REGIONS.map((r) => (
                <Chip
                  key={r}
                  size="small"
                  variant="outlined"
                  active={region === r}
                  onClick={() => setRegion(r)}
                  style={{ flexShrink: 0 }}
                >
                  {r}
                </Chip>
              ))}
            </div>

            {/* 정렬 선택 */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOrder)}
              style={{
                flexShrink: 0,
                fontSize: '12px',
                color: 'var(--semantic-label-alternative)',
                border: '1px solid var(--semantic-line-normal)',
                borderRadius: '8px',
                padding: '6px 10px',
                backgroundColor: 'var(--semantic-background-normal-normal)',
                outline: 'none',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FlexBox>
        </Box>
      </Box>

      {/* 청약 목록 */}
      <Box
        as="main"
        sx={{ paddingTop: '16px', paddingBottom: isMobile ? '112px' : '40px' }}
      >
        <Box sx={{ maxWidth: '1280px', margin: '0 auto', padding: '0 20px' }}>
          {/* 건수 표시 */}
          {!isLoading && (
            <Typography
              variant="caption1"
              weight="medium"
              sx={{ color: 'var(--semantic-label-assistive)', display: 'block', marginBottom: '12px' }}
            >
              총 {data?.total ?? 0}건
            </Typography>
          )}

          {isLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
              {[1, 2, 3, 4].map((i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <ErrorState />
          ) : subscriptions.length === 0 ? (
            <EmptyState status={status} />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
              {subscriptions.map((sub) => (
                <SubscriptionCard key={sub.id} subscription={sub} />
              ))}
            </div>
          )}
        </Box>
      </Box>

    </div>
  );
}

// 빈 상태
function EmptyState({ status }: { status: SubscriptionStatus }) {
  const messages = {
    ongoing: '현재 진행 중인 청약이 없습니다',
    upcoming: '예정된 청약이 없습니다',
    closed: '마감된 청약이 없습니다',
  };

  return (
    <FlexBox flexDirection="column" alignItems="center" justifyContent="center" gap="12px" style={{ padding: '64px 0' }}>
      <Box
        sx={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'var(--semantic-background-normal-alternative)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="28" height="28" fill="none" stroke="var(--semantic-line-normal)" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </Box>
      <Typography variant="body2" weight="medium" sx={{ color: 'var(--semantic-label-assistive)', textAlign: 'center' }}>
        {messages[status]}
      </Typography>
    </FlexBox>
  );
}

// 에러 상태
function ErrorState() {
  return (
    <FlexBox flexDirection="column" alignItems="center" justifyContent="center" gap="16px" style={{ padding: '64px 0' }}>
      <Box
        sx={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#FFF3F3',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="28" height="28" fill="none" stroke="#FF4B4B" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
        </svg>
      </Box>
      <Typography variant="body2" weight="medium" sx={{ color: 'var(--semantic-label-assistive)' }}>
        데이터를 불러오는데 실패했습니다
      </Typography>
      <Button variant="outlined" color="primary" size="small" onClick={() => window.location.reload()}>
        다시 시도
      </Button>
    </FlexBox>
  );
}
