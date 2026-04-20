import React from 'react';

interface DdayBadgeProps {
  dDay: number; // 양수 = 남은 일수, 0 = D-Day, 음수 = 마감
}

// D-day 배지 컴포넌트 — 7단계 긴박도에 따라 색상 변화
const DdayBadge = React.memo<DdayBadgeProps>(({ dDay }) => {
  // 표시 텍스트 결정
  const label =
    dDay < 0
      ? '마감'
      : dDay === 0
        ? 'D-Day'
        : `D-${dDay}`;

  // 7단계 긴박도별 인라인 스타일 결정
  let style: React.CSSProperties;
  let pulseVisible = false;

  if (dDay < 0) {
    // 마감: 회색 + strikethrough
    style = {
      background: '#F5F6F8',
      color: '#8B95A1',
      border: '1px solid #D1D6DB',
      textDecoration: 'line-through',
    };
  } else if (dDay === 0) {
    // D-0: 빨간 텍스트 + 빨간 border
    style = {
      background: '#FFF0F0',
      color: '#FF4B4B',
      border: '1px solid #FF4B4B',
      fontWeight: 700,
    };
    pulseVisible = true;
  } else if (dDay <= 3) {
    // D-1~3: 빨간 텍스트 bold + 빨간 border
    style = {
      background: '#FFF5F5',
      color: '#FF4B4B',
      border: '1px solid #FF4B4B',
      fontWeight: 700,
    };
    pulseVisible = true;
  } else if (dDay <= 7) {
    // D-4~7: 오렌지 + 오렌지 border
    style = {
      background: '#FFF7ED',
      color: '#F97316',
      border: '1px solid #F97316',
    };
  } else if (dDay <= 14) {
    // D-8~14: 노랑 + 노랑 border
    style = {
      background: '#FEFCE8',
      color: '#EAB308',
      border: '1px solid #EAB308',
    };
  } else if (dDay <= 30) {
    // D-15~30: 파랑 + 파랑 border
    style = {
      background: '#EFF6FF',
      color: '#1B64DA',
      border: '1px solid #1B64DA',
    };
  } else {
    // D-31+: 회색 + 회색 border
    style = {
      background: '#F5F6F8',
      color: '#8B95A1',
      border: '1px solid #D1D6DB',
    };
  }

  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    height: '26px',
    borderRadius: '6px',
    padding: '0 7px',
    fontSize: '12px',
    fontFamily: 'monospace',
    fontWeight: style.fontWeight ?? 600,
    textDecoration: style.textDecoration,
    background: style.background as string,
    color: style.color as string,
    border: style.border as string,
  };

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0, whiteSpace: 'nowrap' }}>
      {/* D-3 이내: pulse dot */}
      {pulseVisible && (
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF4B4B', flexShrink: 0, animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }} />
      )}
      <span style={containerStyle}>{label}</span>
    </span>
  );
});

DdayBadge.displayName = 'DdayBadge';
export default DdayBadge;
