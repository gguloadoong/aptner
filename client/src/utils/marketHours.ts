/**
 * 장 운영 시간 관련 유틸리티
 * 부동산 실거래가 API는 24시간 조회 가능하지만,
 * 청약 등 일부 공공 API는 운영 시간 제한이 있음
 */

// 한국 공공 API 운영 시간 체크 (평일 08:00 ~ 22:00)
export function isPublicApiAvailable(): boolean {
  const now = new Date();
  const koreaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const day = koreaTime.getDay(); // 0: 일요일, 6: 토요일
  const hour = koreaTime.getHours();

  // 주말 제외
  if (day === 0 || day === 6) return false;

  // 평일 08:00 ~ 22:00
  return hour >= 8 && hour < 22;
}

// 현재 한국 시간 반환
export function getKoreaTime(): Date {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
}

// 다음 API 갱신 시각까지 남은 시간 (분)
export function minutesUntilNextRefresh(intervalMinutes: number): number {
  const now = new Date();
  const elapsed = now.getMinutes() % intervalMinutes;
  return intervalMinutes - elapsed;
}
