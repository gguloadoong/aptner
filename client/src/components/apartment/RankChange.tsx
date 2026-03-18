// 순위 변동 표시 컴포넌트
interface RankChangeProps {
  change?: number;
  className?: string;
}

export default function RankChange({ change, className = '' }: RankChangeProps) {
  // 변동 없거나 undefined 시 대시 표시
  if (change === undefined || change === 0) {
    return (
      <span className={`text-[11px] text-[#8B95A1] font-medium ${className}`}>
        -
      </span>
    );
  }
  // 상승
  if (change > 0) {
    return (
      <span className={`text-[11px] text-[#E53E3E] font-bold ${className}`}>
        ▲{change}
      </span>
    );
  }
  // 하락
  return (
    <span className={`text-[11px] text-[#00C896] font-bold ${className}`}>
      ▼{Math.abs(change)}
    </span>
  );
}
