// HOT 단지 이유 태그 컴포넌트
interface HotTagProps {
  tag: string;
}

// 태그별 색상 스타일 정의
const TAG_STYLES: Record<string, string> = {
  '거래 급증': 'bg-[#FFF3E0] text-[#E65100] border border-[#FFB74D]/30',
  '최고가 경신': 'bg-[#FFEBEE] text-[#C62828] border border-[#EF9A9A]/30',
  '관심 급증': 'bg-[#F3E5F5] text-[#7B1FA2] border border-[#CE93D8]/30',
  '청약 임박': 'bg-[#E3F2FD] text-[#1565C0] border border-[#90CAF9]/30',
};

export default function HotTag({ tag }: HotTagProps) {
  const style =
    TAG_STYLES[tag] ?? 'bg-[#F5F6F8] text-[#4E5968] border border-[#E5E8EB]';
  return (
    <span
      className={`inline-flex items-center h-[22px] px-2 text-[11px] font-semibold rounded-[4px] ${style}`}
    >
      {tag}
    </span>
  );
}
