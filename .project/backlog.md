# 봄집 백로그

> 소유자: 김재훈 (PM)
> 마지막 업데이트: 2026-03-19 (% 문제 + 홈 사용자 여정 설계 토론 — % 뱃지 제거, 섹션 CTA 목적지 확정, API 키 에스컬레이션)

---

## Critical (즉시 수정)

| ID | 이슈 | 상태 | 담당 |
|----|------|------|------|
| CRIT-01 | FE↔BE Subscription 타입 완전 불일치 | ✅ 완료 | 민준+서연 |
| CRIT-03 | SubscriptionCard 존재하지 않는 필드 참조 | ✅ 완료 (CRIT-01 해결) | - |

---

## Major (출시 전 수정)

| ID | 이슈 | 상태 | 담당 |
|----|------|------|------|
| MAJOR-04 | 정렬 파라미터 BE 미지원 | ✅ 완료 | 서연(BE) |
| MAJOR-05 | 지역 필터 파라미터 BE-FE 불일치 | ✅ 완료 (이미 한글 처리 중) | - |
| MAJOR-06 | 히스토리 API area 파라미터 타입 불일치 | ✅ 완료 | 민준(FE) |
| MAJOR-07 | PriceChart date vs dealDate 필드명 불일치 | ✅ 완료 | 민준(FE) |
| MAJOR-08 | CORS null origin 프로덕션 차단 필요 | ✅ 완료 | 서연(BE) |
| MAJOR-NEW-01 | FE 어댑터 totalUnits 대신 totalSupply 참조 | ✅ 완료 (실 API 확인 — 동일 값) | - |
| MAJOR-NEW-02 | Mock supplyPrice * 10000 버그 (만원→원 잘못 변환) | ✅ 완료 (2026-03-19) | 서연(BE) |

---

## Minor (다음 스프린트)

| ID | 이슈 | 상태 | 담당 |
|----|------|------|------|
| MINOR-01 | TrendPage 날짜 하드코딩 | ✅ 완료 (new Date() 동적 처리 확인) | - |
| MINOR-02 | 지도 마커 innerHTML 사용 → textContent 교체 | ✅ 완료 (DOM API 이미 적용) | - |
| MINOR-03 | HotApartments region 파라미터 코드/문자열 불일치 | ✅ 완료 (FE/BE 모두 문자열 region 사용 확인) | - |
| MINOR-04 | 청약 캐시 TTL 중 status/dDay 재계산 필요 | 유지 (10분 TTL 실용상 허용) | 서연 |
| MINOR-05 | geolocation 실패 시 alert → toast 교체 | ✅ 완료 (alert 사용 없음 확인) | - |
| MINOR-06 | ApartmentDetailPage useEffect 의존성 개선 | 미착수 | 민준 |
| MINOR-07 | Button isLoading 시 aria-busy 추가 | 미착수 | 민준 |

---

## 홈 v2 개편 태스크 (ADR-008)

> 킥오프: 2026-03-18 | 예상 공수: FE 5일 + BE 2일 + QA 1.5일
> 회의록: `.project/meeting-notes/2026-03-18-kickoff-home-v2.md`

### BE 태스크 — 이서연 (2일)

| ID | 태스크 | 우선순위 | 상태 | 산출물 |
|----|--------|---------|------|--------|
| HV2-BE-01 | subscription.routes.ts에 month 파라미터 파싱/검증 추가 | P0 | ✅ 완료 | 코드 |
| HV2-BE-02 | subscription.service.ts에 월간 필터 로직 구현 | P0 | ✅ 완료 | 코드 |
| HV2-BE-03 | record-high.service.ts 신규 작성 (신고가 로직 + Mock) | P0 | ✅ 완료 | 코드 |
| HV2-BE-04 | apartment.routes.ts에 /record-highs 엔드포인트 추가 | P0 | ✅ 완료 | 코드 |
| HV2-BE-05 | BE types/index.ts에 RecordHighApartment 타입 추가 | P0 | ✅ 완료 | 코드 |

### FE 태스크 — 박민준 (5일)

| ID | 태스크 | 우선순위 | 상태 | 산출물 |
|----|--------|---------|------|--------|
| HV2-FE-01 | FE 타입 + 훅 + 서비스 레이어 작성 | P0 | ✅ 완료 | types, hooks, services |
| HV2-FE-02 | WeeklyTimeline 컴포넌트 (가로 스크롤 + dot + 카드 펼침) | P0 | ✅ 완료 | WeeklyTimeline.tsx |
| HV2-FE-03 | RecordHighSection 컴포넌트 (카드 리스트 + 상승률) | P0 | ✅ 완료 | RecordHighSection.tsx |
| HV2-FE-04 | HomePage.tsx 레이아웃 재배치 (섹션 순서 변경) | P0 | ✅ 완료 | HomePage.tsx |
| HV2-FE-05 | SubscriptionCalendarPage 구현 (월간 그리드 + 날짜 선택) | P1 | 미착수 | SubscriptionCalendarPage.tsx |
| HV2-FE-06 | 라우팅 추가 + SubscriptionPage 캘린더 토글 | P1 | 미착수 | App.tsx, SubscriptionPage.tsx |

---

## 다음 스프린트 후보 (P1)

| ID | 기능 | 우선순위 | 담당 | 메모 |
|----|------|---------|------|------|
| NEXT-01 | 청약 캘린더 전용 페이지 | P1 | 민준(FE) | HV2-FE-05/06 |
| NEXT-02 | 관심 단지 거래/신고가 알림 (PWA 푸시 또는 인앱) | P1 | 재훈+하늘 검토 후 | DB/인증 선행 필요 |
| NEXT-03 | 사용자 인증 + 북마크 서버 동기화 | P2 | 서연(BE) 주도 | 알림 기능 선행 요건 |
| HV2-FE-07 | 반응형 + 스켈레톤 + 빈 상태 처리 | P0 | 미착수 | 지수 스펙 선행 필수 |

### QA 태스크 — 정동현 (1.5일)

| ID | 태스크 | 우선순위 | 상태 |
|----|--------|---------|------|
| HV2-QA-01 | Critical 시나리오 5건 전수 검증 | P0 | 미착수 |
| HV2-QA-02 | Major 시나리오 6건 검증 | P0 | 미착수 |
| HV2-QA-03 | 엣지 케이스 4건 검증 | P1 | 미착수 |
| HV2-QA-04 | 모바일 375px + PC 1280px 교차 검증 | P0 | 미착수 |

---

## 홈 개편 v3 태스크 (2026-03-19 킥오프)

> 킥오프: 2026-03-19 | 회의록: `.project/meeting-notes/2026-03-19-홈-개편-킥오프.md`
> 배경: 트렌드 탭 폐기, BottomNav 4탭 축소, 홈 first fold 개선

### Designer 태스크 — 최지수 (선행 필수)

| ID | 태스크 | 우선순위 | 상태 | 비고 |
|----|--------|---------|------|------|
| HOME-05 | 마켓 요약 배너 + 전 섹션 스켈레톤/빈 상태 스펙 작성 | P0 | 미착수 | FE 착수 전 완료 필수 |

### FE 태스크 — 박민준

| ID | 태스크 | 우선순위 | 상태 | 비고 |
|----|--------|---------|------|------|
| HOME-01 | QuickActionTabs 컴포넌트 제거 | P0 | 미착수 | BottomNav 중복 |
| HOME-02 | TodaySubscriptionBadge → WeeklySubscriptionTimeline 통합 | P0 | 미착수 | |
| HOME-03 | 마켓 요약 배너 컴포넌트 신규 작성 (72px, /trends/region 재활용) | P0 | 미착수 | HOME-05 완료 후 착수 |
| HOME-04 | 홈 섹션 순서 재구성 (순서: 마켓배너→신고가→타임라인→HOT→지도) | P0 | 미착수 | |
| HOME-06 | 스켈레톤/빈 상태 구현 (HV2-FE-07 포함) | P0 | 미착수 | HOME-05 완료 후 착수 |
| HOME-07 | TrendPage 제거, `/trend` → `/hot` 301 리다이렉트 추가 | P1 | 미착수 | |
| HOME-08 | 입주 물량 예정 차트 → 청약 탭 이동 | P1 | 미착수 | HOME-07과 동시 진행 |
| HOME-09 | BottomNav 5탭 → 4탭 (트렌드 탭 제거) | P1 | 미착수 | HOME-07과 동시 진행 |

### BE 태스크 — 이서연

| ID | 태스크 | 우선순위 | 상태 | 비고 |
|----|--------|---------|------|------|
| HOME-10 | /trends/region API 파라미터 위치 기반 확장 가능 구조 명세 | P1 | 미착수 | api-spec.md 업데이트 |

### QA 태스크 — 정동현

| ID | 태스크 | 우선순위 | 상태 |
|----|--------|---------|------|
| HOME-11 | 홈 개편 전/후 회귀 시나리오 작성 및 검증 | P0 | 미착수 |

### 미합의 — 추가 논의 필요

| 항목 | 이견 | 담당 |
|------|------|------|
| BottomNav 4번째 탭 이름: "핫" vs "트렌드" | 하늘(트렌드 유지), 재훈(이름은 별도 논의) | 재훈+하늘 다음 주 결정 |
| Intersection Observer lazy load 적용 여부 | 공수 반나절 + QA 시나리오 3건 추가 | 스프린트 계획 시 결정 |
| HotSection 섹션 표현 | "이번 달 거래 활발" vs "HOT 아파트" | A/B 테스트 설계 검토 (재훈+하늘) |

---

## 홈 콘텐츠 구성 신규 태스크 (2026-03-19 회의)

> 회의록: `.project/meeting-notes/2026-03-19-홈-콘텐츠-구성.md`

### Designer 태스크 — 최지수

| ID | 태스크 | 우선순위 | 상태 | 비고 |
|----|--------|---------|------|------|
| HOME-12 | 신고가 섹션 기준월 텍스트 가시성 개선 스펙 (12px 이상, 색상 명도) | P0 | 미착수 | ADR-008 "기준월 반드시 표시" 준수 |
| HOME-14 | 홈 검색 진입점 강화 스펙 작성 | P1 | 미착수 | 민준(FE) 착수 전 완료 필수 |

### FE 태스크 — 박민준

| ID | 태스크 | 우선순위 | 상태 | 비고 |
|----|--------|---------|------|------|
| HOME-13 | HotApartmentSection 섹션 라벨 거래 건수 기준 명시형으로 개선 | P1 | 미착수 | "관심 단지" 라벨 제거. 수도권 한정 표기 포함 |
| HOME-15 | 홈 검색 진입점 강화 구현 | P1 | 미착수 | HOME-14(지수 스펙) 완료 후 착수 |

### 지도 줌 레벨 필터 킥오프 사전 과제 — 다음 주

| ID | 태스크 | 담당 | 우선순위 | 상태 |
|----|--------|------|---------|------|
| MAP-KO-01 | 카카오맵 클러스터러 SDK 문서 검토 + 줌 레벨별 이벤트 처리 공수 추정 | 민준(FE) | 킥오프 사전 | 미착수 |
| MAP-KO-02 | 줌 레벨별 집계 API 구조 초안 (시도/시군구/단지 3단계) | 서연(BE) | 킥오프 사전 | 미착수 |
| MAP-KO-03 | 지도 줌 필터 PRD 요구사항 초안 (호갱노노 UX 벤치마킹 포함) | 재훈(PM) | 킥오프 사전 | 미착수 |
| MAP-KO-04 | 호갱노노 지도 UX 레퍼런스 캡처 + 봄집 차별화 포인트 정리 | 지수(Designer) | 킥오프 사전 | 미착수 |

---

## 미완성 기능 (PRD P1/P2)

| 기능 | 우선순위 | 상태 |
|------|---------|------|
| 핫 아파트 랭킹 페이지 | P1 | 진행 중 |
| 청약 상세 (분양가표, 경쟁률) | P1 | 미착수 |
| 청약 일정 캘린더 | P1 | 진행 예정 (HV2-FE-05) |
| 홈 v3: 마켓 요약 배너 | P0 | 진행 예정 (HOME-03) |
| 홈 v3: 섹션 순서 재구성 | P0 | 진행 예정 (HOME-04) |
| 홈 v3: QuickActionTabs 제거 | P0 | 진행 예정 (HOME-01) |
| TrendPage 폐기 + 리다이렉트 | P1 | 진행 예정 (HOME-07) |
| 지도 줌 레벨 필터 (호갱노노식 드릴다운) | P1 | 킥오프 준비 중 (MAP-KO-01~04) |
| 홈 검색 진입점 강화 | P1 | 미착수 (HOME-14→15) |
| 가격 변동 알림 (푸시) | P2 | 미착수 |
| 관심 단지 찜하기 | P2 | 미착수 |
| 학군 정보 | P2 | 미착수 |
| 부동산 뉴스 RSS 연동 | P2 | 미착수 (다음 분기 재검토. 저작권 리스크 검토 필요) |
| 외부 대출계산기 링크 (주택금융공사) | P2 | 미착수 (자체 구현 제외 결정 — 2026-03-19) |

---

---

## % 문제 + 홈 UX 여정 설계 태스크 (2026-03-19 토론)

> 회의록: `.project/meeting-notes/2026-03-19-홈UX여정-토론.md`
> 배경: 대표 피드백 — % 수치 비현실적, 사용자 여정 미설계

### P0 — 이번 주 즉시

| ID | 태스크 | 담당 | 상태 | 비고 |
|----|--------|------|------|------|
| UX-01 | 신고가 `priceChangeRate` % 뱃지 제거 → 절대 금액 차이(+X억) 표시로 교체 | 민준(FE) | 미착수 | UX-06과 동시 착수 |
| UX-02 | HOT `tradeSurgeRate` 뱃지 전면 제거 → `tradeCount` N건 표시로 교체 | 민준(FE) | 미착수 | `tradeSurgeRate > 0` 블록 제거 |
| UX-03 | RecordHighSection 카드 CTA 추가 → `/apartment/:aptCode` 라우팅 | 민준(FE) | 미착수 | aptCode 필드 존재 확인 완료 |
| UX-04 | WeeklySubscriptionTimeline 카드 CTA 추가 → `/subscriptions` 임시 라우팅 | 민준(FE) | 미착수 | 청약 상세 페이지 개발 후 목적지 교체 |
| UX-05 | 국토부 API 키 확보 에스컬레이션 | 재훈(PM) → 대표 | 미착수 | API 키 없으면 홈 실 데이터 섹션 1개(청약)뿐 |
| UX-06 | Mock `previousPrice` 필드 추가 (신고가 절대 금액 차이 계산용) | 서연(BE) | 미착수 | `RECORD_HIGH_MOCK` 데이터 업데이트 |

### P1 — 다음 주

| ID | 태스크 | 담당 | 상태 | 비고 |
|----|--------|------|------|------|
| UX-07 | BookmarkUpdateSection 카드 클릭 → `/apartment/:id` 이동 추가 | 민준(FE) | 미착수 | `trade.id` = `aptCode` 여부 타입 확인 선행 |
| UX-08 | 봄집 차별화 포인트 PRD 반영 + 로드맵 업데이트 | 재훈(PM) | 미착수 | "청약+실거래가 통합 여정, 처음 집 보는 30대 타겟" |
| UX-09 | 지도 배너 섹션 위치 재검토 (홈 상단 이동 여부 결정) | 재훈+지수 | 미착수 | 시나리오 A 여정 개선 관련 |

### 미결 — 추가 논의 필요

| 항목 | 이견 | 담당 |
|------|------|------|
| MarketSummaryBanner 전국/서울 탭 분리 | 공수 추정 필요 | 재훈+민준 |
| 청약 상세 페이지 `/subscriptions/:id` 착수 시점 | PRD P1이나 UX-04 CTA 목적지로 필요 | 재훈 우선순위 결정 |
| `/hot` 전용 페이지 완성도 (현재 HotApartmentSection 재사용) | 다음 스프린트 | 민준(FE) |

---

*원본: `QA_REPORT.md` + `PRD.md` P1/P2 섹션 + 킥오프 회의록 2026-03-18, 2026-03-19*
