# Aptner BE API 계약서 (API_SPEC)

**버전**: 1.0.0
**작성일**: 2026-03-14
**Base URL**: `http://localhost:3001/api`
**담당**: Backend (Node.js + Express + TypeScript)

---

## 공통 규약

### 응답 형식

모든 API는 아래 두 가지 형식 중 하나로 응답합니다.

#### 성공 응답
```json
{
  "success": true,
  "data": <T>,
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  },
  "cached": false
}
```

- `meta`는 목록 조회 시에만 포함됩니다.
- `cached`는 캐시에서 반환된 경우 `true`입니다.

#### 에러 응답
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "사람이 읽을 수 있는 에러 메시지"
  }
}
```

### 에러 코드 목록

| HTTP 상태 | 에러 코드 | 설명 |
|-----------|-----------|------|
| 400 | `MISSING_PARAMS` | 필수 파라미터 누락 |
| 400 | `INVALID_LAWD_CD` | 잘못된 지역 코드 형식 |
| 400 | `INVALID_DEAL_YMD` | 잘못된 년월 형식 |
| 400 | `INVALID_STATUS` | 잘못된 청약 상태값 |
| 400 | `INVALID_TYPE` | 잘못된 트렌드 타입 |
| 400 | `INVALID_INPUT` | 의심스러운 입력값 감지 |
| 403 | `CORS_ERROR` | 허용되지 않은 도메인 |
| 404 | `NOT_FOUND` | 요청한 리소스 없음 |
| 404 | `SUBSCRIPTION_NOT_FOUND` | 청약 정보 없음 |
| 404 | `REGION_NOT_FOUND` | 지역 정보 없음 |
| 429 | `RATE_LIMIT_EXCEEDED` | 요청 한도 초과 (15분 내 100회) |
| 429 | `API_RATE_LIMIT_EXCEEDED` | API별 요청 한도 초과 |
| 500 | `INTERNAL_SERVER_ERROR` | 서버 내부 오류 |
| 500 | `CONFIGURATION_ERROR` | 서버 설정 오류 |
| 502 | `EXTERNAL_API_ERROR` | 외부 API 호출 오류 |
| 503 | `EXTERNAL_API_UNAVAILABLE` | 외부 API 일시 불가 |
| 504 | `EXTERNAL_API_TIMEOUT` | 외부 API 타임아웃 |

### 보안

- Rate Limit: 전역 100회/15분, API별 20회/분
- CORS: `ALLOWED_ORIGINS` 환경변수에 명시된 도메인만 허용
- 모든 입력값 검증 (SQL Injection, XSS 방어)
- 프로덕션 환경에서 스택 트레이스 노출 없음

---

## 엔드포인트 목록

### 1. 헬스체크

#### `GET /api/health`

서버 상태 및 캐시 통계를 반환합니다.

**응답 예시**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-03-14T10:00:00.000Z",
    "uptime": 3600,
    "environment": "development",
    "cache": {
      "hits": 142,
      "misses": 38,
      "keys": 12
    }
  }
}
```

---

### 2. 아파트 실거래가

#### `GET /api/apartments/trades`

국토교통부 실거래가 API를 통해 특정 지역/기간의 아파트 매매 거래를 조회합니다.

**Query Parameters**

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|----------|------|------|------|------|
| `lawdCd` | string | 필수 | 법정동 코드 앞 5자리 (시군구 코드) | `11680` (강남구) |
| `dealYmd` | string | 필수 | 거래 년월 (YYYYMM) | `202401` |
| `page` | number | 선택 | 페이지 번호 (기본: 1) | `1` |
| `limit` | number | 선택 | 페이지당 건수 (기본: 20, 최대: 100) | `20` |

**요청 예시**
```
GET /api/apartments/trades?lawdCd=11680&dealYmd=202401&page=1&limit=20
```

**응답 데이터 (`data` 배열 요소)**

| 필드 | 타입 | 설명 |
|------|------|------|
| `apartmentName` | string | 아파트명 |
| `area` | number | 전용 면적 (m²) |
| `floor` | number | 층 |
| `price` | number | 거래 금액 (만원) |
| `dealDate` | string | 거래 일자 (YYYY-MM-DD) |
| `dealYear` | number | 거래 년도 |
| `dealMonth` | number | 거래 월 |
| `dealDay` | number | 거래 일 |
| `lawdCd` | string | 법정동 코드 |
| `lawdNm` | string | 법정동 이름 |
| `roadNm` | string? | 도로명 주소 |
| `buildYear` | number? | 건축 년도 |
| `aptCode` | string? | 아파트 코드 |

**캐시 TTL**: 6시간

---

#### `GET /api/apartments/:aptCode/history`

특정 아파트의 실거래가 히스토리를 조회합니다. Recharts 차트 렌더링에 사용합니다.

**Path Parameters**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `aptCode` | string | 아파트 코드 또는 아파트명 |

**Query Parameters**

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|----------|------|------|------|------|
| `lawdCd` | string | 필수 | 법정동 코드 앞 5자리 | `11680` |
| `months` | number | 선택 | 조회 기간 (기본: 24, 최대: 36) | `24` |
| `area` | number | 선택 | 전용 면적 필터 (m²) | `84.99` |

**요청 예시**
```
GET /api/apartments/12345/history?lawdCd=11680&months=24&area=84.99
```

**응답 데이터 (`data` 배열 요소)**

| 필드 | 타입 | 설명 |
|------|------|------|
| `dealDate` | string | 거래 일자 (YYYY-MM-DD) |
| `price` | number | 거래 금액 (만원) |
| `area` | number | 전용 면적 (m²) |
| `floor` | number | 층 |

**캐시 TTL**: 6시간

---

#### `GET /api/apartments/hot`

최근 거래량 기준 핫한 아파트 랭킹을 조회합니다.

**Query Parameters**

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|----------|------|------|------|------|
| `region` | string | 선택 | 시도 코드 2자리 (기본: 11, 서울) | `11` |
| `limit` | number | 선택 | 랭킹 개수 (기본: 10, 최대: 20) | `10` |

**요청 예시**
```
GET /api/apartments/hot?region=11&limit=10
```

**응답 데이터 (`data` 배열 요소)**

| 필드 | 타입 | 설명 |
|------|------|------|
| `rank` | number | 순위 |
| `aptCode` | string | 아파트 코드 |
| `apartmentName` | string | 아파트명 |
| `lawdNm` | string | 법정동명 |
| `recentPrice` | number | 최근 거래가 (만원) |
| `area` | number | 전용 면적 (m²) |
| `tradeCount` | number | 월 거래 건수 |
| `priceChange` | number | 가격 변동액 (만원) |
| `priceChangeRate` | number | 가격 변동률 (%) |

**캐시 TTL**: 6시간

---

### 3. 청약 정보

> **주의**: 현재 Mock 데이터로 구현됩니다. LH 청약홈 OpenAPI 연동 시 `subscription.service.ts`를 교체하세요.

#### `GET /api/subscriptions`

청약 목록을 조회합니다. 기본 정렬: 마감일 오름차순.

**Query Parameters**

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|----------|------|------|------|------|
| `page` | number | 선택 | 페이지 번호 (기본: 1) | `1` |
| `limit` | number | 선택 | 페이지당 건수 (기본: 20, 최대: 50) | `20` |
| `status` | string | 선택 | 상태 필터 (`upcoming`\|`ongoing`\|`closed`) | `ongoing` |
| `sido` | string | 선택 | 시도 필터 | `서울특별시` |

**요청 예시**
```
GET /api/subscriptions?status=ongoing&sido=서울특별시&page=1
```

**응답 데이터 (`data` 배열 요소)**

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | string | 청약 ID |
| `name` | string | 단지명 |
| `constructor` | string | 건설사 |
| `sido` | string | 시도 |
| `sigungu` | string | 시군구 |
| `address` | string | 상세 주소 |
| `minPrice` | number | 분양가 최저 (만원) |
| `maxPrice` | number | 분양가 최대 (만원) |
| `totalSupply` | number | 총 공급 세대수 |
| `status` | string | 청약 상태 (`upcoming`\|`ongoing`\|`closed`) |
| `startDate` | string | 접수 시작일 (YYYY-MM-DD) |
| `endDate` | string | 접수 마감일 (YYYY-MM-DD) |
| `announceDate` | string | 당첨자 발표일 (YYYY-MM-DD) |
| `type` | string | 청약 유형 |
| `dDay` | number | 마감 D-day (양수: 마감 전, 음수: 마감 후) |
| `areas` | array | 평형 목록 |

**`areas` 요소**

| 필드 | 타입 | 설명 |
|------|------|------|
| `typeName` | string | 평형 이름 (예: 84A) |
| `area` | number | 전용 면적 (m²) |
| `supply` | number | 공급 세대수 |
| `price` | number | 분양가 (만원) |

**캐시 TTL**: 1시간

---

#### `GET /api/subscriptions/:id`

청약 상세 정보를 조회합니다.

**Path Parameters**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `id` | string | 청약 ID |

**요청 예시**
```
GET /api/subscriptions/sub-2024-001
```

**응답 데이터 (`data` 객체)**

기본 Subscription 필드에 추가로:

| 필드 | 타입 | 설명 |
|------|------|------|
| `schedule` | object | 청약 일정 상세 |
| `schedule.specialStartDate` | string? | 특별공급 접수 시작일 |
| `schedule.specialEndDate` | string? | 특별공급 접수 마감일 |
| `schedule.firstPriorityDate` | string? | 1순위 접수일 |
| `schedule.secondPriorityDate` | string? | 2순위 접수일 |
| `schedule.announceDate` | string | 당첨자 발표일 |
| `schedule.contractStartDate` | string? | 계약 시작일 |
| `schedule.contractEndDate` | string? | 계약 마감일 |
| `specialSupply` | number? | 특별 공급 세대수 |
| `nearbyAvgPrice` | number? | 주변 실거래가 평균 (만원/m²) |

**캐시 TTL**: 1시간

---

### 4. 트렌드

#### `GET /api/trends/region`

지역별 가격 트렌드를 조회합니다.

**Query Parameters**

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|----------|------|------|------|------|
| `regionCode` | string | 필수 | 시도 코드(2자리) 또는 시군구 코드(5자리) | `11` |
| `type` | string | 선택 | 집계 단위 (`weekly`\|`monthly`, 기본: `monthly`) | `monthly` |

**요청 예시**
```
GET /api/trends/region?regionCode=11&type=monthly
```

**응답 데이터 (`data` 객체)**

| 필드 | 타입 | 설명 |
|------|------|------|
| `regionCode` | string | 지역 코드 |
| `regionName` | string | 지역명 |
| `period` | string | 집계 단위 (`weekly`\|`monthly`) |
| `avgPrice` | number | 전체 평균 거래가 (만원) |
| `priceChange` | number | 최근 기간 가격 변동액 (만원) |
| `priceChangeRate` | number | 최근 기간 가격 변동률 (%) |
| `tradeCount` | number | 전체 거래 건수 |
| `data` | array | 기간별 데이터 포인트 |

**`data` 요소**

| 필드 | 타입 | 설명 |
|------|------|------|
| `date` | string | 기간 (월별: YYYY-MM, 주별: YYYY-Www) |
| `avgPrice` | number | 해당 기간 평균 거래가 (만원) |
| `tradeCount` | number | 해당 기간 거래 건수 |

**캐시 TTL**: 30분

---

### 5. 지역 코드

#### `GET /api/regions/list`

전국 시도 목록을 조회합니다.

**응답 예시**
```json
{
  "success": true,
  "data": [
    { "code": "11", "name": "서울특별시" },
    { "code": "41", "name": "경기도" }
  ]
}
```

**캐시 TTL**: 24시간

---

#### `GET /api/regions/:siDoCd/sigungu`

시도 코드에 해당하는 시군구 목록을 조회합니다.

**Path Parameters**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `siDoCd` | string | 시도 코드 2자리 |

**요청 예시**
```
GET /api/regions/11/sigungu
```

**응답 데이터 (`data` 배열 요소)**

| 필드 | 타입 | 설명 |
|------|------|------|
| `code` | string | 법정동 코드 앞 5자리 (국토부 API용) |
| `name` | string | 시군구명 |
| `siDoCode` | string | 상위 시도 코드 |

**캐시 TTL**: 24시간

---

## 캐싱 전략

| 데이터 | TTL | 비고 |
|--------|-----|------|
| 아파트 실거래가 | 6시간 | 국토부 API 월별 제공 특성 반영 |
| 청약 목록/상세 | 1시간 | 당일 내 상태 변경 가능성 고려 |
| 지역 코드 | 24시간 | 변경 빈도 매우 낮음 |
| 트렌드 데이터 | 30분 | 계산 비용이 높아 적극적으로 캐싱 |

- 캐시 구현: `node-cache` (인메모리)
- 외부 API 실패 시: 캐시 데이터가 있으면 캐시 반환 + `cached: true` 플래그

---

## 환경변수

| 변수명 | 필수 | 기본값 | 설명 |
|--------|------|--------|------|
| `PORT` | 선택 | `3001` | 서버 포트 |
| `NODE_ENV` | 선택 | `development` | 실행 환경 |
| `MOLIT_API_KEY` | 필수 | - | 국토부 실거래가 API 키 (data.go.kr 발급) |
| `ALLOWED_ORIGINS` | 선택 | `http://localhost:5173` | CORS 허용 도메인 (쉼표 구분) |

---

## FE 연동 가이드

### Base URL 설정
```typescript
// FE에서 axios 인스턴스 생성 예시
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api',
  timeout: 15000,
});
```

### 주요 시도 코드

| 코드 | 시도 |
|------|------|
| `11` | 서울특별시 |
| `26` | 부산광역시 |
| `28` | 인천광역시 |
| `41` | 경기도 |

### 서울 주요 시군구 코드

| 코드 | 구 |
|------|-----|
| `11110` | 종로구 |
| `11650` | 서초구 |
| `11680` | 강남구 |
| `11710` | 송파구 |
| `11740` | 강동구 |
| `11440` | 마포구 |

---

*이 문서는 BE 구현 기준 API 계약서입니다. API 변경 시 반드시 이 문서를 함께 업데이트하세요.*
