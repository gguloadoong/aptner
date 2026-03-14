# Aptner Screen Specification v1.0

**작성일**: 2026-03-14
**작성자**: Senior UI/UX Designer
**기준 뷰포트**: 375px x 812px (iPhone 12 기준)
**참조**: DESIGN_SYSTEM.md, PRD.md

---

## 공통 레이아웃 구조

```
┌─────────────────────────────────┐ ← 0px
│         Status Bar (44px)       │   (iOS Safe Area Top)
│─────────────────────────────────│ ← 44px
│         Header (56px)           │   (화면별 상이)
│─────────────────────────────────│ ← 100px
│                                 │
│         Content Area            │   100px ~ 729px (콘텐츠)
│         (height: calc(          │
│          100dvh - 100px - 83px))│
│                                 │
│─────────────────────────────────│ ← 729px
│      Bottom Navigation (83px)   │   49px + 34px safe area
└─────────────────────────────────┘ ← 812px
```

---

## Screen 1: 홈 화면 (Home)

**경로**: `/`
**화면 목적**: 서비스 첫 진입 화면. "지금 핫한 아파트"를 빠르게 탐색하고, 청약 기회를 놓치지 않도록 유도한다.

### 레이아웃 구조

```
┌─────────────────────────────────┐
│  Status Bar (44px, white bg)    │
├─────────────────────────────────┤ ← 44px
│  Header (56px)                  │
│  [로고 Aptner] [알림 아이콘]    │
├─────────────────────────────────┤ ← 100px
│  SearchBar (44px)               │
│  margin: 0 16px                 │
├─────────────────────────────────┤ ← 160px
│                                 │
│  "지금 핫한 아파트" 섹션        │
│  (섹션 헤더 + 가로 스크롤 카드) │
│  약 208px                       │
│                                 │
├─────────────────────────────────┤ ← 368px
│                                 │
│  청약 배너 (120px)              │
│  margin: 0 16px                 │
│                                 │
├─────────────────────────────────┤ ← 504px
│                                 │
│  "이번 주 마감 청약" 섹션       │
│  (섹션 헤더 + 카드 목록)        │
│                                 │
│                                 │
├─────────────────────────────────┤
│  Bottom Navigation (83px)       │
└─────────────────────────────────┘
```

### UI 요소 명세

#### Header
```
높이: 56px
배경: #FFFFFF
border-bottom: none (스크롤 시 box-shadow: 0 1px 3px rgba(0,0,0,0.1))
padding: 0 16px
layout: flexbox, space-between, align-center

[로고]
  텍스트: "aptner"
  폰트: Pretendard 24px weight 800
  색상: #1B64DA
  letter-spacing: -0.03em

[알림 아이콘]
  크기: 40px x 40px (Icon Button 스타일)
  아이콘: BellIcon, 22px, #333D4B
  미읽음 뱃지: 8px 빨간 점, position absolute top 8px right 8px, background #FF4B4B
```

#### SearchBar
```
위치: header 바로 아래
margin: 8px 16px 16px 16px
높이: 44px
border-radius: 10px
배경: #F5F6F8
border: 1.5px solid transparent

placeholder: "아파트 단지명, 지역명 검색"
placeholder 색상: #8B95A1
placeholder 크기: 15px

왼쪽 검색 아이콘: MagnifyingGlassIcon 18px, #8B95A1, left 12px
텍스트 padding-left: 40px
```

#### "지금 핫한 아파트" 섹션
```
섹션 헤더:
  margin: 8px 16px 12px 16px
  [섹션 제목] "지금 핫한 아파트"
    폰트: H2 (20px, weight 700, #191F28)
  [서브텍스트] "이번 주 가장 많이 본 단지"
    폰트: Body2 (13px, #8B95A1), margin-top 2px
  [더보기 버튼] "전체보기"
    position: 우측 정렬
    Ghost Button 스타일 (14px, #1B64DA)

가로 스크롤 컨테이너:
  padding: 0 16px
  gap: 12px
  overflow-x: auto
  -webkit-overflow-scrolling: touch
  scrollbar: none (스크롤바 숨김)
  padding-bottom: 4px (카드 그림자 공간)

핫 아파트 카드 (가로 스크롤형):
  너비: 200px
  높이: 140px
  flex-shrink: 0
  border-radius: 12px
  배경: #FFFFFF
  box-shadow: 0 1px 4px rgba(0,0,0,0.08)
  padding: 16px

  [순위 번호]
    크기: 22px, weight 700, #1B64DA

  [단지명]
    H3 (17px, weight 600, #191F28)
    margin-top: 4px
    max-width 전체, 1줄 ellipsis

  [위치]
    Caption (11px, #8B95A1)
    margin-top: 2px

  [거래가]
    H2 (20px, weight 700, #191F28, JetBrains Mono)
    margin-top: 12px

  [변동률]
    Body2 (13px, weight 600)
    상승: #FF4B4B / 하락: #00C896
    인라인, 거래가 우측
```

#### 청약 배너
```
위치: 핫 아파트 섹션 아래
margin: 8px 16px
높이: 120px
border-radius: 16px
배경: linear-gradient(135deg, #1B64DA 0%, #2979FF 100%)
padding: 20px

[부제목]
  "청약 모집 중"
  Caption (11px, weight 600, rgba(255,255,255,0.8))
  margin-bottom: 4px

[제목]
  "지금 청약 가능한 단지"
  H2 (20px, weight 700, #FFFFFF)

[서브 정보]
  "진행 중 N개 · 이번 주 마감 M개"
  Body2 (13px, rgba(255,255,255,0.8))
  margin-top: 4px

[CTA 버튼] "청약 보러가기"
  position: 우측 하단
  높이: 32px
  border-radius: 8px
  배경: rgba(255,255,255,0.2)
  border: 1px solid rgba(255,255,255,0.4)
  텍스트: 13px, weight 600, #FFFFFF
  padding: 0 12px
```

#### "이번 주 마감 청약" 섹션
```
섹션 헤더:
  margin: 24px 16px 12px 16px
  [섹션 제목] "이번 주 마감 청약"
    H2 (20px, weight 700, #191F28)
  [서브텍스트] "마감일 순"
    Caption (11px, #8B95A1)

카드 목록:
  padding: 0 16px
  gap: 8px
  SubscriptionCard 2-3개 표시
```

### 상태별 UI

#### 로딩 상태
```
핫 아파트 카드: 스켈레톤 3개 (너비 200px, 높이 140px)
청약 카드: 스켈레톤 2개 (전체 너비, 높이 90px)
스켈레톤 border-radius: 12px
```

#### 에러 상태
```
각 섹션 개별 에러 처리 (섹션 단위 격리)
에러 메시지 영역:
  높이: 80px
  텍스트: "데이터를 불러올 수 없습니다."
  Body2, #8B95A1, 중앙 정렬
  [재시도] Ghost Button
```

#### 빈 상태
```
데이터 없을 때 빈 상태 일러스트 대신
  텍스트: "현재 표시할 핫한 단지가 없습니다." Body2, #8B95A1
  표시하지 않고 섹션 자체를 숨김 (홈은 항상 콘텐츠가 있어야 함)
```

### 인터랙션 플로우
```
검색바 탭 → SearchBar 포커스 → 최근 검색어 드롭다운 표시 → 자동완성
핫 아파트 카드 탭 → 아파트 상세 화면 (/apt/:id) 이동
청약 배너 탭 → 청약 목록 화면 (/subscription) 이동
청약 카드 탭 → 청약 상세 화면으로 이동
알림 아이콘 탭 → 알림 목록 (P2, 현재 미구현 toast 표시)
```

---

## Screen 2: 지도 화면 (Map)

**경로**: `/map`
**화면 목적**: 지도 위에 아파트 가격 마커를 표시하여 원하는 지역의 시세를 직관적으로 파악하게 한다.

### 레이아웃 구조

```
┌─────────────────────────────────┐
│  Status Bar (44px)              │ ← 지도 위 오버레이 (투명)
│─────────────────────────────────│
│  검색바 오버레이 (44px)         │ ← top: 60px (44px safe + 16px)
│  margin: 0 16px                 │
│─────────────────────────────────│
│  필터 칩 가로 스크롤 (32px)    │ ← 검색바 아래 8px
│─────────────────────────────────│
│                                 │
│      카카오맵 (100dvh)          │ ← z-index 0
│      아파트 가격 마커들         │
│                                 │
│─────────────────────────────────│
│  [현재 위치 버튼]               │ ← bottom: 83px + 16px + 바텀시트 높이
│  position: fixed, right 16px    │
├─────────────────────────────────┤
│  Bottom Navigation (83px)       │
└─────────────────────────────────┘
```

**지도가 탭바 아래까지 연장**: 지도 자체는 100dvh로 풀스크린. 탭바와 오버레이 UI는 z-index로 지도 위에 표시.

### UI 요소 명세

#### 지도 컨테이너
```
width: 100%
height: 100dvh
position: fixed
top: 0
left: 0
z-index: 0
```

#### 상단 검색바 오버레이
```
position: fixed
top: 60px (44px safe area + 16px)
left: 16px
right: 16px
z-index: 20

SearchBar 컴포넌트 사용
배경: #FFFFFF (지도 위이므로 불투명)
box-shadow: 0 2px 12px rgba(0,0,0,0.15)
border-radius: 10px
```

#### 필터 칩 가로 스크롤
```
position: fixed
top: 116px (60px + 44px 검색바 + 12px 간격)
left: 0
right: 0
z-index: 20
padding: 0 16px
overflow-x: auto
-webkit-overflow-scrolling: touch
scrollbar: none
gap: 8px (칩 간)
display: flex

필터 칩 (Small Button 스타일):
  높이: 32px
  border-radius: 16px
  배경: #FFFFFF
  box-shadow: 0 1px 4px rgba(0,0,0,0.12)
  border: 1px solid transparent

  기본 칩:
    텍스트: #333D4B, 13px, weight 500
  활성 칩:
    배경: #EBF1FC
    border-color: #1B64DA
    텍스트: #1B64DA, 13px, weight 600

필터 목록: 전체 | 59㎡ | 84㎡ | 114㎡ | 가격순 | 상승 | 하락
```

#### 현재 위치 버튼
```
position: fixed
right: 16px
bottom: calc(83px + 16px)
z-index: 20

크기: 44px x 44px
border-radius: 50%
배경: #FFFFFF
box-shadow: 0 2px 12px rgba(0,0,0,0.18)
border: 1px solid #E5E8EB
아이콘: LocationCrosshairsIcon 22px, #333D4B
```

### 바텀시트 (마커 클릭 시)

```
position: fixed
bottom: 0
left: 0
right: 0
z-index: 50

높이: 60vh (364px at 812px 뷰포트)
배경: #FFFFFF
border-radius: 20px 20px 0 0
box-shadow: 0 -4px 20px rgba(0,0,0,0.12)

Drag Handle:
  너비: 36px, 높이: 4px
  배경: #E5E8EB
  border-radius: 2px
  position: top 8px, 수평 center
  margin-bottom: 16px

내용 (단지 요약 카드):
  padding: 20px 16px 0

  [단지명] H1 (24px, weight 700, #191F28)
  [위치]   Body2 (13px, #8B95A1), margin-top 4px

  구분선: margin: 16px 0, border-top 1px solid #F2F4F6

  [최근 거래가 레이블] Caption (11px, #8B95A1) "최근 실거래가"
  [거래가]             H1 (24px, weight 700, #191F28, JetBrains Mono)
  [변동률]             H3 (17px, weight 600), 상승/하락 색상, 거래가 우측 inline

  [면적 정보 행]
    Body2 (13px, #4E5968) "전용 84㎡"
    구분점 "·" #E5E8EB
    Body2 "거래일 2026.02.15"
    구분점 "·" #E5E8EB
    Body2 "12층"

  구분선: margin: 16px 0

  [거래 내역 미리보기] - 최근 3건
    행 높이: 40px
    [날짜] Caption, #8B95A1  |  [면적] Body2  |  [층수] Body2  |  [가격] Body2, JetBrains Mono, 우측정렬

  [상세보기 버튼]
    Primary Button 스타일
    margin-top: 16px
    margin-bottom: env(safe-area-inset-bottom) + 16px
    텍스트: "단지 상세보기"
    너비: 100%
```

### 마커 디자인 상세

```
아파트 마커 기본:
  배경: #FFFFFF
  border: 1.5px solid #1B64DA
  border-radius: 20px
  padding: 6px 12px
  box-shadow: 0 2px 8px rgba(0,0,0,0.15)
  텍스트: 14px, weight 700, #1B64DA, JetBrains Mono
  예시 표시: "15.5억"

  말풍선 꼬리:
    position absolute, bottom -7px, left 50%
    transform translateX(-50%)
    border-left: 6px solid transparent
    border-right: 6px solid transparent
    border-top: 7px solid #1B64DA

상승 마커 (+3% 이상):
  배경: #FFF3F3
  border-color: #FF4B4B
  텍스트: #FF4B4B
  꼬리: border-top-color #FF4B4B

하락 마커 (-3% 이상):
  배경: #F0FBF7
  border-color: #00C896
  텍스트: #00C896
  꼬리: border-top-color #00C896

선택된 마커:
  transform: scale(1.15)
  box-shadow: 0 4px 16px rgba(0,0,0,0.25)
  z-index: 10
  transition: transform 150ms ease

클러스터 마커 (줌 13 이하):
  크기: 40px x 40px
  border-radius: 50%
  배경: #1B64DA
  텍스트: 13px, weight 700, #FFFFFF
  border: 2px solid #FFFFFF
  box-shadow: 0 2px 8px rgba(27,100,218,0.4)
```

### 상태별 UI

#### 로딩 상태
```
지도 로드 중:
  전체 화면 스켈레톤 (배경 #F2F4F6)
  중앙에 로딩 스피너 (40px, #1B64DA)

마커 로드 중:
  지도는 표시, 우측 상단에 소형 로딩 인디케이터
  너비 120px, 높이 32px, 배경 rgba(255,255,255,0.9)
  border-radius 16px, box-shadow
  "데이터 로딩 중..." 11px, #8B95A1
```

#### 에러 상태 (지도 로드 실패)
```
전체 화면 에러:
  배경: #F5F6F8
  중앙 정렬:
    아이콘: MapIcon 48px, #E5E8EB
    제목: "지도를 불러올 수 없습니다" H3, #333D4B
    설명: "네트워크 연결을 확인해주세요" Body2, #8B95A1
    [재시도] Primary Button
```

### 인터랙션 플로우
```
지도 드래그/줌 → 뷰포트 변경 감지 → 마커 재로드 (debounce 500ms)
마커 탭 → 선택 상태로 마커 확대 → 바텀시트 슬라이드업
바텀시트 드래그 다운 → 바텀시트 닫힘 → 마커 비선택 상태
"상세보기" 버튼 탭 → /apt/:id 이동
필터 칩 선택 → 해당 면적/조건 마커만 표시 → 나머지 opacity 0.3
현재 위치 버튼 탭 → 현재 GPS 위치로 지도 이동 + 파란 점 마커
```

---

## Screen 3: 청약 목록 화면 (Subscription)

**경로**: `/subscription`
**화면 목적**: 전국 청약 공고를 한눈에 보고, D-day와 분양가를 기준으로 빠르게 의사결정한다.

### 레이아웃 구조

```
┌─────────────────────────────────┐
│  Status Bar (44px)              │
├─────────────────────────────────┤
│  Header (56px)                  │
│  [뒤로가기] [청약정보] [필터]   │
├─────────────────────────────────┤ ← 100px
│  탭 바 (48px)                   │
│  [진행중] [예정] [마감]         │
├─────────────────────────────────┤ ← 148px
│  지역 필터 (40px, 선택 시 표시) │
├─────────────────────────────────┤
│                                 │
│  청약 카드 목록                 │
│  (스크롤 가능)                  │
│                                 │
├─────────────────────────────────┤
│  Bottom Navigation (83px)       │
└─────────────────────────────────┘
```

### UI 요소 명세

#### Header
```
높이: 56px
배경: #FFFFFF
border-bottom: 1px solid #F2F4F6
padding: 0 16px

[페이지 제목] "청약정보"
  폰트: H2 (20px, weight 700, #191F28)
  position: 중앙 정렬

[필터 아이콘] FunnelIcon
  크기: 40px Icon Button
  position: 우측
  활성 시: 아이콘 #1B64DA, 배지 점 표시
```

#### 탭 바
```
높이: 48px
배경: #FFFFFF
border-bottom: 1px solid #F2F4F6
padding: 0 16px

탭 아이템:
  3개: 진행중 / 예정 / 마감
  각 탭 너비: 동일 (1/3)

  비활성 탭:
    텍스트: 15px, weight 500, #8B95A1
    border-bottom: 2px solid transparent

  활성 탭:
    텍스트: 15px, weight 700, #1B64DA
    border-bottom: 2px solid #1B64DA

  전환 transition: 200ms ease

탭 전환 애니메이션:
  indicator: 활성 탭 아래 2px 라인이 슬라이드 이동
  duration: 200ms, ease
```

#### 지역 필터 드롭다운
```
높이: 40px (필터 버튼 행)
padding: 0 16px
배경: #F5F6F8

[지역 선택 버튼]:
  텍스트: "전국" (기본) 또는 선택된 지역명
  13px, weight 500, #333D4B
  ChevronDownIcon 16px, 텍스트 우측 4px
  배경: #FFFFFF
  border-radius: 8px
  padding: 6px 10px
  border: 1px solid #E5E8EB
  높이: 32px

  클릭 시: 지역 선택 바텀시트 표시
```

#### 청약 카드 목록
```
padding: 12px 16px
gap: 8px
```

#### 청약 카드 (SubscriptionCard 상세)
```
배경: #FFFFFF
border-radius: 12px
box-shadow: 0 1px 4px rgba(0,0,0,0.08)
padding: 16px
전체 너비

레이아웃:

행 1 (상단):
  [단지명] H3 (17px, weight 600, #191F28)  |  [D-day 배지] 우측 정렬

행 2:
  [위치] Caption (11px, #8B95A1)
  예: "서울 강남구"
  margin-top: 4px

행 3:
  [공급세대] Body2 (13px, #4E5968) "198세대 공급"
  margin-top: 8px

구분선:
  margin: 12px 0
  border-top: 1px solid #F2F4F6

행 4 (하단):
  [분양가 레이블] Caption (11px, #8B95A1) "분양가"
  [분양가] H2 (20px, weight 700, #1B64DA, JetBrains Mono) "5억 8천만원부터"
  [청약 상태 배지] 우측 정렬

분양가 포맷:
  "X억 Y천만원부터" — suffix "부터"는 Body2 크기로
  데이터 없으면 "분양가 미정"을 #8B95A1으로
```

#### D-day 배지 상세 규칙
```
배지 높이: 24px
border-radius: 6px
padding: 0 8px
텍스트: 12px, weight 700, JetBrains Mono

D-0 ~ D-3 (마감 임박):
  배경: #FF4B4B
  텍스트: #FFFFFF
  표시: "D-3", "D-2", "D-1", "오늘 마감"

D-4 ~ D-7:
  배경: #F59E0B
  텍스트: #FFFFFF
  표시: "D-5"

D-8 ~ D-30:
  배경: #EBF1FC
  텍스트: #1B64DA
  표시: "D-15"

D-31 이상:
  배경: #F2F4F6
  텍스트: #4E5968
  표시: "D-45"
```

### 상태별 UI

#### 로딩 상태
```
스켈레톤 카드 5개
높이: 각 130px, 너비 전체
border-radius: 12px
shimmer 애니메이션 적용
```

#### 빈 상태 (해당 탭에 청약 없음)
```
높이: 300px
중앙 수직 정렬:
  아이콘: DocumentTextIcon 48px, #E5E8EB
  제목: "진행 중인 청약이 없습니다" H3, #333D4B
  설명: "다른 탭이나 지역을 확인해보세요" Body2, #8B95A1
```

#### 에러 상태
```
아이콘: ExclamationCircleIcon 48px, #E5E8EB
제목: "청약 정보를 불러오지 못했습니다" H3
[재시도] Primary Button
```

### 인터랙션 플로우
```
탭 전환 → 해당 상태 청약 목록 로드
지역 필터 버튼 탭 → 지역 선택 바텀시트 표시 (시/도 선택)
지역 선택 → 바텀시트 닫힘 + 목록 필터링
청약 카드 탭 → 청약 상세 화면 (/subscription/:id) 이동
무한 스크롤: 목록 하단 도달 시 다음 페이지 로드 (페이지 단위 20개)
```

---

## Screen 4: 아파트 상세 화면 (Apartment Detail)

**경로**: `/apt/:complexId`
**화면 목적**: 관심 단지의 모든 핵심 정보를 한 화면에서 제공. 실거래가 차트로 시세 흐름을 파악하게 한다.

### 레이아웃 구조

```
┌─────────────────────────────────┐
│  Status Bar (44px)              │
├─────────────────────────────────┤
│  Header (56px)                  │
│  [뒤로가기] [단지명] [공유]     │
├─────────────────────────────────┤ ← 100px
│  스크롤 영역 시작               │
│                                 │
│  1. 기본 정보 섹션              │
│  2. 가격 요약 카드              │
│  3. 면적 탭 + 실거래가 차트     │
│  4. 최근 거래 내역 테이블       │
│  5. 단지 위치 지도              │
│                                 │
│  (padding-bottom 83px)          │
├─────────────────────────────────┤
│  Bottom Navigation (83px)       │
└─────────────────────────────────┘
```

### UI 요소 명세

#### Header
```
높이: 56px
배경: #FFFFFF
border-bottom: 1px solid #F2F4F6

[뒤로가기] ChevronLeftIcon, 40px Icon Button, 좌측
[단지명]   H3 (17px, weight 600, #191F28), 중앙 (최대 150px, ellipsis)
[공유]     ShareIcon, 40px Icon Button, 우측
```

#### 섹션 1: 기본 정보
```
배경: #FFFFFF
padding: 20px 16px

[단지명] H1 (24px, weight 700, #191F28)
[주소]   Body2 (13px, #8B95A1), margin-top 4px

정보 그리드 (margin-top 16px):
  2열 그리드, gap 8px

  각 정보 아이템:
    배경: #F5F6F8
    border-radius: 8px
    padding: 12px
    [레이블] Caption (11px, #8B95A1)
    [값]     Body1 (15px, weight 600, #191F28), margin-top 2px

  아이템 목록:
    총 세대수: "1,248세대"
    준공년도:  "2019년"
    건설사:    "삼성물산"
    주차:      "세대당 1.5대"
```

#### 섹션 2: 가격 요약 카드
```
margin: 0 16px
배경: #FFFFFF
border-radius: 12px
box-shadow: 0 1px 4px rgba(0,0,0,0.08)
border: 1px solid #F2F4F6
padding: 16px

[레이블 행] "최근 거래 기준"
  Caption (11px, #8B95A1)

[가격 3분할]
  3열 flex, gap 0

  각 열:
    [레이블] Caption (11px, #8B95A1)
    [가격]   H2 (20px, weight 700, JetBrains Mono)
    최저가: #00C896 / 평균: #191F28 / 최고가: #FF4B4B

  구분선: 세로 1px solid #F2F4F6 (열 사이)

[변동 정보]
  margin-top: 12px
  border-top: 1px solid #F2F4F6
  padding-top: 12px
  "3개월 전 대비 +2.3% 상승"
  Body2 (13px, #FF4B4B)
```

#### 섹션 3: 실거래가 차트

##### 면적 탭
```
margin: 24px 16px 0
높이: 40px
배경: #F5F6F8
border-radius: 8px
padding: 2px

탭 구성: 59㎡ / 84㎡ / 114㎡
(실제 단지 보유 면적 타입에 따라 동적 생성)

활성 탭:
  배경: #FFFFFF
  border-radius: 6px
  box-shadow: 0 1px 3px rgba(0,0,0,0.08)
  텍스트: 14px, weight 600, #191F28

비활성 탭:
  텍스트: 14px, weight 500, #8B95A1
```

##### 차트 영역
```
margin: 8px 16px 0
배경: #FFFFFF
border-radius: 12px
box-shadow: 0 1px 4px rgba(0,0,0,0.08)
padding: 16px
높이: 240px (padding 포함 실제 차트 높이 192px)

기간 토글 (차트 우측 상단):
  3개 버튼: 6개월 / 12개월 / 24개월
  높이: 24px
  border-radius: 12px
  텍스트: 11px, weight 500
  비활성: 배경 #F2F4F6, color #8B95A1
  활성:   배경 #1B64DA, color #FFFFFF
  gap: 4px

차트 스펙 (Recharts):
  type: LineChart
  margin: { top: 8, right: 0, left: -16, bottom: 0 }

  Line:
    stroke: #1B64DA
    strokeWidth: 2
    dot: false (기본), activeDot: radius 4, fill #1B64DA

  XAxis:
    dataKey: "date"
    tick: { fontSize: 11, fill: '#8B95A1', fontFamily: 'Pretendard' }
    tickFormatter: "MM.YY" 포맷
    axisLine: { stroke: '#E5E8EB' }
    tickLine: false

  YAxis:
    tick: { fontSize: 11, fill: '#8B95A1' }
    tickFormatter: (value) => `${(value/10000).toFixed(0)}억`
    axisLine: false
    tickLine: false
    width: 36

  CartesianGrid:
    horizontal: true
    vertical: false
    stroke: '#E5E8EB'
    strokeDasharray: '4 4'

  Tooltip:
    cursor: { stroke: '#1B64DA', strokeWidth: 1, strokeDasharray: '4 4' }
    contentStyle: {
      background: '#191F28',
      borderRadius: 8px,
      border: 'none',
      padding: '8px 12px'
    }
    labelStyle: { color: '#8B95A1', fontSize: 11 }
    itemStyle: { color: '#FFFFFF', fontSize: 13, fontFamily: 'JetBrains Mono' }
    내용: 거래일 / 거래가 (X억 Y천만원) / 층수
```

#### 섹션 4: 최근 거래 내역
```
margin-top: 24px

섹션 헤더:
  padding: 0 16px
  "최근 거래 내역" H2 (20px, weight 700, #191F28)
  "최근 20건" Caption (11px, #8B95A1)

테이블 컨테이너:
  margin-top: 8px
  배경: #FFFFFF

테이블 헤더:
  높이: 36px
  padding: 0 16px
  배경: #F5F6F8
  border-bottom: 1px solid #E5E8EB

  컬럼 구성:
  거래일: 80px, Caption (11px, #8B95A1)
  층수:   48px, Caption, 중앙 정렬
  면적:   60px, Caption, 중앙 정렬
  거래가: flex 1, Caption, 우측 정렬

테이블 행:
  높이: 52px
  padding: 0 16px
  border-bottom: 1px solid #F2F4F6
  background: #FFFFFF

  데이터 스타일:
  거래일: Body2 (13px, #4E5968)
  층수:   Body2 (13px, #4E5968), 중앙 정렬
  면적:   Body2 (13px, #4E5968), 중앙 정렬
  거래가: Body2 (13px, weight 600, #191F28, JetBrains Mono), 우측 정렬

홀수/짝수 행 구분:
  짝수 행 background: #FAFAFA (아주 약하게)

더보기 버튼:
  높이: 48px
  전체 너비
  텍스트: "거래 내역 더보기"
  Ghost Button 스타일
  border-top: 1px solid #F2F4F6
```

#### 섹션 5: 단지 위치 지도
```
margin-top: 24px

섹션 헤더:
  padding: 0 16px
  "단지 위치" H2 (20px, weight 700, #191F28)

지도 컨테이너:
  margin-top: 8px
  높이: 200px
  background: #F5F6F8 (지도 로드 전)
  overflow: hidden
  (border-radius 없음, 전체 너비)

카카오맵 옵션:
  draggable: false (소형 맵은 드래그 불필요)
  zoomable: false
  단지 위치 마커: 고정

[지도에서 길찾기] 버튼:
  위치: 지도 우측 하단 오버레이
  Ghost Button with 배경: rgba(255,255,255,0.9)
  "카카오맵으로 보기"
  13px, weight 600, #1B64DA
  외부 링크 (카카오맵 앱 딥링크)
```

### 상태별 UI

#### 로딩 상태
```
기본 정보 섹션: 텍스트 스켈레톤 (3줄)
가격 요약 카드: 카드 스켈레톤 (높이 80px)
차트 영역: 전체 스켈레톤 (높이 240px)
테이블: 행 스켈레톤 5개 (높이 52px)
```

#### 에러 상태
```
전체 화면:
  아이콘: BuildingOffice2Icon 48px, #E5E8EB
  제목: "단지 정보를 불러올 수 없습니다" H3
  [뒤로가기] Secondary Button
  [재시도] Primary Button
```

### 인터랙션 플로우
```
면적 탭 전환 → 차트 데이터 변경 (200ms fade transition)
기간 토글 변경 → 차트 X축 범위 변경 (차트 내부 애니메이션)
차트 터치/드래그 → 툴팁 표시 (Recharts 기본 동작)
"더보기" 탭 → 거래 내역 추가 로드 (페이지 20건씩)
"카카오맵으로 보기" → 카카오맵 앱/웹 외부 이동
공유 버튼 → Web Share API 호출 (미지원 시 링크 복사 토스트)
```

---

## Screen 5: 트렌드 화면 (Ranking / Trend)

**경로**: `/ranking`
**화면 목적**: 이번 주 시장에서 가장 주목받는 단지 TOP 20을 빠르게 파악한다. 투자자, 갈아타기 실수요자 대상.

### 레이아웃 구조

```
┌─────────────────────────────────┐
│  Status Bar (44px)              │
├─────────────────────────────────┤
│  Header (56px)                  │
│  "트렌드 랭킹" + 업데이트 시각 │
├─────────────────────────────────┤ ← 100px
│  필터/정렬 바 (48px)            │
│  [지역 드롭다운] [정렬 기준]   │
├─────────────────────────────────┤ ← 148px
│                                 │
│  랭킹 리스트 (무한 스크롤)      │
│  1위~3위: 메달 강조 스타일     │
│  4위~: 기본 스타일             │
│                                 │
├─────────────────────────────────┤
│  Bottom Navigation (83px)       │
└─────────────────────────────────┘
```

### UI 요소 명세

#### Header
```
높이: 56px
배경: #FFFFFF
border-bottom: 1px solid #F2F4F6
padding: 0 16px

[제목 영역] 좌측 정렬:
  "트렌드 랭킹" H2 (20px, weight 700, #191F28)
  "매주 월요일 업데이트" Caption (11px, #8B95A1), margin-top 2px
```

#### 필터 / 정렬 바
```
높이: 48px
배경: #FFFFFF
border-bottom: 1px solid #F2F4F6
padding: 0 16px
layout: flexbox, space-between

[지역 드롭다운]:
  너비: 120px
  높이: 32px
  배경: #FFFFFF
  border: 1px solid #E5E8EB
  border-radius: 8px
  padding: 0 10px
  텍스트: 13px, weight 500, #333D4B
  ChevronDownIcon 우측 4px

[정렬 기준]:
  칩 3개: 조회수 | 거래량 | 가격상승률
  Small Button 스타일 (높이 32px)
  gap: 6px
```

#### 랭킹 리스트

##### 1위~3위 (메달 스타일)
```
배경: #FFFFFF
border-radius: 0 (리스트 연속 배경)
border-bottom: 1px solid #F2F4F6
padding: 16px
min-height: 80px

레이아웃: flexbox, align-center

[순위 영역] 너비 48px:
  1위:
    크기: 32px x 32px
    border-radius: 50%
    배경: #FFD700
    텍스트: "1", 14px, weight 800, #191F28
    box-shadow: 0 2px 6px rgba(255,215,0,0.5)
  2위:
    배경: #C0C0C0
    box-shadow: 0 2px 6px rgba(192,192,192,0.5)
  3위:
    배경: #CD7F32
    box-shadow: 0 2px 6px rgba(205,127,50,0.5)

[단지 정보 영역] flex 1, margin-left 8px:
  [단지명] H3 (17px, weight 600, #191F28)
  [위치]   Body2 (13px, #8B95A1), margin-top 2px

[가격 정보 영역] 우측 정렬:
  [거래가] Body1 (15px, weight 700, #191F28, JetBrains Mono)
  [변동률] Body2 (13px, weight 600)
    상승: #FF4B4B / 하락: #00C896
    margin-top: 2px
  [순위 변동] Caption (11px)
    ▲2: #FF4B4B / ▼1: #00C896 / NEW 배지
```

##### 4위~20위 (기본 스타일)
```
동일 구조, 순위 영역만 변경:
  크기: 32px x 32px, 배경 없음
  텍스트: 14px, weight 700, #8B95A1 (4~10위)
             14px, weight 500, #8B95A1 (11위+)
```

#### 지역별 바 차트 섹션 (리스트 하단 또는 별도 탭)
```
섹션 헤더: "지역별 가격 변동" H2, margin 24px 16px 12px

차트 컨테이너:
  배경: #FFFFFF
  padding: 16px
  높이: 200px (Recharts BarChart)

  Bar 색상:
    상승: fill #FF4B4B
    하락: fill #00C896

  XAxis: 지역명 (서울, 경기, 인천...)
    텍스트: 11px, #8B95A1

  YAxis: % 단위
    텍스트: 11px, #8B95A1

  기준선 (0%): stroke #E5E8EB, strokeWidth 1

  Tooltip:
    배경: #191F28
    border-radius: 8px
    텍스트: 12px, #FFFFFF
    내용: [지역명] [변동률]
```

### 상태별 UI

#### 로딩 상태
```
랭킹 아이템 스켈레톤 10개
각 높이: 80px
좌측 원형 스켈레톤 (32px), 중앙 텍스트 스켈레톤, 우측 텍스트 스켈레톤
```

#### 빈 상태 (지역 필터 결과 없음)
```
중앙 정렬:
  ArrowTrendingUpIcon 48px, #E5E8EB
  "해당 지역의 랭킹 데이터가 없습니다" H3
  "전국을 선택해 전체 랭킹을 확인해보세요" Body2, #8B95A1
```

#### 에러 상태
```
ExclamationCircleIcon 48px
"랭킹 데이터를 불러오지 못했습니다" H3
[재시도] Primary Button
```

### 인터랙션 플로우
```
지역 드롭다운 탭 → 지역 선택 바텀시트 표시
지역 선택 → 해당 지역 랭킹 로드
정렬 기준 탭 → 즉시 목록 재정렬 (클라이언트 사이드)
랭킹 아이템 탭 → 아파트 상세 화면 이동 (/apt/:id)
무한 스크롤 → TOP 20까지 로드 (페이지당 10개씩)
```

---

## 공통 UI 패턴

### 토스트 메시지
```
position: fixed
top: 60px (상단 safe area + 16px)
left: 50%
transform: translateX(-50%)
z-index: 200

배경: #191F28
border-radius: 10px
padding: 12px 16px
텍스트: 14px, weight 500, #FFFFFF
max-width: 280px
text-align: center

진입: opacity 0 → 1, translateY(-8px) → 0 (200ms ease)
퇴장: opacity 1 → 0 (200ms ease, 2.5초 후)
```

### 빈 상태 (Empty State) 공통 구조
```
중앙 수직/수평 정렬
아이콘: 48px x 48px, #E5E8EB
margin-bottom: 16px
제목: H3 (17px, weight 600, #333D4B), text-align center
설명: Body2 (13px, #8B95A1), margin-top 4px, text-align center
버튼: margin-top 20px (있는 경우)
```

### 로딩 스피너
```
크기: 24px (인라인) / 40px (페이지 레벨)
stroke: #1B64DA
stroke-width: 2.5px
animation: spin 800ms linear infinite
배경: 없음 (투명)
```

### 당김 새로고침 (Pull to Refresh)
```
임계값: 60px 당김
로딩 인디케이터: 스피너 24px, 색상 #1B64DA
완료 시: 체크 아이콘 → 0.5초 후 숨김
피드백 햅틱: light impact
```

---

*Screen Specification v1.0 | Aptner | 2026-03-14*
*컴포넌트 구현 참조: DESIGN_SYSTEM.md*
