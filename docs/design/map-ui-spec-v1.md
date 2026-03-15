# 지도 UI/UX 개선 명세 v1.0
**작성자**: Principal Designer
**작성일**: 2026-03-15
**대상**: FE 개발팀
**기준 문서**: PRD_v3.md 디자인 시스템 섹션

---

## 목차
1. 마커 시스템 명세 (5종)
2. 필터 UI 명세
3. 청약 정보 패널 명세
4. 홈 화면 빈 상태 UI 명세
5. 필터-마커 레이어 논리 구조도
6. 타입 확장 명세 (FE/BE 공유)

---

## 0. 현황 파악 및 개선 근거

### 현재 마커 시스템 문제점
`useKakaoMap.ts` 기준 현재 마커는 단일 타입으로 CSS인라인 스타일의 pill 형태.
- 가격 3단계 색상: `#8B95A1` / `#FF9500` / `#FF4B4B`
- padding: `5px 10px`, border-radius: `20px`, font-size: `12px`
- XSS 방어는 올바르게 구현됨 (textContent 사용)

### 개선 방향
기존 구현 구조 (`CustomOverlay` + DOM API)는 유지하되,
마커 타입별로 팩토리 함수를 분리해 생성한다.
`MapApartment` 타입에 `markerType` 필드를 추가해 타입 분기를 명확히 한다.

---

## 1. 마커 시스템 명세

### 마커 타입 enum 정의

```typescript
// types/index.ts 에 추가
export type MarkerType = 'price' | 'hot' | 'allTimeHigh' | 'subOngoing' | 'subUpcoming';

// MapApartment 확장
export interface MapApartment {
  id: string;
  name: string;
  lat: number;
  lng: number;
  price: number;       // 만원
  area: string;
  priceChangeType: 'up' | 'down' | 'flat';
  markerType?: MarkerType;       // 신규
  subDeadline?: string;          // 청약 마감일 YYYY-MM-DD (청약 마커 전용)
  subStartDate?: string;         // 청약 시작일 YYYY-MM-DD (청약 마커 전용)
}
```

---

### A. 기본 가격 마커 (type: `price`) — 개선

**기존 대비 변경점**: 크기 소폭 확대, 가격 구간 재편, 선택 상태 시각 피드백 추가

| 속성 | 값 |
|------|-----|
| 크기 | min-width: 56px, height: 28px |
| padding | 5px 12px |
| border-radius | 14px (완전 pill) |
| font | Pretendard, 12px, font-weight 700 |
| border | 2px solid #FFFFFF |
| box-shadow | 0 2px 8px rgba(0,0,0,0.20) |
| z-index | 10 |

**가격 구간별 배경색 (개선)**

| 구간 | 배경색 | 텍스트색 | 비고 |
|------|--------|----------|------|
| 5억 미만 | `#8B95A1` | `#FFFFFF` | 현행 유지 |
| 5억 이상~10억 미만 | `#FF9500` | `#FFFFFF` | 현행 유지 |
| 10억 이상~20억 미만 | `#FF4B4B` | `#FFFFFF` | 기존 15억 기준에서 10억으로 하향 |
| 20억 이상 | `#D63031` | `#FFFFFF` | 신규 구간 — 최고가 시인성 강화 |

**선택(active) 상태**
- border: `2.5px solid #191F28`
- box-shadow: `0 4px 16px rgba(0,0,0,0.30)`
- transform: `scale(1.12)`
- z-index: `50` (다른 마커 위에 올라옴)

---

### B. HOT 단지 마커 (type: `hot`) — 신규

주간 조회수+거래량 합산 TOP 10 단지에 적용. 가격 정보와 HOT 뱃지를 함께 표시한다.

**설계 근거**: 단순히 색상만 바꾸면 가격 마커와 구분이 어렵다. 아이콘+텍스트 2줄 구조로 명확히 분리한다.

| 속성 | 값 |
|------|-----|
| 크기 | min-width: 64px, height: 42px |
| 구조 | 상단: "HOT" 텍스트 + 불꽃 아이콘 / 하단: 가격 텍스트 |
| 상단 배경색 | `#FF4136` |
| 상단 텍스트 | "🔥 HOT" — 단, 이모지 대신 SVG 불꽃 아이콘 사용 (접근성) |
| 상단 텍스트 스펙 | font-size 10px, font-weight 800, color `#FFFFFF`, letter-spacing 0.5px |
| 하단 배경색 | `#FFFFFF` |
| 하단 텍스트 | 가격 (예: "15.5억"), font-size 12px, font-weight 700, color `#D63031` |
| border-radius | 10px (상단 좌우) + 0px (하단 좌우 내부) + 10px (하단 좌우) |
| border | 2px solid `#FF4136` |
| box-shadow | `0 3px 12px rgba(214,48,49,0.35)` |
| z-index | 20 (가격 마커보다 위) |

**말꼬리(꼬리핀) 방향**: 마커 하단 중앙, 삼각형 6×4px, 색상 `#FF4136`

**선택(active) 상태**
- box-shadow: `0 6px 20px rgba(214,48,49,0.50)`
- transform: `scale(1.10)`
- z-index: `55`

**SVG 불꽃 아이콘** (10×10px, 마커 내부 인라인)
```
viewBox="0 0 10 10"
path: M5 1 C5 1 8 4 8 6.5 C8 8.4 6.6 9.5 5 9.5 C3.4 9.5 2 8.4 2 6.5 C2 4 5 1 5 1Z
fill: #FFD93D
```

---

### C. 신고가 마커 (type: `allTimeHigh`) — 신규

최근 실거래가가 해당 단지의 역대 최고가를 갱신한 경우 적용.

**설계 근거**: 투자자가 "지금 사면 고점"임을 즉시 인식해야 한다. 금색 계열 + 왕관 아이콘으로 "역대 최고" 연상.

| 속성 | 값 |
|------|-----|
| 크기 | min-width: 64px, height: 42px |
| 구조 | 상단: 왕관 아이콘 + "신고가" / 하단: 가격 |
| 상단 배경색 | `#F39C12` |
| 상단 텍스트 | "▲ 신고가", font-size 10px, font-weight 800, color `#FFFFFF` |
| 하단 배경색 | `#FFFBF0` |
| 하단 텍스트 | 가격, font-size 12px, font-weight 700, color `#E67E22` |
| border-radius | 10px |
| border | 2px solid `#F39C12` |
| box-shadow | `0 3px 12px rgba(243,156,18,0.35)` |
| z-index | 20 |

**말꼬리**: 하단 중앙, 삼각형 6×4px, 색상 `#F39C12`

**선택(active) 상태**
- box-shadow: `0 6px 20px rgba(243,156,18,0.50)`
- transform: `scale(1.10)`
- z-index: `55`

---

### D. 청약 진행중 마커 (type: `subOngoing`) — 신규

현재 청약 접수 중인 단지. 지도에서 가장 먼저 눈에 띄어야 한다.

**설계 근거**: 청약은 마감 시한이 있다. 시간의 긴박감을 pulse 애니메이션으로 표현. 파란 계열은 "진행 중 + 신뢰"의 시각 언어.

| 속성 | 값 |
|------|-----|
| 크기 | 마커 본체 min-width: 68px, height: 44px |
| 구조 | 상단: "청약중" + D-day / 하단: 분양가 |
| 상단 배경색 | `#1B64DA` |
| 상단 텍스트 | "청약중 D-{n}", font-size 10px, font-weight 800, color `#FFFFFF` |
| 하단 배경색 | `#F0F6FF` |
| 하단 텍스트 | 분양가 범위 (예: "7~12억"), font-size 11px, font-weight 700, color `#1B64DA` |
| border-radius | 10px |
| border | 2px solid `#1B64DA` |
| box-shadow | `0 3px 12px rgba(27,100,218,0.35)` |
| z-index | 30 (모든 일반 마커 위) |

**pulse 애니메이션 (CSS @keyframes)**
```css
@keyframes markerPulse {
  0%   { box-shadow: 0 0 0 0 rgba(27, 100, 218, 0.50); }
  60%  { box-shadow: 0 0 0 10px rgba(27, 100, 218, 0); }
  100% { box-shadow: 0 0 0 0 rgba(27, 100, 218, 0); }
}

/* 마커 외곽 ring 엘리먼트에 적용 */
.marker-pulse-ring {
  position: absolute;
  inset: -4px;
  border-radius: 14px;
  border: 2px solid rgba(27, 100, 218, 0.60);
  animation: markerPulse 2s ease-out infinite;
  pointer-events: none;
}
```

**구현 방법**: `useKakaoMap.ts`의 `updateMarkers`에서 DOM 생성 시,
`subOngoing` 타입이면 마커 wrapper에 `.marker-pulse-ring` div를 추가.
CSS 애니메이션은 `/index.css` 또는 별도 `map-markers.css`에 정의.

**말꼬리**: 하단 중앙, 삼각형 6×4px, 색상 `#1B64DA`

**선택(active) 상태**
- animation: 일시 정지 (`animation-play-state: paused`)
- box-shadow: `0 6px 24px rgba(27,100,218,0.55)`
- transform: `scale(1.10)`
- z-index: `60`

---

### E. 청약 예정 마커 (type: `subUpcoming`) — 신규

청약 시작 전, 예정 단지. 진행중보다 덜 긴박하지만 눈에는 띄어야 한다.

**설계 근거**: 진행중(파랑, 실선)과 구분을 위해 점선 테두리 + 흐린 파랑으로 "아직 시작 안 됨" 상태를 표현.

| 속성 | 값 |
|------|-----|
| 크기 | min-width: 68px, height: 44px |
| 구조 | 상단: "청약예정" + 날짜 / 하단: 분양가 |
| 상단 배경색 | `#5B9BD5` (진행중보다 연한 파랑) |
| 상단 텍스트 | "청약예정 M.D", font-size 10px, font-weight 700, color `#FFFFFF` |
| 하단 배경색 | `#F5F9FF` |
| 하단 텍스트 | 분양가 범위, font-size 11px, font-weight 600, color `#5B9BD5` |
| border-radius | 10px |
| border | 2px dashed `#5B9BD5` (점선으로 "미확정" 암시) |
| box-shadow | `0 2px 8px rgba(91,155,213,0.25)` |
| z-index | 25 (진행중보다 아래, HOT/신고가보다 위) |
| 애니메이션 | 없음 (진행중과 명확히 구분) |

**선택(active) 상태**
- border: `2px solid #5B9BD5` (점선 → 실선 전환)
- box-shadow: `0 4px 16px rgba(91,155,213,0.40)`
- transform: `scale(1.08)`
- z-index: `55`

---

### z-index 우선순위 요약

| 마커 타입 | 기본 z-index | 선택(active) z-index |
|-----------|-------------|---------------------|
| price (기본 가격) | 10 | 50 |
| allTimeHigh (신고가) | 20 | 55 |
| hot (HOT 단지) | 20 | 55 |
| subUpcoming (청약 예정) | 25 | 55 |
| subOngoing (청약 진행중) | 30 | 60 |

동일 z-index 충돌 시: `hot`과 `allTimeHigh`가 겹치면 `hot`을 21로 올림.

---

## 2. 필터 UI 명세

### 2-1. 필터 구조 설계

현재 필터는 가격대 단일 그룹. 이번 업데이트에서 3개 그룹으로 구분한다.

```
[그룹 1: 가격대]  전체 / 5억이하 / 5~10억 / 10억이상
[그룹 2: 레이어]  HOT / 신고가 / 청약          ← 신규 (다중 선택 가능)
[그룹 3: 평형]   59㎡ / 74㎡ / 84㎡ / 109㎡+  ← 신규 (단일 선택)
```

**그룹 2 (레이어) 선택 방식**: 각각 독립 ON/OFF 토글. 3개 동시 활성 가능.
**그룹 3 (평형) 선택 방식**: 단일 선택. "전체"는 아무것도 선택 안 한 상태와 동일.

---

### 2-2. 데스크탑 필터 레이아웃

위치: 좌측 사이드 패널 (`aside`) 헤더 영역. 현재 가격 필터 칩 (`mt-3 flex gap-2 flex-wrap`) 아래에 추가.

```
┌─────────────────────────────────────────┐
│  [Aptner 지도]     [← 뒤로]             │
│  [검색바                              ] │
│                                         │
│  가격대                                 │  ← 그룹 라벨 (신규)
│  [전체] [5억이하] [5~10억] [10억이상]   │
│                                         │
│  레이어                    활성 2  ← 뱃지│
│  [HOT ●] [신고가 ●] [청약]             │
│                                         │
│  평형                                   │
│  [59㎡] [74㎡] [84㎡] [109㎡+]         │
└─────────────────────────────────────────┘
```

**그룹 라벨 스펙**
- font-size: 11px
- font-weight: 600
- color: `#8B95A1`
- margin-bottom: 6px
- margin-top: 12px (첫 번째 그룹 제외)

**필터 칩 공통 스펙 (비활성)**
- height: 28px
- padding: 0 10px
- border-radius: 14px
- border: 1px solid `#E5E8EB`
- background: `#FFFFFF`
- font-size: 12px, font-weight: 600
- color: `#8B95A1`

**필터 칩 공통 스펙 (활성)**
- background: `#1B64DA`
- border: 1px solid `#1B64DA`
- color: `#FFFFFF`

**레이어 필터 칩 (활성 시 타입별 색상 차별화)**

| 레이어 | 활성 배경색 | 비고 |
|--------|------------|------|
| HOT | `#FF4136` | 마커 상단 색상과 일치 |
| 신고가 | `#F39C12` | 마커 상단 색상과 일치 |
| 청약 | `#1B64DA` | 마커 색상과 일치 |

**활성 필터 개수 뱃지**
- 위치: "레이어" 그룹 라벨 우측
- 형태: pill, height 16px, padding 0 6px, border-radius 8px
- 배경: `#1B64DA`
- 텍스트: 활성 개수 숫자 + "활성", font-size 10px, font-weight 700, color `#FFFFFF`
- 0개일 때: 미표시
- 예: 2개 활성 → "2 활성"

---

### 2-3. 모바일 필터 레이아웃

위치: 지도 위 상단 오버레이 영역. 현재 검색바 아래 가격 필터 행에 추가.

```
┌────────────────────────────────────────┐  (지도 위 오버레이)
│  [←] [검색바                         ] │
│  [전체][5억이하][5~10억][10억이상] →   │  행 1: 가격대 (가로 스크롤)
│  [HOT●][신고가●][청약] [2활성]   →    │  행 2: 레이어 (가로 스크롤)
│  [59㎡][74㎡][84㎡][109㎡+]      →    │  행 3: 평형 (가로 스크롤)
└────────────────────────────────────────┘
```

**모바일 3행 구조 이유**: 한 행에 모두 넣으면 칩이 너무 작아져 탭 오류가 발생한다. 행별 독립 가로 스크롤로 해결.

**각 행 스펙**
- display: `flex`, gap: `8px`
- overflow-x: `auto`, padding-bottom: `4px`
- 스크롤바 숨김: `scrollbar-width: none`
- 각 행 사이 gap: `8px`
- 모바일 칩 height: `32px` (터치 타겟 확보, 데스크탑 28px보다 4px 큼)
- 모바일 칩 padding: `0 12px`
- 각 칩: `flex-shrink: 0` 필수

**모바일 필터 영역 전체 컨테이너**
- background: 없음 (개별 칩에 `shadow-sm` 적용으로 지도와 분리)
- padding-top: 검색바 아래 `8px`

---

### 2-4. 상태 관리 확장 (`mapStore`)

```typescript
// stores/mapStore.ts 에 추가할 상태
interface MapStoreState {
  // 기존
  priceFilter: PriceFilter;

  // 신규
  layerFilters: {
    hot: boolean;
    allTimeHigh: boolean;
    subscription: boolean;
  };
  areaFilter: '59' | '74' | '84' | '109plus' | 'all';
}
```

---

## 3. 청약 정보 패널 명세

청약 마커(`subOngoing` / `subUpcoming`) 클릭 시,
기존 단지 바텀시트/사이드패널에 청약 전용 섹션을 **상단에 추가**한다.
(기존 단지 기본 정보는 하단에 그대로 유지)

### 3-1. 청약 상태 뱃지

| 상태 | 텍스트 | 배경색 | 텍스트색 | 크기 |
|------|--------|--------|----------|------|
| 진행중 | 청약 진행중 | `#E8F1FD` | `#1B64DA` | height 22px, padding 0 8px, border-radius 11px, font 11px 700 |
| 예정 | 청약 예정 | `#FFF4E5` | `#E67E22` | 동일 |

### 3-2. D-Day 표시

**진행중인 경우** (마감까지 남은 일수)
- 위치: 뱃지 우측 동일 행
- 형태: 텍스트만 (뱃지 아님)
- 텍스트: "D-{n}" (예: "D-3"), 마감 당일: "D-Day", 마감 초과: 미표시
- font-size: 14px, font-weight: 800
- color: D-7 이하 `#D63031` / D-8 이상 `#1B64DA`

**예정인 경우** (청약 시작까지 남은 일수)
- 텍스트: "D-{n} 후 시작"
- color: `#E67E22`

### 3-3. 분양가 범위

```
┌──────────────────────────────────┐
│  [청약 진행중]         D-3       │
│  분양가  7억 ~ 12.5억            │
│  공급    총 384세대               │
│  59㎡ 7억  /  84㎡ 10억  /  109㎡ 12.5억  │
└──────────────────────────────────┘
```

- 라벨("분양가", "공급"): font-size 12px, color `#8B95A1`, font-weight 500
- 값: font-size 13px, color `#191F28`, font-weight 700
- 평형별 분양가 행: font-size 12px, color `#8B95A1`, 구분자 `/`
- 섹션 하단 divider: 1px solid `#E5E8EB`, margin 12px 0

### 3-4. "청약 상세 보기" 버튼

- 위치: 청약 정보 섹션 하단, 기존 "상세보기" 버튼 위
- 스펙: height 40px, border-radius 10px, background `#1B64DA`, color `#FFFFFF`
- font-size 13px, font-weight 700
- 좌측 아이콘: 외부 링크 SVG (14×14px)
- 동작: `/subscription/{id}` 또는 청약홈 외부 링크

**모바일 바텀시트 전체 구조 (청약 마커 클릭 시)**
```
┌────────────────────────────────────┐
│  ▔▔▔ (드래그 핸들)                 │
│  래미안 원펜타스                    │  ← 단지명
│  서초구 반포동                      │  ← 주소
│  ─────────────────────────────────  │
│  [청약 진행중]               D-3   │  ← 청약 섹션 시작
│  분양가  7억 ~ 12.5억               │
│  공급    총 384세대                  │
│  [청약 상세 보기 →]                 │  ← 버튼
│  ─────────────────────────────────  │
│  최근 실거래  14.5억 (84㎡)         │  ← 기존 단지 정보
│  세대수  1,134  준공  2021  GS건설  │
│  [단지 상세보기]                    │
└────────────────────────────────────┘
```

---

## 4. 홈 화면 빈 상태 UI 명세

대상: `HomePage.tsx`의 "핫한 아파트 TOP 10" 섹션
현재 상태: `isAptLoading` 중 `CardSkeleton` × 4 표시, 데이터 없음 처리는 `EmptyState`(단순 텍스트)로 처리됨.

### 4-1. 스켈레톤 로딩 UI (개선)

현재 `CardSkeleton` 컴포넌트를 그대로 사용하되,
**핫 아파트 카드 구조에 맞는 전용 스켈레톤**으로 교체를 권장한다.

**`HotApartmentSkeleton` 컴포넌트 명세**

```
┌──────────────────────────────────┐  height: 76px
│  [  ] ████████████     ██████   │  rank circle(24px) + 단지명(70%) + 가격(30%)
│       ████████                  │  주소(40%)
│  ─────────────────────────────  │  divider
└──────────────────────────────────┘
```

| 요소 | 크기 | 색상 |
|------|------|------|
| rank 원형 | width 24px, height 24px, border-radius 12px | `#E5E8EB` |
| 단지명 행 | width 60~70% (랜덤), height 14px, border-radius 4px | `#E5E8EB` |
| 가격 행 | width 25%, height 14px, border-radius 4px | `#E5E8EB` |
| 주소 행 | width 40%, height 11px, border-radius 4px | `#F0F2F4` |
| shimmer 애니메이션 | `background: linear-gradient(90deg, #E5E8EB 25%, #F5F6F8 50%, #E5E8EB 75%)` |
| shimmer 속도 | `animation: shimmer 1.5s infinite linear` |

**shimmer @keyframes**
```css
@keyframes shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
.skeleton-shimmer {
  background-size: 800px 100%;
  animation: shimmer 1.5s infinite linear;
}
```

렌더링 개수: 모바일 3개, 데스크탑 6개 (현재 4개에서 조정)

---

### 4-2. 빈 상태 UI (개선)

현재 `EmptyState`는 텍스트만 있어 맥락이 부족하다.
핫 아파트 전용 빈 상태를 설계한다.

**`HotApartmentEmpty` 컴포넌트 명세**

```
┌──────────────────────────────────────────┐
│                                          │
│          [아파트 아이콘 SVG]             │  40×40px, color #E5E8EB
│                                          │
│     이번 주 핫한 아파트를 불러오는 중   │  font 14px, bold, #8B95A1
│     잠시 후 다시 확인해 주세요          │  font 12px, #8B95A1, margin-top 4px
│                                          │
│         [지도에서 직접 찾기 →]          │  버튼: height 36px, border-radius 18px
│                                          │  border 1px solid #1B64DA
│                                          │  color #1B64DA, font 13px 600
│                                          │
└──────────────────────────────────────────┘
```

- 컨테이너: background `#FFFFFF`, border-radius 12px, border `1px solid #E5E8EB`
- padding: 32px 16px
- 버튼 동작: `navigate('/map')` 호출

**빈 상태 진입 조건**
- `isAptLoading === false` AND `hotApartments.length === 0`

---

## 5. 필터-마커 레이어 논리 구조도

### 5-1. 마커 표시 결정 로직

마커를 표시할지 여부는 다음 3개 필터의 AND 조건으로 결정한다.

```
표시 여부 = isVisible(apt)

function isVisible(apt: MapApartment): boolean {
  return (
    passPriceFilter(apt) &&   // 가격대 필터
    passAreaFilter(apt) &&    // 평형 필터
    passLayerFilter(apt)      // 레이어 필터
  )
}
```

### 5-2. 가격대 필터 (기존)

```
priceFilter === 'all'    → 통과
priceFilter === 'under5' → apt.price < 50000 (만원)
priceFilter === '5to10'  → 50000 <= apt.price < 100000
priceFilter === 'over10' → apt.price >= 100000
```

### 5-3. 평형 필터 (신규)

```
areaFilter === 'all'     → 통과
areaFilter === '59'      → apt.area가 '59' 포함
areaFilter === '74'      → apt.area가 '74' 포함
areaFilter === '84'      → apt.area가 '84' 포함
areaFilter === '109plus' → apt.area가 '109' 이상 포함
```

평형 필터는 `MapApartment.area`(단일 문자열) 기준이 아닌,
백엔드가 내려주는 `areas: string[]` 배열로 처리해야 한다.
따라서 `MapApartment`에 `areas?: string[]` 필드 추가 필요. (BE 협의 필요)

### 5-4. 레이어 필터 (신규)

레이어 필터의 핵심 원칙:
**레이어가 하나라도 ON이면 → 해당 레이어 타입만 표시**
**레이어가 모두 OFF이면 → 전체 표시 (기본 가격 마커 포함)**

```
layerFilters = { hot: false, allTimeHigh: false, subscription: false }
모두 OFF → passPriceFilter + passAreaFilter 통과한 전체 표시 (type='price')

hot ON   → markerType === 'hot' 인 것만 추가 표시
신고가 ON → markerType === 'allTimeHigh' 인 것만 추가 표시
청약 ON  → markerType === 'subOngoing' OR 'subUpcoming' 인 것만 추가 표시
```

**레이어 필터가 활성일 때 기본 가격 마커 처리**
레이어가 ON되면, 해당 레이어 마커가 아닌 일반 단지는 표시하지 않는다.
이유: 지도가 복잡해지면 핵심 정보가 묻힌다. HOT만 보고 싶을 때 나머지는 노이즈.

### 5-5. 마커 타입 우선순위

같은 단지가 여러 레이어에 해당할 경우 (예: HOT이면서 신고가):
`subOngoing > subUpcoming > hot > allTimeHigh > price` 순으로 가장 높은 우선순위 타입의 마커만 표시.

### 5-6. 전체 시나리오 매트릭스

| 가격대 | 평형 | 레이어 HOT | 레이어 신고가 | 레이어 청약 | 표시 마커 |
|--------|------|-----------|-------------|------------|----------|
| all | all | OFF | OFF | OFF | 가격대 기준 전체 price 마커 |
| under5 | all | OFF | OFF | OFF | 5억 미만 price 마커 |
| all | 84 | OFF | OFF | OFF | 84㎡ 포함 단지의 price 마커 |
| all | all | ON | OFF | OFF | hot 마커만 |
| all | all | ON | ON | OFF | hot + allTimeHigh 마커 |
| all | all | OFF | OFF | ON | subOngoing + subUpcoming 마커 |
| all | all | ON | ON | ON | hot + allTimeHigh + 청약 마커 (가격 마커 숨김) |
| under5 | 84 | ON | OFF | OFF | 5억 미만 + 84㎡ + hot 조건 교집합 |

---

## 6. 타입 확장 명세 (FE/BE 공유)

`types/index.ts`에 추가할 타입 정의.

```typescript
// 마커 타입
export type MarkerType = 'price' | 'hot' | 'allTimeHigh' | 'subOngoing' | 'subUpcoming';

// 평형 필터 타입
export type AreaFilter = '59' | '74' | '84' | '109plus' | 'all';

// 레이어 필터 타입
export interface LayerFilters {
  hot: boolean;
  allTimeHigh: boolean;
  subscription: boolean;
}

// MapApartment 확장
export interface MapApartment {
  id: string;
  name: string;
  lat: number;
  lng: number;
  price: number;
  area: string;
  areas?: string[];              // 신규: 평형 필터용 전체 평형 목록
  priceChangeType: 'up' | 'down' | 'flat';
  markerType?: MarkerType;       // 신규: 마커 렌더링 타입 결정
  subDeadline?: string;          // 신규: 청약 마감일 YYYY-MM-DD
  subStartDate?: string;         // 신규: 청약 시작일 YYYY-MM-DD
  subId?: string;                // 신규: 청약 ID (Subscription 테이블 FK)
}

// mapStore 추가 상태
export interface MapLayerState {
  layerFilters: LayerFilters;
  areaFilter: AreaFilter;
}
```

---

## 7. 구현 우선순위 가이드

FE 팀 작업 순서 권고:

1. **P0** — 타입 확장 (`types/index.ts`) + `mapStore` 상태 추가
2. **P0** — 필터 UI (가격대 개선 + 레이어 + 평형 3행 구조)
3. **P1** — 마커 팩토리 함수 (`useKakaoMap.ts` 내 `createMarkerElement(apt, markerType)`)
4. **P1** — 마커 표시 로직 (`isVisible` 함수 구현)
5. **P1** — pulse CSS 애니메이션 (`index.css`)
6. **P2** — 청약 패널 바텀시트 확장
7. **P2** — 홈 화면 `HotApartmentSkeleton` + `HotApartmentEmpty`

---

*이 명세는 개발자가 디자이너 없이도 독립적으로 구현 가능하도록 작성되었습니다.*
*수치 외 시각적 판단이 필요한 경우 Aptner 디자인 시스템(PRD_v3.md)을 우선 참조하세요.*
