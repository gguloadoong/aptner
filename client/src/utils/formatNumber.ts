/**
 * 숫자 포맷 유틸리티
 * 한국식 금액 표기 (억/만원 단위)
 */

// 만원 단위 금액을 한국식으로 포맷 (예: 150000 -> "15억")
export function formatPrice(manwon: number): string {
  if (manwon <= 0) return '정보없음';

  const eok = Math.floor(manwon / 10000);
  const rest = manwon % 10000;

  if (eok > 0 && rest > 0) {
    return `${eok}억 ${rest.toLocaleString('ko-KR')}만`;
  } else if (eok > 0) {
    return `${eok}억`;
  } else {
    return `${rest.toLocaleString('ko-KR')}만`;
  }
}

// 만원 단위 금액을 억 단위 축약형으로 (예: 150000 -> "15억")
export function formatPriceShort(manwon: number): string {
  if (manwon <= 0) return '-';

  const eok = manwon / 10000;
  if (eok >= 1) {
    return `${eok % 1 === 0 ? eok : eok.toFixed(1)}억`;
  }
  return `${manwon.toLocaleString('ko-KR')}만`;
}

// 변동률 포맷 (예: 3.2 -> "+3.2%", -1.5 -> "-1.5%")
export function formatChange(rate: number): string {
  if (!isFinite(rate) || isNaN(rate)) return '0%';
  if (rate > 0) return `+${rate.toFixed(1)}%`;
  if (rate < 0) return `${rate.toFixed(1)}%`;
  return '0%';
}

// D-day 계산
export function calcDday(deadline: string): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0); // 시간 정규화 (날짜 단위 비교)
  const end = new Date(deadline);
  end.setHours(0, 0, 0, 0);
  const diff = Math.round((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diff < 0) return '마감';
  if (diff === 0) return 'D-day';
  return `D-${diff}`;
}

// 날짜 포맷 (YYYY-MM -> YYYY년 MM월)
export function formatYearMonth(ym: string): string {
  const [year, month] = ym.split('-');
  return `${year}년 ${parseInt(month)}월`;
}

// 세대수 포맷 (예: 1234 -> "1,234세대")
export function formatUnits(units: number): string {
  return `${units.toLocaleString('ko-KR')}세대`;
}

// 전용면적 ㎡ → 평 병기 변환 (1평 = 3.3058㎡)
// 예: "84" -> "84㎡ · 25평"
export function formatArea(areaStr: string): string {
  const sqm = parseFloat(areaStr);
  if (isNaN(sqm)) return `${areaStr}㎡`;
  const pyeong = Math.round(sqm / 3.3058);
  return `${areaStr}㎡ · ${pyeong}평`;
}

// 거래량 포맷
export function formatVolume(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K건`;
  return `${count}건`;
}
