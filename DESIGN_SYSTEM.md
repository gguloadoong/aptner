# Aptner Design System v1.0

**작성일**: 2026-03-14
**작성자**: Senior UI/UX Designer
**대상**: FE 개발팀 (즉시 구현 가능한 수치 기준)
**기준 뷰포트**: 375px (iPhone SE / 모바일 퍼스트)

---

## 1. 디자인 원칙

### 원칙 1 — 숫자가 먼저 눈에 들어와야 한다
가격, 변동률, D-day는 항상 시각 계층의 최상위에 위치한다. 아파트 거래가는 1초 안에 읽혀야 한다.

### 원칙 2 — 정보 밀도 우선, 장식은 최소화
카드 하나에 필요한 정보를 모두 담되, 불필요한 구분선·아이콘·레이블을 제거한다. 여백은 정보를 분리하기 위한 도구이지 미관용이 아니다.

### 원칙 3 — 상승/하락은 색상으로 즉시 판단 가능해야 한다
빨강(상승), 초록(하락)의 컨벤션은 국내 부동산 시장 사용자에게 이미 학습되어 있다. 이 규칙을 일관되게 적용한다.

### 원칙 4 — 지도와 리스트는 동등한 1등 시민
사용자는 지도로 탐색하다가 리스트로 비교하고, 다시 지도로 돌아온다. 두 모드 간 전환이 자연스러워야 한다.

### 원칙 5 — 모바일 엄지 존 기반 인터랙션
핵심 액션(마커 탭, 상세보기, 필터 선택)은 화면 하단 60% 영역에 배치한다. 상단은 탐색, 하단은 결정 영역이다.

---

## 2. 컬러 팔레트

### 브랜드 컬러
| 토큰명 | Hex | 용도 |
|--------|-----|------|
| `--color-primary` | `#1B64DA` | 주요 버튼, 링크, 활성 탭, 지도 마커(기본), 차트 라인 |
| `--color-primary-light` | `#EBF1FC` | 활성 탭 배경, 선택된 칩 배경 |
| `--color-primary-dark` | `#1451B5` | 버튼 hover/press 상태 |

### 가격 변동 컬러 (국내 부동산 컨벤션)
| 토큰명 | Hex | 용도 |
|--------|-----|------|
| `--color-price-up` | `#FF4B4B` | 가격 상승, 상승 마커, 양수 변동률 |
| `--color-price-up-bg` | `#FFF3F3` | 상승 마커 배경, 상승 배지 배경 |
| `--color-price-down` | `#00C896` | 가격 하락, 하락 마커, 음수 변동률 |
| `--color-price-down-bg` | `#F0FBF7` | 하락 마커 배경, 하락 배지 배경 |
| `--color-price-neutral` | `#8B95A1` | 보합, 변동 없음 |

### 중립 컬러 (Grey Scale)
| 토큰명 | Hex | 용도 |
|--------|-----|------|
| `--color-gray-900` | `#191F28` | 본문 제목, 가장 중요한 텍스트 |
| `--color-gray-800` | `#333D4B` | 본문 기본 텍스트 |
| `--color-gray-600` | `#4E5968` | 보조 텍스트, 라벨 |
| `--color-gray-400` | `#8B95A1` | Placeholder, 비활성 텍스트 |
| `--color-gray-200` | `#E5E8EB` | 구분선, 차트 그리드, 비활성 경계 |
| `--color-gray-100` | `#F2F4F6` | 비활성 버튼 배경, 스켈레톤 |
| `--color-gray-50` | `#F5F6F8` | 검색바 배경, 입력 필드 배경 |
| `--color-white` | `#FFFFFF` | 카드 배경, 모달 배경, 네비 배경 |

### 시맨틱 컬러 (상태 표현)
| 토큰명 | Hex | 용도 |
|--------|-----|------|
| `--color-status-active` | `#1B64DA` | 진행 중 청약 배지 |
| `--color-status-upcoming` | `#F59E0B` | 청약 예정 배지 |
| `--color-status-closed` | `#8B95A1` | 마감 청약 배지 |
| `--color-dday-urgent` | `#FF4B4B` | D-3 이내 마감 임박 |
| `--color-dday-soon` | `#F59E0B` | D-7 이내 |
| `--color-dday-normal` | `#4E5968` | 그 외 D-day |

### 랭킹 메달 컬러
| 토큰명 | Hex | 용도 |
|--------|-----|------|
| `--color-rank-gold` | `#FFD700` | 1위 순위 배경 |
| `--color-rank-silver` | `#C0C0C0` | 2위 순위 배경 |
| `--color-rank-bronze` | `#CD7F32` | 3위 순위 배경 |

### 배경 컬러
| 토큰명 | Hex | 용도 |
|--------|-----|------|
| `--color-bg-page` | `#F5F6F8` | 페이지 전체 배경 |
| `--color-bg-card` | `#FFFFFF` | 카드, 모달, 바텀시트 배경 |
| `--color-bg-overlay` | `rgba(0,0,0,0.5)` | 모달/바텀시트 오버레이 |

### 청약 배너 그라디언트
```
background: linear-gradient(135deg, #1B64DA 0%, #2979FF 100%)
```

---

## 3. 타이포그래피

**폰트**: Pretendard (기본), JetBrains Mono (가격 숫자 전용)

### 타입 스케일

| 역할 | 크기 (px) | rem | 굵기 | 행간 | 자간 | 사용처 |
|------|-----------|-----|------|------|------|--------|
| Display | 28px | 1.75rem | 700 | 1.2 (34px) | -0.02em | 분양가 최대값, 히어로 숫자 |
| H1 | 24px | 1.5rem | 700 | 1.3 (31px) | -0.01em | 단지명 (상세 페이지 최상단) |
| H2 | 20px | 1.25rem | 700 | 1.3 (26px) | -0.01em | 섹션 제목, 카드 내 가격 |
| H3 | 17px | 1.0625rem | 600 | 1.4 (24px) | 0 | 청약 카드 단지명, 리스트 항목 제목 |
| Body1 | 15px | 0.9375rem | 400 | 1.5 (23px) | 0 | 일반 본문, 설명 텍스트 |
| Body2 | 13px | 0.8125rem | 400 | 1.5 (20px) | 0 | 보조 정보 (세대수, 준공년도) |
| Caption | 11px | 0.6875rem | 400 | 1.4 (15px) | 0.01em | 태그, 타임스탬프, 출처 |
| Label | 13px | 0.8125rem | 600 | 1.2 | 0.01em | 버튼 텍스트, 탭 텍스트, 배지 |

### 가격 숫자 전용 (JetBrains Mono)
```
font-family: 'JetBrains Mono', monospace;
font-variant-numeric: tabular-nums;
```
- 실거래가, 변동률 수치에 적용
- 숫자 열을 세로로 정렬할 때 사용 (거래 내역 테이블)
- 크기: H2 이상만 적용 (20px+), 이하는 Pretendard 사용

---

## 4. 스페이싱 시스템

**기준 단위**: 4px (0.25rem)

### 기본 스케일
| 토큰 | px | rem | 사용처 |
|------|-----|-----|--------|
| `--space-1` | 4px | 0.25rem | 아이콘-텍스트 간격, 배지 내부 패딩 |
| `--space-2` | 8px | 0.5rem | 인라인 요소 간격, Caption 마진 |
| `--space-3` | 12px | 0.75rem | 카드 내 요소 간격 |
| `--space-4` | 16px | 1rem | 카드 패딩, 섹션 내부 여백 |
| `--space-5` | 20px | 1.25rem | 주요 요소 간 수직 간격 |
| `--space-6` | 24px | 1.5rem | 섹션 간격, 카드 하단 마진 |
| `--space-8` | 32px | 2rem | 섹션 헤더 상단 마진 |
| `--space-10` | 40px | 2.5rem | 페이지 상단 여백 |
| `--space-12` | 48px | 3rem | 대형 섹션 구분 |

### 컴포넌트별 기준 패딩
- 카드 내부 패딩: `16px` (전체)
- 버튼 패딩: `12px 20px` (중형 기준)
- 검색바 패딩: `0 16px`
- 페이지 좌우 여백: `16px`
- 바텀시트 패딩: `20px 16px`

---

## 5. 컴포넌트 명세

### 5-1. Button

#### Primary Button (CTA, 상세보기, 청약 신청)
```
높이: 52px
border-radius: 12px
배경: #1B64DA
텍스트: #FFFFFF, 16px, weight 600, Pretendard
패딩: 0 24px
hover: background #1451B5, transform scale(1.01)
active: background #0F3D8A, transform scale(0.99)
disabled: background #E5E8EB, color #8B95A1
transition: background 150ms ease, transform 100ms ease
```

#### Secondary Button (보조 액션)
```
높이: 52px
border-radius: 12px
배경: #FFFFFF
border: 1.5px solid #1B64DA
텍스트: #1B64DA, 16px, weight 600
패딩: 0 24px
hover: background #EBF1FC
active: background #D6E4F7
disabled: border-color #E5E8EB, color #8B95A1
```

#### Ghost Button (텍스트 링크형)
```
높이: 44px
border-radius: 8px
배경: transparent
텍스트: #4E5968, 14px, weight 500
패딩: 0 12px
hover: background #F2F4F6
active: background #E5E8EB
```

#### Small Button (칩/필터 버튼)
```
높이: 32px
border-radius: 16px
배경: #FFFFFF
border: 1px solid #E5E8EB
텍스트: #4E5968, 13px, weight 500
패딩: 0 12px
활성 상태: background #EBF1FC, border-color #1B64DA, color #1B64DA, weight 600
```

#### Icon Button (지도 UI, 뒤로가기, 공유)
```
크기: 40px x 40px
border-radius: 50%
배경: #FFFFFF
box-shadow: 0 2px 8px rgba(0,0,0,0.12)
아이콘 크기: 20px
아이콘 색상: #333D4B
hover: background #F5F6F8
active: background #E5E8EB
```

---

### 5-2. Card (기본 아파트 카드)

```
배경: #FFFFFF
border-radius: 12px
box-shadow: 0 1px 4px rgba(0,0,0,0.08)
padding: 16px
border: 1px solid #F2F4F6
```

#### hover 상태
```
box-shadow: 0 4px 16px rgba(0,0,0,0.12)
transform: translateY(-2px)
transition: box-shadow 200ms ease, transform 200ms ease
border-color: #E5E8EB
```

#### 카드 내부 레이아웃 (아파트 카드 기준)
```
[단지명] H3, #191F28
[위치]   Body2, #8B95A1, margin-top 2px
[구분선] 없음. margin-top 12px으로 분리
[거래가] H2, JetBrains Mono, #191F28, margin-top 12px
[변동률] Body2, margin-left 8px, 상승: #FF4B4B / 하락: #00C896
[면적]   Caption, #8B95A1, margin-top 4px
```

---

### 5-3. Badge (상태 배지)

#### 청약 상태 배지
```
높이: 22px
border-radius: 6px
패딩: 0 8px
텍스트: 11px, weight 600, Label

진행중: background #EBF1FC, color #1B64DA
예정:   background #FEF3C7, color #D97706
마감:   background #F2F4F6, color #8B95A1
```

#### D-day 배지
```
높이: 24px
border-radius: 6px
패딩: 0 8px
텍스트: 12px, weight 700, JetBrains Mono

D-3 이내: background #FF4B4B, color #FFFFFF
D-7 이내: background #F59E0B, color #FFFFFF
D-30 이내: background #EBF1FC, color #1B64DA
그 외: background #F2F4F6, color #4E5968
```

#### 순위 변동 배지
```
텍스트: 11px, weight 600
▲ 상승: color #FF4B4B (▲ 아이콘 + 숫자)
▼ 하락: color #00C896 (▼ 아이콘 + 숫자)
NEW:    background #FF4B4B, color #FFFFFF, border-radius 4px, padding 1px 5px
```

---

### 5-4. BottomSheet

```
배경: #FFFFFF
border-radius: 20px 20px 0 0
box-shadow: 0 -4px 20px rgba(0,0,0,0.12)
높이 (기본): 60vh
높이 (최대): 90vh
높이 (최소): 200px
transition: transform 300ms cubic-bezier(0.32, 0.72, 0, 1)
```

#### Drag Handle
```
너비: 36px
높이: 4px
border-radius: 2px
배경: #E5E8EB
position: top 8px, 수평 중앙
margin-bottom: 16px
```

#### 내부 구조
```
padding-top: 20px (drag handle 포함)
padding-left: 16px
padding-right: 16px
padding-bottom: env(safe-area-inset-bottom) + 16px (iOS 홈 인디케이터 대응)
```

#### Overlay
```
배경: rgba(0,0,0,0.5)
z-index: 100
transition: opacity 300ms ease
```

---

### 5-5. SearchBar

```
높이: 44px
border-radius: 10px
배경: #F5F6F8
border: 1.5px solid transparent
padding: 0 16px 0 40px (왼쪽 검색 아이콘 공간)
텍스트: 15px, #191F28
placeholder 색상: #8B95A1

포커스 상태:
  border-color: #1B64DA
  배경: #FFFFFF
  box-shadow: 0 0 0 3px rgba(27,100,218,0.12)
  transition: 150ms ease
```

#### 검색 아이콘
```
크기: 18px x 18px
위치: left 12px, 수직 중앙
색상: #8B95A1
포커스 시: #1B64DA
```

#### 자동완성 드롭다운
```
배경: #FFFFFF
border-radius: 12px
box-shadow: 0 4px 20px rgba(0,0,0,0.12)
border: 1px solid #E5E8EB
margin-top: 4px
max-height: 280px
overflow-y: auto

각 항목 높이: 52px
padding: 0 16px
hover: background #F5F6F8
구분선: 1px solid #F2F4F6 (내부 항목 간)
```

---

### 5-6. Navigation Bar (하단 탭 바)

```
높이: 83px (아이콘+텍스트 영역 49px + safe-area 34px)
배경: #FFFFFF
border-top: 1px solid #F2F4F6
box-shadow: 0 -1px 0 rgba(0,0,0,0.06)
position: fixed
bottom: 0
width: 100%
z-index: 50
```

#### 탭 아이템
```
너비: 25% (4개 탭 기준)
높이: 49px
padding-top: 8px

아이콘 크기: 24px
아이콘-텍스트 간격: 2px
텍스트: 10px, weight 500

비활성: 아이콘 #8B95A1, 텍스트 #8B95A1
활성:   아이콘 #1B64DA, 텍스트 #1B64DA, weight 600
```

#### 탭 구성
```
1번 탭: 홈 (집 아이콘)
2번 탭: 지도 (위치 핀 아이콘)
3번 탭: 청약 (문서 아이콘)
4번 탭: 트렌드 (차트 상승 아이콘)
```

---

### 5-7. 가격 마커 (지도 위)

#### 기본 마커 (보합/기본)
```
배경: #FFFFFF
border: 1.5px solid #1B64DA
border-radius: 20px
padding: 6px 12px
box-shadow: 0 2px 8px rgba(0,0,0,0.15)

텍스트: 14px, weight 700, #1B64DA, JetBrains Mono
예시: "15.5억"

꼬리(말풍선 꼬리):
  position: absolute, bottom -7px, left 50%, transform translateX(-50%)
  width: 0, height: 0
  border-left: 6px solid transparent
  border-right: 6px solid transparent
  border-top: 7px solid #1B64DA
```

#### 상승 마커
```
배경: #FFF3F3
border: 1.5px solid #FF4B4B
텍스트: #FF4B4B
꼬리: border-top-color: #FF4B4B
```

#### 하락 마커
```
배경: #F0FBF7
border: 1.5px solid #00C896
텍스트: #00C896
꼬리: border-top-color: #00C896
```

#### 선택(활성) 마커
```
transform: scale(1.15)
box-shadow: 0 4px 16px rgba(0,0,0,0.25)
z-index: 10
transition: transform 150ms ease, box-shadow 150ms ease
```

#### 클러스터 마커 (줌 레벨 13 이하)
```
크기: 40px x 40px
border-radius: 50%
배경: #1B64DA
텍스트: 13px, weight 700, #FFFFFF
border: 2px solid #FFFFFF
box-shadow: 0 2px 8px rgba(27,100,218,0.4)
```

---

### 5-8. ApartmentCard (아파트 단지 카드)

#### 기본형 (리스트/랭킹)
```
배경: #FFFFFF
border-radius: 12px
box-shadow: 0 1px 4px rgba(0,0,0,0.08)
padding: 16px
전체 너비 (좌우 여백 16px 적용 시 343px at 375px 뷰포트)

[단지명]    H3 (17px, weight 600, #191F28)
[위치]      Body2 (13px, weight 400, #8B95A1), margin-top 2px
[구분]      margin-top 12px
[거래가]    H2 (20px, weight 700, #191F28, JetBrains Mono)
[변동률]    Body2 (13px, weight 600), 가격 우측에 inline 배치
            상승: #FF4B4B / 하락: #00C896 / 보합: #8B95A1
[면적 정보] Caption (11px, #8B95A1), 거래가 하단
[거래일]    Caption (11px, #8B95A1), 카드 우측 하단 정렬
```

#### 가로 스크롤 카드형 (홈 핫 아파트)
```
너비: 200px
높이: 140px (콘텐츠 기준, 패딩 포함)
border-radius: 12px
flex-shrink: 0
padding: 16px
```

#### 랭킹 카드 (순위 번호 포함)
```
layout: flex row
[순위 영역] 너비 40px, 수직 중앙 정렬
  1위: width 28px, height 28px, border-radius 50%, background #FFD700, color #191F28, 13px weight 700
  2위: background #C0C0C0
  3위: background #CD7F32
  4-10위: color #8B95A1, 13px weight 600 (배경 없음)
[카드 본문] flex 1, ApartmentCard 기본형
```

---

### 5-9. SubscriptionCard (청약 카드)

```
배경: #FFFFFF
border-radius: 12px
box-shadow: 0 1px 4px rgba(0,0,0,0.08)
padding: 16px
전체 너비

레이아웃:
  상단 행: [단지명 H3] [D-day 배지 우측 정렬]
  2번째 행: [위치 Caption, #8B95A1]
  3번째 행: [공급세대수 Body2] [청약 유형 배지]
  하단 행: [분양가 H2, #1B64DA, JetBrains Mono] [상태 배지 우측 정렬]

상단-하단 행 간격: 12px
2-3번째 행 간격: 4px
```

#### 분양가 표시 규칙
```
"X억 Y천만원" 포맷
X억: H2 (20px, weight 700)
"부터" suffix: Body2 (13px, #8B95A1), inline
```

---

### 5-10. PriceChart (실거래가 라인 차트)

```
라이브러리: Recharts
컨테이너 높이: 240px
배경: #FFFFFF
border-radius: 12px
padding: 16px

차트 라인:
  stroke: #1B64DA
  strokeWidth: 2px
  dot: radius 3px, fill #FFFFFF, stroke #1B64DA, strokeWidth 2px
  activeDot: radius 5px, fill #1B64DA

그리드:
  horizontal: stroke #E5E8EB, strokeDasharray "4 4"
  vertical: 없음

축 스타일:
  텍스트: 11px, #8B95A1, Pretendard
  X축: 날짜 (MM.YY 포맷)
  Y축: 가격 (억 단위, 우측 또는 좌측)
  축선(axisLine): stroke #E5E8EB

툴팁:
  배경: #191F28
  border-radius: 8px
  padding: 8px 12px
  텍스트: 12px, #FFFFFF
  내용: [거래일] [거래가] [층수] 세 줄

데이터 없는 구간:
  strokeDasharray: "4 4"
  stroke: #E5E8EB

기간 토글 버튼:
  위치: 차트 우측 상단
  Small Button 스타일 사용 (6개월 / 12개월 / 24개월)
```

#### 면적 탭 (차트 상단)
```
높이: 40px
배경: #F5F6F8
border-radius: 8px
padding: 2px

탭 아이템: flex, 동일 너비
  비활성: 배경 transparent, 텍스트 #8B95A1, 13px, weight 500
  활성:   배경 #FFFFFF, 텍스트 #191F28, 13px, weight 600,
          border-radius 6px, box-shadow 0 1px 3px rgba(0,0,0,0.08)
  transition: 200ms ease
```

---

## 6. 아이콘 가이드

**아이콘 라이브러리**: Heroicons v2 (MIT 라이선스, React 패키지 제공)
**기본 크기**: 24px (작은 컨텍스트 20px, 탭바 24px, 대형 48px)
**스트로크 두께**: 1.5px (Heroicons Outline 기본값)
**색상**: 컨텍스트에 따라 CSS 변수 사용

### 사용 아이콘 목록

| 아이콘명 (Heroicons) | 용도 |
|----------------------|------|
| `HomeIcon` | 탭바 홈 |
| `MapIcon` | 탭바 지도 |
| `DocumentTextIcon` | 탭바 청약 |
| `ArrowTrendingUpIcon` | 탭바 트렌드 |
| `MagnifyingGlassIcon` | 검색창, 검색 버튼 |
| `MapPinIcon` | 위치 정보, 지도 핀 |
| `ChevronRightIcon` | 리스트 아이템 이동 |
| `ChevronLeftIcon` | 뒤로가기 |
| `ChevronDownIcon` | 드롭다운, 필터 |
| `XMarkIcon` | 닫기, 초기화 |
| `ShareIcon` | 공유하기 |
| `HeartIcon` | 관심 단지 찜하기 (P2) |
| `BellIcon` | 알림 |
| `FunnelIcon` | 필터 |
| `AdjustmentsHorizontalIcon` | 상세 필터 |
| `ArrowUpIcon` | 순위 상승 |
| `ArrowDownIcon` | 순위 하락 |
| `ClockIcon` | 최근 검색어 |
| `BuildingOffice2Icon` | 아파트 단지 |
| `CalculatorIcon` | 면적 계산 |
| `LocationCrosshairsIcon` | 현재 위치 |
| `InformationCircleIcon` | 정보/도움말 |

### 아이콘 사용 규칙
- 탭바: 24px Outline (활성 시 Solid)
- 카드 내 인라인: 16px, 텍스트와 동일 색상
- 버튼 내: 20px, 텍스트와 4px 간격
- 단독 사용 (Icon Button): 20px

---

## 7. 모션 / 애니메이션

### 트랜지션 프리셋

| 이름 | duration | easing | 용도 |
|------|----------|--------|------|
| `fast` | 100ms | `ease` | 버튼 press, 탭 active 피드백 |
| `normal` | 200ms | `ease` | hover 상태, 색상 변경, 아이콘 전환 |
| `slow` | 300ms | `cubic-bezier(0.32, 0.72, 0, 1)` | 바텀시트 슬라이드, 모달 등장 |
| `page` | 250ms | `cubic-bezier(0.4, 0, 0.2, 1)` | 페이지 전환 |

### 바텀시트 애니메이션
```
진입: transform: translateY(100%) → translateY(0)
      duration: 300ms, cubic-bezier(0.32, 0.72, 0, 1)
퇴장: transform: translateY(0) → translateY(100%)
      duration: 250ms, ease-in
```

### 카드 hover
```
transform: translateY(0) → translateY(-2px)
box-shadow: 0 1px 4px → 0 4px 16px
duration: 200ms ease
```

### 마커 선택
```
transform: scale(1) → scale(1.15)
duration: 150ms ease
```

### 스켈레톤 로딩
```
background: linear-gradient(90deg, #F2F4F6 25%, #E5E8EB 50%, #F2F4F6 75%)
background-size: 200% 100%
animation: skeleton-shimmer 1.5s infinite
@keyframes skeleton-shimmer {
  0%   { background-position: 200% 0 }
  100% { background-position: -200% 0 }
}
border-radius: 4px (텍스트 스켈레톤), 8px (블록)
```

### 페이지 전환 (React Router)
```
진입: opacity 0 → 1, translateX(20px) → 0
퇴장: opacity 1 → 0, translateX(0) → -20px
duration: 250ms
```

---

## 8. 반응형 브레이크포인트

**전략**: 모바일 퍼스트. 375px 기준 설계 후 상위 브레이크포인트에서 레이아웃 확장.

| 이름 | 기준 | 대상 디바이스 | 주요 변화 |
|------|------|---------------|-----------|
| `xs` | 0px ~ 374px | 소형 스마트폰 | 폰트 2px 감소, 패딩 12px |
| `sm` (기본) | 375px ~ 767px | 일반 스마트폰 | 기준 설계 (이 문서 기준) |
| `md` | 768px ~ 1023px | 태블릿 | 카드 2열 그리드, 네비 사이드바 전환 |
| `lg` | 1024px ~ 1279px | 소형 데스크톱 | 지도 + 리스트 Split View, 카드 3열 |
| `xl` | 1280px+ | 데스크톱 | 최대 너비 1280px, 중앙 정렬 |

### CSS 미디어 쿼리
```css
/* xs: 소형 스마트폰 */
@media (max-width: 374px) { }

/* md: 태블릿 */
@media (min-width: 768px) { }

/* lg: 데스크톱 */
@media (min-width: 1024px) { }

/* xl: 와이드 데스크톱 */
@media (min-width: 1280px) { }
```

### 태블릿/데스크톱 주요 변경 사항
- 하단 네비게이션 → 좌측 사이드 네비게이션 (768px+)
- 카드 그리드: 1열 → 2열(768px) → 3열(1024px)
- 청약 목록: 단일 컬럼 → 2단 레이아웃 (768px+)
- 바텀시트 → 우측 사이드 패널 (768px+)
- 페이지 최대 너비: 1280px, margin: 0 auto

---

*Design System v1.0 | Aptner | 2026-03-14*
*다음 버전 업데이트: 컴포넌트 라이브러리 Storybook 연동 후*
