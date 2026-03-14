# QA 리포트 - Aptner v1.0

검토일: 2026-03-14
검토자: QA Engineer (Claude Sonnet 4.6)
검토 범위: BE 7개 파일, FE 11개 파일 + 관련 훅/서비스/유틸

---

## 검토 범위

### BE (서버)
- `server/src/index.ts`
- `server/src/middleware/security.ts`
- `server/src/middleware/errorHandler.ts`
- `server/src/services/molit.service.ts`
- `server/src/services/subscription.service.ts`
- `server/src/routes/apartment.routes.ts`
- `server/src/routes/subscription.routes.ts`

### FE (클라이언트)
- `client/src/App.tsx`
- `client/src/pages/HomePage.tsx`
- `client/src/pages/MapPage.tsx`
- `client/src/pages/SubscriptionPage.tsx`
- `client/src/pages/ApartmentDetailPage.tsx`
- `client/src/pages/TrendPage.tsx`
- `client/src/services/api.ts`
- `client/src/hooks/useKakaoMap.ts`
- `client/src/components/ui/Button.tsx`
- `client/src/components/apartment/PriceChart.tsx`
- `client/src/components/subscription/SubscriptionCard.tsx`

---

## Critical 이슈 (출시 불가)

### [CRIT-01] FE와 BE의 Subscription 타입 구조 불일치

**파일**: `client/src/types/index.ts` / `server/src/types/index.ts`

**문제**: FE의 `Subscription` 인터페이스와 BE의 `Subscription` 인터페이스가 필드명이 완전히 다르다. 실제 API 연동 시 런타임 오류가 발생한다.

| 항목 | FE 타입 | BE 타입 |
|------|---------|---------|
| 마감일 | `deadline: string` | `endDate: string` (없음) |
| 위치 | `location: string` | `sido + sigungu + address` |
| 최저분양가 | `startPrice: number` | `minPrice: number` |
| 공급세대 | `supplyUnits: number` | `totalSupply: number` |
| 청약유형 | `'general' \| 'special'` | `'일반공급' \| '특별공급'` 등 문자열 |
| dDay | 없음 | `dDay: number` |

**영향**: `SubscriptionCard`가 `subscription.deadline`, `subscription.location`, `subscription.startPrice`, `subscription.supplyUnits`를 참조한다. BE와 직접 연동하면 모든 청약 카드가 빈 값을 표시하거나 오류가 발생한다.

**수정 방법**: FE 타입 또는 BE 타입 중 하나를 기준으로 통일하거나, API 서비스 레이어에서 매핑(adapter) 함수를 작성한다.

```typescript
// 권장: client/src/services/subscription.service.ts에 매핑 추가
function mapServerSubscription(raw: ServerSubscription): Subscription {
  return {
    ...raw,
    deadline: raw.endDate,
    location: `${raw.sido} ${raw.sigungu}`,
    startPrice: raw.minPrice,
    supplyUnits: raw.totalSupply,
    type: raw.type === '특별공급' ? 'special' : 'general',
  };
}
```

---

### [CRIT-02] 클라이언트 .gitignore에 .env 미등록

**파일**: `client/.gitignore`

**문제**: 서버(`server/.gitignore`)는 `.env`를 gitignore에 등록했지만, 클라이언트(`client/.gitignore`)는 `.env`가 누락되어 있다. `client/.env`에는 `VITE_KAKAO_MAP_KEY`, `VITE_API_BASE_URL`이 포함되어 있어 실수로 커밋될 위험이 있다.

**상태**: 직접 수정 완료 (아래 "직접 수정한 항목" 참조)

---

### [CRIT-03] SubscriptionCard에서 존재하지 않는 필드 참조

**파일**: `client/src/components/subscription/SubscriptionCard.tsx`

**문제**: FE Mock 데이터(`MOCK_SUBSCRIPTIONS`)에는 타입 정의대로 `deadline`, `location`, `startPrice`, `supplyUnits` 필드가 있으나, `calcDday(subscription.deadline)` 호출 시 FE Mock은 정상 동작하지만 BE API와 연동 시 즉시 `undefined` 참조가 된다.

추가로 `subscription.type === 'special'` 비교 로직이 있으나 BE는 `type`을 `'일반공급'` 등 한국어 문자열로 반환하므로 비교가 실패한다.

**수정 방법**: [CRIT-01] 해결 후 자동으로 해결된다.

---

## Major 이슈 (출시 전 수정 권장)

### [MAJOR-01] calcDday 함수 시간대 미처리로 날짜 계산 오차

**파일**: `client/src/utils/formatNumber.ts`

**문제**: `now`에 `setHours(0, 0, 0, 0)` 처리 없이 현재 시각 그대로 차이를 계산하여 같은 날(D-0)에도 시간에 따라 `D-1`이 표시될 수 있다. `Math.ceil` 사용으로 오전에 접속 시 1일을 과다 계산한다.

```typescript
// 수정 전
const now = new Date();
const end = new Date(deadline);
const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

// 수정 후 (직접 수정 완료)
const now = new Date();
now.setHours(0, 0, 0, 0);
const end = new Date(deadline);
end.setHours(0, 0, 0, 0);
const diff = Math.round((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
```

**상태**: 직접 수정 완료

---

### [MAJOR-02] BottomNav에서 window.location.pathname 직접 사용

**파일**: `client/src/pages/HomePage.tsx` - `BottomNav` 컴포넌트

**문제**: `const pathname = window.location.pathname;`을 React Router `useLocation` 대신 직접 사용한다. React Router의 상태(history)와 동기화되지 않아 SPA 내비게이션 후 활성 탭이 잘못 표시될 수 있다.

**상태**: 직접 수정 완료 (`useLocation` 훅으로 교체)

---

### [MAJOR-03] useKakaoMap cleanup 미흡 - 메모리 누수 위험

**파일**: `client/src/hooks/useKakaoMap.ts`

**문제**: `useEffect` cleanup 함수에서 `setInterval` 타이머만 정리하고 있으나, 생성된 카카오맵 `CustomOverlay` 인스턴스들이 컴포넌트 언마운트 시 제거되지 않는다. `MapPage`가 여러 번 마운트/언마운트되는 경우 오버레이가 누적될 수 있다.

**상태**: 직접 수정 완료 (cleanup 시 `overlaysRef.current`의 모든 오버레이 `setMap(null)` 호출 추가)

---

### [MAJOR-04] 구독 서비스의 정렬 파라미터 BE 미지원

**파일**: `server/src/services/subscription.service.ts` / `client/src/hooks/useSubscription.ts`

**문제**: FE `useSubscriptions`가 `sort` 파라미터를 전달하지만 BE `SubscriptionQueryParams` 인터페이스에 `sort` 필드가 없고, `getSubscriptions` 서비스에도 정렬 로직이 없다. 실 API 연동 시 정렬이 무시된다.

```typescript
// server/src/types/index.ts - SubscriptionQueryParams
export interface SubscriptionQueryParams {
  page?: number;
  limit?: number;
  status?: SubscriptionStatus;
  sido?: string;
  // sort 파라미터 없음
}
```

**수정 방법**: BE `SubscriptionQueryParams`에 `sort?: 'deadline' | 'price' | 'latest'` 추가 및 서비스 레이어에 정렬 로직 구현.

---

### [MAJOR-05] 지역 필터 파라미터 BE-FE 불일치

**파일**: `client/src/pages/SubscriptionPage.tsx` / `server/src/routes/subscription.routes.ts`

**문제**: FE는 `region` 파라미터(`'서울'`, `'경기'` 등 약칭)를 사용하지만, BE는 `sido` 파라미터(`'서울특별시'` 등 전체 명칭)를 받는다. 실 API 연동 시 지역 필터가 동작하지 않는다.

---

### [MAJOR-06] 아파트 히스토리 API 경로 불일치

**파일**: `client/src/services/apartment.service.ts`

**문제**: 실 API 연동 시 히스토리 엔드포인트를 `/apartments/${aptId}/history`로 호출하는데, 이 경로는 BE 서버에 존재한다. 그러나 `area` 파라미터를 `string` 타입으로 보내고 있으며, BE는 `area`를 `float`(m² 숫자값)으로 파싱한다. FE의 Mock 데이터 `area` 필드는 `'59'`, `'84'` 등 문자열이므로 전달은 가능하나, 숫자 파싱 결과가 정확히 일치해야 한다.

---

### [MAJOR-07] PriceChart 데이터 타입 필드명 불일치

**파일**: `client/src/components/apartment/PriceChart.tsx`

**문제**: `PriceChart`는 `TradeHistory.date` 필드를 참조하여 필터링하지만, BE의 `ApartmentTradeHistory`는 `dealDate` 필드를 사용한다. 실 API 연동 시 차트에 데이터가 표시되지 않는다.

```typescript
// FE 타입 (client/src/types/index.ts)
export interface TradeHistory {
  id: string;
  date: string;    // YYYY-MM 형식
  ...
}

// BE 타입 (server/src/types/index.ts)
export interface ApartmentTradeHistory {
  dealDate: string; // YYYY-MM-DD 형식
  ...
}
```

---

### [MAJOR-08] CORS 설정의 `origin: null` 허용 범위

**파일**: `server/src/middleware/security.ts`

**문제**: CORS 미들웨어에서 `origin`이 없는 경우(서버-서버 요청, curl 등)를 모두 허용한다. 프로덕션 환경에서는 null origin 요청을 모두 허용하는 것은 CSRF 공격 벡터가 될 수 있다. 최소한 프로덕션 환경에서는 null origin을 차단하도록 분기가 필요하다.

```typescript
// 수정 권장
if (!origin) {
  if (process.env.NODE_ENV === 'production') {
    callback(new Error('CORS: Origin 헤더가 없는 요청은 허용되지 않습니다.'));
  } else {
    callback(null, true);
  }
  return;
}
```

---

## Minor 이슈 (다음 스프린트)

### [MINOR-01] TrendPage 날짜 하드코딩

**파일**: `client/src/pages/TrendPage.tsx` (line 44)

**문제**: `<p className="text-xs text-[#8B95A1] mt-0.5">2026년 3월 14일 기준</p>` 날짜가 하드코딩되어 있다. 실제 데이터 기준일 또는 현재 날짜를 동적으로 표시해야 한다.

---

### [MINOR-02] 지도 마커의 innerHTML 사용

**파일**: `client/src/hooks/useKakaoMap.ts` (line 130-143)

**문제**: 카카오맵 커스텀 오버레이 생성 시 `content.innerHTML`로 HTML을 직접 삽입한다. 현재는 가격 숫자만 삽입되어 XSS 위험이 낮지만, 추후 `apt.name` 등 사용자 입력 데이터가 삽입될 경우 XSS 취약점이 된다. `innerHTML` 대신 `textContent`와 DOM API를 이용한 생성으로 교체를 권장한다.

---

### [MINOR-03] HotApartments API 경로 불일치 가능성

**파일**: `client/src/services/apartment.service.ts`

**문제**: `getHotApartments`의 실 API 경로가 `/apartments/hot`이고 `region` 파라미터를 전달하는데, BE는 2자리 코드(`'11'`)로 기본값을 설정하지만 FE는 `'서울'` 등 한국어 문자열을 전달한다. BE의 `getHotApartments(region, limit)` 함수가 국토부 API에 해당 코드를 직접 `LAWD_CD`로 사용하므로, 한국어 문자열을 받으면 API가 잘못된 결과를 반환할 수 있다.

---

### [MINOR-04] 청약 서비스 Mock 데이터 캐싱 문제

**파일**: `server/src/services/subscription.service.ts`

**문제**: `buildSubscriptions()`에서 `calcStatus`와 `calcDDay`를 매번 호출하는데, 결과가 `cacheService`에 저장된다. 캐시 TTL 동안 날짜가 바뀌어도 cached된 `status`와 `dDay`가 반환된다. 청약 서비스 특성상 날짜가 바뀌면 즉시 상태가 갱신되어야 한다.

**수정 방법**: 청약 데이터는 캐시 TTL을 짧게 설정하거나, status/dDay를 캐시 대상에서 제외하고 매 요청 시 재계산한다.

---

### [MINOR-05] 에러 응답 토스트 알림 부재

**파일**: `client/src/pages/MapPage.tsx` (line 93)

**문제**: `navigator.geolocation` 실패 시 브라우저 기본 `alert()`를 사용한다. 프로덕션 수준의 UX로는 토스트 알림이나 인라인 에러 메시지를 사용해야 한다.

---

### [MINOR-06] `ApartmentDetailPage` useEffect 의존성 배열 주의

**파일**: `client/src/pages/ApartmentDetailPage.tsx` (line 19-23)

**문제**: `selectedArea` 초기화 useEffect의 의존성에 `selectedArea`가 포함되어 있다. 논리적으로 불필요한 재실행은 발생하지 않지만(`!selectedArea` 조건), `selectedArea`가 다른 이유로 초기화되는 상황에서 사이드이펙트가 생길 수 있다. 아파트 ID가 바뀔 때 면적을 초기화하는 명확한 로직으로 리팩토링을 권장한다.

```typescript
// 더 명확한 패턴
useEffect(() => {
  if (apartment) {
    setSelectedArea(apartment.areas[0]);
  }
}, [apartment?.id]); // apartment 전체 대신 id만 의존성으로
```

---

### [MINOR-07] Button 컴포넌트 접근성 개선 필요

**파일**: `client/src/components/ui/Button.tsx`

**문제**: `isLoading` 상태일 때 `aria-busy` 속성과 `aria-label` 변경이 없다. 스크린 리더 사용자에게 로딩 중임을 알리지 않는다.

---

## 직접 수정한 항목

### 수정 1: client/.gitignore에 .env 추가

**파일**: `/Users/bong/aptner/client/.gitignore`

클라이언트 `.gitignore`에 `.env`, `.env.local`, `.env.*.local` 패턴이 누락되어 있어 추가했다.

```
# 추가된 항목
.env
.env.local
.env.*.local
```

---

### 수정 2: calcDday 함수의 D-day 계산 버그 수정

**파일**: `/Users/bong/aptner/client/src/utils/formatNumber.ts`

`now`의 시간을 00:00:00으로 정규화하지 않아 같은 날에도 시간에 따라 D-day가 1일 오차 발생하는 버그를 수정했다. `Math.ceil` 대신 `Math.round`를 사용하도록 변경했다.

```typescript
// 수정 전
const now = new Date();
const end = new Date(deadline);
const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

// 수정 후
const now = new Date();
now.setHours(0, 0, 0, 0);
const end = new Date(deadline);
end.setHours(0, 0, 0, 0);
const diff = Math.round((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
```

---

### 수정 3: useKakaoMap cleanup에 오버레이 정리 로직 추가

**파일**: `/Users/bong/aptner/client/src/hooks/useKakaoMap.ts`

컴포넌트 언마운트 시 생성된 모든 카카오맵 `CustomOverlay`를 지도에서 제거하도록 cleanup 함수를 보완했다. 기존에는 `setInterval` 타이머만 정리하고 오버레이 인스턴스는 방치되었다.

---

### 수정 4: BottomNav를 useLocation 훅으로 수정

**파일**: `/Users/bong/aptner/client/src/pages/HomePage.tsx`

`window.location.pathname` 직접 참조를 React Router의 `useLocation` 훅으로 교체했다. SPA에서 React Router를 통한 네비게이션 후 `window.location`은 즉시 업데이트되지 않을 수 있어 활성 탭 표시가 어긋날 수 있다.

```typescript
// 수정 전
const pathname = window.location.pathname;

// 수정 후
const { pathname } = useLocation();
```

---

## 통과 항목

### 보안

- API 키 하드코딩 없음: BE 코드 어디에도 `MOLIT_API_KEY`가 하드코딩되지 않았다. `process.env.MOLIT_API_KEY`로만 참조하며, 키가 없으면 명시적 오류를 던진다.
- FE API 키: `VITE_KAKAO_MAP_KEY`는 `import.meta.env`로만 참조하며 코드에 하드코딩되지 않았다.
- `dangerouslySetInnerHTML` 미사용: 모든 FE 컴포넌트에서 `dangerouslySetInnerHTML`을 사용하지 않는다.
- 프로덕션 스택 트레이스 차단: `errorHandler.ts`에서 프로덕션 환경의 응답에 스택 트레이스가 포함되지 않는다.
- CORS 특정 Origin 허용: `ALLOWED_ORIGINS` 환경변수로 허용 도메인을 제한한다.
- Rate Limiting 적용: 전역 100req/15min, API 라우트 20req/min 두 단계로 적용되어 있다.
- Helmet 보안 헤더: `helmet` 미들웨어가 적용되어 있다.
- 서버 .gitignore: `server/.gitignore`에 `.env`가 포함되어 있다.
- 입력값 XSS/SQLi 검증: `validateInput` 미들웨어가 위험 문자 패턴을 필터링한다.

### 기능

- 라우팅: App.tsx에서 `/`, `/map`, `/subscription`, `/subscription/:id`, `/apartment/:id`, `/trend`, `/search`, 와일드카드(`*` -> `/`) 모두 정의되어 있다.
- 로딩/에러/빈 상태 처리: `SubscriptionPage`, `HomePage`, `ApartmentDetailPage` 모두 세 가지 상태를 처리한다.
- 가격 포맷: `formatPrice`, `formatPriceShort`에서 억/만원 단위 한국식 포맷이 올바르게 구현되어 있다.
- TypeScript 타입 정의: 모든 컴포넌트에 Props 인터페이스가 정의되어 있다.
- React Query 설정: staleTime, gcTime, retry, retryDelay가 적절히 설정되어 있다.
- 무한 리렌더링 위험 없음: 검토한 useEffect 패턴에서 의존성 배열 누락으로 인한 무한 루프는 없다.

### 코드 품질

- Button 컴포넌트: `React.memo`, `displayName`, Props 타입 정의, loading/disabled 상태 처리가 모두 갖추어져 있다.
- PriceChart: `React.memo`, `useMemo`로 성능 최적화, 날짜 범위 탭 전환, 빈 데이터 상태 처리가 구현되어 있다.
- SubscriptionCard: `React.memo`, `displayName`, Props 타입 정의가 되어 있다.
- Graceful Shutdown: 서버에 SIGTERM/SIGINT 핸들러와 10초 강제 종료 타이머가 구현되어 있다.
- 캐시 전략: Molit 서비스에서 API 실패 시 캐시 데이터를 폴백으로 사용하는 로직이 올바르게 구현되어 있다.

---

## 종합 평가

### 요약

| 분류 | 건수 |
|------|------|
| Critical (즉시 수정) | 3건 |
| Major (출시 전 수정) | 8건 |
| Minor (다음 스프린트) | 7건 |
| 직접 수정 완료 | 4건 |

### 결론

**현재 상태: 출시 불가 (조건부 출시 가능)**

가장 심각한 문제는 FE와 BE의 `Subscription` 타입이 완전히 다르다는 점이다 (CRIT-01). 현재는 FE가 Mock 데이터를 사용하는 `USE_MOCK = true` 상태라서 동작하지만, 실 API 연동 전환 시 청약 관련 기능이 전면 중단된다. 이 문제를 해결하지 않으면 출시 불가다.

`client/.gitignore` 누락(CRIT-02)은 즉시 수정 완료했다.

BE 서버 자체의 보안, 에러 처리, Rate Limiting, CORS 설정은 전반적으로 양호하다. FE의 컴포넌트 구조와 상태 관리도 React best practice를 따르고 있다.

**권장 사항**: CRIT-01 (타입 불일치) 해결 후 실 API 연동 통합 테스트를 수행하고, MAJOR 이슈들을 순차적으로 처리한 뒤 출시를 진행할 것을 권장한다.
