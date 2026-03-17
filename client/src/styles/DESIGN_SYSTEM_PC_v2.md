# 봄집(Bomzip) PC 웹 디자인 시스템 v2.0

**작성자**: 최지수 (Designer)
**기준일**: 2026-03-17
**대상 뷰포트**: 1024px 이상 (PC Web)
**참조 서비스**: 호갱노노, 아실, 직방

---

## 현재 코드의 문제점 진단

### 문제 1: 헤더 nav — WDS Button `variant="outlined" color="assistive"` 3개
```tsx
// HomePage.tsx L75–101 — 현재 코드
<Button variant="outlined" color="assistive" size="small" onClick={() => navigate('/map')}>지도</Button>
<Button variant="outlined" color="assistive" size="small" onClick={() => navigate('/subscription')}>청약</Button>
<Button variant="outlined" color="assistive" size="small" onClick={() => navigate('/trend')}>트렌드</Button>
```
**진단**: `assistive` 색상은 WDS에서 "보조적인 액션"용 토큰이다. 헤더 nav에 사용하면
outline 테두리가 강조되어 nav가 아닌 "작은 버튼 모음"처럼 보인다.
호갱노노 / 아실 모두 PC 헤더 nav는 텍스트 링크 또는 탭 형식을 사용한다.
**해결 방향**: WDS Button 제거 → Tailwind custom nav link로 교체

### 문제 2: 섹션 타이틀 `text-[28px] font-black` 전체 동일
```tsx
// HomePage.tsx L151, L221, L281 — 현재 코드
<h2 className="text-[28px] font-black tracking-[-0.02em] text-[#191F28]">이번 주 HOT</h2>
<h2 className="text-[28px] font-black tracking-[-0.02em] text-[#191F28]">마감 임박 청약</h2>
<h2 className="text-[28px] font-black tracking-[-0.02em] text-[#191F28]">지역 시세</h2>
```
**진단**: PC에서 좌측 메인 콘텐츠(HOT 랭킹)와 우측 사이드패널(청약, 지역 시세)이
동일한 28px font-black을 사용한다. 시각적 위계가 전혀 없다.
좌측 주 섹션 H1급 vs 우측 서브 섹션 H2급으로 구분해야 한다.
**해결 방향**: PC 브레이크포인트에서 좌측 24px, 우측 18px로 분리

### 문제 3: WDS 색상 오버라이드 불완전
```css
/* design-tokens.css L300–314 — 현재 코드 */
--semantic-primary-normal: #2E7D52;
--semantic-label-normal: #191F28;
```
**진단**: `--semantic-primary-foreground`, `--semantic-background-primary`,
`--semantic-line-normal` 등 다수 토큰이 미오버라이드 상태.
WDS TextButton `color="primary"`에서 #0066FF가 노출되는 원인.
**해결 방향**: 섹션 5에서 전체 오버라이드 맵 명시

### 문제 4: CompactApartmentRow 하락 색상 불일치
```tsx
// HomePage.tsx L443, ApartmentCard.tsx L28 — 현재 코드
const priceColor = isDown ? 'text-[#00C896]' : ...  // 초록 (이상함)
// design-tokens.css L33
--color-price-down: #3B82F6;  // 파랑 (맞음)
```
**진단**: 토큰은 `#3B82F6`(파랑)인데 컴포넌트에서 `#00C896`(청록)을 하드코딩.
부동산 컨벤션(하락=파랑)에 맞지 않고 토큰과도 불일치.
**해결 방향**: `text-[#00C896]` 전체 제거 → `text-[#3B82F6]`으로 통일

---

## 1. 색상 시스템

### 1-1. Primary 팔레트 — #2E7D52 기준 5단계

| 단계 | 토큰명 | Hex | 사용처 |
|------|--------|-----|--------|
| 50 | `--color-primary-50` | `#F0FDF6` | hover 배경, 선택 row 배경 |
| 100 | `--color-primary-100` | `#DCFCE8` | chip 배경, badge 배경 (진행 중) |
| 300 | `--color-primary-300` | `#6EE7A4` | 아이콘 보조, 라인 강조 |
| 500 | `--color-primary-500` | `#2E7D52` | Primary 기본값, 버튼, 링크 |
| 700 | `--color-primary-700` | `#166534` | hover/pressed 상태, 짙은 강조 |

**근거**: #2E7D52는 HSL(146, 46%, 34%)이다. 50/100단계는 S를 낮추고 L을 90% 이상으로
올려 배경 오염 없이 사용한다. 700단계는 L을 20%로 내려 대비를 확보한다.

### 1-2. Neutral 팔레트

| 역할 | 토큰명 | Hex | 사용처 |
|------|--------|-----|--------|
| 텍스트 Primary | `--color-text-primary` | `#191F28` | 단지명, 가격, 헤더 타이틀 |
| 텍스트 Secondary | `--color-text-secondary` | `#4E5968` | 위치, 부제목, 설명 |
| 텍스트 Tertiary | `--color-text-tertiary` | `#8B95A1` | 면적, caption, placeholder |
| 텍스트 Disabled | `--color-text-disabled` | `#C9D1D9` | 비활성 버튼 텍스트 |
| 구분선 | `--color-border-default` | `#E5E8EB` | 카드 테두리, row 구분선 |
| 구분선 Strong | `--color-border-strong` | `#D1D5DB` | 입력 필드 테두리, 섹션 구분 |
| 배경 Page | `--color-bg-page` | `#F7FAF8` | 전체 페이지 배경 |
| 배경 Card | `--color-bg-card` | `#FFFFFF` | 카드, 패널 배경 |
| 배경 Subtle | `--color-bg-subtle` | `#F5F6F8` | 비활성 영역, 인풋 배경 |

### 1-3. Semantic 색상

| 역할 | 토큰명 | Hex | 배경 Hex | 사용처 |
|------|--------|-----|----------|--------|
| 상승 (가격 UP) | `--color-price-up` | `#FF4B4B` | `#FFF3F3` | ▲ 상승, D-Day 뱃지 |
| 하락 (가격 DOWN) | `--color-price-down` | `#3B82F6` | `#EFF6FF` | ▼ 하락 |
| 보합 | `--color-price-neutral` | `#8B95A1` | — | 변동 없음 |
| 주의 (Warning) | `--color-warning` | `#F59E0B` | `#FFFBEB` | D-7 뱃지, 유의사항 |
| 성공 (Success) | `--color-success` | `#2E7D52` | `#F0FDF6` | 청약 진행 중 상태 |
| 오류 (Error) | `--color-error` | `#DC2626` | `#FEF2F2` | 오류 메시지, 마감 초과 |

**부동산 컨벤션**: 국내 부동산/증권 서비스 표준 — 상승=빨강, 하락=파랑.
하락에 초록(`#00C896`) 절대 사용 금지. 현재 코드 `text-[#00C896]` 전량 제거 대상.

### 1-4. WDS Semantic Token 전체 오버라이드 맵

아래 토큰을 `design-tokens.css :root` 내에 추가해야 Wanted 파랑이 완전히 차단된다.

```css
/* WDS Primary — 봄집 초록으로 전면 교체 */
--semantic-primary-normal:           #2E7D52;
--semantic-primary-normal-rgb:       46, 125, 82;
--semantic-primary-strong:           #166534;
--semantic-primary-strong-rgb:       22, 101, 52;
--semantic-primary-heavy:            #14532D;
--semantic-primary-heavy-rgb:        20, 83, 45;
--semantic-primary-foreground:       #FFFFFF;

/* WDS Background Primary (filled 버튼 배경) */
--semantic-background-primary:       #2E7D52;
--semantic-background-primary-hover: #166534;

/* WDS Label Primary (텍스트 링크, TextButton) */
--semantic-label-normal:             #191F28;
--semantic-label-alternative:        #4E5968;
--semantic-label-assistive:          #8B95A1;
--semantic-label-disable:            #C9D1D9;

/* WDS Line (구분선) */
--semantic-line-normal:              #E5E8EB;
--semantic-line-strong:              #D1D5DB;

/* WDS Fill (입력 필드 배경) */
--semantic-fill-normal:              #F5F6F8;
--semantic-fill-strong:              #E5E8EB;

/* WDS Static Interaction */
--semantic-primary-opacity-8:        rgba(46, 125, 82, 0.08);
--semantic-primary-opacity-16:       rgba(46, 125, 82, 0.16);
```

---

## 2. 타이포그래피 위계

**기본 원칙**: PC 뷰포트에서는 모바일 대비 1단계 상향. 모바일 display=28px → PC display=40px.

### 2-1. PC 타이포그래피 스케일 (Pretendard)

| 레벨 | 토큰명 (PC 추가) | Size | Weight | Line-height | Letter-spacing | 사용처 |
|------|----------------|------|--------|-------------|----------------|--------|
| Display | `--font-size-display-pc` | 40px | 800 (ExtraBold) | 1.15 | -0.03em | 히어로 배너 타이틀 (현재 미사용) |
| H1 | `--font-size-h1-pc` | 28px | 700 (Bold) | 1.25 | -0.02em | 좌측 메인 섹션 타이틀 "이번 주 HOT" |
| H2 | `--font-size-h2-pc` | 20px | 700 (Bold) | 1.3 | -0.01em | 우측 패널 섹션 타이틀 "마감 임박 청약" |
| H3 | `--font-size-h3-pc` | 17px | 600 (SemiBold) | 1.35 | 0em | 카드 단지명, 모달 소제목 |
| Body1 | 기존 유지 | 15px | 400 | 1.5 | 0em | 본문 텍스트, 설명 |
| Body2 | 기존 유지 | 13px | 400 | 1.5 | 0em | 보조 설명, 위치 텍스트 |
| Caption | 기존 유지 | 11px | 400 | 1.4 | +0.01em | 면적, 날짜, 단위 |
| Label | 기존 유지 | 13px | 600 | 1.2 | +0.01em | 버튼, 뱃지, 탭 |

### 2-2. Price 전용 타이포그래피 (JetBrains Mono)

| 레벨 | Size | Weight | 사용처 |
|------|------|--------|--------|
| Price-XL | 32px | 700 | 히어로 카드 현재가 (1위) |
| Price-LG | 24px | 700 | 상세 페이지 현재가 |
| Price-MD | 17px | 600 | CompactRow 가격, 청약 분양가 |
| Price-SM | 13px | 600 | 지역 시세 칩 평균가, caption 가격 |

**필수 속성**: 모든 Price 텍스트에 `font-variant-numeric: tabular-nums` 적용.
숫자 자릿수가 바뀌어도 레이아웃이 흔들리지 않는다.

### 2-3. 현재 코드의 타이포 오류 목록

| 파일 | 라인 | 현재 | 수정 후 |
|------|------|------|---------|
| HomePage.tsx | 151 | `text-[28px] font-black` | `text-[28px] font-bold md:text-[28px]` (H1-pc) |
| HomePage.tsx | 221 | `text-[28px] font-black` | `text-[18px] font-bold` (H2-pc) |
| HomePage.tsx | 281 | `text-[28px] font-black` | `text-[18px] font-bold` (H2-pc) |
| HeroApartmentCard.tsx | 67 | `text-[22px] font-bold` | `text-[22px] font-bold md:text-[26px]` |
| HeroApartmentCard.tsx | 84 | `text-[28px] font-black font-mono` | Price-XL: `text-[32px] font-bold` (JetBrains) |

---

## 3. 컴포넌트 명세

### 3-1. Header

**높이**: 64px (현재 `--layout-header-height` 64px — 유지)
**sticky**: `position: sticky; top: 0; z-index: 30`
**배경**: `#FFFFFF`
**하단 border**: `border-bottom: 1px solid #E5E8EB`
**shadow**: `box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06)` — 현재 0.04보다 약간 강하게

**내부 레이아웃** (max-width 1280px 컨테이너 내):
```
[로고 160px] [gap 32px] [검색바 flex-1 max-width 480px] [gap 32px] [nav auto] [gap 16px] [우측 액션 auto]
```

**로고 영역**:
- BomzipLogo size="md": 32px height
- 슬로건 텍스트: 13px / color `#8B95A1` / weight 400 — 로고 우측 (현재 md:block 유지)
- 슬로건은 1280px 이상에서만 표시 (`xl:block hidden` 으로 변경 권장)

**검색바** (PC):
- height: 44px (현재 `--layout-search-bar-height` 44px — 유지)
- border-radius: 22px (pill shape)
- border: `1px solid #E5E8EB`
- focus border: `1px solid #2E7D52`
- background: `#F5F6F8`
- placeholder: 13px / `#8B95A1`
- 내부 패딩: 좌 16px (아이콘 포함 시 44px) / 우 16px
- 아이콘: 20x20px / `#8B95A1`

**Nav (PC 전용 — WDS Button 제거 후 교체)**:
```
nav: display flex, gap 4px, align-items center
nav-link: height 36px, padding 0 12px, border-radius 8px
nav-link 기본: font-size 14px, font-weight 500, color #4E5968, background transparent
nav-link hover: background #F0FDF6, color #2E7D52
nav-link active(현재 경로): background #DCFCE8, color #2E7D52, font-weight 600
```

**WDS Button 제거 근거**: `variant="outlined" color="assistive"`는 outline 테두리가
시각적으로 너무 강해 nav의 가벼운 느낌을 해친다. 호갱노노/아실 모두 nav는
텍스트 링크나 탭 형식이다. PC nav에 bordered 버튼은 부동산 서비스 UX 패턴에 맞지 않는다.

**우측 액션 영역**:
- 찜 아이콘: WDS IconButton `variant="normal"` — 유지
- 로그인/가입: 추후 기획 시 WDS Button `variant="outlined" color="primary"` size="small"

---

### 3-2. HOT 랭킹 카드

#### 3-2-A. 1위 히어로 카드 (HeroApartmentCard)

**PC에서의 목표**: 좌측 콘텐츠 영역의 메인 포컬 포인트.
보지 않아도 눈에 들어와야 한다.

```
컨테이너:
  width: 100% (부모 그리드 좌측 1fr에 꽉 채움)
  min-height: 160px
  padding: 24px
  background: #FFFFFF
  border-radius: 16px (--radius-xl)
  border-left: 4px solid #FFD700
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.10)
  hover: box-shadow → 0 8px 40px rgba(0, 0, 0, 0.14), translateY(-2px)
  transition: 200ms ease (box-shadow, transform)
  cursor: pointer

상단 행 (1위 뱃지 + 순위 변동):
  gap: 8px, align-items center, justify-content space-between
  1위 뱃지: background #FFD700, color #191F28, font-size 12px, font-weight 700
            padding 4px 8px, border-radius 6px
  순위변동(NEW): background #2E7D52, color white, font-size 11px, padding 3px 8px, border-radius 10px
  순위변동(▲N): font-size 13px, color #FF4B4B, font-weight 700
  순위변동(▼N): font-size 13px, color #3B82F6, font-weight 700

단지명:
  font-size: 22px (PC: 26px — md:text-[26px] 추가)
  font-weight: 700
  color: #191F28
  margin-top: 12px
  line-height: 1.25

최고가 경신 뱃지 (조건부):
  background: #FEF2F2
  color: #DC2626
  border: 1px solid rgba(220, 38, 38, 0.20)
  font-size: 11px, font-weight 700
  height: 20px, padding: 0 8px, border-radius: 10px
  이모지 제거 → 텍스트만: "최고가 경신"

위치 텍스트:
  font-size: 13px, color #8B95A1, margin-top 4px

가격 행:
  margin-top: 20px
  현재가: font-family JetBrains Mono, font-size 32px, font-weight 700, color #191F28
  변동률: font-size 14px, margin-left 8px, margin-bottom 4px (하단 정렬)
          상승: color #FF4B4B / 하락: color #3B82F6

면적 caption:
  font-size: 11px, color #8B95A1, margin-top 4px
```

#### 3-2-B. 2~5위 컴팩트 행 (CompactApartmentRow)

```
컨테이너:
  height: 64px (현재 min-h-[56px] → 64px로 상향)
  padding: 0 20px
  display: flex, align-items center, gap 12px
  border-bottom: 1px solid #F2F4F6
  cursor: pointer
  hover: background #F7FAF8
  active: background #F0FDF6
  last-child border-bottom: none

순위 뱃지 영역:
  width: 28px, flex-shrink: 0
  2위: circle 24px, background #C0C0C0, color white, font-size 11px, font-weight 700
  3위: circle 24px, background #CD7F32, color white, font-size 11px, font-weight 700
  4~5위: font-size 14px, font-weight 700, color #8B95A1, text-align center

단지명 + 위치:
  flex: 1, min-width: 0
  단지명: 14px / 600 / #191F28 / truncate
  위치: 12px / 400 / #8B95A1 / truncate / margin-top 2px
  HOT 태그: 높이 18px, font-size 10px (현재 HotTag 컴포넌트 유지)

가격 영역:
  flex-shrink: 0, text-align: right
  가격: font-family JetBrains Mono, 15px / 700 / #191F28
  변동률: 11px / 600 / 상승 #FF4B4B / 하락 #3B82F6 / margin-top 2px
```

**2~5위 컨테이너 카드**:
```
background: #FFFFFF
border-radius: 16px (--radius-xl)
border: 1px solid #E5E8EB
margin-top: 12px
overflow: hidden
```

---

### 3-3. 청약 List Row (UrgentSubscriptionCard)

```
컨테이너:
  height: 76px (현재 min-h-[72px] → 76px 고정)
  padding: 0 16px
  display: flex, align-items center, gap 12px
  border-radius: 12px (--radius-lg)
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08)
  cursor: pointer
  hover: box-shadow → 0 2px 8px rgba(0, 0, 0, 0.12), translateY(-1px)
  transition: 150ms ease

긴박 카드 (D-3 이내):
  background: linear-gradient(to bottom right, #FFF8F8, #FFFFFF)
  border-left: 3px solid #FF4B4B
  border: none (left만)

일반 카드:
  background: #FFFFFF
  border: 1px solid #E5E8EB

D-day 뱃지 영역:
  width: 52px, flex-shrink: 0, justify-content: center

단지명 영역:
  flex: 1, min-width: 0
  단지명: 15px / 600 / #191F28 / truncate / line-height 1.3
  부제목: 12px / 400 / #8B95A1 / truncate / margin-top 2px

분양가 + 세대수:
  flex-shrink: 0, text-align: right
  분양가: font-family JetBrains Mono, 15px / 700 / #2E7D52
  세대수: 11px / 400 / #8B95A1 / margin-top 2px
```

---

### 3-4. D-Day 뱃지 (DdayBadge)

```
공통:
  height: 28px
  border-radius: 8px
  padding: 0 8px
  font-family: JetBrains Mono
  font-size: 13px
  font-weight: 700
  display: inline-flex, align-items center, justify-content center
  min-width: 52px

D-Day / D-1 / D-2 / D-3 (dDay 0~3):
  background: #FF4B4B
  color: #FFFFFF
  pulse dot: 8px circle, color #FF4B4B, animation pulse 1.5s infinite
             dot와 뱃지 사이 gap: 4px

D-4 ~ D-7:
  background: #F59E0B
  color: #FFFFFF
  (pulse dot 없음)

D-8 ~ D-14:
  background: #DCFCE8
  color: #2E7D52
  (pulse dot 없음)

D-15 이상:
  background: #F5F6F8
  color: #8B95A1

마감:
  background: #F5F6F8
  color: #C9D1D9
  text: "마감"
```

---

### 3-5. 지역 시세 칩 (RegionChip)

```
컨테이너:
  height: 52px
  border-radius: 26px (pill)
  padding: 0 16px
  display: inline-flex, align-items center, gap 8px
  flex-shrink: 0
  cursor: pointer
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08)
  hover: box-shadow → 0 2px 8px rgba(0, 0, 0, 0.12), translateY(-1px)
  active: scale 0.96
  transition: 150ms ease

상승 칩:
  background: #FFF3F3
  border: 1px solid rgba(255, 75, 75, 0.25)

하락 칩:
  background: #EFF6FF
  border: 1px solid rgba(59, 130, 246, 0.25)

보합 칩:
  background: #FFFFFF
  border: 1px solid #E5E8EB

지역명: 13px / 600 / #191F28
평균가: font-family JetBrains Mono, 13px / 700 / #191F28
변동률: 11px / 600 / 상승 #FF4B4B / 하락 #3B82F6 / 보합 #8B95A1

PC 레이아웃:
  flex-wrap: wrap (현재 md:flex-wrap 유지)
  gap: 8px
```

**현재 코드 오류**: `RegionChip.tsx L22` 하락 배경 `#F0FBF7`(초록 tint) 사용.
하락=파랑 컨벤션에 맞게 `#EFF6FF`(파랑 tint)로 교체 필요.
하락 border `rgba(#00C896, 0.30)` → `rgba(59, 130, 246, 0.25)`로 교체 필요.

---

## 4. PC 레이아웃 명세

### 4-1. 최대 너비 및 컨테이너

```
max-width: 1280px
margin: 0 auto
padding-x: 32px (1024px~) / 40px (1280px~)
```

**현재 코드**: `max-w-6xl` = 1152px. **1280px로 상향 필요**.
호갱노노 기준 1280px, 아실 기준 1200px. 1280px이 정보 밀도 면에서 유리하다.

### 4-2. 2열 그리드

```css
/* PC 2열 레이아웃 */
.home-grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 40px;
  padding-top: 32px;
}
```

**좌측(1fr)**: 최소 680px — HOT 랭킹 메인 콘텐츠
**우측(380px)**: 고정 — 청약 사이드 패널 (현재 360px → 380px로 20px 상향)
**gap**: 40px (현재 gap-8 = 32px → 40px로 확대)

**근거**: 우측 380px는 청약 카드(flex row) + padding 16px*2 = 348px 콘텐츠 + 여유.
760px 이하 브레이크포인트에서는 1열로 전환 (`grid-cols-1`).

### 4-3. 섹션 간격

| 위치 | 값 | 설명 |
|------|-----|------|
| 헤더 하단 ~ 그리드 시작 | 32px (`pt-8`) | 현재 `md:pt-8` 유지 |
| 섹션 타이틀 ~ 콘텐츠 | 16px (`mb-4`) | 현재 유지 |
| 히어로 카드 ~ 컴팩트 리스트 | 12px (`mt-3`) | 현재 유지 |
| 우측 섹션 간격 | 32px (`space-y-8`) | 현재 `space-y-6` → `space-y-8` |
| 지도 배너 상단 | 48px (`mt-12`) | 현재 `mt-6 md:mt-8` → `md:mt-12` |

### 4-4. 헤더 Sticky 동작

```
position: sticky
top: 0
z-index: 30 (--z-sticky 20에서 30으로 상향 — 드롭다운이 헤더 위로 올라오는 현상 방지)
background: rgba(255, 255, 255, 0.95)
backdrop-filter: blur(8px)
-webkit-backdrop-filter: blur(8px)
border-bottom: 1px solid #E5E8EB
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06)
transition: box-shadow 200ms ease
```

**스크롤 시 shadow 강화**:
```
scroll 0: box-shadow: none, border-bottom: 1px solid #E5E8EB
scroll > 4px: box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08), border-bottom: 1px solid transparent
```
JavaScript `IntersectionObserver` 또는 `scroll` 이벤트로 `data-scrolled` attribute 토글 후
CSS `[data-scrolled] header` 선택자로 처리.

### 4-5. 콘텐츠 영역 패딩

```
PC (1024px+): padding-x 32px
Wide (1280px+): 컨테이너 max-width 1280px으로 중앙 정렬 — padding-x 40px
```

---

## 5. WDS 사용 원칙

### 5-1. WDS를 반드시 쓸 곳

| 컴포넌트 | WDS 컴포넌트 | 이유 |
|----------|-------------|------|
| 모바일 하단 내비게이션 | `BottomNavigation`, `BottomNavigationItem` | 접근성(aria), iOS safe area 자동 처리 |
| 모바일 검색 아이콘 버튼 | `IconButton variant="normal"` | 터치 영역 44px 자동 보장 |
| 토스트 / 스낵바 | WDS Toast (있을 경우) | 애니메이션, z-index 관리 복잡도 높음 |
| 아이콘 | `@wanteddev/wds-icon` 전체 | SVG 일관성, 크기/색상 토큰 연동 |
| 텍스트 링크 버튼 ("전체 보기") | `TextButton color="primary"` | hover underline, focus ring 자동 |
| 체크박스, 라디오, 스위치 | WDS 폼 컴포넌트 | 접근성(role, aria-checked) 자동 |
| 모달 / 바텀시트 | WDS BottomSheet (있을 경우) | focus trap, ESC 닫기, 스크롤 lock |

### 5-2. Tailwind custom으로 직접 만들 곳

| 컴포넌트 | 이유 |
|----------|------|
| PC 헤더 nav 링크 | WDS Button/TextButton의 테두리/padding 구조가 nav 링크 패턴에 맞지 않음. height 36px pill 형태로 자유로운 커스텀 필요 |
| HOT 1위 히어로 카드 | border-left 4px gold, 복잡한 내부 레이아웃. WDS Card가 이 패턴을 지원하지 않음 |
| 2~5위 CompactRow | 리스트 행 패턴 — WDS에 대응 컴포넌트 없음 |
| 지역 시세 칩 (RegionChip) | pill형 복합 정보 칩. WDS Chip은 단순 label용으로 가격+변동률 복합 구조 불가 |
| D-Day 뱃지 | 단계별 색상 로직이 있어 WDS Badge로 구현 시 className override 남발됨 |
| 가격 텍스트 | JetBrains Mono + tabular-nums — WDS typography 시스템과 별도 운영 |
| 지도 배너 버튼 | gradient background — WDS Button이 지원하지 않는 형태 |
| HotTag | 서비스 고유 컨텍스트(거래량급증, 신고가 등). WDS Badge와 의미 다름 |

### 5-3. WDS 절대 쓰지 말 곳

| 컴포넌트 | 금지 이유 |
|----------|----------|
| PC 헤더 nav `Button variant="outlined" color="assistive"` | 이미 문제 진단 완료. outlined border가 nav를 button group처럼 보이게 함. 호갱노노/아실/직방 모두 이 패턴 미사용. WDS token override해도 `outlined` 특유의 테두리 weight가 nav에 어색함 |
| 카드 컨테이너에 WDS Card | WDS Card는 padding/radius가 고정되어 있어 border-left 강조선, gradient background 등 봄집 특화 스타일 적용이 불가하거나 `!important` 남발로 이어짐 |
| 가격 표시에 WDS Typography | WDS Typography는 Pretendard 기반. JetBrains Mono tabular-nums 강제 적용이 필요한 가격 영역에 사용하면 폰트 override 충돌 발생 |
| 섹션 타이틀에 WDS Heading | PC/모바일 크기 분기가 필요한데 WDS Heading은 반응형 크기 커스텀 API 미지원 |

---

## 6. design-tokens.css 추가/수정 명세

현재 파일에 아래 내용을 추가해야 한다.

### 6-1. Primary 팔레트 5단계 추가

```css
/* :root 내 --color-primary 블록에 추가 */
--color-primary-50:   #F0FDF6;
--color-primary-100:  #DCFCE8;
--color-primary-300:  #6EE7A4;
--color-primary-500:  #2E7D52;  /* 기존 --color-primary와 동일 */
--color-primary-700:  #166534;  /* 기존 --color-primary-dark와 동일 */
```

### 6-2. Text / Border 토큰 명시화

```css
/* Neutral — Text */
--color-text-primary:    #191F28;
--color-text-secondary:  #4E5968;
--color-text-tertiary:   #8B95A1;
--color-text-disabled:   #C9D1D9;

/* Neutral — Border */
--color-border-default:  #E5E8EB;
--color-border-strong:   #D1D5DB;

/* Semantic */
--color-warning:         #F59E0B;
--color-warning-bg:      #FFFBEB;
--color-success:         #2E7D52;
--color-success-bg:      #F0FDF6;
--color-error:           #DC2626;
--color-error-bg:        #FEF2F2;
```

### 6-3. PC 타이포그래피 토큰 추가

```css
/* @media (min-width: 1024px) :root 블록에 추가 */
--font-size-display-pc:  40px;
--font-size-h1-pc:       28px;
--font-size-h2-pc:       20px;  /* 현재 --font-size-h2와 동일이지만 명시 */

/* Price 전용 */
--font-size-price-xl:    32px;
--font-size-price-lg:    24px;
--font-size-price-md:    17px;
--font-size-price-sm:    13px;
```

### 6-4. PC 레이아웃 토큰 추가

```css
/* @media (min-width: 1024px) :root 블록에 추가 */
--layout-max-width:         1280px;
--layout-content-padding-x: 32px;
--layout-grid-gap:          40px;
--layout-sidebar-width:     380px;
--layout-section-gap:       32px;

/* @media (min-width: 1280px) :root 블록에 추가 */
--layout-content-padding-x: 40px;
```

### 6-5. WDS 오버라이드 누락 토큰 추가 (현재 :root 末尾에 추가)

```css
--semantic-background-primary:       #2E7D52;
--semantic-background-primary-hover: #166534;
--semantic-line-normal:              #E5E8EB;
--semantic-line-strong:              #D1D5DB;
--semantic-fill-normal:              #F5F6F8;
--semantic-fill-strong:              #E5E8EB;
--semantic-primary-opacity-8:        rgba(46, 125, 82, 0.08);
--semantic-primary-opacity-16:       rgba(46, 125, 82, 0.16);
```

---

## 7. 구현 우선순위

| 순위 | 작업 | 파일 | 임팩트 |
|------|------|------|--------|
| P0 | 하락 색상 `#00C896` → `#3B82F6` 전체 교체 | HomePage.tsx, ApartmentCard.tsx, HeroApartmentCard.tsx, RegionChip.tsx | 부동산 컨벤션 오류 수정 |
| P0 | WDS 토큰 오버라이드 누락분 추가 | design-tokens.css | Wanted 파랑 완전 차단 |
| P1 | 헤더 nav WDS Button → custom nav link 교체 | HomePage.tsx | 전문성 체감 개선 |
| P1 | 섹션 타이틀 위계 분리 (28px 획일 → 좌28/우18) | HomePage.tsx | 정보 위계 확립 |
| P1 | 히어로 카드 가격 JetBrains 32px 적용 | HeroApartmentCard.tsx | 숫자 가독성 개선 |
| P1 | max-width 1152 → 1280px | HomePage.tsx | PC 정보 밀도 개선 |
| P2 | RegionChip 하락 배경 파랑 tint 교체 | RegionChip.tsx | 색상 컨벤션 일관성 |
| P2 | grid gap 32 → 40px, sidebar 360 → 380px | HomePage.tsx | 레이아웃 여유감 개선 |
| P2 | PC 타이포그래피 토큰 추가 | design-tokens.css | 개발자 참조 명세 확립 |
| P2 | 섹션 간격 `space-y-6` → `space-y-8` (우측 패널) | HomePage.tsx | 우측 패널 숨통 개선 |
