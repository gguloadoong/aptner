// ============================================================
// 청약 정보 서비스
// LH 청약홈 OpenAPI 연동:
//   - 분양정보: https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1/getApplyhomeInfoDetail
//   - 경쟁률:   https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1/getAPTLttotPblancDetail
// 실 키 미설정 시 Mock 데이터로 graceful fallback
// ============================================================
import axios from 'axios';
import {
  Subscription,
  SubscriptionArea,
  SubscriptionDetail,
  SubscriptionQueryParams,
  SubscriptionStatus,
} from '../types';
import { cacheService, CACHE_TTL } from './cache.service';

// LH API 타임아웃: 10초
const LH_API_TIMEOUT = 10_000;

// ============================================================
// LH 청약홈 실 API 연동 함수
// ============================================================

/**
 * 실제 LH 청약홈 API 키인지 여부를 판별합니다.
 * 미설정이거나 demo 플레이스홀더 값이면 false를 반환합니다.
 * 실제 공공데이터포털 인증키는 최소 20자 이상이어야 합니다.
 */
function isRealLhApiKey(): boolean {
  const key = process.env.LH_SUBSCRIPTION_API_KEY;
  if (!key) return false;
  if (key === 'demo_key_replace_with_real_key') return false;
  // 실제 공공데이터포털 키는 URL-encoded 문자열로 최소 20자 이상
  if (key.length < 20) return false;
  return true;
}

/**
 * LH 청약홈 분양정보 상세 목록을 실 API로 조회합니다.
 * API 키 미설정 시 빈 배열을 반환합니다.
 * 실패 시 에러를 throw하며, 호출부에서 Mock fallback 처리합니다.
 *
 * @param page - 페이지 번호 (1부터 시작)
 * @param perPage - 페이지당 건수
 */
export async function fetchRealSubscriptions(page = 1, perPage = 20): Promise<any[]> {
  if (!isRealLhApiKey()) {
    console.warn('[Subscription] LH_SUBSCRIPTION_API_KEY 미설정 → 실 API 호출 스킵');
    return [];
  }

  const apiKey = process.env.LH_SUBSCRIPTION_API_KEY;
  const keyPrefix = apiKey ? `${apiKey.substring(0, 8)}...` : '없음';
  console.log(`[Subscription] 분양공고 실 API 호출: page=${page}, perPage=${perPage}, key=${keyPrefix}`);

  const response = await axios.get(
    'https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1/getAPTLttotPblancDetail',
    {
      params: {
        serviceKey: apiKey,
        page,
        perPage,
      },
      timeout: LH_API_TIMEOUT,
    }
  );

  const data = response.data?.data ?? [];
  console.log(`[Subscription] 분양공고 실 API 응답: ${data.length}건`);
  return data;
}

/**
 * LH 주택형 상세 API를 호출하여 면적별 분양가 정보를 가져옵니다.
 * API: getAPTLttotPblancMdl
 *
 * 반환 구조: Map<HOUSE_MANAGE_NO, 주택형 목록>
 * 키 없거나 API 실패 시 빈 Map을 반환합니다.
 *
 * @param page - 페이지 번호 (1부터 시작)
 * @param perPage - 가져올 주택형 건수 (공고 1건당 보통 2~5개 주택형)
 */
async function fetchHouseTypeDetails(page = 1, perPage = 500): Promise<Map<string, any[]>> {
  const apiKey = process.env.LH_SUBSCRIPTION_API_KEY;
  if (!apiKey) return new Map();

  const typeMap = new Map<string, any[]>();

  const addItems = (items: any[]) => {
    for (const item of items) {
      const key = String(item.HOUSE_MANAGE_NO ?? item.PBLANC_NO ?? '');
      if (!key) continue;
      if (!typeMap.has(key)) typeMap.set(key, []);
      typeMap.get(key)!.push(item);
    }
  };

  try {
    // 첫 페이지 요청 — totalCount 확인 후 추가 페이지 처리
    const first = await axios.get(
      'https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1/getAPTLttotPblancMdl',
      { params: { serviceKey: apiKey, page, perPage }, timeout: LH_API_TIMEOUT }
    );
    const firstItems: any[] = first.data?.data ?? [];
    const totalCount: number = first.data?.totalCount ?? firstItems.length;
    console.log(`[Subscription] 주택형 API 응답: ${firstItems.length}건 (전체 ${totalCount}건)`);
    addItems(firstItems);

    // 추가 페이지가 있으면 병렬 수집 (최대 10페이지 cap)
    const totalPages = Math.min(Math.ceil(totalCount / perPage), 10);
    if (totalPages > 1) {
      const pageNums = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
      const results = await Promise.allSettled(
        pageNums.map((p) =>
          axios.get(
            'https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1/getAPTLttotPblancMdl',
            { params: { serviceKey: apiKey, page: p, perPage }, timeout: LH_API_TIMEOUT }
          )
        )
      );
      for (const res of results) {
        if (res.status === 'fulfilled') {
          addItems(res.value.data?.data ?? []);
        }
      }
    }

    return typeMap;
  } catch (err) {
    console.warn('[Subscription] 주택형 API 호출 실패 → areas 빈 배열로 대체:', err);
    return new Map();
  }
}

/**
 * LH API 날짜 문자열(YYYYMMDD 또는 YYYY-MM-DD)을 YYYY-MM-DD 형식으로 정규화합니다.
 * 잘못된 포맷이 들어오면 빈 문자열을 반환합니다.
 */
function normalizeDateStr(raw: string | undefined | null): string {
  if (!raw) return '';
  const s = String(raw).trim();
  // YYYYMMDD → YYYY-MM-DD 변환
  if (/^\d{8}$/.test(s)) {
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  }
  // 이미 YYYY-MM-DD 형식이면 그대로 반환
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    return s.slice(0, 10);
  }
  return '';
}

/**
 * LH 주택형 API 항목에서 가격(만원)을 파싱합니다.
 * LTTOT_TOP_AMOUNT 필드가 만원 단위 숫자 문자열입니다.
 * 10억(100,000만원) 초과면 원 단위로 간주하여 만원으로 환산합니다.
 */
function parseHouseTypePrice(raw: string | number | null | undefined): number {
  const n = Number(raw) || 0;
  return n > 1_000_000 ? Math.round(n / 10000) : n;
}

/**
 * LH 주택형 API 항목 하나를 SubscriptionArea 타입으로 변환합니다.
 * HOUSE_TY 예시: "084.9345A" → typeName="84A", area=84.93
 */
function adaptHouseTypeItem(item: any): SubscriptionArea {
  const rawType = String(item.HOUSE_TY ?? '').trim();
  // "084.9345A" → 숫자부 앞 3자리가 전용면적, 뒤 문자가 타입 구분자
  const typeMatch = rawType.match(/^(\d+)\.(\d+)([A-Z]?)$/);
  let typeName = rawType;
  let area = 0;
  if (typeMatch) {
    const intPart = parseInt(typeMatch[1], 10);
    const decPart = typeMatch[2].slice(0, 2); // 소수점 2자리까지
    const suffix = typeMatch[3] || '';
    area = parseFloat(`${intPart}.${decPart}`);
    typeName = `${intPart}${suffix}`;
  }

  // 공급 세대수: 일반공급(SUPLY_HSHLDCO) + 특별공급(SPSPLY_HSHLDCO)
  const supply = (Number(item.SUPLY_HSHLDCO) || 0) + (Number(item.SPSPLY_HSHLDCO) || 0);

  return {
    typeName,
    area,
    supply,
    price: parseHouseTypePrice(item.LTTOT_TOP_AMOUNT),
  };
}

/**
 * LH API 응답을 Subscription 타입으로 변환합니다.
 *
 * 날짜 필드: API는 YYYYMMDD 형식으로 반환하므로 normalizeDateStr()로 변환합니다.
 * 가격 필드: 주택형별 LTTOT_TOP_AMOUNT(만원)에서 min/max를 계산합니다.
 *            주택형 데이터 없으면 0으로 유지됩니다.
 *
 * @param item - LH 분양공고 API 항목
 * @param houseTypeMap - 주택형 API 결과 Map (HOUSE_MANAGE_NO → 주택형 목록)
 */
function adaptLhItem(item: any, houseTypeMap: Map<string, any[]>): Subscription {
  // 날짜 필드 정규화 (YYYYMMDD → YYYY-MM-DD)
  const startDate = normalizeDateStr(item.RCEPT_BGNDE ?? item.SPSPLY_RCEPT_BGNDE);
  // 일반공급 2순위 마감일을 우선 사용하고, 없으면 접수 마감일로 fallback
  const endDate = normalizeDateStr(
    item.GNRL_RNK2_ETC_AREA_ENDDE ?? item.RCEPT_ENDDE ?? item.SPSPLY_RCEPT_ENDDE,
  );
  const announceDate = normalizeDateStr(item.PRZWNER_PRESNATN_DE) || addDays(endDate || startDate, 14);

  const address = item.HSSPLY_ADRES ?? '';
  // SUBSCRPT_AREA_CODE_NM: 예) "서울특별시" / 없으면 주소 첫 토큰 사용
  const sido = item.SUBSCRPT_AREA_CODE_NM ?? address.split(' ')[0] ?? '';
  const sigungu = address.split(' ')[1] ?? '';

  // 주택형별 면적/분양가 정보 구성
  const houseManageNo = String(item.HOUSE_MANAGE_NO ?? item.PBLANC_NO ?? '');
  const rawTypeItems = houseTypeMap.get(houseManageNo) ?? [];
  const areas: SubscriptionArea[] = rawTypeItems
    .map(adaptHouseTypeItem)
    .filter((a) => a.area > 0)
    // 같은 typeName이 중복될 수 있으므로 typeName 기준 중복 제거
    .filter((a, idx, arr) => arr.findIndex((b) => b.typeName === a.typeName) === idx)
    .sort((a, b) => a.area - b.area);

  // 분양가 min/max: 주택형 데이터 있으면 그 값 사용, 없으면 0
  const prices = areas.map((a) => a.price).filter((p) => p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

  const totalSupply = Number(item.TOT_SUPLY_HSHLDCO) || 0;
  // supplyPrice: minPrice 만원 단위 그대로 사용 (0이면 미확정 → undefined)
  const supplyPrice = minPrice > 0 ? minPrice : undefined;

  return {
    id: houseManageNo || `${item.HOUSE_NM ?? 'unknown'}-${sido}-${startDate}`,
    name: item.HOUSE_NM ?? '단지명 없음',
    location: [sido, sigungu].filter(Boolean).join(' '),
    constructor: item.CNSTRCT_ENTRPS_NM ?? '',
    sido,
    sigungu,
    address,
    supplyPrice,
    minPrice,
    maxPrice,
    totalUnits: totalSupply,
    totalSupply,
    startDate,
    endDate,
    announceDate,
    type: item.HOUSE_DTL_SECD_NM === '공공' ? '특별공급' : '일반공급',
    areas,
    status: calcStatus(startDate, endDate),
    dDay: endDate ? calcDDay(endDate) : 0,
  };
}

/**
 * LH 청약홈 분양공고 상세(경쟁률 포함) 목록을 실 API로 조회합니다.
 * API 키 미설정 시 빈 배열을 반환합니다.
 * 실패 시 에러를 throw하며, 호출부에서 Mock fallback 처리합니다.
 *
 * @param page - 페이지 번호 (1부터 시작)
 * @param perPage - 페이지당 건수
 */
export async function fetchRealCompetitionRate(page = 1, perPage = 20): Promise<any[]> {
  if (!isRealLhApiKey()) {
    console.warn('[Subscription] LH_SUBSCRIPTION_API_KEY 미설정 → 경쟁률 API 호출 스킵');
    return [];
  }

  const apiKey = process.env.LH_COMPETITION_API_KEY;

  // LH_COMPETITION_API_KEY 도 별도 키이므로 유효성 확인 (20자 이상 실 키만 허용)
  if (!apiKey || apiKey === 'demo_key_replace_with_real_key' || apiKey.length < 20) {
    console.warn('[Subscription] LH_COMPETITION_API_KEY 미설정 또는 유효하지 않음 → 경쟁률 API 호출 스킵');
    return [];
  }

  const keyPrefix = `${apiKey.substring(0, 8)}...`;
  console.log(`[Subscription] 경쟁률 실 API 호출: page=${page}, perPage=${perPage}, key=${keyPrefix}`);

  try {
    // 경쟁률 조회는 분양공고 상세(getAPTLttotPblancDetail)가 아닌
    // 청약결과/경쟁률 전용 엔드포인트(getAPTLttotPblancMdlSttus)를 사용
    const response = await axios.get(
      'https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1/getAPTLttotPblancMdlSttus',
      {
        params: {
          serviceKey: apiKey,
          page,
          perPage,
        },
        timeout: LH_API_TIMEOUT,
      }
    );

    const data = response.data?.data ?? [];
    console.log(`[Subscription] 경쟁률 실 API 응답: ${data.length}건`);
    return data;
  } catch (err) {
    // 실 API 키 없거나 네트워크 오류 시 Mock fallback 처리
    console.warn('[Subscription] 경쟁률 실 API 호출 실패 → 빈 배열 반환 (Mock fallback)', err instanceof Error ? err.message : err);
    return [];
  }
}


/**
 * 현재 날짜 기준으로 N일 후(전)의 날짜 문자열 반환
 * 음수 값을 넘기면 과거 날짜를 반환합니다.
 */
function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * D-day 계산 유틸리티
 */
function calcDDay(endDateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(endDateStr);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * 날짜 문자열을 기준으로 청약 상태를 계산합니다.
 */
function calcStatus(startDate: string, endDate: string): SubscriptionStatus {
  if (!startDate || !endDate) return 'upcoming';
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'upcoming';

  if (now < start) return 'upcoming';
  if (now > end) return 'closed';
  return 'ongoing';
}

// ---- Mock 데이터 (실제 청약홈 API 연동 전까지 사용) ----
// 날짜는 daysFromNow()로 동적 생성하여 항상 현재 기준 상대값을 유지합니다.
// ongoing:  startDate 과거, endDate 미래
// upcoming: startDate 미래
// closed:   endDate 과거

const MOCK_SUBSCRIPTIONS_RAW: Omit<Subscription, 'status' | 'dDay' | 'location' | 'totalUnits' | 'supplyPrice'>[] = [
  // ---- 진행중(ongoing) 4개 이상 ----
  {
    id: 'sub-2024-001',
    name: '래미안 원베일리 2차',
    constructor: '삼성물산',
    sido: '서울특별시',
    sigungu: '서초구',
    address: '서울특별시 서초구 반포동 1-1',
    // 서울 서초구 59㎡ 10억, 84㎡ 16억, 109㎡ 24억 수준
    minPrice: 100000,
    maxPrice: 240000,
    totalSupply: 641,
    startDate: daysFromNow(-3),   // 3일 전 시작
    endDate: daysFromNow(4),      // 4일 후 마감
    announceDate: daysFromNow(18),
    type: '일반공급',
    areas: [
      { typeName: '59A', area: 59.98, supply: 120, price: 100000 },
      { typeName: '84A', area: 84.99, supply: 320, price: 160000 },
      { typeName: '109A', area: 109.97, supply: 201, price: 240000 },
    ],
    lat: 37.5068,
    lng: 126.9997,
  },
  {
    id: 'sub-2024-002',
    name: '힐스테이트 e편한세상 문정',
    constructor: '현대건설/DL이앤씨',
    sido: '서울특별시',
    sigungu: '송파구',
    address: '서울특별시 송파구 문정동 150',
    // 서울 송파구 59㎡ 8억, 84㎡ 11억 수준
    minPrice: 80000,
    maxPrice: 110000,
    totalSupply: 1052,
    startDate: daysFromNow(-5),   // 5일 전 시작
    endDate: daysFromNow(2),      // 2일 후 마감
    announceDate: daysFromNow(16),
    type: '일반공급',
    areas: [
      { typeName: '59A', area: 59.6, supply: 400, price: 80000 },
      { typeName: '74A', area: 74.99, supply: 352, price: 96000 },
      { typeName: '84B', area: 84.5, supply: 300, price: 110000 },
    ],
    lat: 37.4875,
    lng: 127.1227,
  },
  {
    id: 'sub-2024-006',
    name: '마포 래미안 클래스',
    constructor: '삼성물산',
    sido: '서울특별시',
    sigungu: '마포구',
    address: '서울특별시 마포구 아현동 300',
    // 서울 마포구 59㎡ 9억, 84㎡ 12억 수준
    minPrice: 90000,
    maxPrice: 120000,
    totalSupply: 720,
    startDate: daysFromNow(-1),   // 어제 시작
    endDate: daysFromNow(6),      // 6일 후 마감
    announceDate: daysFromNow(20),
    type: '일반공급',
    areas: [
      { typeName: '59A', area: 59.9, supply: 280, price: 90000 },
      { typeName: '84A', area: 84.7, supply: 440, price: 120000 },
    ],
    lat: 37.5494,
    lng: 126.9541,
  },
  {
    id: 'sub-2024-009',
    name: '자이 강동 에코파크',
    constructor: 'GS건설',
    sido: '서울특별시',
    sigungu: '강동구',
    address: '서울특별시 강동구 명일동 250',
    // 서울 강동구 59㎡ 8.5억, 84㎡ 11.5억 수준
    minPrice: 85000,
    maxPrice: 115000,
    totalSupply: 560,
    startDate: daysFromNow(-2),   // 2일 전 시작
    endDate: daysFromNow(5),      // 5일 후 마감
    announceDate: daysFromNow(19),
    type: '일반공급',
    areas: [
      { typeName: '59A', area: 59.7, supply: 200, price: 85000 },
      { typeName: '84A', area: 84.8, supply: 360, price: 115000 },
    ],
    lat: 37.5498,
    lng: 127.1491,
  },

  // ---- 예정(upcoming) 3개 이상 (1~14일 후 시작) ----
  {
    id: 'sub-2024-003',
    name: '수원 광교 아이파크',
    constructor: 'HDC현대산업개발',
    sido: '경기도',
    sigungu: '수원시 영통구',
    address: '경기도 수원시 영통구 광교동 100',
    // 경기 수원 광교 59㎡ 5.5억, 84㎡ 7.5억 수준
    minPrice: 55000,
    maxPrice: 90000,
    totalSupply: 824,
    startDate: daysFromNow(5),    // 5일 후 시작
    endDate: daysFromNow(9),      // 9일 후 마감
    announceDate: daysFromNow(23),
    type: '일반공급',
    areas: [
      { typeName: '59A', area: 59.7, supply: 300, price: 55000 },
      { typeName: '84A', area: 84.98, supply: 400, price: 75000 },
      { typeName: '101A', area: 101.0, supply: 124, price: 90000 },
    ],
    lat: 37.2902,
    lng: 127.0457,
  },
  {
    id: 'sub-2024-005',
    name: '고양 창릉 e편한세상',
    constructor: 'DL이앤씨',
    sido: '경기도',
    sigungu: '고양시 덕양구',
    address: '경기도 고양시 덕양구 창릉동 50',
    // 경기 고양 창릉 59㎡ 4.5억, 84㎡ 6.5억 수준
    minPrice: 45000,
    maxPrice: 65000,
    totalSupply: 980,
    startDate: daysFromNow(10),   // 10일 후 시작
    endDate: daysFromNow(14),     // 14일 후 마감
    announceDate: daysFromNow(28),
    type: '특별공급',
    areas: [
      { typeName: '59A', area: 59.5, supply: 400, price: 45000 },
      { typeName: '74A', area: 74.5, supply: 380, price: 55000 },
      { typeName: '84A', area: 84.6, supply: 200, price: 65000 },
    ],
    lat: 37.6341,
    lng: 126.8614,
  },
  {
    id: 'sub-2024-007',
    name: '인천 송도 더샵 센트럴파크',
    constructor: '포스코이앤씨',
    sido: '인천광역시',
    sigungu: '연수구',
    address: '인천광역시 연수구 송도동 400',
    // 인천 송도 59㎡ 5억, 84㎡ 7억 수준
    minPrice: 50000,
    maxPrice: 70000,
    totalSupply: 1200,
    startDate: daysFromNow(7),    // 7일 후 시작
    endDate: daysFromNow(11),     // 11일 후 마감
    announceDate: daysFromNow(25),
    type: '일반공급',
    areas: [
      { typeName: '59A', area: 59.8, supply: 500, price: 50000 },
      { typeName: '74A', area: 74.6, supply: 400, price: 60000 },
      { typeName: '84A', area: 84.9, supply: 300, price: 70000 },
    ],
    lat: 37.3831,
    lng: 126.6563,
  },

  // ---- 마감(closed) 2개 ----
  {
    id: 'sub-2024-004',
    name: '인천 검단 푸르지오 더퍼스트',
    constructor: '대우건설',
    sido: '인천광역시',
    sigungu: '서구',
    address: '인천광역시 서구 검단동 200',
    // 인천 검단 59㎡ 3.5억, 84㎡ 4.7억 수준
    minPrice: 35000,
    maxPrice: 47000,
    totalSupply: 1560,
    startDate: daysFromNow(-20),  // 20일 전 시작
    endDate: daysFromNow(-16),    // 16일 전 마감
    announceDate: daysFromNow(-2),
    type: '일반공급',
    areas: [
      { typeName: '59A', area: 59.99, supply: 600, price: 35000 },
      { typeName: '84A', area: 84.9, supply: 760, price: 42000 },
      { typeName: '102A', area: 102.5, supply: 200, price: 47000 },
    ],
    lat: 37.5932,
    lng: 126.7241,
  },
  {
    id: 'sub-2024-008',
    name: '성남 판교 힐스테이트',
    constructor: '현대건설',
    sido: '경기도',
    sigungu: '성남시 분당구',
    address: '경기도 성남시 분당구 판교동 130',
    // 경기 판교 59㎡ 8억, 84㎡ 12억 수준 (입지 프리미엄)
    minPrice: 80000,
    maxPrice: 120000,
    totalSupply: 540,
    startDate: daysFromNow(-35),  // 35일 전 시작
    endDate: daysFromNow(-31),    // 31일 전 마감
    announceDate: daysFromNow(-17),
    type: '일반공급',
    areas: [
      { typeName: '59A', area: 59.5, supply: 200, price: 80000 },
      { typeName: '84A', area: 84.8, supply: 240, price: 110000 },
      { typeName: '101A', area: 101.2, supply: 100, price: 120000 },
    ],
    lat: 37.3947,
    lng: 127.1116,
  },

  // ---- 진행중(ongoing) 추가 2개 ----
  {
    id: 'SUB009',
    name: '동탄2 아이파크 더레이크',
    constructor: 'HDC현대산업개발',
    sido: '경기도',
    sigungu: '화성시',
    address: '경기도 화성시 동탄 일원',
    // 경기 화성 동탄 59㎡ 4.5억, 84㎡ 7.8억 수준
    minPrice: 45000,
    maxPrice: 78000,
    totalSupply: 1284,
    startDate: daysFromNow(-5),   // 5일 전 시작
    endDate: daysFromNow(8),      // 8일 후 마감
    announceDate: daysFromNow(22),
    type: '일반공급',
    areas: [
      { typeName: '59A', area: 59.7, supply: 500, price: 45000 },
      { typeName: '84A', area: 84.9, supply: 784, price: 78000 },
    ],
    lat: 37.2191,
    lng: 127.0812,
  },
  {
    id: 'SUB010',
    name: '과천 푸르지오 어울림 라비엔오',
    constructor: '대우건설',
    sido: '경기도',
    sigungu: '과천시',
    address: '경기도 과천시 일원',
    // 경기 과천 59㎡ 8.9억, 84㎡ 13.5억 수준
    minPrice: 89000,
    maxPrice: 135000,
    totalSupply: 429,
    startDate: daysFromNow(-3),   // 3일 전 시작
    endDate: daysFromNow(4),      // 4일 후 마감
    announceDate: daysFromNow(18),
    type: '일반공급',
    areas: [
      { typeName: '59A', area: 59.8, supply: 180, price: 89000 },
      { typeName: '84A', area: 84.9, supply: 249, price: 135000 },
    ],
    lat: 37.4295,
    lng: 126.9891,
  },

  // ---- 예정(upcoming) 추가 2개 ----
  {
    id: 'SUB011',
    name: '부산 북항 르엘',
    constructor: '롯데건설',
    sido: '부산광역시',
    sigungu: '동구',
    address: '부산광역시 동구 범일동 일원',
    // 부산 동구 59㎡ 6.8억, 84㎡ 11.2억 수준
    minPrice: 68000,
    maxPrice: 112000,
    totalSupply: 1096,
    startDate: daysFromNow(18),   // 18일 후 시작
    endDate: daysFromNow(22),     // 22일 후 마감
    announceDate: daysFromNow(36),
    type: '일반공급',
    areas: [
      { typeName: '59A', area: 59.9, supply: 450, price: 68000 },
      { typeName: '84A', area: 84.8, supply: 646, price: 112000 },
    ],
    lat: 35.1162,
    lng: 129.0523,
  },
  {
    id: 'SUB012',
    name: '세종 6-3생활권 힐스테이트',
    constructor: '현대건설',
    sido: '세종특별자치시',
    sigungu: '세종시',
    address: '세종특별자치시 어진동 일원',
    // 세종 59㎡ 3.8억, 84㎡ 5.5억 수준
    minPrice: 38000,
    maxPrice: 55000,
    totalSupply: 842,
    startDate: daysFromNow(25),   // 25일 후 시작
    endDate: daysFromNow(29),     // 29일 후 마감
    announceDate: daysFromNow(43),
    type: '일반공급',
    areas: [
      { typeName: '59A', area: 59.6, supply: 350, price: 38000 },
      { typeName: '84A', area: 84.7, supply: 492, price: 55000 },
    ],
    lat: 36.5012,
    lng: 127.2719,
  },

  // ---- 마감(closed) 추가 1개 ----
  {
    id: 'SUB013',
    name: '안산 그랑시티자이 2차',
    constructor: 'GS건설',
    sido: '경기도',
    sigungu: '안산시',
    address: '경기도 안산시 단원구 일원',
    // 경기 안산 59㎡ 4.2억, 84㎡ 6.5억 수준
    minPrice: 42000,
    maxPrice: 65000,
    totalSupply: 2037,
    startDate: daysFromNow(-60),  // 60일 전 시작
    endDate: daysFromNow(-45),    // 45일 전 마감
    announceDate: daysFromNow(-31),
    type: '일반공급',
    areas: [
      { typeName: '59A', area: 59.7, supply: 800, price: 42000 },
      { typeName: '84A', area: 84.8, supply: 1237, price: 65000 },
    ],
    lat: 37.3215,
    lng: 126.8312,
  },
];

/**
 * Mock 데이터에 상태와 D-day를 동적으로 계산하여 붙입니다.
 * 매 호출 시 현재 날짜 기준으로 재계산됩니다.
 */
function buildSubscriptions(): Subscription[] {
  return MOCK_SUBSCRIPTIONS_RAW.map((raw) => ({
    ...raw,
    location: [raw.sido, raw.sigungu].filter(Boolean).join(' '),
    totalUnits: raw.totalSupply,
    supplyPrice: raw.minPrice > 0 ? raw.minPrice : undefined,
    status: calcStatus(raw.startDate, raw.endDate),
    dDay: calcDDay(raw.endDate),
  }));
}

/**
 * 청약 목록을 조회합니다.
 * Mock 데이터를 반환합니다.
 * TODO: LH 청약홈 API 연동 시 교체 필요
 *
 * 캐시 키에 오늘 날짜(YYYY-MM-DD)를 포함하여,
 * 자정이 지나면 캐시가 자동으로 무효화됩니다.
 */
export async function getSubscriptions(
  params: SubscriptionQueryParams,
): Promise<{ items: Subscription[]; total: number }> {
  const today = new Date().toISOString().split('T')[0];
  const cacheKey = `subs:${today}:${JSON.stringify(params)}`;

  const cached = cacheService.get<{ items: Subscription[]; total: number }>(cacheKey);
  if (cached) {
    console.log(`[Subscription] 캐시 히트: ${cacheKey}`);
    return cached;
  }

  const { page = 1, limit = 20, status, sido, sort, month } = params;

  // 실 API 사용 가능하면 LH 데이터 사용
  let list: Subscription[];
  if (isRealLhApiKey()) {
    try {
      // 분양공고 목록과 주택형 데이터를 병렬로 가져옴
      const [rawItems, houseTypeMap] = await Promise.all([
        fetchRealSubscriptions(page, 100),
        fetchHouseTypeDetails(1, 500),
      ]);
      list = rawItems.map((item) => adaptLhItem(item, houseTypeMap));
      console.log(`[Subscription] 실 API 데이터 ${list.length}건 사용 (주택형 그룹 ${houseTypeMap.size}개)`);
      // 실 API가 0건이면 API deprecated 또는 공고 없음 → Mock fallback
      if (list.length === 0) {
        console.warn('[Subscription] 실 API 0건 → Mock fallback 사용');
        list = buildSubscriptions();
      }
    } catch (err) {
      console.error('[Subscription] 실 API 실패 → Mock fallback:', err);
      list = buildSubscriptions();
    }
  } else {
    console.warn('[Subscription] LH_SUBSCRIPTION_API_KEY 미설정 → Mock 데이터 사용');
    list = buildSubscriptions();
  }

  // 상태 필터
  if (status) {
    list = list.filter((s) => s.status === status);
  }

  // 시도 필터
  if (sido) {
    list = list.filter((s) => s.sido === sido || s.sido.startsWith(sido));
  }

  // 월 필터 (YYYY-MM): 해당 월에 startDate 또는 endDate가 걸치는 청약 반환
  // 조건: startDate <= 해당 월 말일 AND endDate >= 해당 월 1일
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [yearStr, monthStr] = month.split('-');
    const monthStart = `${yearStr}-${monthStr}-01`;
    // 해당 월의 마지막 날 계산
    const lastDay = new Date(Number(yearStr), Number(monthStr), 0).getDate();
    const monthEnd = `${yearStr}-${monthStr}-${String(lastDay).padStart(2, '0')}`;
    list = list.filter((s) => {
      if (!s.startDate || !s.endDate) return false;
      // startDate <= monthEnd AND endDate >= monthStart
      return s.startDate <= monthEnd && s.endDate >= monthStart;
    });
  }

  // 정렬 (MAJOR-04)
  if (sort === 'units') {
    // 총 세대수 내림차순
    list.sort((a, b) => b.totalUnits - a.totalUnits);
  } else if (sort === 'price') {
    // 분양가 내림차순 (supplyPrice null인 경우 맨 뒤)
    list.sort((a, b) => {
      const pa = a.supplyPrice ?? -1;
      const pb = b.supplyPrice ?? -1;
      return pb - pa;
    });
  } else {
    // dDay 오름차순 (기본 포함)
    list.sort((a, b) => a.dDay - b.dDay);
  }

  const total = list.length;
  const start = (page - 1) * limit;
  const items = list.slice(start, start + limit);

  const result = { items, total };
  // TTL을 10분으로 설정 (날짜 키 포함으로 자정 무효화도 함께 적용)
  cacheService.set(cacheKey, result, CACHE_TTL.SUBSCRIPTION);

  return result;
}

/**
 * 청약 상세 정보를 조회합니다.
 * Mock 데이터를 반환합니다.
 * TODO: LH 청약홈 API 연동 시 교체 필요
 *
 * 상세 조회도 날짜를 캐시 키에 포함하여 stale 방지.
 */
export async function getSubscriptionById(id: string): Promise<SubscriptionDetail | null> {
  const today = new Date().toISOString().split('T')[0];
  const cacheKey = `sub:${today}:${id}`;

  const cached = cacheService.get<SubscriptionDetail>(cacheKey);
  if (cached) {
    console.log(`[Subscription] 상세 캐시 히트: ${cacheKey}`);
    return cached;
  }

  // 실 API 키 설정 시: 실 API 데이터에서 먼저 검색
  // 목록(getSubscriptions)이 실 API 기반 ID를 반환하므로, 상세도 실 API에서 찾아야 합니다.
  if (isRealLhApiKey()) {
    try {
      const [rawItems, houseTypeMap] = await Promise.all([
        fetchRealSubscriptions(1, 100),
        fetchHouseTypeDetails(1, 500),
      ]);
      const realList = rawItems.map((item) => adaptLhItem(item, houseTypeMap));
      const realFound = realList.find((s) => s.id === id);
      if (realFound) {
        const detail: SubscriptionDetail = {
          ...realFound,
          schedule: {
            specialStartDate: subtractDays(realFound.startDate, 2),
            specialEndDate: subtractDays(realFound.startDate, 1),
            firstPriorityDate: realFound.startDate,
            secondPriorityDate: addDays(realFound.startDate, 1),
            announceDate: realFound.announceDate,
            contractStartDate: addDays(realFound.announceDate, 7),
            contractEndDate: addDays(realFound.announceDate, 14),
          },
          specialSupply: Math.floor(realFound.totalSupply * 0.3),
        };
        cacheService.set(cacheKey, detail, CACHE_TTL.SUBSCRIPTION);
        return detail;
      }
      // 실 API 목록에도 없으면 null 반환 (Mock fallback 없음 — ID 체계 혼용 방지)
      console.warn(`[Subscription] 실 API 에서 ID "${id}" 없음 → null 반환`);
      return null;
    } catch (err) {
      console.error('[Subscription] 실 API 상세 조회 실패 → Mock fallback:', err);
    }
  }

  // 실 API 키 미설정 시: Mock 데이터에서 검색
  const list = buildSubscriptions();
  const found = list.find((s) => s.id === id);

  if (!found) return null;

  // 상세 정보 조합
  const detail: SubscriptionDetail = {
    ...found,
    schedule: {
      specialStartDate: subtractDays(found.startDate, 2),
      specialEndDate: subtractDays(found.startDate, 1),
      firstPriorityDate: found.startDate,
      secondPriorityDate: addDays(found.startDate, 1),
      announceDate: found.announceDate,
      contractStartDate: addDays(found.announceDate, 7),
      contractEndDate: addDays(found.announceDate, 14),
    },
    specialSupply: Math.floor(found.totalSupply * 0.3),
  };

  cacheService.set(cacheKey, detail, CACHE_TTL.SUBSCRIPTION);

  return detail;
}

/** 날짜 문자열에서 N일을 뺀 날짜 문자열 반환 */
function subtractDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

/** 날짜 문자열에 N일을 더한 날짜 문자열 반환 */
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
