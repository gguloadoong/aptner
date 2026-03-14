# Aptner - 아파트 중심 부동산 서비스

> "아파트 구매와 청약, 더 이상 발품 팔지 않아도 된다."

국내 아파트 시장의 정보 비대칭을 해소하는 모바일 퍼스트 부동산 인텔리전스 플랫폼입니다.
실거래가, 청약 정보, 지역별 트렌드를 한 화면에서 제공합니다.

---

## 주요 화면 설명

### 홈 화면 (/)
- 지역별 시세 요약 카드 (서울/경기/인천 등 주요 지역 평균 실거래가 및 전월 대비 등락)
- 진행 중인 청약 배너 (마감 임박 순서로 최대 3개 가로 스크롤)
- 핫한 아파트 TOP 10 (주간 조회수 + 거래량 기준 랭킹, 순위 변동 표시)

### 지도 화면 (/map)
- 카카오맵 위에 아파트 단지별 최근 실거래가 마커 표시
- 뷰포트 이동 시 해당 영역 아파트 자동 조회
- 가격 필터 및 평형 필터 지원
- 마커 클릭 시 단지 요약 바텀시트 표출

### 아파트 상세 화면 (/apartment/:id)
- 단지 기본 정보 (세대수, 준공년도, 건설사)
- 면적 탭별 최근 2년 실거래가 라인 차트
- 최근 거래 내역 테이블 (날짜, 층, 면적, 거래금액)
- 주변 단지 비교 목록

### 청약 화면 (/subscription)
- 진행중 / 예정 / 마감 탭 필터
- 지역 필터 (전국 / 서울 / 경기 등)
- 마감임박순 / 분양가순 / 최신순 정렬
- 청약 카드: 단지명, 지역, 세대수, 분양가, D-day 표시

### 청약 상세 화면 (/subscription/:id)
- 청약 공고 상세 (주소, 공급 세대수, 분양가, 청약 일정)
- 평형별 공급 현황 및 특별/일반 공급 구분

### 트렌드 화면 (/trend)
- 시도/시군구별 실거래가 트렌드 차트
- 지역 선택 및 기간 필터

---

## 기술 스택

### 프론트엔드 (client/)
| 기술 | 용도 |
|------|------|
| React 18 | UI 프레임워크 |
| TypeScript | 정적 타입 |
| Vite | 빌드 도구 |
| TailwindCSS | 스타일링 |
| Zustand | 전역 상태 관리 |
| React Query (TanStack Query) | 서버 상태 관리 및 캐싱 |
| React Router v6 | 클라이언트 라우팅 |
| Recharts | 가격 차트 |
| 카카오맵 API | 지도 기반 UI |

### 백엔드 (server/)
| 기술 | 용도 |
|------|------|
| Node.js | 런타임 |
| Express | HTTP 서버 |
| TypeScript | 정적 타입 |
| helmet | 보안 헤더 |
| express-rate-limit | API Rate Limiting |
| cors | CORS 처리 |
| morgan | 요청 로깅 |
| dotenv | 환경변수 관리 |

### 외부 API
| API | 용도 |
|------|------|
| 국토교통부 실거래가 공개시스템 (data.go.kr) | 아파트 실거래가 데이터 |
| 청약홈 API (apply.lh.or.kr) | 청약 공고 및 일정 |
| 카카오맵 API | 지도 서비스 |

---

## 시작하기

### 사전 요구사항
- Node.js 18 이상
- npm 9 이상

### 1. 저장소 클론
```bash
git clone https://github.com/your-org/aptner.git
cd aptner
```

### 2. 의존성 설치
```bash
npm install        # 루트 (concurrently 등 dev 도구)
npm run install:all  # client + server 의존성 한 번에 설치
```

### 3. 환경변수 설정

**server/.env**
```env
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
MOLIT_API_KEY=발급받은_국토부_API_키
```

**client/.env**
```env
VITE_KAKAO_MAP_KEY=발급받은_카카오맵_API_키
VITE_API_BASE_URL=http://localhost:3001
```

> 카카오맵 API 키: https://developers.kakao.com
> 국토부 실거래가 API 키: https://www.data.go.kr

### 4. 개발 서버 실행
```bash
# client + server 동시 실행
npm run dev

# 개별 실행
npm run dev:client   # http://localhost:5173
npm run dev:server   # http://localhost:3001
```

### 5. 프로덕션 빌드
```bash
npm run build
```

---

## 프로젝트 구조

```
aptner/
├── package.json          # 루트 (concurrently 스크립트)
├── .gitignore
├── README.md
│
├── client/               # React 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   │   ├── apartment/    # ApartmentCard, PriceChart, TradeHistoryTable, PriceMarker
│   │   │   ├── subscription/ # SubscriptionCard, SubscriptionBadge
│   │   │   └── ui/           # SearchBar, LoadingSpinner, Card, Button, Badge, BottomSheet
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── MapPage.tsx
│   │   │   ├── ApartmentDetailPage.tsx
│   │   │   ├── SubscriptionPage.tsx
│   │   │   ├── SubscriptionDetailPage.tsx
│   │   │   ├── TrendPage.tsx
│   │   │   └── SearchPage.tsx
│   │   ├── hooks/            # useApartment, useSubscription, useKakaoMap
│   │   ├── services/         # API 호출 함수 (apartment.service, subscription.service)
│   │   ├── stores/           # Zustand 전역 상태
│   │   ├── mocks/            # 개발용 Mock 데이터
│   │   ├── types/            # TypeScript 타입 정의
│   │   └── utils/            # formatNumber, marketHours
│   ├── .env
│   └── package.json
│
└── server/               # Express API 프록시 서버
    ├── src/
    │   ├── index.ts          # 엔트리포인트
    │   ├── routes/
    │   │   ├── index.ts          # 라우터 통합
    │   │   ├── apartment.routes.ts
    │   │   ├── subscription.routes.ts
    │   │   └── trend.routes.ts
    │   ├── services/
    │   │   ├── molit.service.ts       # 국토부 실거래가 API 연동
    │   │   ├── subscription.service.ts # 청약 API 연동
    │   │   ├── trend.service.ts       # 트렌드 계산
    │   │   └── cache.service.ts       # 인메모리 캐시
    │   ├── middleware/
    │   │   ├── security.ts            # helmet, cors, rate-limit
    │   │   └── errorHandler.ts        # 전역 에러 처리
    │   └── types/            # 서버 타입 정의
    ├── .env
    └── package.json
```

---

## API 엔드포인트 요약

### 아파트 (Apartments)

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/apartments/trades` | 실거래가 목록 조회 |
| GET | `/api/apartments/hot` | 핫한 아파트 랭킹 |
| GET | `/api/apartments/:aptCode/history` | 단지별 거래 이력 |

**`GET /api/apartments/trades` 주요 파라미터**
- `lawdCd` (필수): 법정동 코드 앞 5자리 (예: `11110` = 서울 종로구)
- `dealYmd` (필수): 거래 년월 (예: `202401`)
- `page`, `limit`: 페이지네이션

**`GET /api/apartments/hot` 파라미터**
- `district`: 지역 필터 (선택)
- `limit`: 조회 건수 (기본 10, 최대 50)

### 청약 (Subscriptions)

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/subscriptions` | 청약 목록 조회 |
| GET | `/api/subscriptions/:id` | 청약 상세 조회 |

**`GET /api/subscriptions` 파라미터**
- `status`: `upcoming` | `ongoing` | `closed`
- `sido`: 시도 필터 (예: `서울특별시`)
- `page`, `limit`: 페이지네이션

### 트렌드 및 지역 코드 (Trends & Regions)

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/trends/region` | 지역별 가격 트렌드 |
| GET | `/api/regions` | 시도 목록 조회 |
| GET | `/api/regions/:siDoCd/sigungu` | 시군구 목록 조회 |

### 헬스체크

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/health` | 서버 상태 및 캐시 통계 |

### 응답 형식
```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

에러 응답:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "에러 메시지"
  }
}
```

---

## 에이전트 시스템

이 프로젝트는 Claude Code 멀티 에이전트 워크플로우로 개발되었습니다.
각 전문 에이전트가 역할을 분담하여 협업합니다.

| 에이전트 | 역할 | 담당 파일 |
|----------|------|-----------|
| PM | 요구사항 정의, PRD 작성 | `PRD.md`, `SCREEN_SPEC.md` |
| Designer | 디자인 시스템, UI 명세 | `DESIGN_SYSTEM.md` |
| Backend (BE) | API 서버 구현 | `server/src/` |
| Frontend (FE) | UI 구현 및 API 연동 | `client/src/` |
| QA | 기능/보안/성능 검증 | `QA_REPORT.md` |

에이전트 정의 파일은 `.claude/agents/` 디렉토리에 위치합니다.

### 협업 원칙
- 각 에이전트는 자신의 역할 범위에서 최선의 결정을 내립니다.
- 인터페이스(API 계약, 컴포넌트 인터페이스)는 반드시 문서화합니다.
- 보안 지침은 모든 에이전트가 공통으로 준수합니다 (`CLAUDE.md` 참조).

---

## 보안 주의사항

- `.env` 파일은 절대 커밋하지 마세요 (`.gitignore`에 포함됨)
- API 키는 각 서비스에서 발급 후 `.env`에 설정하세요
- 프로덕션 배포 시 `NODE_ENV=production` 및 HTTPS 설정 필수
- 국토부 API는 일일 호출 한도가 있으므로 서버의 캐시 레이어를 활용하세요

---

## 라이선스

MIT
