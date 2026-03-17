// HOT 단지 이유 태그 컴포넌트
interface HotTagProps {
  tag: string;
}

// 태그별 색상 스타일 정의 — WDS CSS 변수 없는 도메인 전용 색상
const TAG_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  '거래 급증':   { bg: '#FFF3E0', color: '#E65100', border: 'rgba(255,183,77,0.3)' },
  '최고가 경신': { bg: '#FFEBEE', color: '#C62828', border: 'rgba(239,154,154,0.3)' },
  '관심 급증':   { bg: '#F3E5F5', color: '#7B1FA2', border: 'rgba(206,147,216,0.3)' },
  '청약 임박':   { bg: '#E3F2FD', color: '#1565C0', border: 'rgba(144,202,249,0.3)' },
};

const DEFAULT_STYLE = {
  bg: 'var(--semantic-background-normal-alternative)',
  color: 'var(--semantic-label-alternative)',
  border: 'var(--semantic-line-normal)',
};

export default function HotTag({ tag }: HotTagProps) {
  const style = TAG_STYLES[tag] ?? DEFAULT_STYLE;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: '22px',
        padding: '0 8px',
        fontSize: '11px',
        fontWeight: 600,
        borderRadius: '4px',
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
      }}
    >
      {tag}
    </span>
  );
}
