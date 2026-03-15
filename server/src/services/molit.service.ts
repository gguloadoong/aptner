// ============================================================
// 국토교통부 실거래가 API 서비스
// 공공데이터포털 (data.go.kr) 아파트 매매 실거래가 API 연동
// API 문서: https://www.data.go.kr/tcs/dss/selectApiDataDetailView.do?publicDataPk=15057511
// ============================================================
import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import {
  ApartmentTrade,
  ApartmentTradeHistory,
  ApartmentMapMarker,
  HotApartment,
  MolitApiResponse,
  MolitTradeItem,
} from '../types';
import { cacheService, CACHE_TTL } from './cache.service';

// 국토부 실거래가 API 기본 URL
const MOLIT_API_BASE_URL =
  'http://openapi.molit.go.kr/OpenAPI_ToolInstallPackage/service/rest/RTMSOBJSvc/getRTMSDataSvcAptTradeDev';

// API 타임아웃: 10초
const API_TIMEOUT = 10_000;

/**
 * 실제 API 키인지 여부를 판별합니다.
 * 미설정이거나 demo 플레이스홀더 값이면 false를 반환합니다.
 */
function isRealApiKey(key: string | undefined): boolean {
  return !!key && key !== 'demo_key_replace_with_real_key';
}

// ============================================================
// 서울/경기 실제 아파트 Mock 데이터 정의
// ============================================================

/** 핫 아파트 기준 데이터 (실제 시세 반영) */
interface AptBaseData {
  aptCode: string;
  apartmentName: string;
  lawdNm: string;
  lat: number;
  lng: number;
  basePrice: number; // 84m² 기준 만원
  area: number;
  tradeCount: number;
  priceChange: number;
  priceChangeRate: number;
  /** 역대 최고가 여부 */
  isRecordHigh?: boolean;
  /** HOT 랭킹 TOP 10 순위 (TOP 10이면 1~10, 나머지 undefined) */
  hotRank?: number;
}

const APT_BASE_DATA: AptBaseData[] = [
  {
    aptCode: 'APT001',
    apartmentName: '래미안 원베일리',
    lawdNm: '서울 서초구 반포동',
    lat: 37.5068,
    lng: 127.0053,
    basePrice: 280000,
    area: 84,
    tradeCount: 42,
    priceChange: 15000,
    priceChangeRate: 5.7,
    isRecordHigh: true,  // 반포 역대 최고가 경신
    hotRank: 1,
  },
  {
    aptCode: 'APT002',
    apartmentName: '아크로리버파크',
    lawdNm: '서울 서초구 반포동',
    lat: 37.5075,
    lng: 126.9994,
    basePrice: 310000,
    area: 84,
    tradeCount: 38,
    priceChange: 8000,
    priceChangeRate: 2.6,
    isRecordHigh: true,  // 국내 최고가 단지 신고가
    hotRank: 2,
  },
  {
    aptCode: 'APT003',
    apartmentName: '헬리오시티',
    lawdNm: '서울 송파구 가락동',
    lat: 37.4918,
    lng: 127.1239,
    basePrice: 145000,
    area: 84,
    tradeCount: 35,
    priceChange: 5000,
    priceChangeRate: 3.6,
    hotRank: 3,
  },
  {
    aptCode: 'APT004',
    apartmentName: '은마아파트',
    lawdNm: '서울 강남구 대치동',
    lat: 37.4983,
    lng: 127.0622,
    basePrice: 180000,
    area: 84,
    tradeCount: 31,
    priceChange: -2000,
    priceChangeRate: -1.1,
    hotRank: 4,
  },
  {
    aptCode: 'APT005',
    apartmentName: '올림픽파크포레온',
    lawdNm: '서울 강동구 둔촌동',
    lat: 37.5211,
    lng: 127.1366,
    basePrice: 135000,
    area: 84,
    tradeCount: 28,
    priceChange: 7000,
    priceChangeRate: 5.5,
    isRecordHigh: true,  // 둔촌주공 재건축 신고가
    hotRank: 5,
  },
  {
    aptCode: 'APT006',
    apartmentName: '래미안 대치팰리스',
    lawdNm: '서울 강남구 대치동',
    lat: 37.4977,
    lng: 127.0631,
    basePrice: 220000,
    area: 84,
    tradeCount: 25,
    priceChange: 9000,
    priceChangeRate: 4.3,
    hotRank: 6,
  },
  {
    aptCode: 'APT007',
    apartmentName: '도곡렉슬',
    lawdNm: '서울 강남구 도곡동',
    lat: 37.4847,
    lng: 127.0468,
    basePrice: 195000,
    area: 84,
    tradeCount: 22,
    priceChange: 5500,
    priceChangeRate: 2.9,
    hotRank: 7,
  },
  {
    aptCode: 'APT008',
    apartmentName: '잠실주공5단지',
    lawdNm: '서울 송파구 잠실동',
    lat: 37.5109,
    lng: 127.0867,
    basePrice: 230000,
    area: 82,
    tradeCount: 20,
    priceChange: 12000,
    priceChangeRate: 5.5,
    isRecordHigh: true,  // 재건축 기대감 신고가
    hotRank: 8,
  },
  {
    aptCode: 'APT009',
    apartmentName: '마포래미안푸르지오',
    lawdNm: '서울 마포구 아현동',
    lat: 37.5494,
    lng: 126.9541,
    basePrice: 115000,
    area: 84,
    tradeCount: 25,
    priceChange: 3000,
    priceChangeRate: 2.7,
    hotRank: 9,
  },
  {
    aptCode: 'APT010',
    apartmentName: '목동신시가지7단지',
    lawdNm: '서울 양천구 목동',
    lat: 37.5322,
    lng: 126.8748,
    basePrice: 98000,
    area: 76,
    tradeCount: 22,
    priceChange: -1000,
    priceChangeRate: -1.0,
    hotRank: 10,
  },
  {
    aptCode: 'APT011',
    apartmentName: '힐스테이트 광교',
    lawdNm: '경기 수원시 영통구',
    lat: 37.2902,
    lng: 127.0457,
    basePrice: 72000,
    area: 84,
    tradeCount: 18,
    priceChange: 2000,
    priceChangeRate: 2.9,
  },
  {
    aptCode: 'APT012',
    apartmentName: '동탄역 롯데캐슬',
    lawdNm: '경기 화성시 오산동',
    lat: 37.2101,
    lng: 127.0727,
    basePrice: 68000,
    area: 84,
    tradeCount: 15,
    priceChange: 4000,
    priceChangeRate: 6.3,
  },
  {
    aptCode: 'APT013',
    apartmentName: '판교 알파리움',
    lawdNm: '경기 성남시 분당구',
    lat: 37.3947,
    lng: 127.1116,
    basePrice: 130000,
    area: 84,
    tradeCount: 17,
    priceChange: 6000,
    priceChangeRate: 4.8,
  },
  {
    aptCode: 'APT014',
    apartmentName: '위례 자이',
    lawdNm: '서울 송파구 장지동',
    lat: 37.4715,
    lng: 127.1293,
    basePrice: 105000,
    area: 84,
    tradeCount: 19,
    priceChange: 3500,
    priceChangeRate: 3.4,
  },
  {
    aptCode: 'APT015',
    apartmentName: '반포 자이',
    lawdNm: '서울 서초구 반포동',
    lat: 37.5071,
    lng: 126.9971,
    basePrice: 265000,
    area: 84,
    tradeCount: 24,
    priceChange: 10000,
    priceChangeRate: 3.9,
  },
  {
    aptCode: 'APT016',
    apartmentName: '잠실 리센츠',
    lawdNm: '서울 송파구 잠실동',
    lat: 37.5133,
    lng: 127.0869,
    basePrice: 205000,
    area: 84,
    tradeCount: 21,
    priceChange: 7500,
    priceChangeRate: 3.8,
  },
  {
    aptCode: 'APT017',
    apartmentName: '개포 래미안 포레스트',
    lawdNm: '서울 강남구 개포동',
    lat: 37.4787,
    lng: 127.0545,
    basePrice: 240000,
    area: 84,
    tradeCount: 16,
    priceChange: 11000,
    priceChangeRate: 4.8,
  },
  {
    aptCode: 'APT018',
    apartmentName: '고덕 아르테온',
    lawdNm: '서울 강동구 고덕동',
    lat: 37.5524,
    lng: 127.1530,
    basePrice: 118000,
    area: 84,
    tradeCount: 20,
    priceChange: 4500,
    priceChangeRate: 4.0,
  },
  {
    aptCode: 'APT019',
    apartmentName: '덕은 DMC 센트럴자이',
    lawdNm: '경기 고양시 덕양구',
    lat: 37.6341,
    lng: 126.8614,
    basePrice: 65000,
    area: 84,
    tradeCount: 14,
    priceChange: 2500,
    priceChangeRate: 4.0,
  },
  {
    aptCode: 'APT020',
    apartmentName: '검단 푸르지오 더퍼스트',
    lawdNm: '인천 서구',
    lat: 37.5932,
    lng: 126.7241,
    basePrice: 55000,
    area: 84,
    tradeCount: 12,
    priceChange: 1800,
    priceChangeRate: 3.4,
  },
];

// ============================================================
// Mock 데이터 생성 헬퍼 함수
// ============================================================

/**
 * 지정 범위 내 랜덤 정수 반환
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 기준 가격 기반으로 ±5% 범위 내 랜덤 가격 반환
 */
function randomPrice(basePrice: number): number {
  const variation = basePrice * 0.05;
  return Math.round((basePrice + (Math.random() * variation * 2 - variation)) / 100) * 100;
}

/**
 * 특정 아파트의 24개월 월별 실거래가 히스토리 생성
 * 가격은 현재 시세 기준으로 과거로 갈수록 약간 낮게 설정
 */
function generateHistory(
  basePrice: number,
  months: number = 24,
): ApartmentTradeHistory[] {
  const history: ApartmentTradeHistory[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;

    // 과거일수록 가격이 약간 낮음 (월 0.2% 상승 추세 반영)
    const growthFactor = 1 - i * 0.002;
    const adjustedBase = Math.round(basePrice * growthFactor);
    const price = randomPrice(adjustedBase);

    // 월 내 랜덤 거래일 (1~28일)
    const day = randomInt(1, 28);
    const dealDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    history.push({
      dealDate,
      price,
      area: 84.99,
      floor: randomInt(5, 25),
    });
  }

  return history;
}

// ============================================================
// 핫 아파트 Mock 데이터 (20개, 실제 시세 반영)
// TODO: 실 API 연동 시 이 함수 교체
// ============================================================
const HOT_APARTMENTS_MOCK: HotApartment[] = APT_BASE_DATA.map((apt, idx) => ({
  rank: idx + 1,
  aptCode: apt.aptCode,
  apartmentName: apt.apartmentName,
  lawdNm: apt.lawdNm,
  recentPrice: apt.basePrice,
  area: apt.area,
  tradeCount: apt.tradeCount,
  priceChange: apt.priceChange,
  priceChangeRate: apt.priceChangeRate,
  lat: apt.lat,
  lng: apt.lng,
  isRecordHigh: apt.isRecordHigh,
  hotRank: apt.hotRank,
}));

// ============================================================
// 아파트 히스토리 Mock 데이터 (aptCode별 24개월치)
// TODO: 실 API 연동 시 이 함수 교체
// ============================================================
const APT_HISTORY_MOCK: Record<string, ApartmentTradeHistory[]> = Object.fromEntries(
  APT_BASE_DATA.map((apt) => [apt.aptCode, generateHistory(apt.basePrice, 24)]),
);

// ============================================================
// 지도 마커용 Mock 데이터
// TODO: 실 API 연동 시 이 함수 교체
// ============================================================
const MAP_MARKERS_MOCK: ApartmentMapMarker[] = APT_BASE_DATA.map((apt) => ({
  id: apt.aptCode,
  name: apt.apartmentName,
  lat: apt.lat,
  lng: apt.lng,
  price: apt.basePrice,
  area: String(apt.area),
  priceChangeType: apt.priceChange > 0 ? 'up' : apt.priceChange < 0 ? 'down' : 'flat',
}));

// ============================================================
// 국토부 API 관련 함수 (실 API 연동용)
// ============================================================

/**
 * 국토부 XML 응답에서 거래 아이템 하나를 파싱합니다.
 */
function parseMolitItem(item: MolitTradeItem, lawdCd: string): ApartmentTrade {
  // 거래 금액에서 쉼표 제거 후 숫자 변환
  const rawPrice = item.거래금액?.[0]?.replace(/,/g, '').trim() ?? '0';
  const price = parseInt(rawPrice, 10) || 0;

  const year = parseInt(item.년?.[0] ?? '0', 10);
  const month = parseInt(item.월?.[0] ?? '0', 10);
  const day = parseInt(item.일?.[0]?.trim() ?? '0', 10);
  const dealDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return {
    apartmentName: item.아파트?.[0]?.trim() ?? '',
    area: parseFloat(item.전용면적?.[0] ?? '0'),
    floor: parseInt(item.층?.[0] ?? '0', 10),
    price,
    dealDate,
    dealYear: year,
    dealMonth: month,
    dealDay: day,
    lawdCd: item.지역코드?.[0] ?? lawdCd,
    lawdNm: item.법정동?.[0]?.trim() ?? '',
    roadNm: item.도로명?.[0]?.trim(),
    buildYear: item.건축년도?.[0] ? parseInt(item.건축년도[0], 10) : undefined,
    aptCode: item.단지코드?.[0]?.trim(),
  };
}

/**
 * 국토부 API를 호출합니다.
 * @param lawdCd - 법정동 코드 앞 5자리 (시군구 코드)
 * @param dealYmd - 조회 년월 (YYYYMM 형식)
 * @param pageNo - 페이지 번호
 * @param numOfRows - 페이지당 건수
 */
async function fetchMolitApi(
  lawdCd: string,
  dealYmd: string,
  pageNo: number = 1,
  numOfRows: number = 100,
): Promise<{ items: ApartmentTrade[]; totalCount: number }> {
  const apiKey = process.env.MOLIT_API_KEY;
  if (!isRealApiKey(apiKey)) {
    throw new Error('MOLIT_API_KEY 환경변수가 설정되지 않았습니다.');
  }

  const params = {
    serviceKey: apiKey,
    LAWD_CD: lawdCd,
    DEAL_YMD: dealYmd,
    pageNo: String(pageNo),
    numOfRows: String(numOfRows),
  };

  const response = await axios.get<string>(MOLIT_API_BASE_URL, {
    params,
    timeout: API_TIMEOUT,
    responseType: 'text',
    headers: {
      Accept: 'application/xml',
    },
  });

  // XML을 JSON으로 변환
  const parsed = (await parseStringPromise(response.data)) as MolitApiResponse;
  const body = parsed.response?.body?.[0];
  const totalCount = parseInt(body?.totalCount?.[0] ?? '0', 10);
  const rawItems = body?.items?.[0]?.item ?? [];

  const items = rawItems.map((item: MolitTradeItem) => parseMolitItem(item, lawdCd));

  return { items, totalCount };
}

// ============================================================
// 공개 서비스 함수
// ============================================================

/**
 * 아파트 실거래가 목록을 조회합니다.
 * 국토부 API 호출 실패 시 캐시 데이터를 반환합니다.
 */
export async function getApartmentTrades(
  lawdCd: string,
  dealYmd: string,
  page: number = 1,
  limit: number = 20,
): Promise<{ items: ApartmentTrade[]; totalCount: number; cached: boolean }> {
  const cacheKey = `trades:${lawdCd}:${dealYmd}:${page}:${limit}`;

  try {
    const cached = cacheService.get<{ items: ApartmentTrade[]; totalCount: number }>(cacheKey);
    if (cached) {
      console.log(`[Molit] 캐시 히트: ${cacheKey}`);
      return { ...cached, cached: true };
    }

    console.log(`[Molit] API 호출: 지역코드=${lawdCd}, 년월=${dealYmd}, 페이지=${page}`);
    const { items, totalCount } = await fetchMolitApi(lawdCd, dealYmd, page, limit);

    // 캐시 저장 (6시간)
    cacheService.set(cacheKey, { items, totalCount }, CACHE_TTL.APARTMENT_TRADE);
    console.log(`[Molit] 조회 완료: ${items.length}건 / 전체 ${totalCount}건`);

    return { items, totalCount, cached: false };
  } catch (error) {
    const cached = cacheService.get<{ items: ApartmentTrade[]; totalCount: number }>(cacheKey);
    if (cached) {
      console.warn(`[Molit] API 실패, 캐시 데이터 반환: ${cacheKey}`, error);
      return { ...cached, cached: true };
    }
    console.error(`[Molit] API 실패 및 캐시 없음: ${cacheKey}`, error);
    throw error;
  }
}

/**
 * 특정 아파트의 실거래가 히스토리를 조회합니다 (차트용).
 * TODO: 실 API 연동 시 이 함수 교체
 * - Mock: aptCode별 사전 생성된 24개월 데이터 반환
 * - 실 API: 국토부 API에서 월별 수집 후 aptCode 필터링
 */
export async function getApartmentHistory(
  aptCode: string,
  lawdCd: string,
  months: number = 24,
  filterArea?: number,
): Promise<ApartmentTradeHistory[]> {
  const cacheKey = `history:${aptCode}:${lawdCd}:${months}:${filterArea ?? 'all'}`;

  const cached = cacheService.get<ApartmentTradeHistory[]>(cacheKey);
  if (cached) {
    console.log(`[Molit] 히스토리 캐시 히트: ${cacheKey}`);
    return cached;
  }

  console.log(`[Molit] 히스토리 조회 시작: aptCode=${aptCode}, ${months}개월`);

  // Mock 데이터에 해당 aptCode가 있으면 Mock 반환
  const mockData = APT_HISTORY_MOCK[aptCode];
  if (mockData) {
    console.log(`[Molit] Mock 히스토리 반환: aptCode=${aptCode}, ${mockData.length}개월`);

    // 요청 months에 맞게 슬라이싱 (최근 N개월)
    let result = mockData.slice(-months);

    // 면적 필터 적용 (±5m² 범위 허용)
    if (filterArea !== undefined) {
      result = result.filter((t) => Math.abs(t.area - filterArea) < 5);
    }

    // 캐시 저장 (6시간)
    cacheService.set(cacheKey, result, CACHE_TTL.APARTMENT_TRADE);
    return result;
  }

  // Mock에 없으면 실 API 시도
  // 최근 N개월의 년월 배열 생성
  const yearMonths: string[] = [];
  const now = new Date();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
    yearMonths.push(ym);
  }

  // 각 월별 데이터 수집 (병렬 처리, 최대 6개월씩)
  const allTrades: ApartmentTrade[] = [];

  for (let i = 0; i < yearMonths.length; i += 6) {
    const batch = yearMonths.slice(i, i + 6);
    const results = await Promise.allSettled(
      batch.map((ym) => fetchMolitApi(lawdCd, ym, 1, 1000)),
    );

    results.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        allTrades.push(...result.value.items);
      } else {
        console.warn(`[Molit] ${batch[idx]} 월 데이터 조회 실패:`, result.reason);
      }
    });
  }

  // 해당 aptCode 필터링
  let filtered = allTrades.filter(
    (t) => t.aptCode === aptCode || t.apartmentName === aptCode,
  );

  // 면적 필터 적용 (±5m² 범위 허용)
  if (filterArea !== undefined) {
    filtered = filtered.filter((t) => Math.abs(t.area - filterArea) < 5);
  }

  // 날짜 오름차순 정렬
  filtered.sort((a, b) => a.dealDate.localeCompare(b.dealDate));

  const history: ApartmentTradeHistory[] = filtered.map((t) => ({
    dealDate: t.dealDate,
    price: t.price,
    area: t.area,
    floor: t.floor,
  }));

  // 캐시 저장 (6시간)
  cacheService.set(cacheKey, history, CACHE_TTL.APARTMENT_TRADE);

  return history;
}

/**
 * 트렌드 계산용 실거래가 데이터를 일괄 수집합니다.
 * trend.service.ts에서 호출합니다.
 */
export async function fetchTradesForTrend(
  regionCode: string,
  months: number,
): Promise<ApartmentTrade[]> {
  const yearMonths: string[] = [];
  const now = new Date();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
    yearMonths.push(ym);
  }

  const allTrades: ApartmentTrade[] = [];

  for (let i = 0; i < yearMonths.length; i += 6) {
    const batch = yearMonths.slice(i, i + 6);
    const results = await Promise.allSettled(
      batch.map((ym) => fetchMolitApi(regionCode, ym, 1, 1000)),
    );
    results.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        allTrades.push(...result.value.items);
      } else {
        console.warn(`[Molit] ${batch[idx]} 트렌드 데이터 조회 실패:`, result.reason);
      }
    });
  }

  return allTrades;
}

/**
 * 핫한 아파트 랭킹을 조회합니다.
 * TODO: 실 API 연동 시 이 함수 교체
 * - Mock: 사전 정의된 20개 아파트 데이터 반환 (lat/lng 포함)
 * - 실 API: 국토부 API 호출 후 거래량 기준 정렬
 *
 * @param regionCode - 법정동 코드 앞 2자리 (예: '11' = 서울). Mock 모드에서는 regionFilter 우선 사용.
 * @param limit - 반환 개수 (기본 10, 최대 20)
 * @param regionFilter - 한글 시도명 키워드 (예: '서울', '경기'). lawdNm 포함 여부로 필터링.
 *                       undefined 또는 미지정 시 전체 반환.
 */
export async function getHotApartments(
  regionCode: string,
  limit: number = 10,
  regionFilter?: string,
): Promise<HotApartment[]> {
  const cacheKey = `hot:${regionCode}:${limit}:${regionFilter ?? 'all'}`;

  const cached = cacheService.get<HotApartment[]>(cacheKey);
  if (cached) {
    console.log(`[Molit] 핫 아파트 캐시 히트: ${cacheKey}`);
    return cached;
  }

  console.log(`[Molit] 핫 아파트 조회: regionCode=${regionCode}, regionFilter=${regionFilter ?? '없음'}`);

  // MOLIT_API_KEY가 없거나 demo 키이면 즉시 Mock 반환
  if (!isRealApiKey(process.env.MOLIT_API_KEY)) {
    console.warn('[Molit] API 키 없음 → Mock 데이터 반환');

    // mock 모드에서 한글 region 필터 적용
    // '서울' → lawdNm에 '서울' 포함된 것만, undefined 또는 '전국'이면 전체 반환
    let mockList = HOT_APARTMENTS_MOCK;
    if (regionFilter && regionFilter !== '전국') {
      mockList = HOT_APARTMENTS_MOCK.filter((apt) =>
        apt.lawdNm.includes(regionFilter),
      );
      console.log(`[Molit] Mock 한글 필터 '${regionFilter}' 적용: ${mockList.length}건`);
    }

    // 필터 후 순위 재부여
    const result = mockList.slice(0, limit).map((apt, idx) => ({
      ...apt,
      rank: idx + 1,
    }));

    cacheService.set(cacheKey, result, CACHE_TTL.APARTMENT_TRADE);
    return result;
  }

  // 최근 1개월 데이터 조회
  const now = new Date();
  const dealYmd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

  try {
    const { items } = await fetchMolitApi(regionCode, dealYmd, 1, 1000);

    // 아파트별 거래 집계
    const aptMap = new Map<string, { trades: ApartmentTrade[]; key: string }>();
    items.forEach((item) => {
      const key = item.aptCode ?? item.apartmentName;
      if (!aptMap.has(key)) {
        aptMap.set(key, { trades: [], key });
      }
      aptMap.get(key)!.trades.push(item);
    });

    // 거래량 기준 정렬
    const sorted = Array.from(aptMap.values())
      .sort((a, b) => b.trades.length - a.trades.length)
      .slice(0, limit);

    const hotList: HotApartment[] = sorted.map((apt, idx) => {
      const latestTrade = apt.trades[apt.trades.length - 1];
      const firstTrade = apt.trades[0];
      const priceChange = latestTrade.price - firstTrade.price;
      const priceChangeRate = firstTrade.price > 0 ? (priceChange / firstTrade.price) * 100 : 0;

      return {
        rank: idx + 1,
        aptCode: apt.key,
        apartmentName: latestTrade.apartmentName,
        lawdNm: `${latestTrade.lawdNm}`,
        recentPrice: latestTrade.price,
        area: latestTrade.area,
        tradeCount: apt.trades.length,
        priceChange,
        priceChangeRate: Math.round(priceChangeRate * 10) / 10,
        // 실 API 응답에는 좌표가 없으므로 undefined
        lat: undefined,
        lng: undefined,
      };
    });

    // 캐시 저장 (6시간)
    cacheService.set(cacheKey, hotList, CACHE_TTL.APARTMENT_TRADE);

    return hotList;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[Molit] 핫 아파트 조회 실패 → Mock 반환: ${msg}`);
    return HOT_APARTMENTS_MOCK.slice(0, limit);
  }
}

/**
 * 지도 뷰포트 내 아파트 마커를 조회합니다.
 * TODO: 실 API 연동 시 이 함수 교체
 * - Mock: 사전 정의된 20개 아파트에서 뷰포트 필터링
 * - 실 API: DB 또는 API에서 좌표 기반 조회
 *
 * @param swLat - 남서쪽 위도
 * @param swLng - 남서쪽 경도
 * @param neLat - 북동쪽 위도
 * @param neLng - 북동쪽 경도
 * @param priceFilter - 가격 필터 (만원, 이하)
 */
export async function getApartmentMapMarkers(
  swLat: number,
  swLng: number,
  neLat: number,
  neLng: number,
  priceFilter?: number,
): Promise<ApartmentMapMarker[]> {
  const cacheKey = `map:${swLat}:${swLng}:${neLat}:${neLng}:${priceFilter ?? 'all'}`;

  const cached = cacheService.get<ApartmentMapMarker[]>(cacheKey);
  if (cached) {
    console.log(`[Molit] 지도 마커 캐시 히트`);
    return cached;
  }

  // 뷰포트 내 아파트 필터링
  let markers = MAP_MARKERS_MOCK.filter(
    (apt) =>
      apt.lat >= swLat &&
      apt.lat <= neLat &&
      apt.lng >= swLng &&
      apt.lng <= neLng,
  );

  // 가격 필터 적용
  if (priceFilter !== undefined && priceFilter > 0) {
    markers = markers.filter((apt) => apt.price <= priceFilter);
  }

  console.log(`[Molit] 지도 마커 조회: 뷰포트 내 ${markers.length}개 반환`);

  // 캐시 저장 (30초 - 지도는 자주 갱신)
  cacheService.set(cacheKey, markers, 30);

  return markers;
}

/**
 * aptCode로 특정 아파트 정보를 조회합니다.
 * TODO: 실 API 연동 시 실제 조회 로직 구현
 * - Mock: APT_BASE_DATA에서 aptCode로 검색
 * - 실 API: 일단 Mock 반환
 *
 * @param aptCode - 아파트 코드 (예: APT001)
 */
export async function getApartmentById(aptCode: string): Promise<HotApartment | null> {
  const cacheKey = `apt:${aptCode}`;

  const cached = cacheService.get<HotApartment>(cacheKey);
  if (cached) {
    console.log(`[Molit] 아파트 상세 캐시 히트: ${aptCode}`);
    return cached;
  }

  // Mock 데이터에서 aptCode로 검색
  const found = APT_BASE_DATA.find((apt) => apt.aptCode === aptCode);
  if (!found) {
    console.log(`[Molit] 아파트 없음: aptCode=${aptCode}`);
    return null;
  }

  const result: HotApartment = {
    rank: 0,
    aptCode: found.aptCode,
    apartmentName: found.apartmentName,
    lawdNm: found.lawdNm,
    recentPrice: found.basePrice,
    area: found.area,
    tradeCount: found.tradeCount,
    priceChange: found.priceChange,
    priceChangeRate: found.priceChangeRate,
    lat: found.lat,
    lng: found.lng,
    isRecordHigh: found.isRecordHigh,
    hotRank: found.hotRank,
  };

  cacheService.set(cacheKey, result, CACHE_TTL.APARTMENT_TRADE);
  return result;
}

/**
 * 키워드로 아파트를 검색합니다.
 * APT_BASE_DATA에서 apartmentName 또는 lawdNm에 keyword가 포함된 항목을 반환합니다.
 *
 * @param keyword - 검색 키워드 (아파트명 또는 행정구역명)
 */
export async function searchApartments(keyword: string): Promise<HotApartment[]> {
  const cacheKey = `search:${keyword}`;

  const cached = cacheService.get<HotApartment[]>(cacheKey);
  if (cached) {
    console.log(`[Molit] 아파트 검색 캐시 히트: ${keyword}`);
    return cached;
  }

  const lowerKeyword = keyword.toLowerCase();

  const matched = APT_BASE_DATA.filter(
    (apt) =>
      apt.apartmentName.toLowerCase().includes(lowerKeyword) ||
      apt.lawdNm.toLowerCase().includes(lowerKeyword),
  );

  const result: HotApartment[] = matched.map((apt, idx) => ({
    rank: idx + 1,
    aptCode: apt.aptCode,
    apartmentName: apt.apartmentName,
    lawdNm: apt.lawdNm,
    recentPrice: apt.basePrice,
    area: apt.area,
    tradeCount: apt.tradeCount,
    priceChange: apt.priceChange,
    priceChangeRate: apt.priceChangeRate,
    lat: apt.lat,
    lng: apt.lng,
    isRecordHigh: apt.isRecordHigh,
    hotRank: apt.hotRank,
  }));

  console.log(`[Molit] 아파트 검색 '${keyword}': ${result.length}건`);

  // 캐시 저장 (30초)
  cacheService.set(cacheKey, result, 30);

  return result;
}
