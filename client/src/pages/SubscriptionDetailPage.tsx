import { useNavigate, useParams } from 'react-router-dom';
import { useSubscriptionDetail } from '../hooks/useSubscription';
import SubscriptionBadge from '../components/subscription/SubscriptionBadge';
import { Loading, Box, FlexBox, Typography, Grid, GridItem, TopNavigation, TopNavigationButton } from '@wanteddev/wds';
import { IconChevronLeft } from '@wanteddev/wds-icon';
import { formatPrice, calcDday, formatArea } from '../utils/formatNumber';
import type { SubscriptionSchedule } from '../types';

// 청약 상세 페이지
export default function SubscriptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: subscription, isLoading, isError } = useSubscriptionDetail(id);

  if (isLoading) {
    return (
      <FlexBox alignItems="center" justifyContent="center" style={{ minHeight: '100svh' }}>
        <Loading size="32px" />
      </FlexBox>
    );
  }

  if (isError || !subscription) {
    return (
      <FlexBox flexDirection="column" alignItems="center" justifyContent="center" gap="16px" style={{ minHeight: '100svh' }}>
        <Typography variant="body1" weight="medium" sx={{ color: '#FF4B4B' }}>
          청약 정보를 불러올 수 없습니다
        </Typography>
        <button
          onClick={() => navigate(-1)}
          style={{ color: 'var(--semantic-primary-normal)', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          돌아가기
        </button>
      </FlexBox>
    );
  }

  const dday = calcDday(subscription.deadline);
  const isDdayUrgent =
    dday !== '마감' && (dday === 'D-day' || parseInt(dday.replace('D-', '')) <= 3);

  const ddayColor = isDdayUrgent
    ? '#FF4B4B'
    : subscription.status === 'closed'
      ? 'var(--semantic-label-assistive)'
      : 'var(--semantic-label-normal)';

  return (
    <div style={{ minHeight: '100svh', backgroundColor: 'var(--semantic-background-normal-alternative)' }}>
      {/* 헤더 — WDS TopNavigation */}
      <TopNavigation
        leadingContent={
          <TopNavigationButton onClick={() => navigate(-1)} aria-label="뒤로가기">
            <IconChevronLeft />
          </TopNavigationButton>
        }
      >
        <Typography
          variant="body1"
          weight="bold"
          sx={{ color: 'var(--semantic-label-normal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {subscription.name}
        </Typography>
      </TopNavigation>

      <Box as="main" sx={{ paddingBottom: '32px' }}>

        {/* 기본 정보 섹션 */}
        <Box
          sx={{
            backgroundColor: 'var(--semantic-background-normal-normal)',
            padding: '20px',
            marginBottom: '12px',
          }}
        >
          <FlexBox alignItems="center" justifyContent="space-between" style={{ marginBottom: '12px' }}>
            <FlexBox alignItems="center" gap="8px">
              <SubscriptionBadge status={subscription.status} />
              {subscription.type === 'special' && (
                <span style={{ fontSize: '12px', padding: '2px 8px', backgroundColor: '#F3E5F5', color: '#7B1FA2', fontWeight: 600, borderRadius: '9999px' }}>
                  특별공급
                </span>
              )}
            </FlexBox>
            <Typography variant="heading2" weight="bold" sx={{ color: ddayColor }}>
              {dday}
            </Typography>
          </FlexBox>

          <Typography variant="title3" weight="bold" sx={{ color: 'var(--semantic-label-normal)', display: 'block', lineHeight: 1.3, marginBottom: '4px' }}>
            {subscription.name}
          </Typography>

          <FlexBox alignItems="center" justifyContent="space-between">
            <Typography variant="body2" sx={{ color: 'var(--semantic-label-assistive)' }}>
              {subscription.location}
            </Typography>
            {/* 지도 CTA */}
            <button
              onClick={() => {
                const searchQuery = encodeURIComponent(`${subscription.name} ${subscription.location}`);
                navigate(`/map?search=${searchQuery}`);
              }}
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--semantic-primary-normal)',
                border: '1px solid rgba(0,102,255,0.4)',
                borderRadius: '8px',
                padding: '6px 12px',
                cursor: 'pointer',
                background: 'none',
                flexShrink: 0,
                marginLeft: '8px',
                transition: 'background-color 150ms',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(0,102,255,0.05)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
            >
              지도에서 주변 시세 보기
            </button>
          </FlexBox>

          {/* 핵심 수치 */}
          <Grid spacing={4} style={{ marginTop: '20px' }}>
            <GridItem columns={6}>
              <Box sx={{ backgroundColor: 'var(--semantic-background-normal-alternative)', borderRadius: '12px', padding: '16px' }}>
                <Typography variant="caption1" sx={{ color: 'var(--semantic-label-assistive)', display: 'block', marginBottom: '4px' }}>
                  최저 분양가
                </Typography>
                <Typography variant="heading2" weight="bold" sx={{ color: 'var(--semantic-label-normal)' }}>
                  {formatPrice(subscription.startPrice)}
                </Typography>
              </Box>
            </GridItem>
            <GridItem columns={6}>
              <Box sx={{ backgroundColor: 'var(--semantic-background-normal-alternative)', borderRadius: '12px', padding: '16px' }}>
                <Typography variant="caption1" sx={{ color: 'var(--semantic-label-assistive)', display: 'block', marginBottom: '4px' }}>
                  최고 분양가
                </Typography>
                <Typography variant="heading2" weight="bold" sx={{ color: 'var(--semantic-label-normal)' }}>
                  {formatPrice(subscription.maxPrice)}
                </Typography>
              </Box>
            </GridItem>
          </Grid>
        </Box>

        {/* 청약 일정 */}
        <Box
          sx={{
            backgroundColor: 'var(--semantic-background-normal-normal)',
            padding: '20px',
            marginBottom: '12px',
          }}
        >
          <Typography variant="body1" weight="bold" sx={{ color: 'var(--semantic-label-normal)', display: 'block', marginBottom: '16px' }}>
            청약 일정
          </Typography>
          <SubscriptionTimeline
            startDate={subscription.startDate}
            deadline={subscription.deadline}
            schedule={subscription.schedule}
          />
        </Box>

        {/* 면적별 분양가 */}
        <Box
          sx={{
            backgroundColor: 'var(--semantic-background-normal-normal)',
            padding: '20px',
            marginBottom: '12px',
          }}
        >
          <Typography variant="body1" weight="bold" sx={{ color: 'var(--semantic-label-normal)', display: 'block', marginBottom: '16px' }}>
            면적별 공급 현황
          </Typography>
          <FlexBox flexDirection="column" gap="12px">
            {subscription.areas.map((area) => (
              <Box
                key={area.area}
                sx={{
                  border: '1px solid var(--semantic-line-normal)',
                  borderRadius: '12px',
                  padding: '16px',
                }}
              >
                <FlexBox alignItems="center" justifyContent="space-between" style={{ marginBottom: '12px' }}>
                  <Typography variant="body1" weight="bold" sx={{ color: 'var(--semantic-label-normal)' }}>
                    {formatArea(area.area)}
                  </Typography>
                  <Typography variant="body2" weight="bold" sx={{ color: 'var(--semantic-primary-normal)' }}>
                    {formatPrice(area.price)}
                  </Typography>
                </FlexBox>

                <Grid spacing={4}>
                  <GridItem columns={4}>
                    <Typography variant="caption2" sx={{ color: 'var(--semantic-label-assistive)', display: 'block' }}>공급세대</Typography>
                    <Typography variant="caption1" weight="bold" sx={{ color: 'var(--semantic-label-normal)', display: 'block', marginTop: '2px' }}>{area.units}세대</Typography>
                  </GridItem>
                  <GridItem columns={4}>
                    <Typography variant="caption2" sx={{ color: 'var(--semantic-label-assistive)', display: 'block' }}>가점</Typography>
                    <Typography variant="caption1" weight="bold" sx={{ color: 'var(--semantic-label-normal)', display: 'block', marginTop: '2px' }}>{area.generalRatio}%</Typography>
                  </GridItem>
                  <GridItem columns={4}>
                    <Typography variant="caption2" sx={{ color: 'var(--semantic-label-assistive)', display: 'block' }}>추첨</Typography>
                    <Typography variant="caption1" weight="bold" sx={{ color: 'var(--semantic-label-normal)', display: 'block', marginTop: '2px' }}>{area.lotteryRatio}%</Typography>
                  </GridItem>
                </Grid>

                {/* 가점/추첨 비율 바 */}
                <div style={{ marginTop: '8px', height: '6px', backgroundColor: 'var(--semantic-line-normal)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${area.generalRatio}%`, backgroundColor: 'var(--semantic-primary-normal)', borderRadius: '9999px' }} />
                </div>
                <FlexBox justifyContent="space-between" style={{ marginTop: '2px' }}>
                  <Typography variant="caption2" sx={{ color: 'var(--semantic-primary-normal)' }}>가점 {area.generalRatio}%</Typography>
                  <Typography variant="caption2" sx={{ color: 'var(--semantic-label-assistive)' }}>추첨 {area.lotteryRatio}%</Typography>
                </FlexBox>
              </Box>
            ))}
          </FlexBox>
        </Box>

        {/* 총 공급 현황 */}
        <Box
          sx={{
            backgroundColor: 'var(--semantic-background-normal-normal)',
            padding: '20px',
          }}
        >
          <Typography variant="body1" weight="bold" sx={{ color: 'var(--semantic-label-normal)', display: 'block', marginBottom: '12px' }}>
            총 공급 현황
          </Typography>
          <Grid spacing={4}>
            <GridItem columns={6}>
              <Box sx={{ backgroundColor: 'var(--semantic-background-normal-alternative)', borderRadius: '12px', padding: '12px' }}>
                <Typography variant="caption1" sx={{ color: 'var(--semantic-label-assistive)', display: 'block' }}>총 공급세대</Typography>
                <Typography variant="heading2" weight="bold" sx={{ color: 'var(--semantic-label-normal)', display: 'block', marginTop: '4px' }}>
                  {subscription.supplyUnits.toLocaleString()}세대
                </Typography>
              </Box>
            </GridItem>
            <GridItem columns={6}>
              <Box sx={{ backgroundColor: 'var(--semantic-background-normal-alternative)', borderRadius: '12px', padding: '12px' }}>
                <Typography variant="caption1" sx={{ color: 'var(--semantic-label-assistive)', display: 'block' }}>면적 종류</Typography>
                <Typography variant="heading2" weight="bold" sx={{ color: 'var(--semantic-label-normal)', display: 'block', marginTop: '4px' }}>
                  {subscription.areas.length}가지
                </Typography>
              </Box>
            </GridItem>
          </Grid>
        </Box>
      </Box>
    </div>
  );
}

// 청약 일정 타임라인
function SubscriptionTimeline({
  startDate,
  deadline,
  schedule,
}: {
  startDate: string;
  deadline: string;
  schedule?: SubscriptionSchedule;
}) {
  const now = new Date();

  const contractDateLabel = schedule?.contractStartDate
    ? schedule.contractEndDate
      ? `${schedule.contractStartDate} ~ ${schedule.contractEndDate}`
      : schedule.contractStartDate
    : undefined;

  const steps: Array<{ label: string; date: string | undefined; done: boolean }> = [
    { label: '청약 시작', date: startDate, done: !!startDate && new Date(startDate) <= now },
    { label: '청약 마감', date: deadline, done: !!deadline && new Date(deadline) < now },
    { label: '당첨자 발표', date: schedule?.announceDate, done: !!schedule?.announceDate && new Date(schedule.announceDate) < now },
    { label: '계약 기간', date: contractDateLabel, done: !!schedule?.contractEndDate && new Date(schedule.contractEndDate) < now },
  ];

  return (
    <div style={{ position: 'relative' }}>
      {steps.map((step, index) => (
        <div key={step.label} style={{ display: 'flex', gap: '16px', paddingBottom: index < steps.length - 1 ? '24px' : '0' }}>
          {/* 타임라인 선 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                border: '2px solid',
                flexShrink: 0,
                zIndex: 1,
                backgroundColor: step.done ? 'var(--semantic-primary-normal)' : 'var(--semantic-background-normal-normal)',
                borderColor: step.done ? 'var(--semantic-primary-normal)' : 'var(--semantic-line-normal)',
              }}
            />
            {index < steps.length - 1 && (
              <div style={{ width: '2px', flex: 1, backgroundColor: 'var(--semantic-line-normal)', marginTop: '4px' }} />
            )}
          </div>

          {/* 내용 */}
          <div style={{ flex: 1, paddingBottom: '4px' }}>
            <Typography
              variant="body2"
              weight="medium"
              sx={{ color: step.done ? 'var(--semantic-primary-normal)' : 'var(--semantic-label-normal)', display: 'block' }}
            >
              {step.label}
            </Typography>
            <Typography variant="caption1" sx={{ color: 'var(--semantic-label-assistive)', display: 'block', marginTop: '2px' }}>
              {step.date ?? '일정 미정'}
            </Typography>
          </div>
        </div>
      ))}
    </div>
  );
}
