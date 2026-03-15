# Aptner - 아파트 중심 부동산 서비스

## 프로젝트 개요
호갱노노/아실 스타일의 국내 아파트 중심 부동산 서비스.
청약정보, 실거래가, 핫한 부동산을 시각적으로 제공한다.

## 기술 스택
- **Frontend**: React 18 + Vite + TailwindCSS + Zustand + React Query
- **Backend**: Node.js + Express (API 프록시 서버)
- **Map**: 카카오맵 API
- **Charts**: Recharts
- **External APIs**:
  - 국토교통부 실거래가 공개시스템 (data.go.kr)
  - 청약홈 API (apply.lh.or.kr)
  - 공공데이터포털 부동산 관련 API

## 디렉토리 구조
```
aptner/
├── client/          # React 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── stores/
│   │   ├── services/
│   │   └── utils/
├── server/          # Express 백엔드
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── utils/
├── .claude/
│   └── agents/      # 각 직군 에이전트 정의
└── CLAUDE.md
```

---

# 보안 지침 (Security Guidelines)

## 1. API 키 및 시크릿 관리
- **절대 금지**: API 키, 비밀번호, 토큰을 코드에 하드코딩
- 모든 민감 정보는 `.env` 파일에 보관 (`.gitignore`에 반드시 포함)
- 프론트엔드에서 공개 API 키만 사용 (`VITE_` prefix로 명시적으로 노출 범위 제한)
- 백엔드 API 키는 서버사이드에서만 사용

```env
# .env.example (커밋 허용)
VITE_KAKAO_MAP_KEY=your_key_here
MOLITDATA_API_KEY=your_key_here
PORT=3001
```

## 2. 입력값 검증 및 XSS 방어
- 모든 사용자 입력은 서버사이드에서 검증
- React의 JSX는 기본적으로 XSS를 방어하므로 `dangerouslySetInnerHTML` 사용 금지
- URL 파라미터, 쿼리스트링은 `encodeURIComponent`로 이스케이핑
- API 응답 데이터는 Zod 스키마로 타입 검증

## 3. SQL Injection 방어
- ORM/쿼리빌더 사용 시 파라미터 바인딩 방식 사용
- 사용자 입력값을 직접 쿼리 문자열에 삽입 금지

## 4. CORS 설정
```javascript
// server에서 허용 origin 명시
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
```

## 5. Rate Limiting
- 공공 API 호출에 rate limiting 적용 (외부 API quota 보호)
- 서버에 express-rate-limit 미들웨어 적용

## 6. HTTPS 및 보안 헤더
- 프로덕션에서 HTTPS 강제
- helmet.js로 보안 헤더 설정 (X-Frame-Options, CSP 등)

## 7. 의존성 보안
- `npm audit` 정기 실행
- 불필요한 패키지 설치 지양
- 패키지 버전 고정 (package-lock.json 커밋)

## 8. 에러 처리
- 프로덕션에서 스택 트레이스 노출 금지
- 에러 응답에 내부 시스템 정보 포함 금지

```javascript
// 잘못된 예
res.status(500).json({ error: err.stack });

// 올바른 예
res.status(500).json({ error: '서버 오류가 발생했습니다.' });
```

---

# 코드 컨벤션

## 공통
- 함수명: camelCase
- 컴포넌트명: PascalCase
- 상수: UPPER_SNAKE_CASE
- 파일명: kebab-case (컴포넌트는 PascalCase.tsx)

## 커밋 메시지
```
feat: 청약 정보 목록 페이지 추가
fix: 지도 마커 클릭 이벤트 오류 수정
style: 가격 차트 색상 개선
refactor: API 호출 로직 훅으로 분리
```

## 에이전트 협업 규칙

### 역할 분담
- **PM** → 요구사항/PRD 정의, 기능 우선순위(P0/P1/P2) 결정
- **Designer** → 디자인 시스템/UI 명세, 컴포넌트 스펙(px/hex/rem)
- **BE** → API 서버 구현, 공공 API 연동, 캐싱 전략
- **FE** → UI 구현, API 연동, 성능 최적화
- **QA** → 기능/보안/성능/타입 안전성 전 영역 검증

### 필수 워크플로우 (반드시 준수)

```
기능 구현 사이클:
1. PM → 요구사항/수용기준 정의
2. Designer → UI 명세 작성 (필요 시)
3. BE + FE → 병렬 구현
4. ✅ QA → 반드시 자동 실행 (FE 또는 BE 작업 완료 즉시)
5. QA Critical/Major 이슈 → FE/BE 즉시 수정
6. 빌드 성공 → 커밋/푸시
```

### QA 자동 실행 트리거 (필수)
다음 중 하나라도 해당되면 **QA 에이전트를 반드시 proactively 호출**:
- FE 에이전트가 코드 작업을 완료한 직후
- BE 에이전트가 코드 작업을 완료한 직후
- 새 기능 추가 또는 버그 수정 완료 후
- 커밋/푸시 전

### 인터페이스 계약 원칙
각 에이전트는 자신의 역할 범위에서 최선의 결정을 내리되:
- BE↔FE 타입/필드명은 반드시 양측 동일하게 유지
- API 응답 형식: `{ success: true, data: T }` / `{ success: false, error: { code, message } }`
- 열거형 값(enum)은 BE `types/index.ts`를 단일 출처로 사용
