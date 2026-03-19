# QA 리포트 - Aptner v1.0

최초 작성: 2026-03-14
최종 업데이트: 2026-03-19 (P0/P1/P2 전수 검증 — 지도 줌 상수화·recent-trades·청약 마커 UI)
검토자: 정동현 (QA Engineer)

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-03-14 | 초기 QA 리포트 작성. Critical 3건, Major 8건, Minor 7건 |
| 2026-03-18 | P0 버그 수정 결과 전체 재검증. CRIT-01/03 해소, MAJOR-04/06/07/08 해소 확인 |
| 2026-03-18 (2차) | P1 핫 아파트 랭킹 페이지 QA. MAJOR 1건 신규 발견 (region 파라미터 계약 불일치), MINOR 2건 신규 발견 |
| 2026-03-18 (3차) | 지도 아파트 가격 마커 기능 QA. CRITICAL 1건 신규 발견 (BE recentPrice vs FE price 필드명 불일치), MAJOR 1건, MINOR 2건 신규 발견 |
| 2026-03-19 | 청약 캘린더 페이지 QA. CRITICAL 0건, MAJOR 1건 신규 발견 (useSubscriptions pageSize 파라미터 타입 미선언 — 캐스팅 우회), MINOR 2건 신규 발견 |
| 2026-03-19 (2차) | 홈 전면 개편 QA. CRITICAL 1건 신규 발견 (WeeklySubscriptionTimeline dateKey KST 버그 — 오늘 청약 Badge 오작동), MAJOR 0건, MINOR 2건 신규 발견 |
| 2026-03-19 (3차) | P0/P1/P2 전수 검증. CRITICAL 0건, MAJOR 2건 신규 발견, MINOR 3건 신규 발견 |

---

## 2026-03-19 (3차) P0/P1/P2 전수 검증 — 지도 줌 상수화·recent-trades·청약 마커 UI

### 검증 대상

- `server/src/constants/region.constants.ts` — 전국 시군구 코드 249개로 확대
- `server/src/services/complex.service.ts` — fetchMolitRaw 페이지네이션 루프 (최대 5페이지)
- `client/src/pages/map/constants.ts` — MAP_ZOOM 상수 추가
- `client/src/pages/map/index.tsx` — 줌 레벨 하드코딩 → 상수 교체, district overlay 겹침 버그 수정
- `server/src/services/hot-ranking.service.ts` — 실 MOLIT API 연동 (Mock fallback 유지)
- `server/src/services/recent-trades.service.ts` — 신규: 최근 거래 피드 서비스
- `server/src/routes/apartment.routes.ts` — GET /api/apartments/recent-trades 엔드포인트
- `client/src/components/home/RecentTradesSection.tsx` — 신규 컴포넌트
- `client/src/types/index.ts` — RecentTrade 타입 추가
- `client/src/services/apartment.service.ts` — getRecentTrades() 추가
- `client/src/hooks/useApartment.ts` — useRecentTrades() 추가
- `client/src/pages/map/MapCanvas.tsx` — 청약 마커 클릭 시 청약 상세 UI
- `client/src/components/layout/BottomNav.tsx` — 트렌드 탭 제거 (4탭 유지)

### 결과 요약

| 분류 | 건수 |
|------|------|
| 🔴 CRITICAL (즉시 수정) | 0건 |
| 🟠 MAJOR (배포 전 수정) | 2건 (신규) |
| 🟡 MINOR (다음 스프린트) | 3건 (신규) |
| ✅ PASS | 31개 항목 통과 |

**현재 상태: 조건부 배포 가능** — MAJOR 2건은 기능 오작동이 아닌 데이터 정확도 이슈이며, 사용자에게 즉각적인 크래시를 유발하지 않는다. 단, 배포 전 수정 권장.
TypeScript 컴파일 에러 0건 (FE `tsc --noEmit` 통과, BE `tsc --noEmit` 통과).

---

### 검증 항목별 결과

#### P0 — region.constants.ts (시군구 코드 249개)

✅ PASS — 서울 25개 구 코드 기존 유지 확인 (11110~11740)
✅ PASS — 중복 코드 0건 (249개 전체 unique)
✅ PASS — prefix 오류 없음 (모든 코드가 유효한 시도 prefix 보유)
✅ PASS — 대부분 좌표가 한국 범위(lat 33~38.6, lng 124~131) 이내

🟡 MINOR-MAP-03 — **강원 고성군(42820) neLat 38.615 — 한반도 최북단 접경**

- 파일: `server/src/constants/region.constants.ts:170`
- 내용: `neLat: 38.615` — 고성군이 강원도 최북단(휴전선 인근)에 위치하므로 좌표 자체는 지리적으로 유효하다. 단, 38.6 초과 좌표는 뷰포트 교차 계산 시 군사보호구역 포함 가능성이 있어 주석으로 명시하면 혼란 방지에 도움이 된다.
- 재현: 강원 고성군 뷰포트 조회 시 해당 바운딩박스 적용
- 수정 방법: 주석에 "휴전선 접경 — 의도적 범위" 명시 (데이터 오류 아님)
- 심각도: MINOR (기능 영향 없음)

#### P0 — complex.service.ts 페이지네이션

✅ PASS — `fetchMolitPage()`가 totalCount 파싱 후 반환, `fetchMolitRaw()`가 이를 받아 `Math.min(ceil, MAX_PAGES)` cap 적용
✅ PASS — MAX_PAGES = 5 cap 정상 적용 (`server/src/services/complex.service.ts:127-130`)
✅ PASS — 2페이지 이상은 `Promise.allSettled()`로 병렬 요청, 실패한 페이지는 warn 로그 후 건너뜀 (`147-154`)
✅ PASS — 첫 페이지 실패 시 예외 전파 (상위 `getComplexesByViewport`의 `Promise.allSettled`에서 처리)

#### P0 — MAP_ZOOM 상수 / index.tsx

✅ PASS — `MAP_ZOOM.INDIVIDUAL_MARKERS: 3`, `COMPLEX_MARKERS: 4`, `DISTRICT_OVERLAYS: 5`, `COMPLEX_DATA_FETCH: 4` — 값 올바름
✅ PASS — `index.tsx`에서 하드코딩 숫자 `3`, `4` 전부 상수 참조로 교체 확인
✅ PASS — `zoom >= DISTRICT_OVERLAYS(5)` 이상일 때만 district overlay 활성화 → complex 마커(`<= 4`)와 겹치지 않음
✅ PASS — `moveToLocation` 호출부 `zoom=3` 하드코딩(line 208)은 Geocoder 결과 이동용으로 의도된 값, 상수 불필요

#### P1 — hot-ranking.service.ts

✅ PASS — `buildRankingFromApi()` 실패 시 catch에서 `buildRankingFromMock()` fallback 정상 동작
✅ PASS — 반환 타입 `HotApartmentRanking[]` 일치 (`server/src/types/index.ts` 기준)
✅ PASS — TTL `HOT_RANKING_TTL = 60 * 30` = 30분 캐시 확인

🟠 MAJOR-RANKING-01 — **MOLIT API URL이 직접 Cloudflare Workers 프록시를 참조 — API 키 노출 경로 확인 필요**

- 파일: `server/src/services/hot-ranking.service.ts:18`, `server/src/services/recent-trades.service.ts:17`
- 내용: `https://molit-proxy.bomzip.workers.dev/trade` — 프록시 URL이 소스코드에 하드코딩되어 있다. 프록시 자체에 인증이 없다면 누구나 해당 엔드포인트로 직접 요청 가능하다. `complex.service.ts`는 `apis.data.go.kr`을 직접 호출하는 반면 두 서비스는 프록시 경유 — 일관성도 없다.
- 재현: `curl https://molit-proxy.bomzip.workers.dev/trade?serviceKey=...` 직접 호출
- 수정 방법: 프록시 URL을 `process.env.MOLIT_PROXY_URL`로 환경변수화, 또는 `complex.service.ts`처럼 직접 `apis.data.go.kr` 호출로 통일
- 심각도: MAJOR (보안 — 프록시 URL 하드코딩)

#### P1 — recent-trades.service.ts / routes

✅ PASS — BE `RecentTrade` 타입 (`server/src/services/recent-trades.service.ts:34-43`)과 FE `RecentTrade` 타입 (`client/src/types/index.ts:227-236`) 필드명·타입 완전 일치
✅ PASS — `/recent-trades` 라우트가 `/:aptCode` 와일드카드보다 앞에 선언됨 (`apartment.routes.ts:447` vs `839`)
✅ PASS — 응답 형식 `{ success: true, data: RecentTrade[] }` 확인 (`apartment.routes.ts:483-488`)
✅ PASS — MOLIT API 실패 시 빈 배열 반환 — 홈 화면 크래시 없음

🟠 MAJOR-TRADES-01 — **dealDay 정렬 기준 최신가 갱신 로직 불안정**

- 파일: `server/src/services/hot-ranking.service.ts:321-324`
- 내용: `aggregateComplexes()` 내부에서 이번달 최신 거래가를 갱신할 때 `if (item.dealDay > 0)` 조건만 체크하고 실제로 더 최근 날짜인지 비교하지 않는다. 루프 순서에 따라 더 오래된 거래가가 최신가로 저장될 수 있다. (`dealDay`가 더 큰지 비교 없이 매번 덮어씀)
- 재현: 같은 단지에 dealDay=5(가격 높음)와 dealDay=20(가격 낮음) 두 거래가 있을 때 루프 순서에 따라 결과가 달라짐
- 수정 방법: `existing.latestPrice = item.dealAmount * 10_000` 덮어쓰기 전에 `item.dealDay > currentMaxDay` 조건 추가하거나, 루프 후 날짜 내림차순 정렬로 첫 건 선택
- 심각도: MAJOR (데이터 정확도 — 핫 랭킹 최신 거래가 오표기 가능)

#### P2 — MapCanvas.tsx 청약 마커 상세 UI

✅ PASS — `selectedApartment.id.startsWith('sub-')` 감지 로직 정상 (`MapCanvas.tsx:342`)
✅ PASS — 일반 마커 (`sub-` prefix 없음) 동작 기존과 동일 (`389-416`)
✅ PASS — `aptDetailId` 계산 시 `sub-` prefix인 경우 `undefined` 반환 → 불필요한 상세 API 호출 없음 (`index.tsx:51`)
✅ PASS — `selectedMapApt` null 체크 후 `SubscriptionInfoSection` 렌더링 (`MapCanvas.tsx:370-374`)

🟡 MINOR-MAP-04 — **selectedMapApt null 시 청약 배지 markerType fallback 부재**

- 파일: `client/src/pages/map/MapCanvas.tsx:355-359`
- 내용: 청약 배지 배경색이 `selectedMapApt?.markerType === 'subOngoing'` 조건에 의존한다. `selectedMapApt`가 null이면 항상 "청약 예정" 스타일로 표시된다. mapApartments에 없는 청약 마커를 클릭하면 진행중 청약이 "예정" 배지로 보인다.
- 재현: mapApartments 목록에 없는 청약 마커 클릭
- 수정 방법: `selectedApartment`의 `markerType` 필드를 직접 저장하거나, `selectedApartment.id`에서 subOngoing/subUpcoming 정보를 인코딩
- 심각도: MINOR (UI 오표기, 기능 동작은 정상)

#### P2 — BottomNav.tsx 트렌드 탭 제거

✅ PASS — BottomNav에 트렌드 탭 없음, 현재 4탭 (홈/지도/청약/핫) 구성 확인
✅ PASS — `/trend` 라우트는 `App.tsx:87`에 유지됨 — 딥링크 접근 가능

🟡 MINOR-NAV-01 — **BottomNav에 트렌드 탭 없지만 App.tsx에 TrendPage 라우트 잔존**

- 파일: `client/src/App.tsx:87`
- 내용: `/trend` 라우트와 `TrendPage` lazy import가 남아있다. BottomNav에서 접근 경로가 제거됐으나 라우트는 유지됨 — 의도적이라면 문서화 필요, 향후 삭제 예정이라면 dead code.
- 수정 방법: PM 확인 후 라우트 유지(딥링크용) 또는 제거 결정
- 심각도: MINOR (dead code 가능성)

#### RecentTradesSection 검증

✅ PASS — 가격 표시: `formatPriceShort(trade.price)` 사용 — 만원 → 억 변환 올바름 (85000 → "8.5억")
✅ PASS — 면적 표시: `toPyeong(trade.area)` = `Math.round(sqm / 3.3)` — 평 환산 정상
✅ PASS — 클릭 이벤트: `encodeURIComponent(aptNm + ' ' + umdNm)` 적용 (`RecentTradesSection.tsx:138`)
✅ PASS — 홈 최대 5건 표시: `trades.slice(0, 5)` 확인 (`RecentTradesSection.tsx:142`)
✅ PASS — 로딩 상태 처리: Skeleton 컴포넌트 정상 구현
✅ PASS — 빈 데이터 처리: "최근 실거래 데이터를 불러오는 중이에요" fallback 메시지 표시

---

## 2026-03-19 (2차) 홈 전면 개편 QA

### 검증 대상

- `client/src/pages/HomePage.tsx` — 섹션 순서 재구성, QuickActionTabs/TodaySubscriptionBadge 제거
- `client/src/components/home/MarketSummaryBanner.tsx` — 신규 컴포넌트, 실 API 연동
- `client/src/services/trends.service.ts` — 신규 서비스
- `client/src/components/home/WeeklySubscriptionTimeline.tsx` — 헤더 오늘 청약 Badge 통합
- `client/src/components/home/RecordHighSection.tsx` — 동적 타이틀, 부제목 추가
- `client/src/components/home/HotApartmentSection.tsx` — 부제목 변경
- `server/src/services/trend.service.ts` — getMarketSummary() 추가
- `server/src/routes/trend.routes.ts` — GET /api/trends/summary 추가

### 결과 요약

| 분류 | 건수 |
|------|------|
| 🔴 CRITICAL (즉시 수정) | 1건 (신규) |
| 🟠 MAJOR (배포 전 수정) | 0건 |
| 🟡 MINOR (다음 스프린트) | 2건 (신규) |
| ✅ PASS | 20개 항목 통과 |

**현재 상태: 배포 불가** — CRITICAL-HOME-01 수정 전 배포 금지. KST 환경에서 오늘 청약 Badge가 오작동한다.
TypeScript 컴파일 에러 0건 (`tsc -b && vite build` 성공, `tsc --noEmit` server EXIT:0 확인).

---

### 검증 항목별 결과

#### 1. 빌드 — ✅ PASS

```
client/ npm run build → ✓ built in 315ms, 에러 0건
server/ npx tsc --noEmit → EXIT:0 (에러 없음)
```

#### 2. QuickActionTabs / TodaySubscriptionBadge import 제거 — ✅ PASS

`HomePage.tsx` 전체에서 `QuickActionTabs`, `TodaySubscriptionBadge` 문자열 grep 결과 매칭 없음. import 및 사용처 완전 제거 확인.

파일 자체는 삭제되지 않고 존재한다 (`client/src/components/home/QuickActionTabs.tsx`, `TodaySubscriptionBadge.tsx`). 미사용 파일이지만 빌드에서 tree-shaking으로 번들 포함 안 됨. 다음 스프린트에서 파일 삭제 권장 (MINOR-HOME-02).

#### 3. 섹션 순서 — ✅ PASS

`HomePage.tsx` 렌더 순서 확인 (149~177행):

1. BookmarkUpdateSection (조건부, `newTrades.length > 0` 시에만)
2. MarketSummaryBanner (158행)
3. RecordHighSection (161행)
4. WeeklySubscriptionTimeline (164행)
5. HotApartmentSection (171행)
6. MapBanner (175행)

요구 명세 순서와 일치. BookmarkUpdateSection은 조건부 렌더이므로 명세에 없는 위치가 아님 — 정상.

#### 4. BookmarkUpdateSection 유지 — ✅ PASS

`HomePage.tsx:149-155`: `newTrades.length > 0` 조건부로 `BookmarkUpdateSection` 렌더링 유지됨. 컴포넌트 구현도 파일 내 188-285행에 존재.

#### 5. MarketSummaryBanner — Mock 데이터 잔존 여부 — ✅ PASS

`MarketSummaryBanner.tsx` 전체 읽기 결과: 상수 선언, 하드코딩 Mock 데이터 없음. `useQuery`로 실 API 호출. `isError` 시 `null` 반환으로 graceful 처리.

#### 6. MarketSummaryBanner — useQuery staleTime/gcTime — ✅ PASS

`trends.service.ts:12-18`:
```typescript
const STALE_TIME = 6 * 60 * 60 * 1000;   // 6시간
const GC_TIME   = 12 * 60 * 60 * 1000;  // 12시간

export const MARKET_SUMMARY_QUERY_OPTIONS = {
  staleTime: STALE_TIME,
  gcTime:    GC_TIME,
} as const;
```
`MarketSummaryBanner.tsx:7-11`에서 스프레드로 적용 확인. 시장 지표 성격에 맞는 6시간 staleTime 적절.

#### 7. MarketSummaryBanner — isLoading Skeleton / isError null — ✅ PASS

`MarketSummaryBanner.tsx`:
- `isError` → `return null` (14-16행) — 홈 화면 전체 깨짐 없음
- `isLoading` → 각 StatItem 내부에서 `Skeleton` 렌더링 (49행, 70행, 91행) — 3개 항목 개별 스켈레톤 표시

#### 8. MarketSummaryBanner — priceChange 필드명 매핑 — ✅ PASS

BE `MarketSummary.priceChange` (`server/src/services/trend.service.ts:115-120`) → FE `MarketSummary.priceChange` (`trends.service.ts:6`) — 필드명 일치.

`MarketSummaryBanner.tsx:19`: `const priceChangeRate = data?.priceChange ?? 0` — BE 필드명 그대로 사용. 별칭 혼용 없음.

#### 9. MarketSummaryBanner — 숫자 표시 (부호, 자릿수) — ✅ PASS

`MarketSummaryBanner.tsx:28-29, 81`:
```typescript
const changeSign = priceChangeRate > 0 ? '+' : '';
// priceChangeRate < 0 이면 toFixed(1) 자체가 '-1.2' 형태로 출력
{changeSign}{priceChangeRate.toFixed(1)}%
```

- 양수: `+1.2%`
- 음수: `-1.2%` (changeSign = '', toFixed 자체 부호 포함)
- 0: `0.0%`

소수점 1자리 고정. 적절.

#### 10. RecordHighSection — 동적 날짜 타이틀 — ✅ PASS

`RecordHighSection.tsx:145-148`:
```typescript
function getDataCaption(): string {
  const now = new Date();
  return `${now.getFullYear()}년 ${now.getMonth() + 1}월 신고가`;
}
```

`getMonth() + 1` 사용으로 1월(0+1=1) ~ 12월(11+1=12) 정상. "0년 12월" 버그 없음.

현재(2026-03-19) 실행 시: `2026년 3월 신고가` 표시. 타이틀에 `전월` 계산은 없고 `현재 월` 그대로 사용 — 설계서 의도와 일치.

#### 11. RecordHighSection — 부제목 — ✅ PASS

`RecordHighSection.tsx:174`:
```
국토부 실거래가 기준 · 2~3주 지연
```
요구 명세와 정확히 일치.

#### 12. WeeklySubscriptionTimeline — 오늘 청약 Badge 0건 미노출 / 1건 이상 노출 — ✅ PASS (로직 기준)

`WeeklySubscriptionTimeline.tsx:100-117`:
```typescript
{todaySubCount > 0 && (
  <span ...>오늘 {todaySubCount}건</span>
)}
```

조건부 렌더 로직 자체는 정확하다. **단, todaySubCount 계산이 KST 환경에서 오작동한다 — CRITICAL-HOME-01 참조.**

#### 13. WeeklySubscriptionTimeline — TodaySubscriptionBadge 코드 잔존 여부 — ✅ PASS

`WeeklySubscriptionTimeline.tsx` 전체에서 `TodaySubscriptionBadge` 문자열 없음. 관련 import, 컴포넌트 참조 완전 제거.

#### 14. HotApartmentSection — 부제목 — ✅ PASS

`HotApartmentSection.tsx:236-238`:
```
거래량 기준 · 수도권 아파트
```
Caption 위치, 스타일 정상.

#### 15. server/trend.service.ts — getMarketSummary() 존재 — ✅ PASS

`server/src/services/trend.service.ts:153`에 `export async function getMarketSummary(): Promise<MarketSummary>` 확인.

#### 16. server/trend.service.ts — Promise.allSettled 병렬 호출 — ✅ PASS

`trend.service.ts:180-183`:
```typescript
const [thisMonthResults, prevMonthResults] = await Promise.all([
  Promise.allSettled(SUMMARY_REGION_CODES.map((code) => fetchTradesForTrend(code, 1))),
  Promise.allSettled(SUMMARY_REGION_CODES.map((code) => fetchTradesForTrend(code, 2))),
]);
```
`Promise.allSettled` 사용으로 개별 지역 API 실패가 전체 집계를 중단시키지 않는 구조. 정상.

#### 17. server/trend.service.ts — Mock fallback — ✅ PASS

두 경로에서 Mock fallback 확인:
- API 키 없음 (166-172행): `MOLIT_API_KEY` 미설정 또는 `demo_key_replace_with_real_key` → 즉시 Mock 반환
- 이번 달 거래 0건 (215-219행): `thisTrades.length === 0` → Mock fallback

`MARKET_SUMMARY_MOCK` 상수 (115-120행): 하드코딩 값이나 서비스 내부 fallback용이므로 정상. API 키와 무관한 Mock 데이터.

#### 18. server/trend.service.ts — API 키 하드코딩 여부 — ✅ PASS

`trend.service.ts:166`:
```typescript
const apiKey = process.env.MOLIT_API_KEY;
```
`process.env` 환경변수 참조. 코드 내 API 키 하드코딩 없음. `.gitignore`에 `.env`, `server/.env` 모두 등록 확인 (6~8행).

#### 19. server/trend.service.ts — 캐시 TTL — ✅ PASS

Mock fallback 시: `CACHE_TTL.APARTMENT_TRADE` = 6시간 (`cache.service.ts:9`)
실 데이터 시: `CACHE_TTL.APARTMENT_TRADE` = 6시간 (239행)

`trends.service.ts` FE측 staleTime 6시간과 BE 캐시 TTL 6시간이 동기화됨. 일관적.

#### 20. server/trend.routes.ts — GET /api/trends/summary 라우트 및 Cache-Control — ✅ PASS

`trend.routes.ts:105-113`:
```typescript
router.get('/summary', async (_req, res, next) => {
  const data = await getMarketSummary();
  res.set('Cache-Control', 'public, max-age=21600');  // 6시간
  res.json({ success: true, data });
});
```
라우트 존재, Cache-Control 설정 확인. `max-age=21600` = 6시간 — BE 캐시 TTL과 일치.

---

### 신규 발견 이슈

#### 🔴 CRITICAL-HOME-01: WeeklySubscriptionTimeline `dateKey()` KST 타임존 버그 — 오늘 청약 Badge 항상 0건으로 계산

**파일**: `client/src/components/home/WeeklySubscriptionTimeline.tsx:37-39`

**문제**:
```typescript
function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}
```

`toISOString()`은 항상 UTC 기준 문자열을 반환한다. KST(UTC+9) 환경에서 로컬 자정(`00:00:00 KST`)을 `toISOString()`으로 변환하면 전날 오후 3시(`15:00:00 UTC`)가 되어 날짜가 하루 뒤로 밀린다.

**실제 재현 결과** (로컬 Node.js KST 환경):
```
KST 자정 dateKey: 2026-03-18   ← 실제 날짜 2026-03-19와 불일치
today (local midnight): Thu Mar 19 2026 00:00:00 GMT+0900
dateKey(today): 2026-03-18     ← 하루 이전 날짜 반환
local date: 2026-03-19
match? false
```

**영향 경로**:
1. `todayKey = dateKey(today)` → KST에서 항상 어제 날짜 키 반환 (86행)
2. `subsByDate.get(todayKey)` → 어제 키로 조회하므로 `undefined` 또는 엉뚱한 날짜 데이터 반환 (87행)
3. `todaySubCount` → 실제 오늘 청약이 있어도 0 계산
4. Badge `todaySubCount > 0` 조건 → 미표시

추가 영향:
- `dateKey(day)` (138행)로 생성한 주간 날짜 키도 동일 버그 적용 → 요일별 청약 dot 표시가 실제 날짜와 하루 어긋남
- `isToday = dateKey(day) === dateKey(today)` (139행) → today 하이라이트가 어제 날짜 버튼에 적용됨

**재현 방법**: KST 환경(한국 시간대) 브라우저에서 홈 화면 접속 → 청약 있는 날 Badge 미표시, 캘린더 today 하이라이트 어긋남 확인.

**수정 방법**: `dateKey()` 함수를 로컬 타임존 기준으로 수정:
```typescript
// 수정 전 (37-39행)
function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// 수정 후
function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
```

참고: `RecordHighSection.tsx`의 `getDataCaption()`과 `SubscriptionCalendarPage.tsx`의 `toDateKey()`는 이미 로컬 타임존 방식을 사용하고 있다. `WeeklySubscriptionTimeline.tsx`만 `toISOString()` 방식으로 작성되어 불일치 상태.

---

#### 🟡 MINOR-HOME-01: trends.service.ts `getMarketSummary` 오류 시 에러 전파 — useQuery에서 처리되나 사용자 메시지 없음

**파일**: `client/src/components/home/MarketSummaryBanner.tsx:14-16`

`isError` 시 `return null`로 배너 자체를 숨기는 처리는 올바르다. 그러나 API 실패 원인(네트워크, 서버 500 등)을 사용자에게 전혀 알리지 않는다. 배너가 사라지면 사용자는 기능이 없는 것인지 오류인지 알 수 없다.

현재 기존 미해결 과제(공공 API 에러 메시지 사용자 친화적 처리)와 연관되는 항목. 개별 배너 수준에서는 null 반환이 적절하므로 Minor로 분류.

**수정 방향**: 전역 에러 핸들링 레이어에서 처리하거나, 배너 내 작은 안내 텍스트("시장 데이터를 불러올 수 없습니다")를 null 대신 표시하는 방식 검토.

---

#### 🟡 MINOR-HOME-02: QuickActionTabs.tsx / TodaySubscriptionBadge.tsx 미사용 파일 잔존

**파일**:
- `client/src/components/home/QuickActionTabs.tsx`
- `client/src/components/home/TodaySubscriptionBadge.tsx`

HomePage에서 import가 제거되었고 프로젝트 전체에서 참조 없음. Vite tree-shaking으로 번들에 포함되지 않으나 소스 코드에 남아 있어 혼란을 줄 수 있다. 다음 스프린트에서 파일 삭제 권장.

---

### 엣지 케이스 검증 결과

| 케이스 | 결과 |
|--------|------|
| MarketSummaryBanner API 실패 | `isError → return null` — 홈 화면 전체 정상 (배너만 미표시) |
| RecordHighSection 1월 실행 | `getMonth() + 1 = 1` → "2026년 1월 신고가" — "0년 12월" 버그 없음 |
| WeeklySubscriptionTimeline 오늘 청약 0건 | `todaySubCount = 0` → Badge 미표시 — 로직 정상 (단 dateKey 버그로 실제로는 항상 0) |
| trend.service.ts API 키 없음 | 즉시 Mock fallback 반환 — 홈 화면 정상 표시 |
| trend.service.ts 이번 달 거래 0건 | Mock fallback — 정상 |
| BookmarkUpdateSection 북마크 없음 | `newTrades.length = 0` → 섹션 미렌더 — 정상 |

---

## 2026-03-18 (3차) 지도 아파트 가격 마커 QA

### 검증 대상

- `server/src/routes/apartment.routes.ts` — `GET /api/apartments/map-prices`
- `server/src/routes/trend.routes.ts` — `GET /api/regions/lawdCd`
- `server/src/services/molit.service.ts` — `getMapPrices()` 반환 타입 및 캐시
- `server/src/services/cache.service.ts` — `CACHE_TTL.MAP_PRICES`
- `server/src/types/index.ts` — `ApartmentPrice` 인터페이스
- `client/src/services/apartment.service.ts` — `getMapPrices()`, `getLawdCdByCoords()`, `ApartmentMapPrice` 인터페이스
- `client/src/hooks/useMapApartments.ts` — `fetchPlaceMarkers`, `matchAptName`
- `client/src/hooks/useKakaoMap.ts` — `createPlacePriceMarker`, `updatePlaceMarkers`
- `client/src/pages/MapPage.tsx` — 줌 조건, Places 호출 타이밍, debounce

### 결과 요약

| 분류 | 건수 |
|------|------|
| 🔴 CRITICAL (즉시 수정) | 1건 (신규) |
| 🟠 MAJOR (배포 전 수정) | 1건 (신규) |
| 🟡 MINOR (다음 스프린트) | 2건 (신규) |
| ✅ PASS | 8개 항목 통과 |

**현재 상태: 배포 불가** — CRITICAL-MAP-01 수정 전 배포 금지. 가격이 모든 마커에서 undefined로 표시됨.
TypeScript 컴파일 에러 0건 (`tsc --noEmit` EXIT:0 양쪽 모두 확인).

---

### 검증 항목별 결과

#### 1. BE↔FE 필드명 일치 여부 — 🔴 CRITICAL

아래 항목 3차 QA의 핵심 체크 항목. 실제 코드를 직접 읽어 확인했다.

**BE `ApartmentPrice` 인터페이스** (`server/src/types/index.ts:383-392`):
```typescript
export interface ApartmentPrice {
  aptName: string;
  recentPrice: number;  // <-- 필드명: recentPrice
  dealDate: string;
  floor: number;
  area: number;
}
```

**BE `getMapPrices()` 반환** (`server/src/services/molit.service.ts:2429-2435`):
```typescript
const data: ApartmentPrice[] = Array.from(latestByName.values()).map((trade) => ({
  aptName:     trade.apartmentName.trim(),
  recentPrice: trade.price,   // <-- recentPrice 키로 직렬화
  dealDate:    trade.dealDate,
  floor:       trade.floor,
  area:        trade.area,
}));
```

Mock 데이터도 동일 (`molit.service.ts:2336`):
```typescript
{ aptName: '래미안 원베일리', recentPrice: 280000, ... }
```

**BE 라우트 응답** (`server/src/routes/apartment.routes.ts:113-117`):
```typescript
res.json({ success: true, data, cached });
// data = ApartmentPrice[] → { aptName, recentPrice, dealDate, floor, area }
```

**FE `ApartmentMapPrice` 인터페이스** (`client/src/services/apartment.service.ts:598-603`):
```typescript
export interface ApartmentMapPrice {
  aptName: string;
  price: number;     // <-- 필드명: price (BE의 recentPrice와 불일치)
  lawdCd: string;
  dealDate: string;
}
```

**FE `getMapPrices()` 파싱** (`client/src/services/apartment.service.ts:619-623`):
```typescript
const response = await api.get<{ success: true; data: ApartmentMapPrice[] }>(
  '/apartments/map-prices',
  { params: { lawdCd } }
);
return response.data.data;
// BE가 { recentPrice: 280000 }로 내려보내지만
// FE 타입은 price 필드를 기대 → price는 undefined
```

**FE 마커 렌더링** (`client/src/hooks/useMapApartments.ts:92`):
```typescript
price: matched?.price ?? null,
// matched.price === undefined → null로 처리됨
```

**결과**: 전체 지도에서 가격 pill 마커가 표시되지 않고 점 마커만 표시된다. BE가 응답한 `recentPrice` 값을 FE가 `price` 필드로 읽으려 하므로 항상 `undefined` → `null` → 점 마커 렌더링 경로로 진입한다.

**재현 방법**: 지도 줌 7 이상에서 어떤 지역이든 이동 → Places AT4 검색 결과에 파란 가격 pill 마커가 아닌 작은 점 마커만 표시됨을 확인. 브라우저 콘솔에서 `getMapPrices()` 응답을 확인하면 `recentPrice` 키는 존재하고 `price` 키는 없음.

**수정 방법** (두 가지 중 하나 선택):

옵션 A — FE `ApartmentMapPrice` 인터페이스 필드명을 BE에 맞게 수정 (`apartment.service.ts`):
```typescript
export interface ApartmentMapPrice {
  aptName: string;
  recentPrice: number;  // price → recentPrice
  lawdCd: string;
  dealDate: string;
}
```
그리고 `useMapApartments.ts:92`도 함께 수정:
```typescript
price: matched?.recentPrice ?? null,
```

옵션 B — BE `ApartmentPrice`에 `price` 별칭 필드 추가 (하위 호환):
```typescript
// molit.service.ts getMapPrices 반환 시
{ aptName, recentPrice: trade.price, price: trade.price, ... }
```

옵션 A 권장 (BE 계약 타입을 FE에서 준수하는 방향).

---

#### 2. 줌 레벨 조건 — ✅ PASS

**MapPage.tsx 관련 코드 확인**:
- `handleBoundsChange` (`MapPage.tsx:125`): `zoom >= 7` 조건에서 단지 데이터 갱신
- Places 마커 갱신 (`MapPage.tsx:142`): `zoom >= 7` 블록 내부에서 `fetchPlaceMarkersRef.current?.(...)` 호출
- `useEffect` (`MapPage.tsx:246`): `viewMode === 'marker' && currentZoom >= 7` 조건에서 `updatePlaceMarkers` 호출

줌 7 기준으로 Places AT4 검색이 트리거된다. 요구사항(`>= 7`)과 코드 일치.

---

#### 3. Places 호출 타이밍 (SDK 로드 확인) — ✅ PASS

`useMapApartments.ts:52-59`:
```typescript
const kakao = window.kakao;
if (
  !kakao?.maps?.services?.Places ||
  !kakao?.maps?.services?.Status
) {
  console.warn('[useMapApartments] kakao.maps.services 미로드 — Places 검색 불가');
  return [];
}
```

`window.kakao.maps.services.Places` 존재 여부를 옵셔널 체이닝으로 확인한 후 `new kakao.maps.services.Places()`를 호출한다. SDK 미로드 시 빈 배열 반환으로 안전하게 처리됨.

---

#### 4. debounce 처리 — 🟠 MAJOR

`MapPage.tsx:102-162` `handleBoundsChange` 내 Places 호출 코드:
```typescript
fetchPlaceMarkersRef.current?.(centerLat, centerLng)
  .then((markers) => setPlaceMarkers(markers))
  .catch(...);
```

`useKakaoMap.ts`의 지도 `idle` 이벤트에 `handleBoundsChange`가 연결되어 있다. `idle` 이벤트는 지도 이동이 멈춘 후 발화하므로 연속 드래그 중에는 호출되지 않는다. 그러나 Places 호출 자체에 별도 debounce 또는 이전 요청 취소(AbortController) 로직이 없다. 빠른 줌인/줌아웃 반복 시 `idle` 이벤트가 연속으로 발화하면 Places API 요청이 중복 발생할 수 있다.

카카오 Places API 일일 쿼터 제한이 있으므로 불필요한 중복 호출은 쿼터를 소진시킬 수 있다.

**재현 방법**: 지도에서 줌 슬라이더를 빠르게 7→8→9→8→7로 조작 → 네트워크 탭에서 `/api/regions/lawdCd` 및 `/api/apartments/map-prices` 요청이 중복 발생하는지 확인.

**수정 방법**: `MapPage.tsx`에서 Places 호출 전 이전 타이머를 취소하는 debounce 추가:
```typescript
const placeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
// handleBoundsChange 내부에서:
if (placeDebounceRef.current) clearTimeout(placeDebounceRef.current);
placeDebounceRef.current = setTimeout(() => {
  fetchPlaceMarkersRef.current?.(centerLat, centerLng)
    .then((markers) => setPlaceMarkers(markers))
    .catch(...);
}, 300);
```

---

#### 5. aptName 매칭 로직 — ✅ PASS

`useMapApartments.ts:18-35` `matchAptName()` 함수:

1차: 공백·괄호 제거 후 소문자 정규화된 완전 일치 (`===`)
2차: place_name이 aptName을 포함하거나 aptName이 place_name을 포함 (`includes`)

"래미안 대치팰리스" vs "래미안대치팰리스" → 정규화 후 `raemiandeachipaellis` 완전 일치 → 1차 통과.
"래미안 대치팰리스 1단지" vs "래미안 대치팰리스" → 정규화 후 포함 관계 → 2차 통과.
POI명이 상호명인 경우(예: "00공인중개사") → 매칭 실패 → `null` 반환 → `price: null` → 점 마커. 런타임 에러 없음.

---

#### 6. 마커 클릭 이동 로직 — ✅ PASS

`useKakaoMap.ts:1065-1091` `createPlacePriceMarker()` 함수에서 pill/점 마커 모두 `onClick` 핸들러가 연결된다:
```typescript
wrapper.addEventListener('click', () => {
  onClick?.(place.id, place.placeName);
});
```

`MapPage.tsx`의 `handlePlaceMarkerClick`:
```typescript
const handlePlaceMarkerClick = useCallback((id: string, placeName: string) => {
  navigate(`/search?q=${encodeURIComponent(placeName)}`);
}, [navigate]);
```

클릭 시 `/search?q=단지명` 으로 이동. `encodeURIComponent` 적용으로 XSS 없음.

---

#### 7. 빈 상태 처리 — ✅ PASS

`useMapApartments.ts` 빈 상태 케이스별 처리:
- `kakao.maps.services` 미로드 → `return []` (57-59행)
- `getLawdCdByCoords` 실패 → `return []` (63-66행)
- `getMapPrices` 예외 → `prices = []` catch 처리 (75-78행)
- Places `ZERO_RESULT` 또는 `ERROR` → `resolve([])` (119-121행)
- Places 예외 → `resolve([])` catch 처리 (128-130행)

전 경로에서 빈 배열로 graceful 처리됨. 런타임 에러 없음.

`getMapPrices` 결과 0건 시 BE는 `MAP_PRICES_MOCK` 12건 fallback 반환 (`molit.service.ts:2413-2415`). FE 입장에서 빈 배열이 내려오는 케이스는 실질적으로 없음.

---

#### 8. 타입 캐스팅 안전성 — 🟡 MINOR

`useMapApartments.ts:111`:
```typescript
const mapWithBounds = map as { getBounds: () => unknown };
```

`map`은 `getMap()` 반환값으로 `unknown` 타입이다. `getBounds()` 반환 타입도 `unknown`으로 캐스팅되어 있다. 이 값은 카카오 Places `categorySearch` 옵션의 `bounds`에 전달되는데, 해당 옵션 타입도 `bounds?: unknown`으로 선언되어 있어 타입 체커를 통과한다. 런타임 안전성은 카카오 SDK가 실제로 map 객체를 보유하고 있다는 전제에 의존한다. `any` 타입은 사용되지 않음 — 단순 구조적 캐스팅.

현재 구조에서 런타임 에러 가능성은 낮으나, `useKakaoMap.ts`의 `KakaoMap` 인터페이스를 활용해 타입을 명확히 하면 더 안전하다.

**수정 방법** (`useMapApartments.ts:111`):
```typescript
import type { KakaoMap } from '../types';
const mapWithBounds = map as KakaoMap;
// KakaoMap.getBounds()는 KakaoBounds 반환 → 타입 명확
```

---

#### 9. 캐시 동작 — ✅ PASS

`cache.service.ts:17`: `MAP_PRICES: 60 * 60` — 1시간 TTL.

`molit.service.ts:2369-2372`:
```typescript
const cachedResult = cacheService.get<ApartmentPrice[]>(cacheKey);
if (cachedResult) {
  return { data: cachedResult, cached: true };
}
```

캐시 키: `map-prices:${lawdCd}:${year ?? 'auto'}:${month ?? 'auto'}` — lawdCd 단위로 1시간 캐시. 동일 지역 재진입 시 BE 캐시 히트.

FE에서도 `useMapApartments.ts:44` `pricesCacheRef`로 메모리 캐시 추가:
```typescript
const pricesCacheRef = useRef<Map<string, ApartmentMapPrice[]>>(new Map());
```
같은 lawdCd 재방문 시 BE 요청 생략. 이중 캐시 구조 정상 작동.

---

#### 10. TypeScript 빌드 — ✅ PASS

```
client/ npx tsc --noEmit → EXIT:0 (에러 없음)
server/ npx tsc --noEmit → EXIT:0 (에러 없음)
```

주목: CRITICAL-MAP-01에서 지적한 `recentPrice` vs `price` 불일치는 **TypeScript 타입 에러를 발생시키지 않는다**. FE `ApartmentMapPrice.price: number`로 선언되어 있고, BE 응답 JSON을 제네릭 타입으로 캐스팅하는 구조(`api.get<{ success: true; data: ApartmentMapPrice[] }>`)이므로 컴파일러는 실제 응답 필드를 검사하지 못한다. 런타임에서만 드러나는 버그다.

---

### 신규 발견 이슈

#### 🔴 CRITICAL-MAP-01: BE `recentPrice` vs FE `price` 필드명 불일치 — 가격 마커 전체 무력화

**파일**:
- BE 타입: `server/src/types/index.ts:387` — `recentPrice: number`
- BE 서비스: `server/src/services/molit.service.ts:2431` — `recentPrice: trade.price`
- BE Mock: `server/src/services/molit.service.ts:2336` — `recentPrice: 280000`
- FE 타입: `client/src/services/apartment.service.ts:600` — `price: number`
- FE 파싱: `client/src/services/apartment.service.ts:619-623` — `data: ApartmentMapPrice[]` 캐스팅
- FE 매칭: `client/src/hooks/useMapApartments.ts:92` — `matched?.price ?? null`

**증상**: 지도 가격 마커 기능의 핵심 데이터 흐름인 `BE.recentPrice → FE.price` 매핑이 끊어져 있다. `matched?.price`는 항상 `undefined`이므로 `?? null`로 처리되어 `PlaceMarkerData.price = null`이 된다. `createPlacePriceMarker`는 `place.price !== null` 조건으로 pill 마커와 점 마커를 분기하므로 (`useKakaoMap.ts:1028`), 모든 마커가 점 마커로만 렌더링된다.

**TypeScript가 잡지 못하는 이유**: FE가 BE 응답을 `api.get<{ data: ApartmentMapPrice[] }>()`로 제네릭 캐스팅하기 때문에 컴파일러는 실제 JSON 필드명과 FE 타입의 불일치를 검사하지 않는다.

**재현 방법**: `VITE_USE_MOCK=false` 환경에서 지도 줌 7 이상 → 파란 가격 pill 마커 미표시 확인. Mock 환경에서도 `MOCK_MAP_PRICES`의 `price` 필드(`apartment.service.ts:648`)와 BE Mock의 `recentPrice` 필드가 다르므로 동일하게 재현됨.

**수정 방법**: `client/src/services/apartment.service.ts` 수정:

```typescript
// 수정 전 (598-603행)
export interface ApartmentMapPrice {
  aptName: string;
  price: number;
  lawdCd: string;
  dealDate: string;
}

// 수정 후
export interface ApartmentMapPrice {
  aptName: string;
  recentPrice: number;
  lawdCd: string;
  dealDate: string;
}
```

그리고 `client/src/hooks/useMapApartments.ts:92` 수정:
```typescript
// 수정 전
price: matched?.price ?? null,

// 수정 후
price: matched?.recentPrice ?? null,
```

추가로 FE Mock 데이터도 필드명 통일 필요 (`apartment.service.ts:647-658`):
```typescript
// 수정 전
{ aptName: '래미안 대치팰리스', price: 290000, lawdCd: '11680', dealDate: '2024-02' }

// 수정 후
{ aptName: '래미안 대치팰리스', recentPrice: 290000, lawdCd: '11680', dealDate: '2024-02' }
```

---

#### 🟠 MAJOR-MAP-01: Places 호출 debounce 없음 — 빠른 줌 조작 시 중복 API 호출

**파일**: `client/src/pages/MapPage.tsx:138-144`

카카오 지도 `idle` 이벤트 발화 후 Places 호출까지 debounce가 없다. 줌인/줌아웃을 빠르게 반복하면 `idle` 이벤트가 연속 발화하여 `getLawdCdByCoords` → `getMapPrices` → `categorySearch` 체인이 중복 실행된다. 카카오 Places API 및 국토부 API 모두 쿼터 제한이 있으므로 불필요한 소진이 발생한다.

**재현 방법**: 줌 슬라이더를 1초 내에 5회 이상 조작 → 네트워크 탭에서 `regions/lawdCd` 중복 요청 확인.

**수정 방법**: `MapPage.tsx`에 Places 호출 debounce 추가 (300ms 권장):
```typescript
const placeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

// handleBoundsChange 내 zoom >= 7 블록:
if (placeDebounceRef.current) clearTimeout(placeDebounceRef.current);
placeDebounceRef.current = setTimeout(() => {
  fetchPlaceMarkersRef.current?.(centerLat, centerLng)
    .then((markers) => setPlaceMarkers(markers))
    .catch((err) => console.warn('[handleBoundsChange] Places 마커 갱신 실패:', err));
}, 300);
```

---

#### 🟡 MINOR-MAP-01: `useKakaoMap.ts` map 캐스팅 타입 불명확

**파일**: `client/src/hooks/useMapApartments.ts:111`

`map as { getBounds: () => unknown }` — `KakaoMap` 인터페이스가 이미 `getBounds(): KakaoBounds`로 선언되어 있음에도 구조적 캐스팅으로 처리하고 있다. `any`는 아니나 기존 타입을 활용하지 않아 타입 정보가 손실된다.

**수정**: `map as KakaoMap` 으로 변경하여 `getBounds()` 반환 타입을 `KakaoBounds`로 복원.

---

#### 🟡 MINOR-MAP-02: FE Mock `MOCK_MAP_PRICES`와 `ApartmentMapPrice` 타입 불일치

**파일**: `client/src/services/apartment.service.ts:647-658`

CRITICAL-MAP-01 수정 과정에서 함께 수정되어야 하는 항목이나 별도 기록. 현재 Mock 데이터의 필드명 `price`가 수정 후 인터페이스 `recentPrice`와 달라져 TypeScript 에러가 발생할 수 있다. CRITICAL-MAP-01 수정 시 반드시 함께 처리.

---

### 엣지 케이스 검증 결과

| 케이스 | 결과 |
|--------|------|
| Places 결과 0건 | `resolve([])` → `placeMarkers = []` → 마커 없음. 에러 없음 |
| lawdCd 조회 실패 (네트워크 에러) | `return []` → Places 호출 생략. 폴백 정상 |
| POI명이 아파트명 아닌 경우 | `matchAptName` null 반환 → `price: null` → 점 마커. 에러 없음 |
| 줌 < 7 이동 | `updatePlaceMarkers([], ...)` 호출 → 기존 마커 전부 제거. 정상 |
| 같은 lawdCd 재방문 | FE `pricesCacheRef` 캐시 히트 → BE 요청 생략. 정상 |
| `getMapPrices` 예외 | `prices = []` → 매칭 0건 → 점 마커. 에러 없음 |
| lawdCd `12345` (실 데이터 0건) | BE Mock fallback 12건 반환. FE 마커 표시 (단, CRITICAL-MAP-01 수정 후) |

---

## 2026-03-18 (2차) P1 핫 아파트 랭킹 페이지 QA

### 검증 대상

- `server/src/types/index.ts` — `HotApartmentRanking` 타입
- `server/src/services/hot-ranking.service.ts` — 랭킹 서비스
- `server/src/routes/apartment.routes.ts` — `/hot` 라우트
- `client/src/types/index.ts` — `HotApartment` 타입
- `client/src/mocks/apartments.mock.ts` — `MOCK_HOT_APARTMENTS`
- `client/src/services/apartment.service.ts` — `getHotApartmentRanking()`
- `client/src/pages/HotRankingPage.tsx` — 신규 페이지
- `client/src/App.tsx` — `/hot` 라우트
- `client/src/components/layout/BottomNav.tsx` — "핫" 탭

### 결과 요약

| 분류 | 건수 |
|------|------|
| 🔴 CRITICAL (즉시 수정) | 0건 |
| 🟠 MAJOR (배포 전 수정) | 1건 (신규) |
| 🟡 MINOR (다음 스프린트) | 2건 (신규) |
| ✅ PASS | 10개 항목 통과 |

**현재 상태: 조건부 배포 가능** — Mock 환경 기준 전 기능 정상 동작. MAJOR-HOT-01 실 API 연결 전 수정 필요.
TypeScript 컴파일 에러 0건 (`tsc --noEmit` EXIT:0 양쪽 모두 확인).

---

### 검증 항목별 결과

#### 1. 타입 일관성 — ✅ PASS

BE `HotApartmentRanking` (`server/src/types/index.ts:343`) vs FE `HotApartment` (`client/src/types/index.ts:165`) 필드 대조:

| 필드 | BE 타입 | FE 타입 | 일치 |
|------|---------|---------|------|
| `rank` | `number` | `number` | PASS |
| `rankChange` | `number \| null` | `number \| null` | PASS |
| `aptCode` | `string` | `string` | PASS |
| `name` | `string` | `string` | PASS |
| `location` | `string` | `string` | PASS |
| `recentPrice` | `number` (원) | `number` (원) | PASS |
| `tradeCount` | `number` | `number` | PASS |
| `tradeSurgeRate` | `number` (%) | `number` (%) | PASS |

8개 필드 전부 이름/타입/단위 일치. 계약 완전 준수.

#### 2. rankChange null 처리 — ✅ PASS

`HotRankingPage.tsx:30-102` `RankChangeBadge` 컴포넌트:

- `rankChange === null` → "NEW" 뱃지 (파란색 배경)
- `rankChange > 0` → "▲ N" (빨간색)
- `rankChange < 0` → "▼ N" (초록색)
- `rankChange === 0` → "-" (회색)

4분기 전부 처리됨. 런타임 에러 없음. Mock 데이터 `hot-001`, `hot-007`, `hot-012`, `hot-017`에 `rankChange: null` 케이스 존재하며 정상 분기 확인.

#### 3. 지역 필터 — ✅ PASS (Mock 환경 한정)

`apartment.service.ts:574-577`:
```typescript
if (region && region !== '전국') {
  data = data.filter((apt) => apt.location.includes(region));
}
```

Mock 환경에서 `location.includes('서울'|'경기'|'인천')` 필터링 정상 동작.
인천 데이터: `hot-012`(인천 서구), `hot-015`(인천 연수구), `hot-020`(인천 부평구) 3건 — 인천 탭 빈 상태 없음.
"부산" 등 탭에 없는 지역은 FE에서 노출 안 함 — 정상.

#### 4. 빈 상태 — ✅ PASS

`HotRankingPage.tsx:300-313`:
```typescript
{!isLoading && !isError && (!data || data.length === 0) && (
  <div>데이터가 없습니다.</div>
)}
```

빈 배열 반환 시 "데이터가 없습니다." 표시. 로딩/에러/빈 상태 3종 모두 처리됨.

#### 5. 가격 표시 — ✅ PASS

`HotRankingPage.tsx:17-27` `formatPrice()` 검증 결과:

| 입력값 | 출력값 | 기대값 | 결과 |
|--------|--------|--------|------|
| `1_230_000_000` | 12억 3,000만원 | 12억 3,000만원 | PASS |
| `2_800_000_000` | 28억 | 28억 | PASS |
| `1_000_000_000` | 10억 | 10억 | PASS |
| `480_000_000` | 4억 8,000만원 | 4억 8,000만원 | PASS |
| `50_000_000` | 5,000만원 | 5,000만원 | PASS |
| `0` | 0만원 | (해당 없음) | 런타임 에러 없음 |

Mock 데이터 범위(4.8억~46억)에서 전부 정상 표시. `recentPrice: 0` 은 "0만원" 표시되나 실 데이터에서 발생 가능성 극히 낮음 — MINOR로 분류.

#### 6. 급등률 표시 — ✅ PASS

`HotRankingPage.tsx:187`: `거래 +{apt.tradeSurgeRate}%`

Mock 데이터 범위: 32% ~ 340%. 전부 양수 정수 표시 정상.
`tradeSurgeRate: 0` 케이스: "거래 +0%" 표시됨 — 런타임 에러 없으나 UI 어색함 (MINOR).

#### 7. 순위 1~3위 색상 — ✅ PASS

`HotRankingPage.tsx:106,126-128`:
```typescript
const isTopThree = apt.rank <= 3;
color: isTopThree ? '#1B64DA' : '#9CA3AF',
```

1~3위 Primary(`#1B64DA`) 적용, 4위 이하 회색 처리. 설계서 일치.

#### 8. TypeScript 빌드 — ✅ PASS

```
client/ npx tsc --noEmit → EXIT:0
server/ npx tsc --noEmit → EXIT:0
```

신규 코드 포함 전체 컴파일 에러 없음.

#### 9. any 타입 — ✅ PASS

`HotRankingPage.tsx`, `hot-ranking.service.ts` 전체 `any` 사용 없음. 신규 코드 기준 PASS.

#### 10. 라우팅 — ✅ PASS

`App.tsx:91`: `<Route path="/hot" element={<HotRankingPage />} />` 등록 확인.
`BottomNav.tsx:65-68`: `value="/hot"` `label="핫"` 탭 등록 확인.
lazy import: `const HotRankingPage = lazy(() => import('./pages/HotRankingPage'))` 확인.

---

### 신규 발견 이슈

#### 🟠 MAJOR-HOT-01: FE region 파라미터 — 실 API 연결 시 400 에러 발생

**파일**: `client/src/services/apartment.service.ts:581-585` / `server/src/routes/apartment.routes.ts:249-257`
**심각도**: MAJOR — Mock 환경에서는 숨겨지나 실 API 연결 즉시 지역 필터 완전 동작 불가

**문제**:
FE는 지역 이름 문자열을 region 파라미터로 전송한다:
```typescript
// apartment.service.ts:582
api.get('/apartments/hot', { params: { region, limit } })
// 전송값: region="서울" | "경기" | "인천"
```

BE는 2자리 숫자 시도 코드를 기대한다:
```typescript
// apartment.routes.ts:249
if (regionCode && !/^\d{2}$/.test(regionCode)) {
  res.status(400).json({ error: { code: 'INVALID_REGION', ... } });
}
```

`/^\d{2}$/.test('서울')` → `false` → 400 INVALID_REGION 반환.

**Mock 환경에서 숨겨지는 이유**: `USE_MOCK=true`일 때 FE가 자체적으로 `apt.location.includes(region)` 필터링을 수행하므로 BE 호출 없이 동작.

**재현 방법**: `VITE_USE_MOCK=false` 설정 후 서울/경기/인천 탭 클릭 → Network 탭에서 400 응답 확인.

**수정 방법**: 두 가지 중 하나 선택.

옵션 A — FE에 지역명→코드 매핑 추가 (`apartment.service.ts`):
```typescript
const REGION_CODE_MAP: Record<string, string> = {
  '서울': '11', '경기': '41', '인천': '28',
  '부산': '26', '대구': '27', '광주': '29',
};
// getHotApartmentRanking 내부
const regionCode = region && region !== '전국' ? REGION_CODE_MAP[region] : undefined;
api.get('/apartments/hot', { params: { region: regionCode, limit } })
```

옵션 B — BE가 지역명 문자열도 허용하도록 확장 (`apartment.routes.ts`):
```typescript
const REGION_NAME_MAP: Record<string, string> = { '서울': '11', '경기': '41', '인천': '28' };
const regionCode = isNationwide ? undefined : (REGION_NAME_MAP[region!] ?? region);
```

옵션 A 권장 (FE 자체 해결, BE 계약 안정적 유지).

---

#### 🟡 MINOR-HOT-01: tradeSurgeRate 음수 시 표시 어색함

**파일**: `client/src/pages/HotRankingPage.tsx:187`

BE 서비스에서 하락 단지(prevMonth > thisMonth)는 음수 `tradeSurgeRate`가 계산된다. 랭킹 정렬 특성상 음수 단지는 TOP 20에 진입하지 않으나, 향후 "하락 랭킹" 기능 추가 시 `거래 +-18.2%` 형식으로 표시될 수 있다. 현재 Mock 데이터에는 음수 케이스 없음.

**수정 방법**: `HotRankingPage.tsx:187`에서 `tradeSurgeRate >= 0`이면 `+`, 음수이면 부호 그대로 표시:
```typescript
거래 {apt.tradeSurgeRate >= 0 ? '+' : ''}{apt.tradeSurgeRate}%
```

---

#### 🟡 MINOR-HOT-02: recentPrice 1만원 미만 값 formatPrice 오표시

**파일**: `client/src/pages/HotRankingPage.tsx:17-27`

`formatPrice(9999)` → "0만원" 표시됨. 10,000원 미만은 만원 단위 절사로 0이 된다. 부동산 실거래가 특성상 1만원 미만은 실 데이터에서 발생 불가능하므로 실제 영향은 없다. 방어 코드 차원에서 `if (won <= 0) return '-'` 처리 권장.

---

### 엣지케이스 검증 결과

| 케이스 | 결과 |
|--------|------|
| `tradeSurgeRate: 0` | "거래 +0%" 표시, 런타임 에러 없음 |
| `rankChange: 0` | "-" 표시 정상 |
| `recentPrice: 0` | "0만원" 표시, 런타임 에러 없음 |
| 인천 탭 (데이터 3건 존재) | 정상 표시, 빈 상태 미발생 |
| "부산" 등 탭에 없는 지역 | FE REGION_TABS에 노출 없음, 정상 |
| `prevMonthCount: 0` 신규 단지 (APT005, APT012) | Infinity → `thisMonth * 100` 변환 후 JSON 직렬화 정상 |

---

## 2026-03-18 재검증 결과 요약

### 검증 대상

BE 수정:
- CRIT-01: `Subscription` 타입 필드 추가 (`location`, `totalUnits`, `supplyPrice`)
- MAJOR-04: 정렬 파라미터 `?sort=dDay|units|price` 구현
- MAJOR-08: CORS `"null"` origin 차단

FE 수정:
- CRIT-01+03: `Subscription` 인터페이스 BE 타입으로 통일, `SubscriptionCard` 필드 참조 수정
- MAJOR-06: `area` 파라미터 `String()` 변환
- MAJOR-07: `TradeHistory.date` → `dealDate` 전파

### 결과 요약

| 분류 | 건수 |
|------|------|
| 🔴 CRITICAL (즉시 수정) | 0건 |
| 🟠 MAJOR (배포 전 수정) | 2건 (신규 발견) |
| 🟡 MINOR (다음 스프린트) | 7건 (기존 유지) |
| ✅ PASS / 해소 | 전 검증 항목 통과 |

**현재 상태: 조건부 배포 가능** — MAJOR-NEW-01, MAJOR-NEW-02 인지 후 배포 가능.
TypeScript 컴파일 에러 0건 (`tsc --noEmit` EXIT:0 확인).

---

## 검증 항목별 결과

### 1. 타입 일관성 — ✅ PASS

`client/src/types/index.ts` `Subscription` 인터페이스 기준:

```
location: string       ← BE location 필드 직접 수신
totalUnits: number     ← BE totalUnits 필드 직접 수신
supplyPrice?: number   ← BE supplyPrice 필드 직접 수신 (optional 일치)
```

BE `server/src/types/index.ts`의 `Subscription`에 세 필드 모두 존재 확인.
`adaptSubscription()` 어댑터 레이어에서 올바르게 매핑:

- `location`: `raw.location ?? sido+sigungu` 조합으로 fallback 포함
- `totalUnits`: `raw.totalSupply` 로 매핑 — 아래 MAJOR-NEW-01 참고
- `supplyPrice`: `raw.minPrice` 로 매핑 — 아래 MAJOR-NEW-01 참고

### 2. 옵셔널 체이닝 — ✅ PASS

`supplyPrice` 참조 3개 컴포넌트 전체 확인:

| 컴포넌트 | 코드 | 결과 |
|----------|------|------|
| `SubscriptionCard.tsx:104` | `subscription.supplyPrice != null ? formatPrice(...) : '미정'` | PASS |
| `UrgentSubscriptionCard.tsx:77` | `subscription.supplyPrice != null ? formatPrice(...) : '분양가 미정'` | PASS |
| `SubscriptionDetailPage.tsx:132` | `subscription.supplyPrice != null ? formatPrice(...) : '미정'` | PASS |

null/undefined 시 런타임 에러 없음.

### 3. dDay 경계값 (`dDay === 0`) — ✅ PASS

`SubscriptionCard.tsx:13-17`:
```typescript
function formatDday(dDay: number): string {
  if (dDay < 0) return '마감';
  if (dDay === 0) return '오늘 마감';
  return `D-${dDay}`;
}
```

`SubscriptionDetailPage.tsx:41-44`:
```typescript
subscription.dDay < 0 ? '마감' :
subscription.dDay === 0 ? '오늘 마감' :
`D-${subscription.dDay}`
```

두 컴포넌트 모두 `dDay === 0` 경계값 처리 일치. PASS.

### 4. dealDate 전파 — ✅ PASS

`t.date` 잔존 패턴 전수 grep 결과 — `TradeHistory` 관련 코드에서 `.date` 잔존 없음.

| 파일 | 필드명 | 결과 |
|------|--------|------|
| `TradeHistoryTable.tsx:15` | `b.dealDate.localeCompare(a.dealDate)` | PASS |
| `TradeHistoryTable.tsx:69` | `formatYearMonth(trade.dealDate)` | PASS |
| `PriceChart.tsx:45` | `t.dealDate.split('-')` | PASS |
| `PriceChart.tsx:51-52` | `byMonth[t.dealDate]` | PASS |
| `ComparePage.tsx:216` | `t.dealDate` | PASS |
| `ComparePage.tsx:227` | `map[t.dealDate]` | PASS |
| `apartment.service.ts:312` | `t.dealDate.split('-')` (Mock 필터) | PASS |
| `apartment.service.ts:316` | `a.dealDate.localeCompare(b.dealDate)` | PASS |
| `apartment.service.ts:326,328` | BE 응답 `raw.dealDate` 매핑 | PASS |
| `types/index.ts:32` | `dealDate: string` 타입 정의 | PASS |

`PriceChart.tsx:257`의 `data.date`는 `ChartPoint` 인터페이스 내부 필드 (`date: string`)이며
`TradeHistory.dealDate`와 별개의 변수. 오탐 없음.

### 5. 정렬 로직 (`sort=price` + `supplyPrice` 없는 항목) — ✅ PASS

`server/src/services/subscription.service.ts:735-741`:
```typescript
} else if (sort === 'price') {
  list.sort((a, b) => {
    const pa = a.supplyPrice ?? -1;
    const pb = b.supplyPrice ?? -1;
    return pb - pa;
  });
}
```

`supplyPrice === undefined` 항목에 `-1` 대입 → 내림차순 정렬 시 맨 뒤 배치. 의도대로 동작.
`SubscriptionQueryParams.sort?: 'dDay' | 'units' | 'price'` 타입 정의 확인.

### 6. CORS `origin === 'null'` 차단 — ✅ PASS

`server/src/middleware/security.ts:38-42`:
```typescript
if (origin === 'null') {
  console.warn('[Security] CORS 차단: null origin (file:// 또는 sandboxed iframe)');
  callback(new Error('CORS: null origin은 허용되지 않습니다.'));
  return;
}
```

문자열 `'null'` 명시적 차단 코드 존재.
`localhost:5173` fallback도 기본값으로 설정되어 개발 환경 허용 유지 (`rawOrigins` 기본값). PASS.

### 7. TypeScript 빌드 — ✅ PASS

```
cd client && npx tsc --noEmit → EXIT:0 (에러 없음)
cd server && npx tsc --noEmit → EXIT:0 (에러 없음)
```

### 8. `any` 타입 사용 — 🟡 MINOR (기존 패턴, 신규 아님)

BE `subscription.service.ts`에 `any` 타입이 존재하나, 전부 LH 공공 API 연동 레이어 (`fetchRealSubscriptions`, `fetchHouseTypeDetails`, `adaptLhItem`, `adaptHouseTypeItem`)에 집중됨. 외부 API 응답 구조가 공식 타입 정의 없이 문서에만 기술된 구조이므로 현시점 불가피. 신규 추가 코드에서의 `any` 사용 아님.

---

## 신규 발견 이슈

### 🟠 MAJOR-NEW-01: FE 어댑터 `totalUnits` 매핑 오류 — `totalSupply` 필드 사용

**파일**: `client/src/services/subscription.service.ts:43`
**라인**: 43

```typescript
totalUnits: (raw.totalSupply as number | undefined) ?? 0,
```

**문제**: BE `Subscription` 타입에 `totalUnits`와 `totalSupply` 두 필드가 모두 존재한다 (`server/src/types/index.ts:173-175`). FE 어댑터는 `raw.totalUnits` 대신 `raw.totalSupply`를 읽고 있다. 현재 BE Mock 서비스는 `buildSubscriptions()`에서 `totalUnits: raw.totalSupply`로 두 필드를 동일하게 채우므로 Mock 환경에서는 값이 일치하지만, 실 LH API 연동 시 `adaptLhItem()`이 두 필드를 독립적으로 채울 경우 불일치가 발생할 수 있다.

**BE `adaptLhItem()` 확인** (`subscription.service.ts:211,226-227`):
```typescript
const totalSupply = Number(item.TOT_SUPLY_HSHLDCO) || 0;
...
totalUnits: totalSupply,
totalSupply,
```
현재 실 API에서도 두 값이 동일하게 채워지므로 즉각적 런타임 오류는 없다. 그러나 FE가 계약 필드(`totalUnits`)가 아닌 내부 구현 필드(`totalSupply`)에 의존하는 구조는 취약하다.

**재현**: LH API 연동 후 `adaptLhItem()`에서 `totalUnits`와 `totalSupply`가 다른 값으로 채워지는 상황.

**수정 방법**: `client/src/services/subscription.service.ts:43`을 아래와 같이 변경:
```typescript
totalUnits: (raw.totalUnits as number | undefined) ?? (raw.totalSupply as number | undefined) ?? 0,
```

---

### 🟠 MAJOR-NEW-02: FE 어댑터 `supplyPrice` 단위 불일치 가능성

**파일**: `client/src/services/subscription.service.ts:44`
**라인**: 44

```typescript
supplyPrice: raw.minPrice as number | undefined,
```

**문제**: BE `adaptLhItem()`에서 `supplyPrice`는 **원(원화)** 단위로 계산된다 (`server/src/services/subscription.service.ts:213`):
```typescript
const supplyPrice = minPrice > 0 ? minPrice * 10000 : undefined;
```
반면 `minPrice`는 **만원** 단위다. FE 어댑터가 `raw.minPrice`(만원)를 `supplyPrice`에 할당하면 `formatPrice(subscription.supplyPrice)`가 10,000배 작은 값을 표시한다.

Mock 환경에서는 `MOCK_SUBSCRIPTIONS`가 직접 `supplyPrice` 필드를 가지고 있어 이 경로를 타지 않으나, 실 API 연동 시 BE 응답에는 `supplyPrice`와 `minPrice`가 모두 포함된다. 어댑터가 `raw.minPrice`를 읽는 현재 코드는 `raw.supplyPrice`(원 단위)를 버리고 `raw.minPrice`(만원 단위)를 사용하는 구조다.

**재현**: 실 API 연동 시 `SubscriptionCard`의 분양가 표시가 1/10000 값으로 표시됨.

**수정 방법**: `client/src/services/subscription.service.ts:44`를 아래와 같이 변경:
```typescript
supplyPrice: (raw.supplyPrice as number | undefined) ?? (raw.minPrice != null ? (raw.minPrice as number) * 10000 : undefined),
```

---

## 기존 이슈 현황

### Critical — 전건 해소

| ID | 내용 | 상태 |
|----|------|------|
| CRIT-01 | FE↔BE Subscription 타입 불일치 | ✅ 해소 |
| CRIT-02 | client/.gitignore .env 미등록 | ✅ 해소 (2026-03-14 직접 수정) |
| CRIT-03 | SubscriptionCard 존재하지 않는 필드 참조 | ✅ 해소 |

### Major — 기존 이슈 현황

| ID | 내용 | 상태 |
|----|------|------|
| MAJOR-01 | calcDday 시간대 미처리 | ✅ 해소 (2026-03-14 직접 수정) |
| MAJOR-02 | BottomNav window.location 직접 사용 | ✅ 해소 (2026-03-14 직접 수정) |
| MAJOR-03 | useKakaoMap cleanup 미흡 | ✅ 해소 (2026-03-14 직접 수정) |
| MAJOR-04 | 정렬 파라미터 BE 미지원 | ✅ 해소 (2026-03-18 수정 확인) |
| MAJOR-05 | 지역 필터 파라미터 BE-FE 불일치 | ✅ 해소 (REGION_MAP 어댑터 확인) |
| MAJOR-06 | area 파라미터 타입 불일치 | ✅ 해소 (String() 변환 확인) |
| MAJOR-07 | PriceChart `date` → `dealDate` | ✅ 해소 (전파 완료 확인) |
| MAJOR-08 | CORS null origin 허용 | ✅ 해소 (차단 코드 확인) |

### Minor — 기존 이슈 유지

| ID | 내용 | 상태 |
|----|------|------|
| MINOR-01 | TrendPage 날짜 하드코딩 | 미해결 |
| MINOR-02 | 지도 마커 innerHTML 사용 | 미해결 |
| MINOR-03 | HotApartments 지역 코드 불일치 가능성 | 미해결 |
| MINOR-04 | 청약 캐시 TTL 내 status/dDay stale | 미해결 |
| MINOR-05 | 에러 응답 토스트 알림 부재 | 미해결 |
| MINOR-06 | ApartmentDetailPage useEffect 의존성 | 미해결 |
| MINOR-07 | Button 컴포넌트 접근성 (aria-busy) | 미해결 |

---

---

## 2026-03-19 청약 캘린더 페이지 QA

### 검증 대상

- `client/src/pages/SubscriptionCalendarPage.tsx` (신규, 354줄)
- `client/src/App.tsx` (라우팅 추가)
- `client/src/pages/SubscriptionPage.tsx` (캘린더 진입 버튼 추가)
- `client/src/hooks/useSubscription.ts` (파라미터 타입 계약)
- `client/src/services/subscription.service.ts` (pageSize 처리 확인)
- `client/src/types/index.ts` (Subscription 타입)

### 결과 요약

| 분류 | 건수 |
|------|------|
| 🔴 CRITICAL (즉시 수정) | 0건 |
| 🟠 MAJOR (배포 전 수정) | 1건 (신규) |
| 🟡 MINOR (다음 스프린트) | 2건 (신규) |
| ✅ PASS | 12개 항목 통과 |

**현재 상태: 조건부 배포 가능** — MAJOR-CAL-01 인지 후 배포 가능. 핵심 캘린더 기능 정상 동작 확인.
TypeScript 컴파일 에러 0건 (`tsc --noEmit` EXIT:0 확인).

---

### 검증 항목별 결과

#### 1. TypeScript 빌드 — ✅ PASS

```
cd client && npx tsc --noEmit → EXIT:0 (에러 없음)
```

`SubscriptionCalendarPage.tsx` 포함 전체 컴파일 에러 없음.

---

#### 2. 라우팅 순서 — ✅ PASS

`App.tsx:86-87`:
```
<Route path="/subscription/calendar" element={<SubscriptionCalendarPage />} />
<Route path="/subscription/:id" element={<SubscriptionDetailPage />} />
```

`/subscription/calendar`가 `/subscription/:id` 앞에 위치한다. React Router v6는 경로를 선언 순서대로 매칭하므로 `/subscription/calendar` 접근 시 `:id = "calendar"`로 오매칭되지 않음. 정상.

lazy import도 `App.tsx:23`에서 확인:
```typescript
const SubscriptionCalendarPage = lazy(() => import('./pages/SubscriptionCalendarPage'));
```

---

#### 3. Rules of Hooks — ✅ PASS

`SubscriptionCalendarPage.tsx` 전체 hook 선언 순서:

1. `useNavigate()` — 1번
2. `useIsPC()` — 14번 (내부적으로 `useBreakpoint` → `useState` + `useEffect`)
3. `useMemo(today)` — 71번
4. `useState(currentYear)` — 77번
5. `useState(currentMonth)` — 78번
6. `useState(selectedDate)` — 79번
7. `useSubscriptions(...)` — 103번
8. `useMemo(cells)` — 110번
9. `useMemo(subsByDate)` — 116번
10. `useMemo(selectedSubs)` — 125번

컴포넌트 함수 내 early return 없음. 모든 hook이 조건문/early return 이전에 선언됨. Rules of Hooks 위반 없음.

---

#### 4. 월 그리드 offset 계산 — ✅ PASS

`getCalendarCells()` 함수 (34-46번):
```typescript
const firstDay = new Date(year, month, 1);
const startOffset = firstDay.getDay(); // 0=일
for (let i = 0; i < startOffset; i++) cells.push(null);
```

`new Date(year, month, 1).getDay()` — 로컬 타임존 기준으로 생성되므로 UTC 타임존 버그 없음.

검증: 2026년 3월 1일은 일요일 → `getDay() = 0` → 빈 셀 0개 → 1일이 첫 번째 열에 표시. 2026년 4월 1일은 수요일 → `getDay() = 3` → 빈 셀 3개(일/월/화) → 정상.

6행 패딩 (`while cells.length % 7 !== 0`) 로직도 정상. 최대 42셀 보장.

---

#### 5. parseLocalDate KST 타임존 방어 — ✅ PASS

`parseLocalDate()` 함수 (20-23번):
```typescript
const [y, m, d] = dateStr.split('-').map(Number);
return new Date(y, m - 1, d);
```

`new Date('YYYY-MM-DD')` 대신 `new Date(y, m-1, d)` 로컬 생성자를 사용한다. `new Date('2026-03-19')`는 UTC 기준으로 파싱되어 KST(UTC+9) 환경에서 3월 18일로 밀리는 문제를 방지한다. 방어 코드 정상.

---

#### 6. startDate <= date <= endDate 범위 필터 — ✅ PASS

`filterByDate()` 함수 (49-58번):
```typescript
return target >= start && target <= end;
```

`start`, `end`, `target` 모두 `parseLocalDate()`로 생성된 로컬 Date 객체이므로 비교 정상. `startDate` 또는 `endDate`가 없는 항목은 `if (!sub.startDate || !sub.endDate) return false` — 방어 처리 정상.

---

#### 7. 이전달/다음달 이동 시 날짜 리셋 — ✅ PASS

`gotoPrevMonth()`, `gotoNextMonth()` (82-100번):

- 연도 경계 처리: 1월 → 12월(전년), 12월 → 1월(다음년) 정상 처리.
- `setSelectedDate(null)` 호출로 월 이동 시 선택 날짜 초기화. 다른 달로 이동 후 이전 달 날짜가 여전히 선택된 상태로 남는 문제 없음.

---

#### 8. 날짜 재클릭 시 선택 해제 — ✅ PASS

`button onClick` 핸들러 (319번):
```typescript
onClick={() => setSelectedDate(isSelected ? null : key)}
```

`isSelected`가 true이면 `null` 설정 → 선택 해제. 정상.

---

#### 9. 0건 상태 처리 — ✅ PASS

`selectedSubs.length === 0` 분기 (454-469번):
```typescript
<Box ...>
  <Typography ...>해당 날짜에 청약 일정이 없습니다</Typography>
</Box>
```

날짜 선택 시 청약 0건인 경우 빈 박스 텍스트 표시. 선택 안 한 경우(`selectedDate === null`)는 목록 섹션 자체를 렌더링하지 않음 (425번 조건). 정상.

---

#### 10. dot 우선순위 (ongoing + upcoming 동시) — ✅ PASS

`getDotColor()` 함수 (61-65번):
```typescript
const hasOngoing = subs.some((s) => s.status === 'ongoing');
return hasOngoing ? '#0066FF' : '#F59E0B';
```

해당 날짜에 ongoing과 upcoming이 동시에 있는 경우: `hasOngoing = true` → 파란색(`#0066FF`). ongoing이 없고 upcoming만 있는 경우: amber(`#F59E0B`). 우선순위 정상.

---

#### 11. 5건 초과 시 "외 N건" 표시 — ✅ PASS

473-488번:
```typescript
{selectedSubs.slice(0, 5).map((sub) => (
  <SubscriptionCard key={sub.id} subscription={sub} />
))}
{selectedSubs.length > 5 && (
  <Typography ...>
    외 {selectedSubs.length - 5}건 더 있습니다
  </Typography>
)}
```

6건 이상일 때 첫 5건만 렌더링하고 나머지 건수 텍스트 표시. 정상.

---

#### 12. SubscriptionCard 타입 호환 — ✅ PASS

`SubscriptionCard`는 `Subscription` 타입 전체를 props로 받는다. `filterByDate()`와 `subsByDate`가 반환하는 값은 `useSubscriptions()` → `getSubscriptions()` → `adaptSubscription()` 어댑터를 거친 `Subscription[]`이므로 타입 완전 일치. 런타임 에러 없음.

---

### 신규 발견 이슈

#### 🟠 MAJOR-CAL-01: `useSubscriptions` hook `pageSize` 파라미터 타입 미선언 — 캐스팅 우회

**파일**:
- `client/src/hooks/useSubscription.ts:6-11` — hook 파라미터 타입
- `client/src/pages/SubscriptionCalendarPage.tsx:103-106` — 호출부

**문제**: `useSubscriptions` hook의 파라미터 타입에 `pageSize`가 선언되어 있지 않다.

```typescript
// useSubscription.ts:6-11 — 현재 선언
export function useSubscriptions(params: {
  status?: SubscriptionStatus;
  region?: string;
  sort?: SortOrder;
  page?: number;
  // pageSize 없음
})
```

`SubscriptionCalendarPage`는 `pageSize: 100`을 전달해야 하므로 타입 오류를 `as Parameters<typeof useSubscriptions>[0]` 캐스팅으로 강제 우회하고 있다:

```typescript
// SubscriptionCalendarPage.tsx:103-106
const { data, isLoading } = useSubscriptions({
  page: 1,
  pageSize: 100,
} as Parameters<typeof useSubscriptions>[0]);
```

**런타임 영향**: `getSubscriptions()`의 파라미터 타입에는 `pageSize?: number`가 선언되어 있어(`subscription.service.ts:109-115`) 실제 서비스 레이어까지 값이 전달된다. Mock 환경에서 `pageSize: 100`으로 최대 100건 로드되므로 캘린더 기능은 정상 동작한다.

**문제점**: 캐스팅 우회는 타입 계약 파기다. hook 시그니처와 호출부가 불일치하는 상태로 유지되면, 추후 `useSubscriptions`의 내부 구현이 변경될 때 컴파일러가 `pageSize` 전달을 검증하지 못한다. `as` 캐스팅은 타입 안전성 경고를 억제하는 것이지 실제 타입을 맞추는 것이 아니다.

**재현**: `SubscriptionCalendarPage.tsx:103-106`의 캐스팅을 제거하면 즉시 TypeScript 에러 발생 (`Object literal may only specify known properties, and 'pageSize' does not exist in type`).

**수정 방법**: `client/src/hooks/useSubscription.ts:6-11`에 `pageSize` 추가:
```typescript
export function useSubscriptions(params: {
  status?: SubscriptionStatus;
  region?: string;
  sort?: SortOrder;
  page?: number;
  pageSize?: number;  // 추가
}) {
```

그리고 `SubscriptionCalendarPage.tsx:103-106`의 캐스팅 제거:
```typescript
const { data, isLoading } = useSubscriptions({
  page: 1,
  pageSize: 100,
});
```

---

#### 🟡 MINOR-CAL-01: `filterByDate` 내부 불필요한 Date 왕복 변환

**파일**: `client/src/pages/SubscriptionCalendarPage.tsx:50-55`

`filterByDate(subscriptions, date)` 함수가 인수로 받은 `date: Date`를 `toDateKey(date)`로 문자열로 변환한 뒤 다시 `parseLocalDate(key)`로 Date로 역변환한다:

```typescript
function filterByDate(subscriptions: Subscription[], date: Date): Subscription[] {
  const key = toDateKey(date);       // Date → 'YYYY-MM-DD'
  return subscriptions.filter((sub) => {
    ...
    const target = parseLocalDate(key); // 'YYYY-MM-DD' → Date (불필요한 왕복)
    return target >= start && target <= end;
  });
}
```

`date` 자체를 `target`으로 직접 사용하면 동일한 결과이며 변환 비용이 없다. `subsByDate` useMemo가 31개 날짜 × N건 청약으로 호출되므로 누적 비용이 발생한다. 기능 오동작은 없으나 불필요한 연산이다.

**수정 방법**: `filterByDate` 내 `key`/`target` 중간 변환 제거:
```typescript
function filterByDate(subscriptions: Subscription[], date: Date): Subscription[] {
  return subscriptions.filter((sub) => {
    if (!sub.startDate || !sub.endDate) return false;
    const start = parseLocalDate(sub.startDate);
    const end = parseLocalDate(sub.endDate);
    return date >= start && date <= end;
  });
}
```

---

#### 🟡 MINOR-CAL-02: 로딩 중 캘린더 그리드 대신 단일 CardSkeleton 표시

**파일**: `client/src/pages/SubscriptionCalendarPage.tsx:280-284`

데이터 로딩 중에 캘린더 그리드 전체를 대체하는 스켈레톤으로 `CardSkeleton` 하나를 표시한다:
```typescript
{isLoading ? (
  <div style={{ padding: '24px' }}>
    <CardSkeleton />
  </div>
) : (
  // 날짜 그리드 렌더링
```

`CardSkeleton`은 청약 카드 형태의 스켈레톤이므로 캘린더 그리드의 시각적 형태와 일치하지 않는다. 사용자가 로딩 중 화면을 보면 캘린더가 아닌 카드형 박스가 표시된다. 레이아웃 시프트(CLS)가 발생할 수 있다.

**수정 방법**: 7×6 그리드 형태의 캘린더 스켈레톤을 별도 구현하거나, `isLoading` 중에도 빈 그리드 구조를 유지하고 각 셀에 반투명 처리를 적용.

---

### 엣지 케이스 검증 결과

| 케이스 | 결과 |
|--------|------|
| 해당 월 청약 0건 | `subsByDate` 모든 키에 빈 배열 → dot 없음 → 날짜 클릭 시 "해당 날짜에 청약 일정이 없습니다" 표시. 정상 |
| ongoing + upcoming 동시 | `getDotColor` → `hasOngoing = true` → 파란 dot 우선. 정상 |
| 청약 5건 초과 | `slice(0, 5)` + "외 N건" 텍스트. 정상 |
| 날짜 재클릭 | `isSelected ? null : key` → 선택 해제. 정상 |
| 1월에서 이전달 이동 | `currentMonth=0` → `year-1, month=11`. 정상 |
| 12월에서 다음달 이동 | `currentMonth=11` → `year+1, month=0`. 정상 |
| startDate/endDate 없는 청약 | `filterByDate` 내 `return false` 방어. 정상 |
| 선택 날짜 없이 페이지 진입 | `selectedDate = toDateKey(today)` 초기값으로 오늘 선택 상태. 정상 |

---

## 미해결 과제 (별도 트래킹)

공공 API 장애 시 사용자에게 기술적 에러 메시지(`500 Internal Server Error`)가 노출되는 문제가 있다. 현재 `errorHandler.ts`는 프로덕션에서 스택 트레이스를 차단하지만, 공공 API 특유의 오류 코드를 사용자 친화적 메시지로 변환하는 레이어가 없다. 다음 스프린트에서 BE 공공 API 에러 → 사용자 친화적 메시지 매핑 작업 필요.

---

## 통과 항목 (2026-03-18 기준)

### 보안
- API 키 하드코딩 없음 (BE/FE 전체)
- `dangerouslySetInnerHTML` 미사용
- 프로덕션 스택 트레이스 차단
- CORS 특정 Origin 허용 + `'null'` origin 명시적 차단
- Rate Limiting 2단계 적용
- Helmet 보안 헤더 적용
- `.gitignore` `.env` 등록 (client/server 모두)
- 입력값 XSS/SQLi 검증 미들웨어

### 기능
- TypeScript 컴파일 에러 0건 (client/server 모두)
- `dDay === 0` "오늘 마감" 경계값 처리
- `supplyPrice` null/undefined 런타임 에러 없음
- `sort=price` + `supplyPrice` 없는 항목 맨 뒤 정렬
- `dealDate` 필드 전체 컴포넌트 일관 사용
- 로딩/에러/빈 상태 처리
- React Query staleTime/retry 설정

### 코드 품질
- `React.memo` + `displayName` 적용
- `useMemo`/`useCallback` 성능 최적화
- Graceful Shutdown (SIGTERM/SIGINT)
- 캐시 전략 (공공 API 실패 시 캐시 폴백)

---

## 2026-03-19 (4차) Ralph 세션 변경사항 검증

### 검증 대상

- `server/src/services/complex.service.ts` — 경고 메시지 교체
- `server/src/services/hot-ranking.service.ts` — 빈 결과 fallback 경고 로그 추가
- `client/src/components/home/RecentTradesSection.tsx` — 최신순/고가순 정렬 토글
- `client/src/pages/HomePage.tsx` TrendBanner — 가격 변동 색상 수정
- `server/src/services/redevelopment.service.ts` — 정비사업 Mock 서비스 신규
- `server/src/routes/apartment.routes.ts` — GET /api/apartments/redevelopment 추가
- FE: `RedevelopmentProject` 타입 + `getRedevelopmentProjects` 서비스 + `useRedevelopmentProjects` 훅

### 검증 방법

실제 파일 직접 읽기 + tsc --noEmit 양측 실행

---

### 1. 타입 안전성

**BE** (`server/`): `tsc --noEmit` — 에러 0건  
**FE** (`client/`): `tsc --noEmit` — 에러 0건

✅ PASS

---

### 2. RecentTradesSection 정렬 로직

**파일**: `client/src/components/home/RecentTradesSection.tsx`

- `sortOrder` state: `useState<SortOrder>('latest')` — 존재 확인 ✅
- latest 정렬 (`localeCompare`): `b.dealDate.localeCompare(a.dealDate)` — 내림차순 ✅
- price 정렬: `b.price - a.price` — 내림차순 ✅
- 5건 cap 순서: `[...trades].sort(...).slice(0, 5)` — 정렬 후 슬라이싱 ✅ (정렬 전 슬라이싱 버그 없음)

✅ PASS

---

### 3. TrendBanner 색상 로직

**파일**: `client/src/pages/HomePage.tsx` (TrendBanner 컴포넌트, 265~274행)

```
rate > 0  → var(--semantic-label-danger)   // 빨강 ✅
rate < 0  → var(--semantic-label-info)     // 파랑 ✅
rate === 0 → var(--semantic-label-assistive) // 회색 ✅
```

✅ PASS

---

### 4. /redevelopment 엔드포인트

**파일**: `server/src/routes/apartment.routes.ts`

**라우트 선언 순서** (808행 vs 877행):
```
808:  router.get('/redevelopment', ...)   // 고정 경로
877:  router.get('/:aptCode', ...)        // 와일드카드
```
`/redevelopment`가 `/:aptCode`보다 앞에 선언됨 ✅

**Mock 데이터 건수**: `MOCK_REDEVELOPMENT_PROJECTS` — 재개발 3건 + 재건축 3건 = 총 6건 ✅

**캐시 TTL**: `CACHE_TTL_MS = 60 * 60 * 1000` — 1시간(ms) 인메모리 캐시 ✅

✅ PASS

---

### 5. BE/FE RedevelopmentProject 타입 일치

**BE** (`server/src/services/redevelopment.service.ts`):
```ts
interface RedevelopmentProject {
  id: string;
  name: string;
  type: 'redevelopment' | 'reconstruction';
  status: 'planning' | 'approved' | 'construction' | 'completed';
  lat: number;
  lng: number;
  address: string;
  estimatedUnits?: number;
  completionYear?: number;
}
```

**FE** (`client/src/types/index.ts`):
```ts
interface RedevelopmentProject {
  id: string;
  name: string;
  type: 'redevelopment' | 'reconstruction';
  status: 'planning' | 'approved' | 'construction' | 'completed';
  lat: number;
  lng: number;
  address: string;
  estimatedUnits?: number;
  completionYear?: number;
}
```

필드명·타입·optional 여부 전 항목 일치 ✅

✅ PASS

---

### 6. hot-ranking fallback 경고 로그

**파일**: `server/src/services/hot-ranking.service.ts` (548~551행)

catch 블록:
```ts
console.warn(`[HotRanking] 실 API 실패 → Mock fallback 사용: ${reason}`);
console.warn(`[HotRanking] 실API 결과 0건 → Mock fallback 사용 (region=...)`);
```

warn 로그 존재 확인 ✅

단, warn 로그가 2줄 중복으로 존재합니다. 첫 번째는 모든 catch에 출력되고 두 번째도 동일 catch 블록에서 항상 출력됩니다. 0건일 때만 출력하려는 의도라면 `buildRankingFromApi` 내부의 `throw new Error('이번달 데이터 0건...')` 경로와 API 키 없음 경로가 구분 없이 같은 메시지를 냅니다.

🟡 MINOR — 기능적 결함 없음. `console.warn` 중복 출력. 다음 스프린트에 정리 권장.

---

### 7. complex.service.ts 경고 메시지

**파일**: `server/src/services/complex.service.ts` (319행)

```ts
console.warn('[Complex] 뷰포트 내 시군구 코드 없음 (해당 좌표가 SIGUNGU_TABLE 커버 범위 밖)');
```

"서울/경기" 한정 문구 없음. 전국 범위 표현으로 교체됨 ✅

✅ PASS

---

### 종합 결과

| 항목 | 결과 |
|------|------|
| BE tsc --noEmit | ✅ PASS (에러 0건) |
| FE tsc --noEmit | ✅ PASS (에러 0건) |
| RecentTradesSection 정렬 로직 | ✅ PASS |
| TrendBanner 색상 (양수/음수/0) | ✅ PASS |
| /redevelopment 라우트 순서 | ✅ PASS |
| Mock 데이터 6건 | ✅ PASS |
| 캐시 TTL 1시간 | ✅ PASS |
| BE/FE RedevelopmentProject 타입 | ✅ PASS |
| hot-ranking fallback warn 로그 | ✅ PASS (중복 로그 MINOR) |
| complex.service 경고 메시지 교체 | ✅ PASS |

**Critical 0건 / Major 0건 / Minor 1건**

배포 가능합니다.

