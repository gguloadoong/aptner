// ============================================================
// 아파트 단지 집계 서비스
// 국토부 실거래가 API에서 최근 2개월 거래를 가져와
// 단지명 + 법정동 코드 기준으로 집계한 후 반환합니다.
//
// 설계 원칙:
//  - 좌표는 FE에서 Kakao JS Geocoder로 변환하므로 서버는 address만 제공
//  - 결과는 6시간 캐시 (국토부 API 쿼터 절약)
//  - 너무 많으면 거래횟수 기준 상위 200개만 반환
// ============================================================
import { getOverlappingSigunguCodes } from '../constants/region.constants';
import { cacheService, CACHE_TTL } from './cache.service';
import { ApartmentComplex } from '../types';

// 국토부 API 기본 URL
const MOLIT_API_BASE_URL =
  'https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev';

// API 타임아웃: 10초
const API_TIMEOUT = 10_000;

// 단 한 번에 최대 요청 건수 (국토부 API 최대값)
const MAX_ROWS_PER_REQUEST = 1000;

// 최근 2개월 거래만 조회
const MONTHS_BACK = 2;

// 단지별 집계 후 최대 반환 개수
const MAX_COMPLEXES = 200;

// ============================================================
// 내부 헬퍼: 국토부 API 직접 호출 (raw)
// ============================================================

interface RawTradeItem {
  aptNm: string;       // 아파트명
  umdNm: string;       // 읍면동명
  roadNm: string;      // 도로명
  sggCd: string;       // 시군구 코드 (5자리)
  dealAmount: number;  // 거래금액 (만원)
  dealDate: string;    // YYYY-MM-DD
  area: number;        // 전용면적 (m²)
  buildYear?: number;  // 건축연도
  aptSeq?: string;     // 단지일련번호
}

/**
 * 국토부 API에서 특정 시군구 + 년월 데이터를 조회합니다.
 * 실패 시 빈 배열 반환 (상위 Promise.allSettled에서 처리).
 */
async function fetchMolitRaw(
  lawdCd: string,
  dealYmd: string,
): Promise<RawTradeItem[]> {
  const apiKey = process.env.MOLIT_API_KEY;
  if (!apiKey || apiKey === 'demo_key_replace_with_real_key') {
    throw new Error('MOLIT_API_KEY 환경변수가 설정되지 않았습니다.');
  }

  // axios 대신 native http 활용 가능하지만 일관성 유지를 위해 axios 사용
  const axios = (await import('axios')).default;
  const { parseStringPromise } = await import('xml2js');

  const response = await axios.get<string>(MOLIT_API_BASE_URL, {
    params: {
      serviceKey: apiKey,
      LAWD_CD: lawdCd,
      DEAL_YMD: dealYmd,
      pageNo: '1',
      numOfRows: String(MAX_ROWS_PER_REQUEST),
    },
    timeout: API_TIMEOUT,
    responseType: 'text',
    headers: { Accept: 'application/xml' },
  });

  // XML → JSON 파싱
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parsed: any = await parseStringPromise(response.data);
  const rawItems: Record<string, string[]>[] =
    parsed?.response?.body?.[0]?.items?.[0]?.item ?? [];

  return rawItems.map((item) => {
    const rawPrice = (item.dealAmount?.[0] ?? '0').replace(/,/g, '').trim();
    const year  = parseInt(item.dealYear?.[0]?.trim()  ?? '0', 10);
    const month = parseInt(item.dealMonth?.[0]?.trim() ?? '0', 10);
    const day   = parseInt(item.dealDay?.[0]?.trim()   ?? '0', 10);

    return {
      aptNm:      (item.aptNm?.[0]    ?? '').trim(),
      umdNm:      (item.umdNm?.[0]    ?? '').trim(),
      roadNm:     (item.roadNm?.[0]   ?? '').trim(),
      sggCd:      (item.sggCd?.[0]    ?? lawdCd).trim(),
      dealAmount: parseInt(rawPrice, 10) || 0,
      dealDate:   `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      area:       parseFloat((item.excluUseAr?.[0] ?? '0').trim()),
      buildYear:  item.buildYear?.[0] ? parseInt(item.buildYear[0].trim(), 10) : undefined,
      aptSeq:     item.aptSeq?.[0]?.trim(),
    };
  });
}

// ============================================================
// 내부 헬퍼: 최근 N개월 YYYYMM 배열 생성
// ============================================================

function recentYearMonths(months: number): string[] {
  const now = new Date();
  const result: string[] = [];
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push(
      `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`,
    );
  }
  return result;
}

// ============================================================
// 내부 헬퍼: 단지별 집계
// ============================================================

/**
 * 거래 항목 배열을 단지명 + sggCd 기준으로 집계합니다.
 * 집계 결과:
 *  - 가장 최근 거래가 (latestPrice)
 *  - 가장 최근 거래 일자 (latestDealDate)
 *  - 2개월 거래 건수 (tradeCount)
 *  - 대표 전용면적 (거래 건수 가장 많은 면적)
 *  - 건축연도 (있으면 사용)
 *  - 도로명 주소 (Geocoder 입력용)
 */
function aggregateComplexes(items: RawTradeItem[]): ApartmentComplex[] {
  // 집계 맵: key = aptNm::sggCd
  const map = new Map<
    string,
    {
      name: string;
      sggCd: string;
      umdNm: string;
      roadNm: string;
      aptSeq?: string;
      buildYear?: number;
      trades: RawTradeItem[];
    }
  >();

  for (const item of items) {
    if (!item.aptNm || item.dealAmount <= 0) continue;

    const key = `${item.aptNm}::${item.sggCd}`;
    if (!map.has(key)) {
      map.set(key, {
        name: item.aptNm,
        sggCd: item.sggCd,
        umdNm: item.umdNm,
        roadNm: item.roadNm,
        aptSeq: item.aptSeq,
        buildYear: item.buildYear,
        trades: [],
      });
    }
    const entry = map.get(key)!;
    entry.trades.push(item);

    // buildYear, aptSeq는 처음 발견된 값 사용
    if (!entry.buildYear && item.buildYear) entry.buildYear = item.buildYear;
    if (!entry.aptSeq && item.aptSeq) entry.aptSeq = item.aptSeq;
  }

  const result: ApartmentComplex[] = [];

  for (const [, entry] of map) {
    const { trades } = entry;
    if (trades.length === 0) continue;

    // 날짜 내림차순 정렬 → 가장 최근 거래
    trades.sort((a, b) => b.dealDate.localeCompare(a.dealDate));
    const latest = trades[0];

    // 대표 면적: 거래 횟수 가장 많은 면적
    const areaCount = new Map<number, number>();
    for (const t of trades) {
      areaCount.set(t.area, (areaCount.get(t.area) ?? 0) + 1);
    }
    const representativeArea = [...areaCount.entries()].sort(
      (a, b) => b[1] - a[1],
    )[0][0];

    // Geocoder 입력: 단지명을 최우선으로 사용 (도로명보다 정확)
    // 단지명이 없을 경우 "읍면동명 단지명" 형태로 fallback
    const address = entry.name
      ? `${entry.umdNm} ${entry.name}`.trim()
      : entry.umdNm;

    // id: aptSeq가 있으면 사용, 없으면 aptNm+sggCd 해시 (간단 문자열 기반)
    const id =
      entry.aptSeq ??
      Buffer.from(`${entry.name}::${entry.sggCd}`).toString('base64').slice(0, 16);

    result.push({
      id,
      name: entry.name,
      address,
      lawdCd: entry.sggCd,
      umdNm: entry.umdNm,
      latestPrice: latest.dealAmount,
      latestDealDate: latest.dealDate,
      tradeCount: trades.length,
      area: representativeArea,
      buildYear: entry.buildYear,
    });
  }

  return result;
}

// ============================================================
// 공개 함수: getComplexesByViewport
// ============================================================

/**
 * 지도 뷰포트 바운딩박스 내 실 아파트 단지 + 최근 거래가를 반환합니다.
 *
 * 흐름:
 *  1. 바운딩박스와 겹치는 시군구 코드 추출
 *  2. 각 코드 × 최근 2개월 을 Promise.all로 병렬 조회
 *  3. 단지별 집계 (이름+법정동 기준)
 *  4. 거래횟수 내림차순 정렬 → 상위 limit개 반환
 *  5. 결과 6시간 캐시
 *
 * @param swLat - 남서 위도
 * @param swLng - 남서 경도
 * @param neLat - 북동 위도
 * @param neLng - 북동 경도
 * @param limit - 반환 최대 개수 (기본 200)
 * @returns ApartmentComplex 배열
 */
export async function getComplexesByViewport(
  swLat: number,
  swLng: number,
  neLat: number,
  neLng: number,
  limit: number = MAX_COMPLEXES,
): Promise<ApartmentComplex[]> {
  // 캐시 키: 좌표를 소수 2자리로 반올림해 키 증폭 방지
  const roundedKey = [swLat, swLng, neLat, neLng]
    .map((v) => v.toFixed(2))
    .join(':');
  const cacheKey = `complexes:${roundedKey}:${limit}`;

  const cached = cacheService.get<ApartmentComplex[]>(cacheKey);
  if (cached) {
    console.log(`[Complex] 캐시 히트: ${cacheKey}`);
    return cached;
  }

  // 1. 뷰포트와 겹치는 시군구 코드 추출
  const codes = getOverlappingSigunguCodes(swLat, swLng, neLat, neLng);
  if (codes.length === 0) {
    console.warn('[Complex] 뷰포트 내 시군구 코드 없음 (서울/경기 외 지역)');
    return [];
  }

  const yearMonths = recentYearMonths(MONTHS_BACK);
  console.log(
    `[Complex] 조회 시작: ${codes.length}개 시군구 × ${yearMonths.length}개월 ` +
    `= ${codes.length * yearMonths.length}개 API 호출`,
  );

  // 2. 병렬 조회: 모든 (code × yearMonth) 조합
  const tasks = codes.flatMap((code) =>
    yearMonths.map((ym) => fetchMolitRaw(code, ym)),
  );

  const results = await Promise.allSettled(tasks);

  // 3. 성공한 결과만 취합
  const allItems: RawTradeItem[] = [];
  let successCount = 0;
  let failCount = 0;

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allItems.push(...result.value);
      successCount++;
    } else {
      failCount++;
      console.warn('[Complex] API 호출 실패:', result.reason?.message ?? result.reason);
    }
  }

  console.log(
    `[Complex] 병렬 조회 완료: 성공 ${successCount}건, 실패 ${failCount}건, ` +
    `수집 거래 ${allItems.length}건`,
  );

  // 4. 단지별 집계 및 정렬
  const complexes = aggregateComplexes(allItems);
  complexes.sort((a, b) => b.tradeCount - a.tradeCount);

  const limited = complexes.slice(0, limit);
  console.log(`[Complex] 단지 집계 완료: ${complexes.length}개 → 상위 ${limited.length}개 반환`);

  // 5. 6시간 캐시 저장
  cacheService.set(cacheKey, limited, CACHE_TTL.APARTMENT_TRADE);

  return limited;
}
