import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  FlexBox,
  Typography,
  TopNavigation,
  TopNavigationButton,
} from '@wanteddev/wds';
import { IconChevronLeft, IconChevronRight } from '@wanteddev/wds-icon';
import { useSubscriptions } from '../hooks/useSubscription';
import SubscriptionCard from '../components/subscription/SubscriptionCard';
import { CardSkeleton } from '../components/ui/LoadingSpinner';
import { useIsPC } from '../hooks/useBreakpoint';
import type { Subscription } from '../types';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

// YYYY-MM-DD → Date (KST 타임존 버그 방지, UTC 파싱 금지)
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Date → 'YYYY-MM-DD'
function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 해당 월의 모든 날짜 셀 배열 반환 (앞뒤 빈칸 포함, null = 빈 셀)
function getCalendarCells(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay(); // 0=일
  const totalDays = lastDay.getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(new Date(year, month, d));
  // 6행 맞추기 (최대 42칸)
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// 해당 날짜에 걸쳐있는 청약 필터 (startDate <= date <= endDate)
function filterByDate(subscriptions: Subscription[], date: Date): Subscription[] {
  const key = toDateKey(date);
  return subscriptions.filter((sub) => {
    if (!sub.startDate || !sub.endDate) return false;
    const start = parseLocalDate(sub.startDate);
    const end = parseLocalDate(sub.endDate);
    const target = parseLocalDate(key);
    return target >= start && target <= end;
  });
}

// 날짜별 dot 색상 결정
function getDotColor(subs: Subscription[]): string | null {
  if (subs.length === 0) return null;
  const hasOngoing = subs.some((s) => s.status === 'ongoing');
  return hasOngoing ? '#1B64DA' : '#F59E0B';
}

export default function SubscriptionCalendarPage() {
  const navigate = useNavigate();
  const isMobile = !useIsPC();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(() => toDateKey(today));

  // 이전달 / 다음달 이동
  function gotoPrevMonth() {
    if (currentMonth === 0) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDate(null);
  }

  function gotoNextMonth() {
    if (currentMonth === 11) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDate(null);
  }

  // 해당 월의 청약 데이터 — month 파라미터로 BE 필터링
  const { data, isLoading } = useSubscriptions({
    page: 1,
    pageSize: 100,
    month: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`,
  });

  const allSubscriptions: Subscription[] = data?.data ?? [];

  const cells = useMemo(
    () => getCalendarCells(currentYear, currentMonth),
    [currentYear, currentMonth],
  );

  // 날짜별 청약 맵 (셀 렌더링 최적화)
  const subsByDate = useMemo(() => {
    const map = new Map<string, Subscription[]>();
    cells.forEach((cell) => {
      if (!cell) return;
      map.set(toDateKey(cell), filterByDate(allSubscriptions, cell));
    });
    return map;
  }, [cells, allSubscriptions]);

  const selectedSubs = useMemo(() => {
    if (!selectedDate) return [];
    return subsByDate.get(selectedDate) ?? [];
  }, [selectedDate, subsByDate]);

  const todayKey = toDateKey(today);

  return (
    <div
      style={{
        minHeight: '100svh',
        backgroundColor: 'var(--semantic-background-normal-alternative)',
      }}
    >
      {/* 헤더 */}
      {isMobile ? (
        <TopNavigation
          leadingContent={
            <TopNavigationButton onClick={() => navigate(-1)}>
              <IconChevronLeft />
            </TopNavigationButton>
          }
        >
          청약 캘린더
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
            <Typography
              variant="body1"
              weight="bold"
              sx={{ color: 'var(--semantic-label-normal)', display: 'block' }}
            >
              청약 캘린더
            </Typography>
            <Typography
              variant="caption1"
              sx={{
                color: 'var(--semantic-label-assistive)',
                marginTop: '2px',
                display: 'block',
              }}
            >
              청약홈 공식 데이터 기준
            </Typography>
          </Box>
        </Box>
      )}

      <Box sx={{ maxWidth: '1280px', margin: '0 auto', padding: isMobile ? '16px 16px' : '24px 32px' }}>
        {/* 월 네비게이션 */}
        <FlexBox
          alignItems="center"
          justifyContent="space-between"
          style={{ marginBottom: '16px' }}
        >
          <button
            onClick={gotoPrevMonth}
            aria-label="이전 달"
            style={{
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--semantic-line-normal)',
              borderRadius: '8px',
              backgroundColor: 'var(--semantic-background-normal-normal)',
              cursor: 'pointer',
            }}
          >
            <IconChevronLeft />
          </button>

          <Typography
            variant="body1"
            weight="bold"
            sx={{ color: 'var(--semantic-label-normal)' }}
          >
            {currentYear}년 {currentMonth + 1}월
          </Typography>

          <button
            onClick={gotoNextMonth}
            aria-label="다음 달"
            style={{
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--semantic-line-normal)',
              borderRadius: '8px',
              backgroundColor: 'var(--semantic-background-normal-normal)',
              cursor: 'pointer',
            }}
          >
            <IconChevronRight />
          </button>
        </FlexBox>

        {/* 캘린더 */}
        <Box
          sx={{
            backgroundColor: 'var(--semantic-background-normal-normal)',
            borderRadius: '12px',
            border: '1px solid var(--semantic-line-normal)',
            overflow: 'hidden',
            marginBottom: '16px',
          }}
        >
          {/* 요일 헤더 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              borderBottom: '1px solid var(--semantic-line-normal)',
            }}
          >
            {DAY_LABELS.map((label, idx) => (
              <div
                key={label}
                style={{
                  padding: '10px 0',
                  textAlign: 'center',
                }}
              >
                <Typography
                  variant="caption2"
                  weight="medium"
                  sx={{
                    color:
                      idx === 0
                        ? '#FF4B4B'
                        : idx === 6
                          ? '#1B64DA'
                          : 'var(--semantic-label-assistive)',
                  }}
                >
                  {label}
                </Typography>
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          {isLoading ? (
            <div style={{ padding: '24px' }}>
              <CardSkeleton />
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
              }}
            >
              {cells.map((cell, idx) => {
                if (!cell) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      style={{
                        minHeight: '56px',
                        borderRight: (idx + 1) % 7 !== 0 ? '1px solid var(--semantic-line-normal)' : 'none',
                        borderBottom: idx < cells.length - 7 ? '1px solid var(--semantic-line-normal)' : 'none',
                        backgroundColor: 'var(--semantic-background-normal-alternative)',
                      }}
                    />
                  );
                }

                const key = toDateKey(cell);
                const isToday = key === todayKey;
                const isSelected = key === selectedDate;
                const subs = subsByDate.get(key) ?? [];
                const dotColor = getDotColor(subs);
                const dayIdx = cell.getDay(); // 0=일, 6=토
                const col = idx % 7;
                const row = Math.floor(idx / 7);
                const totalRows = Math.floor(cells.length / 7);

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDate(isSelected ? null : key)}
                    aria-label={`${cell.getMonth() + 1}월 ${cell.getDate()}일, 청약 ${subs.length}건`}
                    aria-pressed={isSelected}
                    style={{
                      minHeight: '56px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      paddingTop: '8px',
                      gap: '4px',
                      border: 'none',
                      borderRight: col < 6 ? '1px solid var(--semantic-line-normal)' : 'none',
                      borderBottom: row < totalRows - 1 ? '1px solid var(--semantic-line-normal)' : 'none',
                      cursor: 'pointer',
                      backgroundColor: isSelected
                        ? 'rgba(27,100,218,0.06)'
                        : 'transparent',
                      transition: 'background-color 120ms ease',
                    }}
                  >
                    {/* 날짜 숫자 */}
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isToday ? '#1B64DA' : 'transparent',
                        flexShrink: 0,
                      }}
                    >
                      <Typography
                        variant="caption1"
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
                        {cell.getDate()}
                      </Typography>
                    </div>

                    {/* 청약 dot */}
                    {dotColor ? (
                      <div
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: dotColor,
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div style={{ width: '6px', height: '6px', flexShrink: 0 }} />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </Box>

        {/* 범례 */}
        <FlexBox gap="16px" style={{ marginBottom: '20px' }}>
          <FlexBox alignItems="center" gap="6px">
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#1B64DA',
              }}
            />
            <Typography variant="caption2" sx={{ color: 'var(--semantic-label-assistive)' }}>
              진행중
            </Typography>
          </FlexBox>
          <FlexBox alignItems="center" gap="6px">
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#F59E0B',
              }}
            />
            <Typography variant="caption2" sx={{ color: 'var(--semantic-label-assistive)' }}>
              예정
            </Typography>
          </FlexBox>
        </FlexBox>

        {/* 선택된 날짜 청약 목록 */}
        {selectedDate && (
          <Box sx={{ marginBottom: isMobile ? '100px' : '40px' }}>
            {/* 선택 날짜 헤더 */}
            <Typography
              variant="body2"
              weight="bold"
              sx={{
                color: 'var(--semantic-label-normal)',
                display: 'block',
                marginBottom: '12px',
              }}
            >
              {(() => {
                const [, m, d] = selectedDate.split('-').map(Number);
                return `${m}월 ${d}일 청약 일정`;
              })()}
              {selectedSubs.length > 0 && (
                <Typography
                  variant="caption1"
                  sx={{
                    color: 'var(--semantic-label-assistive)',
                    marginLeft: '8px',
                  }}
                >
                  {selectedSubs.length}건
                </Typography>
              )}
            </Typography>

            {selectedSubs.length === 0 ? (
              <Box
                sx={{
                  backgroundColor: 'var(--semantic-background-normal-normal)',
                  borderRadius: '12px',
                  border: '1px solid var(--semantic-line-normal)',
                  padding: '32px 16px',
                  textAlign: 'center',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ color: 'var(--semantic-label-assistive)' }}
                >
                  해당 날짜에 청약 일정이 없습니다
                </Typography>
              </Box>
            ) : (
              <FlexBox flexDirection="column" gap="12px">
                {selectedSubs.slice(0, 5).map((sub) => (
                  <SubscriptionCard key={sub.id} subscription={sub} />
                ))}
                {selectedSubs.length > 5 && (
                  <Typography
                    variant="caption1"
                    sx={{
                      color: 'var(--semantic-label-assistive)',
                      display: 'block',
                      textAlign: 'center',
                      padding: '8px 0',
                    }}
                  >
                    외 {selectedSubs.length - 5}건 더 있습니다
                  </Typography>
                )}
              </FlexBox>
            )}
          </Box>
        )}
      </Box>
    </div>
  );
}
