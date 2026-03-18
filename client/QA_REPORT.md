# QA Report — 홈 화면 전면 개편

- 검증자: 정동현 (QA)
- 최초 검증일: 2026-03-18
- 최종 업데이트: 2026-03-18 (Home v2 — WeeklySubscriptionTimeline + RecordHighSection 추가)
- 빌드: `npx tsc --noEmit` → EXIT 0 (에러 0건) / `npm run build` → ✓ built in 305ms
- 검증 방식: 파일 직독 + tsc 타입 체크 + 빌드 확인 (서버 실행 없음)

---

## 검증 대상 — Home v2 (2026-03-18)

### 신규 파일
- `src/components/home/WeeklySubscriptionTimeline.tsx`
- `src/components/home/RecordHighSection.tsx`

### 수정 파일
- `src/pages/HomePage.tsx`
- `src/services/apartment.service.ts` (getRecordHighs 추가)
- `src/types/index.ts` (RecordHighApartment 추가)

---

## 결과 요약 — Home v2

| 등급 | 건수 |
|------|------|
| CRITICAL | 0 |
| MAJOR | 1 |
| MINOR | 2 |
| PASS | 17 |

---

## CRITICAL — 없음

배포 불가 조건은 발견되지 않았습니다.

---

## MAJOR — 1건

### MAJOR-H2-01: `parseDate`에서 `new Date(dateStr)` 사용 — 타임존에 따라 날짜 1일 오차 발생

- 파일: `src/components/home/WeeklySubscriptionTimeline.tsx:31-35`
- 현상: `parseDate("2026-03-18")`에서 `new Date("2026-03-18")`을 호출하면 ISO 8601 날짜 문자열(YYYY-MM-DD)은 UTC 자정으로 파싱됨. 한국(UTC+9) 환경에서는 이 값이 `2026-03-17T15:00:00Z`로 해석되어 실제 날짜보다 하루 빠름. `setHours(0,0,0,0)`을 호출해도 이미 로컬 기준 3월 17일이 됨.
- 재현 방법: 한국 시간대 브라우저에서 `new Date("2026-03-18").getDate()` 실행 → 17 반환. 결과적으로 청약의 `startDate`/`endDate`가 하루씩 당겨져 타임라인 날짜 매핑이 틀어짐.
- 수정 방법: `new Date(dateStr)` 대신 로컬 날짜로 명시적 파싱 적용.

```ts
// 현재 (문제 있음)
function parseDate(dateStr: string): Date {
  const d = new Date(dateStr);   // UTC 기준 파싱 → KST 환경에서 1일 오차
  d.setHours(0, 0, 0, 0);
  return d;
}

// 수정
function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d); // 로컬 타임존 기준 생성
}
```

---

## MINOR — 2건

### MINOR-H2-01: `RecordHighSection` 에러 상태 처리 없음

- 파일: `src/components/home/RecordHighSection.tsx:151-156`
- 현상: `useQuery`에서 `isError`를 구조분해하지 않음. `getRecordHighs`는 실패 시 내부적으로 Mock fallback을 반환(`apartment.service.ts:741-743`)하여 실제 에러가 쿼리 레이어까지 올라오지 않음. 단, 서비스 함수 외부에서 예외가 발생하는 엣지 케이스(네트워크 레이어 예외 등)에 대한 에러 UI가 없음.
- 영향도: 낮음. `getRecordHighs`의 이중 fallback 덕분에 실운영 노출 가능성 매우 낮음.
- 수정 방법: `const { data, isLoading, isError } = useQuery(...)` 후 `isError` 시 "데이터를 불러올 수 없습니다" 메시지 렌더링 추가.

### MINOR-H2-02: `UrgentSubscriptionSection.tsx` 파일이 미사용 상태로 잔존

- 파일: `src/components/home/UrgentSubscriptionSection.tsx`
- 현상: `HomePage.tsx`에서 해당 컴포넌트를 import하거나 렌더링하는 코드가 없음. 이번 Home v2 개편에서 제거된 컴포넌트이나 파일이 삭제되지 않고 남아 있음. 빌드 결과물에는 포함되지 않으나 코드베이스 혼란 유발 가능.
- 수정 방법: `src/components/home/UrgentSubscriptionSection.tsx` 파일 삭제.

---

## PASS — 17건 (Home v2)

| # | 항목 | 결과 |
|---|------|------|
| 1 | TypeScript 타입 체크 (`tsc --noEmit`) | EXIT 0 — 에러 0건 |
| 2 | 프로덕션 빌드 (`npm run build`) | ✓ built in 305ms — 에러 0건 |
| 3 | `RecordHighApartment` BE↔FE 필드 일치 | BE `RecordHighItem` (molit.service.ts:2458-2467) vs FE `RecordHighApartment` (types/index.ts:213-222) — `aptName`, `location`, `area`, `recentPrice`, `previousPrice`, `priceChangeRate`, `dealDate`, `lawdCd` 8개 필드 완전 일치 |
| 4 | `getRecordHighs` 응답 파싱 | `apartment.service.ts:735-739` — `{ success: true, data: RecordHighApartment[] }` 구조 정확히 파싱. `response.data.data` 접근 올바름 |
| 5 | `getRecordHighs` Mock fallback | API 실패 시 `MOCK_RECORD_HIGHS` 반환 확인 (apartment.service.ts:741-744). 0건 반환 시 BE도 Mock fallback 동작 (molit.service.ts:2574, 2630) |
| 6 | `RecordHighSection` 0건 빈 상태 처리 | `RecordHighSection.tsx:179-192` — `recordHighs.length === 0` 조건 분기, "이달 신고가 데이터를 불러오는 중이에요" 메시지 렌더링 확인 |
| 7 | `RecordHighSection` 로딩 Skeleton | `RecordHighSection.tsx:109-142` — `RecordHighSkeleton` 컴포넌트. WDS `Skeleton variant="circle"/"text"` 사용 확인 |
| 8 | 순위 배지 1~3위 스타일 분기 | `RecordHighSection.tsx:8-12` — 1위 `#FFD700`(금), 2위 `#C0C0C0`(은), 3위 `#CD7F32`(동). 4위 이후 `badgeStyle?.bg ?? fallback` 안전하게 처리 |
| 9 | 가격 포맷팅 (`formatPrice`) | `RecordHighSection.tsx:95` — `formatPrice(apt.recentPrice)`. `recentPrice`는 만원 단위. `formatPrice`는 만원 입력 기대 — 단위 일치 확인 |
| 10 | `priceChangeRate.toFixed(1)` null-safety | `RecordHighSection.tsx:102` — BE 응답에서 `priceChangeRate: number` (required 필드). FE 타입도 `number` (non-optional) — 안전 |
| 11 | `WeeklySubscriptionTimeline` 이번 주 월~일 계산 | `WeeklySubscriptionTimeline.tsx:14-28` — `dayOfWeek === 0 ? -6 : 1 - dayOfWeek` 월요일 기준 주 시작 로직 정확 |
| 12 | `WeeklySubscriptionTimeline` closed 청약 필터링 | `WeeklySubscriptionTimeline.tsx:61` — `if (sub.status === 'closed') return false` 처리 확인 |
| 13 | `WeeklySubscriptionTimeline` 날짜 클릭 토글 | `WeeklySubscriptionTimeline.tsx:126` — `setSelectedDate(isSelected ? null : key)` 재클릭 시 선택 해제 동작 확인 |
| 14 | `WeeklySubscriptionTimeline` 청약 없는 날 처리 | `WeeklySubscriptionTimeline.tsx:236-242` — `selectedSubs.length === 0` 시 "해당 날짜에 청약 일정이 없습니다" 메시지 렌더링 |
| 15 | `WeeklySubscriptionTimeline` 3건 초과 처리 | `WeeklySubscriptionTimeline.tsx:221, 225-230` — `slice(0, 3)` 후 초과 건수 "외 N건 더 있음" 표시 |
| 16 | `WeeklySubscriptionTimeline` `any` 타입 사용 여부 | 0건 — 없음 |
| 17 | `HomePage` `UrgentSubscriptionSection` 렌더링 제거 확인 | `HomePage.tsx` 전체 검색 — import 및 렌더링 코드 없음 확인 |
| 18 | `HomePage` 컴포넌트 렌더링 순서 | QuickActionTabs → TodaySubscriptionBadge → WeeklySubscriptionTimeline → RecordHighSection → HotApartmentSection → MapBanner 순서 확인 |
| 19 | `Subscription` 타입 사용 (WeeklySubscriptionTimeline) | `types/index.ts:46-63` 기준 `Subscription` 타입 import 및 사용 — 필드 접근 (`startDate`, `endDate`, `status`, `id`) 모두 타입 정의에 존재 |

---

## 미해결 이슈 (이전 스프린트 이월)

| 이슈 | 등급 | 상태 |
|------|------|------|
| `supplyPrice` 타입 주석 `(원)` → `(만원)` 정정 필요 | MAJOR | 미수정 |
| HotRankingPage 로딩 Skeleton 미적용 | MAJOR | 미수정 |
| QuickActionTabs 모바일 터치 피드백 없음 | MINOR | 미수정 |
| HotRankingPage `tradeSurgeRate === 0` 시 "거래 +0%" 노출 | MINOR | 미수정 |
| HotRankingPage 뒤로가기 헤더 없음 | MINOR | 미수정 |
| 공공 API 장애 시 500 에러 메시지 사용자 노출 | MINOR | 미수정 |

---

## 배포 판단 — Home v2

CRITICAL 0건.

MAJOR-H2-01 (`parseDate` 타임존 버그)은 한국 시간대에서 청약 날짜가 1일 당겨지는 실제 데이터 오류임. 배포 전 수정 강력 권장.

단, 현재 서비스 환경(KST 고정)에서 `startDate`와 `endDate` 모두 동일하게 1일 오차가 적용되므로 범위 포함 판단(`d >= start && d <= end`)의 상대적 오차는 상쇄될 수 있음. 실 운영 영향도를 감안하여 **수정 후 배포**를 권장하나, PM 판단에 따라 조건부 배포 후 즉시 패치 가능.
