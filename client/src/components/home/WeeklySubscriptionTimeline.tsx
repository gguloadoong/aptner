import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, FlexBox, Typography, Skeleton } from '@wanteddev/wds';
import type { Subscription } from '../../types';
import SubscriptionCard from '../subscription/SubscriptionCard';

interface WeeklySubscriptionTimelineProps {
  subscriptions: Subscription[];
  isLoading?: boolean;
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

// 이번 주 월~일 날짜 배열 반환 (Date 객체)
function getWeekDays(): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay(); // 0=일, 1=월, ..., 6=토
  // 월요일 기준 주 시작 (월=0 offset)
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

// YYYY-MM-DD 문자열 → Date (로컬 타임존 기준, KST 오차 방지)
function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Date → 'YYYY-MM-DD' 키 문자열 (KST 로컬 기준, toISOString() UTC 변환 금지)
function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function WeeklySubscriptionTimeline({
  subscriptions,
  isLoading = false,
}: WeeklySubscriptionTimelineProps) {
  const navigate = useNavigate();
  const weekDays = useMemo(() => getWeekDays(), []);
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string | null>(() => dateKey(today));

  // 날짜별 청약 맵 구성 (startDate~endDate 범위 내에 포함되는 청약)
  const subsByDate = useMemo(() => {
    const map = new Map<string, Subscription[]>();
    weekDays.forEach((day) => {
      const key = dateKey(day);
      const matched = subscriptions.filter((sub) => {
        if (sub.status === 'closed') return false;
        const start = parseDate(sub.startDate);
        const end = parseDate(sub.endDate);
        const d = new Date(key);
        d.setHours(0, 0, 0, 0);
        return d >= start && d <= end;
      });
      map.set(key, matched);
    });
    return map;
  }, [subscriptions, weekDays]);

  const selectedSubs = useMemo(() => {
    if (!selectedDate) return [];
    return subsByDate.get(selectedDate) ?? [];
  }, [selectedDate, subsByDate]);

  if (isLoading) {
    return (
      <Box sx={{ padding: '0 16px' }}>
        <Skeleton variant="rectangle" width="100%" height="80px" style={{ borderRadius: '12px' }} />
      </Box>
    );
  }

  // 오늘 날짜 키 기준 청약 건수 계산
  const todayKey = dateKey(today);
  const todaySubCount = subsByDate.get(todayKey)?.length ?? 0;

  return (
    <Box as="section" sx={{ padding: '0 16px' }}>
      {/* 섹션 헤더 */}
      <FlexBox alignItems="center" justifyContent="space-between" style={{ marginBottom: '8px' }}>
        <Typography
          variant="caption1"
          weight="bold"
          sx={{ color: 'var(--semantic-label-assistive)', letterSpacing: '0.02em' }}
        >
          이번 주 청약 일정
        </Typography>
        {todaySubCount > 0 && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 8px',
              borderRadius: '9999px',
              backgroundColor: 'var(--semantic-primary-normal)',
              color: 'white',
              fontSize: '11px',
              fontWeight: 700,
              lineHeight: 1.5,
              flexShrink: 0,
            }}
          >
            오늘 {todaySubCount}건
          </span>
        )}
      </FlexBox>

      {/* 타임라인 가로 스크롤 */}
      <Box
        sx={{
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: '4px',
        }}
        style={{
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        <FlexBox
          gap="4px"
          style={{ width: 'max-content', minWidth: '100%' }}
        >
          {weekDays.map((day) => {
            const key = dateKey(day);
            const isToday = dateKey(day) === dateKey(today);
            const isSelected = selectedDate === key;
            const subs = subsByDate.get(key) ?? [];
            const hasOngoing = subs.some((s) => s.status === 'ongoing');
            const hasSub = subs.length > 0;
            const dayIdx = day.getDay(); // 0=일, 6=토

            return (
              <button
                key={key}
                onClick={() => setSelectedDate(isSelected ? null : key)}
                style={{
                  scrollSnapAlign: 'start',
                  width: '48px',
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 4px',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  backgroundColor: isSelected
                    ? 'rgba(27,100,218,0.08)'
                    : 'transparent',
                  transition: 'background-color 120ms ease',
                }}
                aria-label={`${day.getMonth() + 1}월 ${day.getDate()}일 청약 ${subs.length}건`}
                aria-pressed={isSelected}
              >
                {/* 날짜 숫자 */}
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isToday ? '#1B64DA' : 'transparent',
                    flexShrink: 0,
                  }}
                >
                  <Typography
                    variant="body2"
                    weight={isToday || isSelected ? 'bold' : 'regular'}
                    sx={{
                      color: isToday
                        ? 'white'
                        : dayIdx === 0
                          ? '#FF4B4B'
                          : dayIdx === 6
                            ? '#1B64DA'
                            : isSelected
                              ? '#1B64DA'
                              : 'var(--semantic-label-normal)',
                      lineHeight: 1,
                    }}
                  >
                    {day.getDate()}
                  </Typography>
                </div>

                {/* 요일 */}
                <Typography
                  variant="caption2"
                  sx={{
                    color: isToday
                      ? '#1B64DA'
                      : dayIdx === 0
                        ? '#FF4B4B'
                        : dayIdx === 6
                          ? '#1B64DA'
                          : 'var(--semantic-label-assistive)',
                    lineHeight: 1,
                  }}
                >
                  {DAY_LABELS[dayIdx]}
                </Typography>

                {/* 청약 dot */}
                {hasSub ? (
                  <div
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: hasOngoing ? '#1B64DA' : '#F59E0B',
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div style={{ width: '6px', height: '6px', flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </FlexBox>
      </Box>

      {/* 선택된 날짜의 청약 카드 */}
      {selectedDate && selectedSubs.length > 0 && (
        <Box sx={{ marginTop: '12px' }}>
          <FlexBox flexDirection="column" gap="8px">
            {selectedSubs.slice(0, 3).map((sub) => (
              <SubscriptionCard key={sub.id} subscription={sub} />
            ))}
          </FlexBox>
          {selectedSubs.length > 3 && (
            <Typography
              variant="caption1"
              sx={{ color: 'var(--semantic-label-assistive)', display: 'block', marginTop: '8px', textAlign: 'center' }}
            >
              외 {selectedSubs.length - 3}건 더 있음
            </Typography>
          )}
          <button
            onClick={() => navigate('/subscription')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              width: '100%',
              marginTop: '8px',
              padding: '4px 0',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              gap: '2px',
            }}
          >
            <Typography
              variant="caption1"
              sx={{ color: 'var(--semantic-label-assistive)' }}
            >
              자세히 보기
            </Typography>
            <Typography
              variant="caption1"
              sx={{ color: 'var(--semantic-label-assistive)' }}
            >
              &gt;
            </Typography>
          </button>
        </Box>
      )}

      {selectedDate && selectedSubs.length === 0 && (
        <Box sx={{ marginTop: '8px', padding: '12px', textAlign: 'center' }}>
          <Typography variant="caption1" sx={{ color: 'var(--semantic-label-assistive)' }}>
            해당 날짜에 청약 일정이 없습니다
          </Typography>
        </Box>
      )}
    </Box>
  );
}
