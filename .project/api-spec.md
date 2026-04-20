# 봄집 API 명세

> 소유자: 이서연 (BE)
> 버전: 1.0.0 | Base URL: `http://localhost:3001/api`

---

## 공통 규약

### 응답 형식
```json
// 성공
{ "success": true, "data": T, "meta": { "total", "page", "limit", "totalPages" }, "cached": false }
// 에러
{ "success": false, "error": { "code": "ERROR_CODE", "message": "..." } }
```

### 에러 코드
| HTTP | 코드 | 설명 |
|------|------|------|
| HTTP | 코드 | 설명 |
|------|------|------|
| 400 | MISSING_PARAMS | 필수 파라미터 누락 |
| 400 | INVALID_LAWD_CD | 잘못된 지역 코드 형식 |
| 400 | INVALID_YEAR | 잘못된 년도 (2006~2100 범위 외) |
| 400 | INVALID_MONTH | 잘못된 월 (1~12 범위 외) |
| 400 | INVALID_PARAMS | year/month 중 하나만 지정 |
| 400 | INVALID_COORDS | 좌표 파라미터가 숫자 아님 |
| 400 | OUT_OF_RANGE | 한국 범위를 벗어난 좌표 |
| 429 | RATE_LIMIT_EXCEEDED | 요청 한도 초과 |
| 502 | EXTERNAL_API_ERROR | 외부 API 오류 |
| 504 | EXTERNAL_API_TIMEOUT | 외부 API 타임아웃 |

---

## 엔드포인트

### 아파트 실거래가
- `GET /api/apartments/trades?lawdCd=11680&dealYmd=202401` — 지역/기간별 매매 거래
- `GET /api/apartments/:aptCode/history?lawdCd=11680&months=24` — 차트용 히스토리
- `GET /api/apartments/hot?region=11&limit=10` — 핫 아파트 랭킹
- `GET /api/apartments/map-prices?lawdCd=11200` — 지도 마커용 단지별 최근 거래가 요약
- `GET /api/apartments/record-highs?region=수도권&limit=5` — 신고가 경신 단지 (홈 v2)

#### GET /api/apartments/record-highs

이번 달 거래가가 이전 달 대비 신고가를 경신한 단지 목록. 홈 v2 카드 섹션용.

**Query params**
| 파라미터 | 필수 | 기본값 | 설명 | 예시 |
|---------|------|--------|------|------|
| region  | 선택 | `수도권` | `수도권` 또는 `전국` | `수도권` |
| limit   | 선택 | `5` | 반환 건수 (1~10) | `5` |

**응답 예시**
```json
{
  "success": true,
  "data": [
    {
      "aptName": "래미안원베일리",
      "location": "서울 서초구",
      "area": 84,
      "recentPrice": 150000,
      "previousPrice": 138000,
      "priceChangeRate": 8.7,
      "dealDate": "2026-03",
      "lawdCd": "11650"
    }
  ],
  "meta": { "baseMonth": "2026-03", "region": "수도권" }
}
```

- 실 API 키 없거나 결과 0건이면 Mock fallback 반환 (ADR-006)
- 동일 단지 동일 면적(반올림 기준) 비교
- priceChangeRate 내림차순 정렬
- 캐시 TTL: MAP_PRICES (10분)

**에러 코드**
| HTTP | 코드 | 설명 |
|------|------|------|
| 400 | INVALID_REGION | region이 `수도권`/`전국` 외 값 |
| 400 | INVALID_LIMIT | limit이 1~10 범위 외 |

---

#### GET /api/apartments/map-prices

지도 뷰포트 내 아파트 마커에 거래가를 표시하기 위한 단지별 최근 1건 요약 API.

**Query params**
| 파라미터 | 필수 | 설명 | 예시 |
|---------|------|------|------|
| lawdCd  | 필수 | 법정동 코드 5자리 | `11200` |
| year    | 선택 | 조회 년도 (month와 함께 사용) | `2025` |
| month   | 선택 | 조회 월 1~12 (year와 함께 사용) | `2` |

- `year`/`month` 미지정 시: 현재 달 포함 최근 3개월 자동 조회
- `year`/`month`는 둘 다 있거나 둘 다 없어야 함 (한쪽만 지정 → 400)

**응답**
```typescript
interface ApartmentPrice {
  aptName: string;      // 아파트명 (카카오 Places 매칭 키)
  recentPrice: number;  // 최근 거래가 (만원)
  dealDate: string;     // 거래일 (YYYY-MM-DD)
  floor: number;        // 층
  area: number;         // 전용면적 (m²)
}
// { success: true, data: ApartmentPrice[], cached: boolean }
```

- 동일 단지(aptName) 중 가장 최근 거래 1건만 포함
- API 키 없거나 결과 0건 시 Mock fallback 12건 반환
- 캐시 TTL: 1시간

### 청약 정보
- `GET /api/subscriptions?status=ongoing&sido=서울특별시&month=2026-03` — 청약 목록
- `GET /api/subscriptions/:id` — 청약 상세

#### GET /api/subscriptions

**Query params**
| 파라미터 | 필수 | 기본값 | 설명 | 예시 |
|---------|------|--------|------|------|
| page    | 선택 | `1` | 페이지 번호 | `1` |
| limit   | 선택 | `20` | 페이지당 건수 (최대 50) | `20` |
| status  | 선택 | - | `upcoming` \| `ongoing` \| `closed` | `ongoing` |
| sido    | 선택 | - | 시도 필터 | `서울특별시` |
| sort    | 선택 | `dDay` | `dDay` \| `units` \| `price` | `dDay` |
| month   | 선택 | - | YYYY-MM 형식. 해당 월에 startDate 또는 endDate가 걸치는 청약만 반환 | `2026-03` |

- `month` 필터 조건: `startDate <= 해당월 말일 AND endDate >= 해당월 1일`
- 다른 필터(status, sido, sort)와 AND 조건으로 함께 동작

### 트렌드
- `GET /api/trends/summary` — 전국 시장 요약 (평균가/변동률/거래량)
- `GET /api/trends/region?regionCode=11&type=monthly` — 지역별 가격 트렌드

#### GET /api/trends/summary

홈 `MarketSummaryBanner` 컴포넌트용 전국(주요 시도) 시장 요약 API.
서울/경기/인천/부산/대구/광주/대전/울산 8개 시도 데이터를 병렬 조회 후 집계.
실 API 키 없거나 조회 결과 0건이면 Mock fallback 반환.

**응답**
```json
{
  "success": true,
  "data": {
    "scope": "수도권",
    "avgPrice": 87500,
    "priceChange": 1.2,
    "tradeCount": 23847,
    "baseYearMonth": "2026-03",
    "updatedAt": "2026-03-19T00:00:00.000Z"
  }
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| scope | `"수도권" \| "전국"` | 집계 범위 |
| avgPrice | number | 평균 거래가 (만원) |
| priceChange | number | 전월 대비 변동률 (%) |
| tradeCount | number | 이번 달 거래량 (건) |
| baseYearMonth | string | 기준 년월 (YYYY-MM) |
| updatedAt | string | 데이터 갱신 시각 (ISO 8601) |

- 캐시 TTL: 6시간 (`Cache-Control: public, max-age=21600`)
- 파라미터 없음

### 지역 코드
- `GET /api/regions/list` — 전국 시도 목록
- `GET /api/regions/:siDoCd/sigungu` — 시군구 목록
- `GET /api/regions/lawdCd?lat=37.56&lng=126.97` — 좌표 → 법정동 코드 변환

#### GET /api/regions/lawdCd

지도 중심 좌표로 가장 가까운 시군구 법정동 코드를 반환합니다.
FE에서 카카오맵 뷰포트 중심 좌표를 전달해 `/api/apartments/map-prices` 조회에 사용합니다.

**Query params**
| 파라미터 | 필수 | 설명 | 예시 |
|---------|------|------|------|
| lat     | 필수 | 위도 | `37.56` |
| lng     | 필수 | 경도 | `126.97` |

**응답**
```json
{ "success": true, "data": { "lawdCd": "11200", "sigungu": "서울 성동구" } }
```

- 1순위: 좌표가 시군구 바운딩박스 내부에 있으면 해당 코드 반환
- 2순위: 모든 시군구 중심점과의 거리가 가장 가까운 코드 반환 (fallback)
- 서울 25개 구 + 경기 주요 시군구 내장 테이블 사용
- 캐시 TTL: 24시간 (소수점 3자리 반올림 좌표 기준 캐싱)
- 에러: 한국 범위(위도 33~38.7, 경도 124.5~131) 벗어난 좌표 → `OUT_OF_RANGE`

---

## 환경변수

| 변수명 | 필수 | 설명 |
|--------|------|------|
| PORT | 선택 | 서버 포트 (기본 3001) |
| MOLIT_API_KEY | 필수 | 국토부 실거래가 API 키 |
| ALLOWED_ORIGINS | 선택 | CORS 허용 도메인 |

---

*원본: `/Users/bong/aptner/API_SPEC.md`*
