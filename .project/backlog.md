# 봄집 백로그

> 소유자: 김재훈 (PM)
> 마지막 업데이트: 2026-03-19 (홈 v2 완료, MAJOR-NEW-02 수정, 알림 기능 P1 등록)

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
| HV2-FE-07 | 반응형 + 스켈레톤 + 빈 상태 처리 | P0 | 미착수 | 각 컴포넌트 |

### QA 태스크 — 정동현 (1.5일)

| ID | 태스크 | 우선순위 | 상태 |
|----|--------|---------|------|
| HV2-QA-01 | Critical 시나리오 5건 전수 검증 | P0 | 미착수 |
| HV2-QA-02 | Major 시나리오 6건 검증 | P0 | 미착수 |
| HV2-QA-03 | 엣지 케이스 4건 검증 | P1 | 미착수 |
| HV2-QA-04 | 모바일 375px + PC 1280px 교차 검증 | P0 | 미착수 |

---

## 미완성 기능 (PRD P1/P2)

| 기능 | 우선순위 | 상태 |
|------|---------|------|
| 핫 아파트 랭킹 페이지 | P1 | 진행 중 |
| 청약 상세 (분양가표, 경쟁률) | P1 | 미착수 |
| 청약 일정 캘린더 | P1 | **진행 예정 (HV2-FE-05)** |
| 홈 v2: 청약 타임라인 | P0 | **진행 예정 (HV2-FE-02)** |
| 홈 v2: 신고가 경신 TOP 5 | P0 | **진행 예정 (HV2-FE-03)** |
| 가격 변동 알림 (푸시) | P2 | 미착수 |
| 관심 단지 찜하기 | P2 | 미착수 |
| 학군 정보 | P2 | 미착수 |

---

*원본: `QA_REPORT.md` + `PRD.md` P1/P2 섹션 + 킥오프 회의록 2026-03-18*
