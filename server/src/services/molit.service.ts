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
  ApartmentPrice,
  ComplexFilter,
  HotApartment,
  MolitApiResponse,
  MolitTradeItem,
} from '../types';
import { cacheService, CACHE_TTL } from './cache.service';

// 국토부 실거래가 API — Cloudflare Workers 프록시를 통해 호출
// Railway 서버가 해외 IP라 직접 호출 시 WAF 차단됨
// Cloudflare 서울 엣지에서 한국 IP로 중계
const MOLIT_API_BASE_URL = 'https://molit-proxy.bomzip.workers.dev/trade';

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
  // ---- 단지 특성 필드 (MAP_MARKERS_MOCK 에서 사용) ----
  /** 건설사 */
  builder?: string;
  /** 준공 연도 */
  builtYear?: number;
  /** 총 세대수 */
  totalUnits?: number;
  /** 역세권 여부 (500m 이내) */
  isWalkSubway?: boolean;
  /** 평지 여부 */
  isFlat?: boolean;
  /** 초품아 여부 */
  hasElementarySchool?: boolean;
}

// ---- 브랜드 건설사 목록 및 판별 헬퍼 ----
const BRAND_BUILDERS = [
  '삼성물산', 'GS건설', '현대건설', '대우건설', '롯데건설',
  '포스코이앤씨', 'DL이앤씨', 'HDC현대산업개발', '한화건설',
];

/**
 * 건설사명 기반 브랜드 단지 여부를 반환합니다.
 */
function isBrandBuilder(builder: string): boolean {
  return BRAND_BUILDERS.some((b) => builder.includes(b));
}

const APT_BASE_DATA: AptBaseData[] = [
  // ---- 기존 20개 단지 ----
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
    builder: '삼성물산',
    builtYear: 2023,
    totalUnits: 2990,
    isWalkSubway: true,
    isFlat: true,
    hasElementarySchool: false,
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
    builder: 'DL이앤씨',
    builtYear: 2016,
    totalUnits: 1612,
    isWalkSubway: true,
    isFlat: true,
    hasElementarySchool: false,
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
    builder: '삼성물산/현대건설/GS건설',
    builtYear: 2018,
    totalUnits: 9510,
    isWalkSubway: true,
    isFlat: true,
    hasElementarySchool: true,
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
    builder: '한양',
    builtYear: 1979,
    totalUnits: 4424,
    isWalkSubway: true,
    isFlat: true,
    hasElementarySchool: true,
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
    builder: '현대건설/HDC현대산업개발/대우건설/롯데건설',
    builtYear: 2023,
    totalUnits: 12032,
    isWalkSubway: true,
    isFlat: true,
    hasElementarySchool: true,
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
    builder: '삼성물산',
    builtYear: 2015,
    totalUnits: 1278,
    isWalkSubway: true,
    isFlat: true,
    hasElementarySchool: true,
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
    builder: '현대건설',
    builtYear: 2002,
    totalUnits: 1717,
    isWalkSubway: true,
    isFlat: true,
    hasElementarySchool: false,
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
    builder: '주공',
    builtYear: 1978,
    totalUnits: 3930,
    isWalkSubway: true,
    isFlat: true,
    hasElementarySchool: true,
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
    builder: '삼성물산/대우건설',
    builtYear: 2014,
    totalUnits: 3885,
    isWalkSubway: true,
    isFlat: false,
    hasElementarySchool: true,
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
    builder: '주공',
    builtYear: 1986,
    totalUnits: 2512,
    isWalkSubway: false,
    isFlat: true,
    hasElementarySchool: true,
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
    builder: '현대건설',
    builtYear: 2017,
    totalUnits: 1248,
    isWalkSubway: false,
    isFlat: false,
    hasElementarySchool: true,
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
    builder: '롯데건설',
    builtYear: 2016,
    totalUnits: 2102,
    isWalkSubway: true,
    isFlat: true,
    hasElementarySchool: false,
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
    builder: '포스코이앤씨',
    builtYear: 2014,
    totalUnits: 1652,
    isWalkSubway: false,
    isFlat: false,
    hasElementarySchool: true,
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
    builder: 'GS건설',
    builtYear: 2016,
    totalUnits: 1872,
    isWalkSubway: false,
    isFlat: true,
    hasElementarySchool: true,
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
    builder: 'GS건설',
    builtYear: 2008,
    totalUnits: 3410,
    isWalkSubway: true,
    isFlat: true,
    hasElementarySchool: false,
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
    builder: '롯데건설/현대건설',
    builtYear: 2008,
    totalUnits: 5563,
    isWalkSubway: true,
    isFlat: true,
    hasElementarySchool: true,
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
    builder: '삼성물산',
    builtYear: 2019,
    totalUnits: 2296,
    isWalkSubway: false,
    isFlat: false,
    hasElementarySchool: true,
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
    builder: '현대건설',
    builtYear: 2019,
    totalUnits: 4066,
    isWalkSubway: true,
    isFlat: true,
    hasElementarySchool: true,
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
    builder: 'GS건설',
    builtYear: 2021,
    totalUnits: 1320,
    isWalkSubway: true,
    isFlat: false,
    hasElementarySchool: false,
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
    builder: '대우건설',
    builtYear: 2021,
    totalUnits: 2084,
    isWalkSubway: false,
    isFlat: true,
    hasElementarySchool: false,
  },

  // ---- 추가 20개 단지 ----

  // 서울 북부
  {
    aptCode: 'APT021',
    apartmentName: '중계 주공그린4단지',
    lawdNm: '서울 노원구 중계동',
    lat: 37.6512,
    lng: 127.0762,
    basePrice: 80000,
    area: 84,
    tradeCount: 10,
    priceChange: 1000,
    priceChangeRate: 1.3,
    builder: '현대건설',
    builtYear: 1994,
    totalUnits: 1900,
    isWalkSubway: true,
    isFlat: true,
    hasElementarySchool: true,
  },
  {
    aptCode: 'APT022',
    apartmentName: '창동 e편한세상',
    lawdNm: '서울 도봉구 창동',
    lat: 37.6523,
    lng: 127.0478,
    basePrice: 72000,
    area: 84,
    tradeCount: 9,
    priceChange: 800,
    priceChangeRate: 1.1,
    builder: 'DL이앤씨',
    builtYear: 2002,
    totalUnits: 1046,
    isWalkSubway: true,
    isFlat: false,
    hasElementarySchool: false,
  },
  {
    aptCode: 'APT023',
    apartmentName: '서울숲 리버뷰 자이',
    lawdNm: '서울 성동구 성수동',
    lat: 37.5481,
    lng: 127.0392,
    basePrice: 185000,
    area: 84,
    tradeCount: 11,
    priceChange: 9000,
    priceChangeRate: 5.1,
    builder: 'GS건설',
    builtYear: 2022,
    totalUnits: 1052,
    isWalkSubway: false,
    isFlat: true,
    hasElementarySchool: true,
  },

  // 서울 기타
  {
    aptCode: 'APT024',
    apartmentName: '이수 브라운스톤',
    lawdNm: '서울 동작구 사당동',
    lat: 37.4892,
    lng: 126.9812,
    basePrice: 95000,
    area: 84,
    tradeCount: 8,
    priceChange: 1500,
    priceChangeRate: 1.6,
    builder: '코오롱글로벌',
    builtYear: 2003,
    totalUnits: 584,
    isWalkSubway: true,
    isFlat: false,
    hasElementarySchool: true,
  },
  {
    aptCode: 'APT025',
    apartmentName: '용산 센트럴파크 해링턴스퀘어',
    lawdNm: '서울 용산구 한강로동',
    lat: 37.5253,
    lng: 126.9646,
    basePrice: 290000,
    area: 84,
    tradeCount: 13,
    priceChange: 12000,
    priceChangeRate: 4.3,
    builder: '한화건설',
    builtYear: 2019,
    totalUnits: 1140,
    isWalkSubway: true,
    isFlat: true,
    hasElementarySchool: false,
  },

  // 경기 1기 신도시
  {
    aptCode: 'APT026',
    apartmentName: '분당 파크뷰',
    lawdNm: '경기 성남시 분당구',
    lat: 37.3729,
    lng: 127.1219,
    basePrice: 145000,
    area: 84,
    tradeCount: 14,
    priceChange: 5000,
    priceChangeRate: 3.6,
    builder: '삼성물산',
    builtYear: 2003,
    totalUnits: 1694,
    isWalkSubway: false,
    isFlat: false,
    hasElementarySchool: true,
  },
  {
    aptCode: 'APT027',
    apartmentName: '일산 위시티 블루밍',
    lawdNm: '경기 고양시 일산동구',
    lat: 37.6738,
    lng: 126.7712,
    basePrice: 58000,
    area: 84,
    tradeCount: 9,
    priceChange: 500,
    priceChangeRate: 0.9,
    builder: '대우건설',
    builtYear: 2011,
    totalUnits: 2102,
    isWalkSubway: true,
    isFlat: true,
    hasElementarySchool: true,
  },
  {
    aptCode: 'APT028',
    apartmentName: '평촌 어바인퍼스트',
    lawdNm: '경기 안양시 동안구',
    lat: 37.3924,
    lng: 126.9619,
    basePrice: 89000,
    area: 84,
    tradeCount: 11,
    priceChange: 2000,
    priceChangeRate: 2.3,
    builder: '대우건설',
    builtYear: 2010,
    totalUnits: 1680,
    isWalkSubway: false,
    isFlat: true,
    hasElementarySchool: true,
  },

  // 경기 2기/3기 신도시
  {
    aptCode: 'APT029',
    apartmentName: '광교 자이더클래스',
    lawdNm: '경기 수원시 영통구',
    lat: 37.2891,
    lng: 127.0532,
    basePrice: 128000,
    area: 84,
    tradeCount: 12,
    priceChange: 4000,
    priceChangeRate: 3.2,
    builder: 'GS건설',
    builtYear: 2021,
    totalUnits: 1956,
    isWalkSubway: false,
    isFlat: false,
    hasElementarySchool: true,
  },
  {
    aptCode: 'APT030',
    apartmentName: '동탄역 롯데캐슬 트리니엔',
    lawdNm: '경기 화성시 동탄',
    lat: 37.2095,
    lng: 127.0727,
    basePrice: 92000,
    area: 84,
    tradeCount: 10,
    priceChange: 3000,
    priceChangeRate: 3.4,
    builder: '롯데건설',
    builtYear: 2016,
    totalUnits: 2102,
    isWalkSubway: true,
    isFlat: true,
    hasElementarySchool: false,
  },
  {
    aptCode: 'APT031',
    apartmentName: '판교 더샵 퍼스트파크',
    lawdNm: '경기 성남시 분당구',
    lat: 37.3847,
    lng: 127.1119,
    basePrice: 162000,
    area: 84,
    tradeCount: 13,
    priceChange: 6000,
    priceChangeRate: 3.8,
    builder: '포스코이앤씨',
    builtYear: 2018,
    totalUnits: 1160,
    isWalkSubway: false,
    isFlat: false,
    hasElementarySchool: true,
  },
  {
    aptCode: 'APT032',
    apartmentName: '위례 자이 2단지',
    lawdNm: '경기 성남시 수정구',
    lat: 37.4712,
    lng: 127.1391,
    basePrice: 115000,
    area: 84,
    tradeCount: 11,
    priceChange: 3500,
    priceChangeRate: 3.1,
    builder: 'GS건설',
    builtYear: 2016,
    totalUnits: 1872,
    isWalkSubway: false,
    isFlat: true,
    hasElementarySchool: true,
  },
  {
    aptCode: 'APT033',
    apartmentName: '하남 미사 강변힐스테이트',
    lawdNm: '경기 하남시 미사동',
    lat: 37.5512,
    lng: 127.2163,
    basePrice: 78000,
    area: 84,
    tradeCount: 10,
    priceChange: 2000,
    priceChangeRate: 2.6,
    builder: '현대건설',
    builtYear: 2017,
    totalUnits: 1480,
    isWalkSubway: false,
    isFlat: true,
    hasElementarySchool: true,
  },

  // 인천/경기 기타
  {
    aptCode: 'APT034',
    apartmentName: '검단 AB3블록 푸르지오',
    lawdNm: '인천 서구 검단동',
    lat: 37.6012,
    lng: 126.7219,
    basePrice: 52000,
    area: 84,
    tradeCount: 8,
    priceChange: 1000,
    priceChangeRate: 2.0,
    builder: '대우건설',
    builtYear: 2023,
    totalUnits: 2084,
    isWalkSubway: false,
    isFlat: true,
    hasElementarySchool: false,
  },
  {
    aptCode: 'APT035',
    apartmentName: '고양 삼송 원흥 아이파크',
    lawdNm: '경기 고양시 덕양구',
    lat: 37.6502,
    lng: 126.8892,
    basePrice: 65000,
    area: 84,
    tradeCount: 9,
    priceChange: 1500,
    priceChangeRate: 2.4,
    builder: 'HDC현대산업개발',
    builtYear: 2015,
    totalUnits: 1536,
    isWalkSubway: true,
    isFlat: true,
    hasElementarySchool: true,
  },
  {
    aptCode: 'APT036',
    apartmentName: '과천 푸르지오 써밋',
    lawdNm: '경기 과천시',
    lat: 37.4295,
    lng: 126.9878,
    basePrice: 175000,
    area: 84,
    tradeCount: 11,
    priceChange: 7000,
    priceChangeRate: 4.2,
    builder: '대우건설',
    builtYear: 2022,
    totalUnits: 1571,
    isWalkSubway: true,
    isFlat: false,
    hasElementarySchool: true,
  },

  // 지방 광역시
  {
    aptCode: 'APT037',
    apartmentName: '부산 해운대 아이파크',
    lawdNm: '부산 해운대구',
    lat: 35.1631,
    lng: 129.1624,
    basePrice: 135000,
    area: 84,
    tradeCount: 12,
    priceChange: 4500,
    priceChangeRate: 3.4,
    builder: 'HDC현대산업개발',
    builtYear: 2011,
    totalUnits: 1631,
    isWalkSubway: true,
    isFlat: false,
    hasElementarySchool: false,
  },
  {
    aptCode: 'APT038',
    apartmentName: '대구 수성 범어 아이파크',
    lawdNm: '대구 수성구 범어동',
    lat: 35.8582,
    lng: 128.6321,
    basePrice: 98000,
    area: 84,
    tradeCount: 10,
    priceChange: 2500,
    priceChangeRate: 2.6,
    builder: 'HDC현대산업개발',
    builtYear: 2013,
    totalUnits: 1248,
    isWalkSubway: true,
    isFlat: false,
    hasElementarySchool: true,
  },
  {
    aptCode: 'APT039',
    apartmentName: '대전 도안 트리풀시티',
    lawdNm: '대전 서구 도안동',
    lat: 36.3502,
    lng: 127.3612,
    basePrice: 56000,
    area: 84,
    tradeCount: 9,
    priceChange: 1200,
    priceChangeRate: 2.2,
    builder: '현대건설',
    builtYear: 2014,
    totalUnits: 3032,
    isWalkSubway: false,
    isFlat: true,
    hasElementarySchool: true,
  },
  {
    aptCode: 'APT040',
    apartmentName: '세종 리더스포레',
    lawdNm: '세종특별자치시',
    lat: 36.5012,
    lng: 127.2719,
    basePrice: 48000,
    area: 84,
    tradeCount: 8,
    priceChange: 800,
    priceChangeRate: 1.7,
    builder: '한화건설',
    builtYear: 2015,
    totalUnits: 1030,
    isWalkSubway: false,
    isFlat: true,
    hasElementarySchool: true,
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
// 지도 마커용 Mock 데이터 (40개)
// isBrand: builder 기준 자동 계산
// isLargeComplex: totalUnits >= 1000 자동 계산
// isNewBuild: builtYear >= 2020 자동 계산
// TODO: 실 API 연동 시 이 함수 교체
// ============================================================
const MAP_MARKERS_MOCK: ApartmentMapMarker[] = APT_BASE_DATA.map((apt) => ({
  id: apt.aptCode,
  name: apt.apartmentName,
  lat: apt.lat,
  lng: apt.lng,
  price: apt.basePrice,
  area: String(apt.area),
  lawdNm: apt.lawdNm,
  umdNm: apt.lawdNm.split(' ')[apt.lawdNm.split(' ').length - 1],
  priceChangeType: apt.priceChange > 0 ? 'up' : apt.priceChange < 0 ? 'down' : 'flat',
  unitCount: apt.totalUnits,
  isBrand: apt.builder ? isBrandBuilder(apt.builder) : false,
  isWalkSubway: apt.isWalkSubway ?? false,
  isLargeComplex: apt.totalUnits !== undefined ? apt.totalUnits >= 1000 : false,
  isNewBuild: apt.builtYear !== undefined ? apt.builtYear >= 2020 : false,
  isFlat: apt.isFlat ?? false,
  hasElementarySchool: apt.hasElementarySchool ?? false,
}));

// ============================================================
// 국토부 API 관련 함수 (실 API 연동용)
// ============================================================

/**
 * 국토부 XML 응답에서 거래 아이템 하나를 파싱합니다.
 * 공공데이터포털 신 API (apis.data.go.kr) 기준 필드명 사용
 */
function parseMolitItem(item: MolitTradeItem, lawdCd: string): ApartmentTrade {
  // 거래 금액에서 쉼표 및 공백 제거 후 숫자 변환
  const rawPrice = item.dealAmount?.[0]?.replace(/,/g, '').trim() ?? '0';
  const price = parseInt(rawPrice, 10) || 0;

  const year = parseInt(item.dealYear?.[0]?.trim() ?? '0', 10);
  const month = parseInt(item.dealMonth?.[0]?.trim() ?? '0', 10);
  const day = parseInt(item.dealDay?.[0]?.trim() ?? '0', 10);
  const dealDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return {
    apartmentName: item.aptNm?.[0]?.trim() ?? '',
    area: parseFloat(item.excluUseAr?.[0]?.trim() ?? '0'),
    floor: parseInt(item.floor?.[0]?.trim() ?? '0', 10),
    price,
    dealDate,
    dealYear: year,
    dealMonth: month,
    dealDay: day,
    // 신 API: sggCd (시군구 코드), umdNm (읍면동명)
    lawdCd: item.sggCd?.[0]?.trim() ?? lawdCd,
    lawdNm: item.umdNm?.[0]?.trim() ?? '',
    roadNm: item.roadNm?.[0]?.trim(),
    buildYear: item.buildYear?.[0] ? parseInt(item.buildYear[0].trim(), 10) : undefined,
    aptCode: item.aptSeq?.[0]?.trim(),
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

  let response;
  try {
    response = await axios.get<string>(MOLIT_API_BASE_URL, {
      params,
      timeout: API_TIMEOUT,
      responseType: 'text',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BomzipServer/1.0)',
      },
    });
  } catch (err) {
    // axios 네트워크/타임아웃 에러 시 응답 body도 함께 출력
    if (axios.isAxiosError(err)) {
      const status = err.response?.status ?? 'N/A';
      const body = err.response?.data ?? '(응답 없음)';
      console.error(
        `[Molit] API HTTP 에러 — status=${status}, lawdCd=${lawdCd}, dealYmd=${dealYmd}`,
        typeof body === 'string' ? body.substring(0, 500) : body,
      );
    } else {
      console.error(`[Molit] API 호출 실패 — lawdCd=${lawdCd}, dealYmd=${dealYmd}`, err);
    }
    throw err;
  }

  // XML을 JSON으로 변환
  let parsed: MolitApiResponse;
  try {
    parsed = (await parseStringPromise(response.data)) as MolitApiResponse;
  } catch (parseErr) {
    // XML 파싱 실패 시 응답 원문 앞 500자 출력
    console.error(
      `[Molit] XML 파싱 실패 — lawdCd=${lawdCd}, dealYmd=${dealYmd}, 응답 앞 500자:`,
      response.data?.substring(0, 500),
    );
    throw parseErr;
  }

  const body = parsed.response?.body?.[0];
  // API 레벨 에러 메시지 확인 (예: "SERVICE_KEY_IS_NOT_REGISTERED_ERROR")
  const resultCode = parsed.response?.header?.[0]?.resultCode?.[0];
  const resultMsg = parsed.response?.header?.[0]?.resultMsg?.[0];
  if (resultCode && resultCode !== '00' && resultCode !== '0000') {
    console.error(
      `[Molit] API 에러 응답 — lawdCd=${lawdCd}, dealYmd=${dealYmd}, code=${resultCode}, msg=${resultMsg}`,
    );
  }

  const totalCount = parseInt(body?.totalCount?.[0] ?? '0', 10);
  const rawItems = body?.items?.[0]?.item ?? [];

  const items = rawItems.map((item: MolitTradeItem) => parseMolitItem(item, lawdCd));
  console.log(`[Molit] API 응답 — lawdCd=${lawdCd}, dealYmd=${dealYmd}, totalCount=${totalCount}, parsed=${items.length}건`);

  return { items, totalCount };
}

// ============================================================
// 시군구 코드 → 대표 좌표 Map
// 실 API에서 lat/lng를 제공하지 않을 때 사용합니다.
// aptCode 앞 5자리 (시군구 코드) 기준으로 구/군의 중심 좌표를 반환합니다.
// ============================================================
const LAWD_CD_COORDS: Record<string, { lat: number; lng: number }> = {
  // 서울 (11)
  '11110': { lat: 37.5920, lng: 126.9776 }, // 종로구
  '11140': { lat: 37.5636, lng: 126.9975 }, // 중구
  '11170': { lat: 37.5543, lng: 127.0093 }, // 용산구
  '11200': { lat: 37.5613, lng: 127.0369 }, // 성동구
  '11215': { lat: 37.5492, lng: 127.0868 }, // 광진구
  '11230': { lat: 37.5809, lng: 127.0450 }, // 동대문구
  '11260': { lat: 37.6063, lng: 127.0927 }, // 중랑구
  '11290': { lat: 37.5894, lng: 127.0144 }, // 성북구
  '11305': { lat: 37.6396, lng: 127.0254 }, // 강북구
  '11320': { lat: 37.6688, lng: 127.0470 }, // 도봉구
  '11350': { lat: 37.6541, lng: 127.0568 }, // 노원구
  '11380': { lat: 37.6024, lng: 126.9287 }, // 은평구
  '11410': { lat: 37.5794, lng: 126.9368 }, // 서대문구
  '11440': { lat: 37.5538, lng: 126.9086 }, // 마포구
  '11470': { lat: 37.5392, lng: 126.8565 }, // 양천구
  '11500': { lat: 37.5263, lng: 126.8966 }, // 강서구
  '11530': { lat: 37.4943, lng: 126.8956 }, // 구로구
  '11545': { lat: 37.4567, lng: 126.8957 }, // 금천구
  '11560': { lat: 37.5219, lng: 126.9241 }, // 영등포구
  '11590': { lat: 37.5124, lng: 126.9393 }, // 동작구
  '11620': { lat: 37.4784, lng: 126.9516 }, // 관악구
  '11650': { lat: 37.4836, lng: 127.0325 }, // 서초구
  '11680': { lat: 37.5172, lng: 127.0473 }, // 강남구
  '11710': { lat: 37.5146, lng: 127.1053 }, // 송파구
  '11740': { lat: 37.5301, lng: 127.1238 }, // 강동구
  // 경기 주요 (41)
  '41110': { lat: 37.3945, lng: 127.1113 }, // 성남 수정구
  '41130': { lat: 37.4375, lng: 127.1378 }, // 성남 중원구
  '41135': { lat: 37.3595, lng: 127.1156 }, // 성남 분당구
  '41150': { lat: 37.2636, lng: 127.0286 }, // 수원 장안구
  '41170': { lat: 37.2415, lng: 127.0576 }, // 수원 팔달구
  '41190': { lat: 37.2599, lng: 127.0573 }, // 수원 영통구
  '41280': { lat: 37.4140, lng: 126.7483 }, // 부천시
  '41290': { lat: 37.6566, lng: 126.8320 }, // 고양 덕양구
  '41310': { lat: 37.3219, lng: 126.8318 }, // 안산 단원구
  '41360': { lat: 37.0081, lng: 127.2715 }, // 평택시
  '41390': { lat: 37.3943, lng: 126.9558 }, // 안양 만안구
  '41410': { lat: 37.3945, lng: 126.9368 }, // 안양 동안구
  '41450': { lat: 37.3001, lng: 127.0088 }, // 의왕시
  '41460': { lat: 37.3601, lng: 126.9268 }, // 군포시
  '41480': { lat: 37.4295, lng: 126.9891 }, // 과천시
  '41550': { lat: 37.3946, lng: 127.0547 }, // 광주시
  '41570': { lat: 37.5497, lng: 127.1946 }, // 하남시
  '41590': { lat: 37.2191, lng: 127.0812 }, // 화성시
  '41610': { lat: 37.2902, lng: 127.0457 }, // 수원 영통구(광교)
  '41630': { lat: 37.3944, lng: 127.1204 }, // 성남 분당
  '41670': { lat: 37.6738, lng: 126.7712 }, // 고양 일산동구
  // 인천 (28)
  '28110': { lat: 37.4562, lng: 126.7052 }, // 미추홀구
  '28140': { lat: 37.4762, lng: 126.6462 }, // 연수구
  '28177': { lat: 37.5335, lng: 126.6969 }, // 서구
  '28200': { lat: 37.5143, lng: 126.7228 }, // 부평구
  // 부산 (26)
  '26110': { lat: 35.1028, lng: 129.0244 }, // 중구
  '26350': { lat: 35.1631, lng: 129.1624 }, // 해운대구
  '26440': { lat: 35.1853, lng: 128.9814 }, // 사상구
};

/**
 * aptCode에서 시군구 코드를 추출해 대표 좌표를 반환합니다.
 * aptCode 형식: "11305-46" → 앞 5자리 "11305" 또는 5자리 코드 직접 입력
 * 매칭 실패 시 null을 반환합니다.
 */
function getLawdCdCoords(aptCode: string): { lat: number; lng: number } | null {
  // "11305-46" → "11305"
  const lawdCd = aptCode.split('-')[0];
  if (LAWD_CD_COORDS[lawdCd]) {
    return LAWD_CD_COORDS[lawdCd];
  }
  // 5자리 숫자 코드 그대로 전달된 경우
  if (/^\d{5}$/.test(aptCode) && LAWD_CD_COORDS[aptCode]) {
    return LAWD_CD_COORDS[aptCode];
  }
  // 앞 4자리 + '0' 패딩 시도 (일부 코드 불일치 대응)
  const padded = `${lawdCd.slice(0, 4)}0`;
  if (LAWD_CD_COORDS[padded]) {
    return LAWD_CD_COORDS[padded];
  }
  return null;
}

function normalizeApartmentId(aptCode: string): string {
  if (/^\d{5}-APT\d+$/i.test(aptCode)) {
    return aptCode.split('-').slice(1).join('-');
  }
  return aptCode;
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
  const cacheLookupId = `history:${aptCode}:${lawdCd}:${months}:${filterArea ?? 'all'}`;

  const cached = cacheService.get<ApartmentTradeHistory[]>(cacheLookupId);
  if (cached) {
    console.log(`[Molit] 히스토리 캐시 히트: ${cacheLookupId}`);
    return cached;
  }

  console.log(`[Molit] 히스토리 조회 시작: aptCode=${aptCode}, ${months}개월, lawdCd=${lawdCd || '미제공'}`);

  // Mock 데이터에 해당 aptCode가 있으면 Mock 반환
  // lawdCd가 없는 경우에도 Mock 데이터로 서빙 (FE 단에서 lawdCd 없이 호출하는 케이스 대응)
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
    cacheService.set(cacheLookupId, result, CACHE_TTL.APARTMENT_TRADE);
    return result;
  }

  // lawdCd 없으면 실 API 호출 불가 → 동적 Mock 생성
  if (!lawdCd) {
    console.warn(`[Molit] lawdCd 미제공이고 Mock 데이터도 없음: aptCode=${aptCode} → 동적 Mock 생성`);
    // APT_BASE_DATA에서 aptCode에 근접한 단지 찾아 basePrice 추출 후 동적 생성
    const baseApt = APT_BASE_DATA.find((a) => a.aptCode === aptCode);
    const basePrice = baseApt?.basePrice ?? 100000;
    const dynamicHistory = generateHistory(basePrice, months);
    cacheService.set(cacheLookupId, dynamicHistory, CACHE_TTL.APARTMENT_TRADE);
    return dynamicHistory;
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
  cacheService.set(cacheLookupId, history, CACHE_TTL.APARTMENT_TRADE);

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

  // 국토부 API는 5자리 시군구 코드(LAWD_CD) 필수
  // regionCode가 2자리(시도)이면 해당 시도 주요 구 코드 목록으로 확장
  const REGION_LAWD_MAP: Record<string, string[]> = {
    '11': ['11110','11140','11170','11200','11215','11230','11260','11290','11305','11320','11350','11380','11410','11440','11470','11500','11530','11545','11560','11590','11620','11650','11680','11710','11740'], // 서울 25구
    '41': ['41110','41130','41150','41170','41190','41210','41220','41250','41270','41280','41290','41310','41360','41370','41390','41410','41430','41450','41460','41480','41500','41550','41570','41590','41610','41630','41650','41670','41800','41820','41830'], // 경기 주요
    '26': ['26110','26140','26170','26200','26230','26260','26290','26320','26350','26380','26410','26440','26470','26500','26530','26710'], // 부산
  };
  const lawdCodes = REGION_LAWD_MAP[regionCode] ?? [regionCode];

  // 최근 1개월 데이터 조회 (주요 구 병렬)
  const now = new Date();
  const dealYmd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

  try {
    const results = await Promise.allSettled(
      lawdCodes.map((cd) => fetchMolitApi(cd, dealYmd, 1, 1000)),
    );
    const items = results.flatMap((r) => (r.status === 'fulfilled' ? r.value.items : []));

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

      // 실 API에서는 좌표 정보 없음 → aptCode 기반 시군구 대표 좌표로 근사 보정
      const approxCoords = getLawdCdCoords(apt.key);

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
        lat: approxCoords?.lat ?? null,
        lng: approxCoords?.lng ?? null,
      };
    });

    // 데이터 없으면 최대 6개월 전까지 순차 탐색 (신고 기간 지연 대응)
    if (hotList.length === 0) {
      let prevItems: ApartmentTrade[] = [];
      let prevDealYmd = '';
      for (let offset = 1; offset <= 6; offset++) {
        const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
        prevDealYmd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
        console.warn(`[Molit] 데이터 없음 → ${prevDealYmd} 재시도 (offset=${offset})`);
        const prevResults = await Promise.allSettled(
          lawdCodes.map((cd) => fetchMolitApi(cd, prevDealYmd, 1, 1000)),
        );
        const errs = prevResults.filter((r) => r.status === 'rejected');
        if (errs.length > 0) console.error(`[Molit] ${prevDealYmd} API 오류 샘플:`, (errs[0] as PromiseRejectedResult).reason?.message ?? errs[0]);
        prevItems = prevResults.flatMap((r) => (r.status === 'fulfilled' ? r.value.items : []));
        if (prevItems.length > 0) break;
      }
      if (prevItems.length > 0) {
        const prevMap = new Map<string, { trades: ApartmentTrade[]; key: string }>();
        prevItems.forEach((item) => {
          const key = item.aptCode ?? item.apartmentName;
          if (!prevMap.has(key)) prevMap.set(key, { trades: [], key });
          prevMap.get(key)!.trades.push(item);
        });
        const prevSorted = Array.from(prevMap.values())
          .sort((a, b) => b.trades.length - a.trades.length)
          .slice(0, limit);
        const prevHotList = prevSorted.map((apt, idx) => {
          const latest = apt.trades[apt.trades.length - 1];
          const first = apt.trades[0];
          const pc = latest.price - first.price;
          // 실 API에서는 좌표 없음 → aptCode 기반 시군구 대표 좌표로 근사 보정
          const prevCoords = getLawdCdCoords(apt.key);
          return {
            rank: idx + 1,
            aptCode: apt.key,
            apartmentName: latest.apartmentName,
            lawdNm: latest.lawdNm,
            recentPrice: latest.price,
            area: latest.area,
            tradeCount: apt.trades.length,
            priceChange: pc,
            priceChangeRate: Math.round((first.price > 0 ? (pc / first.price) * 100 : 0) * 10) / 10,
            lat: prevCoords?.lat ?? null,
            lng: prevCoords?.lng ?? null,
          };
        });
        cacheService.set(cacheKey, prevHotList, CACHE_TTL.APARTMENT_TRADE);
        return prevHotList;
      }
      // 이전 달도 없으면 Mock
      console.warn('[Molit] 이전 달도 데이터 없음 → Mock 반환');
      return HOT_APARTMENTS_MOCK.slice(0, limit);
    }

    cacheService.set(cacheKey, hotList, CACHE_TTL.APARTMENT_TRADE);
    return hotList;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[Molit] 핫 아파트 조회 실패 → Mock 반환: ${msg}`);
    return HOT_APARTMENTS_MOCK.slice(0, limit);
  }
}

// 뷰포트 범위 안에 있는 구(lawdCd) 목록을 추출하기 위한 배열
// LAWD_CD_COORDS의 키/값을 순회 가능한 형태로 정리
const LAWD_CD_LIST = Object.entries(LAWD_CD_COORDS).map(([lawdCd, coords]) => ({
  lawdCd,
  lat: coords.lat,
  lng: coords.lng,
}));

// 뷰포트당 반환할 마커 최대 수
const MAP_MARKERS_MAX = 200;

/**
 * 실거래 ApartmentTrade 배열을 단지별로 집계해 ApartmentMapMarker[] 를 생성합니다.
 *
 * 국토부 API는 좌표를 제공하지 않으므로, 구 중심 좌표 + 단지 인덱스 기반 오프셋으로
 * 마커를 분산 배치합니다. aptCode(아파트 일련번호)를 시드로 사용해 오프셋이
 * 재실행 시에도 동일하게 유지됩니다.
 *
 * @param trades - 실거래 목록
 * @param lawdCd - 조회 대상 시군구 코드 (좌표 추정에 사용)
 */
function tradesToMapMarkers(trades: ApartmentTrade[], lawdCd: string): ApartmentMapMarker[] {
  const baseCoords = LAWD_CD_COORDS[lawdCd];
  if (!baseCoords) return [];

  // aptCode(없으면 아파트명+동 조합) 기준으로 단지 집계
  // key: 단지 식별자, value: 해당 단지의 거래 목록
  const aptMap = new Map<string, ApartmentTrade[]>();

  for (const trade of trades) {
    // 단지 식별자: aptCode 있으면 사용, 없으면 아파트명으로 대체
    const key = trade.aptCode ?? trade.apartmentName;
    const list = aptMap.get(key) ?? [];
    list.push(trade);
    aptMap.set(key, list);
  }

  // 지역 중앙값 가격 계산 (신고가 판정 기준)
  const allPrices = trades.map((t) => t.price).sort((a, b) => a - b);
  const districtMedian = allPrices.length > 0 ? (allPrices[Math.floor(allPrices.length / 2)] ?? 0) : 0;

  const markers: ApartmentMapMarker[] = [];
  let idx = 0;

  for (const [key, aptTrades] of aptMap) {
    // 가장 최근 거래 기준으로 대표 가격 결정 (dealDate 내림차순 정렬)
    const sorted = [...aptTrades].sort((a, b) => b.dealDate.localeCompare(a.dealDate));
    const latest = sorted[0];
    const oldest = sorted[sorted.length - 1];

    // 가격 변화 방향 계산 (최신 vs 가장 오래된 거래)
    const priceDiff = latest.price - oldest.price;
    const priceChangeType: 'up' | 'down' | 'flat' =
      priceDiff > 0 ? 'up' : priceDiff < 0 ? 'down' : 'flat';

    // 신고가 여부: 지역 중앙값 대비 30% 이상 고가 거래
    const isRecordHigh = districtMedian > 0 && latest.price >= districtMedian * 1.3;

    // 단지 식별자 문자열을 간단한 해시값으로 변환 (좌표 오프셋 시드)
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
    }
    // 오프셋 범위: ±0.03도 (약 ±3km) 내에서 분산 배치
    const latOffset = ((Math.abs(hash) % 60) - 30) * 0.001;
    const lngOffset = (((Math.abs(hash) >> 4) % 60) - 30) * 0.001;

    markers.push({
      id: latest.aptCode ? `${lawdCd}-${latest.aptCode}` : `${lawdCd}-${idx}`,
      name: latest.apartmentName,
      lat: baseCoords.lat + latOffset,
      lng: baseCoords.lng + lngOffset,
      price: latest.price,
      area: String(Math.round(latest.area)),
      lawdNm: `${LAWD_CD_TO_LOCATION[latest.lawdCd] ?? LAWD_CD_TO_LOCATION[lawdCd] ?? latest.lawdNm}${latest.lawdNm ? ` ${latest.lawdNm}` : ''}`.trim(),
      umdNm: latest.lawdNm,
      priceChangeType,
      isRecordHigh,
    });

    idx++;
  }

  return markers;
}

/**
 * 지도 뷰포트 내 아파트 마커를 조회합니다.
 *
 * MOLIT_API_KEY 환경변수가 설정된 경우 실 국토부 API 데이터를 사용하고,
 * 없거나 API 호출 실패 시 Mock 데이터(40개 고정 단지)로 자동 폴백합니다.
 *
 * 실 API 흐름:
 * 1. 뷰포트 범위 안에 있는 구(lawdCd) 목록 추출 (LAWD_CD_LIST 활용)
 * 2. 최대 5개 구를 병렬로 실거래 조회 (이번 달 기준)
 * 3. 거래 데이터를 단지별로 집계해 ApartmentMapMarker 형태로 변환
 * 4. 필터 적용 후 최대 200개 마커 반환
 *
 * @param swLat - 남서쪽 위도
 * @param swLng - 남서쪽 경도
 * @param neLat - 북동쪽 위도
 * @param neLng - 북동쪽 경도
 * @param priceFilter - 가격 필터 (만원, 이하)
 * @param complexFilter - 단지 특성 필터 (세대수, 브랜드, 역세권 등)
 */
export async function getApartmentMapMarkers(
  swLat: number,
  swLng: number,
  neLat: number,
  neLng: number,
  priceFilter?: number,
  complexFilter?: ComplexFilter,
): Promise<ApartmentMapMarker[]> {
  const filterKey = complexFilter ? JSON.stringify(complexFilter) : 'none';
  const cacheKey = `map:${swLat}:${swLng}:${neLat}:${neLng}:${priceFilter ?? 'all'}:${filterKey}`;

  const cached = cacheService.get<ApartmentMapMarker[]>(cacheKey);
  if (cached) {
    console.log(`[Molit] 지도 마커 캐시 히트`);
    return cached;
  }

  // ── 실 API 경로 ──────────────────────────────────────────────
  if (isRealApiKey(process.env.MOLIT_API_KEY)) {
    try {
      // 1. 뷰포트 안에 중심 좌표가 들어오는 구 목록 추출
      const inBoundsLawdCds = LAWD_CD_LIST.filter(
        (d) => d.lat >= swLat && d.lat <= neLat && d.lng >= swLng && d.lng <= neLng,
      );

      if (inBoundsLawdCds.length === 0) {
        console.log('[Molit] 지도 마커: 뷰포트 내 구 없음 → Mock 폴백');
        return getMockMarkersWithFilter(swLat, swLng, neLat, neLng, priceFilter, complexFilter);
      }

      // 2. 최대 5개 구를 병렬 조회 (API quota 보호)
      const targetLawdCds = inBoundsLawdCds.slice(0, 5);
      // 현재 연월 (YYYYMM 형식)
      const now = new Date();
      const currentYm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

      console.log(
        `[Molit] 지도 마커 실 API 조회: ${targetLawdCds.map((d) => d.lawdCd).join(', ')} (${currentYm})`,
      );

      const results = await Promise.allSettled(
        targetLawdCds.map((d) =>
          getApartmentTrades(d.lawdCd, currentYm, 1, 100),
        ),
      );

      // 3. 성공한 구의 거래 데이터를 마커로 변환
      let allMarkers: ApartmentMapMarker[] = [];

      results.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          const { items } = result.value;
          const lawdCd = targetLawdCds[i].lawdCd;
          const converted = tradesToMapMarkers(items, lawdCd);
          allMarkers = allMarkers.concat(converted);
        } else {
          console.warn(
            `[Molit] 구 ${targetLawdCds[i].lawdCd} 조회 실패:`,
            result.reason,
          );
        }
      });

      // 이번 달 데이터 없으면 전달도 조회 (신고 지연 대응)
      if (allMarkers.length === 0) {
        const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevYm = `${prevDate.getFullYear()}${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
        console.log(`[Molit] 이번 달 데이터 없음 → 전달(${prevYm}) 재조회`);
        const prevResults = await Promise.allSettled(
          targetLawdCds.map((d) => getApartmentTrades(d.lawdCd, prevYm, 1, 100)),
        );
        prevResults.forEach((result, i) => {
          if (result.status === 'fulfilled') {
            const { items } = result.value;
            const converted = tradesToMapMarkers(items, targetLawdCds[i].lawdCd);
            allMarkers = allMarkers.concat(converted);
          }
        });
      }

      // 여전히 없으면 Mock 폴백
      if (allMarkers.length === 0) {
        console.warn('[Molit] 지도 마커: 실 API 결과 없음 → Mock 폴백');
        return getMockMarkersWithFilter(swLat, swLng, neLat, neLng, priceFilter, complexFilter);
      }

      // 4. 필터 적용
      let markers = allMarkers;

      if (priceFilter !== undefined && priceFilter > 0) {
        markers = markers.filter((apt) => apt.price <= priceFilter);
      }

      // 단지 특성 필터: 실 API 데이터에는 특성 정보가 없으므로 undefined 필드는 필터 제외
      if (complexFilter) {
        if (complexFilter.minUnit !== undefined) {
          markers = markers.filter(
            (apt) => apt.unitCount !== undefined && apt.unitCount >= complexFilter.minUnit!,
          );
        }
        if (complexFilter.isBrand !== undefined) {
          markers = markers.filter(
            (apt) => apt.isBrand === undefined || apt.isBrand === complexFilter.isBrand,
          );
        }
        if (complexFilter.isWalkSubway !== undefined) {
          markers = markers.filter(
            (apt) =>
              apt.isWalkSubway === undefined || apt.isWalkSubway === complexFilter.isWalkSubway,
          );
        }
        if (complexFilter.isLargeComplex !== undefined) {
          markers = markers.filter(
            (apt) =>
              apt.isLargeComplex === undefined ||
              apt.isLargeComplex === complexFilter.isLargeComplex,
          );
        }
        if (complexFilter.isNewBuild !== undefined) {
          markers = markers.filter(
            (apt) =>
              apt.isNewBuild === undefined || apt.isNewBuild === complexFilter.isNewBuild,
          );
        }
        if (complexFilter.isFlat !== undefined) {
          markers = markers.filter(
            (apt) => apt.isFlat === undefined || apt.isFlat === complexFilter.isFlat,
          );
        }
        if (complexFilter.hasElementarySchool !== undefined) {
          markers = markers.filter(
            (apt) =>
              apt.hasElementarySchool === undefined ||
              apt.hasElementarySchool === complexFilter.hasElementarySchool,
          );
        }
      }

      // 최대 200개 제한
      const limited = markers.slice(0, MAP_MARKERS_MAX);

      console.log(
        `[Molit] 지도 마커 실 API: 전체 ${allMarkers.length}개 → 필터 후 ${markers.length}개 → 반환 ${limited.length}개`,
      );

      // 캐시 저장 (5분 - 실 API 데이터)
      cacheService.set(cacheKey, limited, 300);
      return limited;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`[Molit] 지도 마커 실 API 실패 → Mock 폴백: ${msg}`);
      // 실패 시 Mock 폴백으로 계속 진행
    }
  }

  // ── Mock 경로 (API 키 없음 또는 실 API 실패) ─────────────────
  return getMockMarkersWithFilter(swLat, swLng, neLat, neLng, priceFilter, complexFilter);
}

/**
 * Mock 데이터에서 뷰포트 및 필터를 적용해 마커 목록을 반환합니다.
 * getApartmentMapMarkers 의 Mock 폴백 경로에서 공통으로 사용합니다.
 */
function getMockMarkersWithFilter(
  swLat: number,
  swLng: number,
  neLat: number,
  neLng: number,
  priceFilter?: number,
  complexFilter?: ComplexFilter,
): ApartmentMapMarker[] {
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

  // 단지 특성 필터 적용
  if (complexFilter) {
    // 최소 세대수 필터
    if (complexFilter.minUnit !== undefined) {
      markers = markers.filter(
        (apt) => apt.unitCount !== undefined && apt.unitCount >= complexFilter.minUnit!,
      );
    }
    // 브랜드 필터
    if (complexFilter.isBrand !== undefined) {
      markers = markers.filter((apt) => apt.isBrand === complexFilter.isBrand);
    }
    // 역세권 필터
    if (complexFilter.isWalkSubway !== undefined) {
      markers = markers.filter((apt) => apt.isWalkSubway === complexFilter.isWalkSubway);
    }
    // 대단지 필터
    if (complexFilter.isLargeComplex !== undefined) {
      markers = markers.filter((apt) => apt.isLargeComplex === complexFilter.isLargeComplex);
    }
    // 신축 필터
    if (complexFilter.isNewBuild !== undefined) {
      markers = markers.filter((apt) => apt.isNewBuild === complexFilter.isNewBuild);
    }
    // 평지 필터
    if (complexFilter.isFlat !== undefined) {
      markers = markers.filter((apt) => apt.isFlat === complexFilter.isFlat);
    }
    // 초품아 필터
    if (complexFilter.hasElementarySchool !== undefined) {
      markers = markers.filter(
        (apt) => apt.hasElementarySchool === complexFilter.hasElementarySchool,
      );
    }
  }

  console.log(`[Molit] 지도 마커 Mock: 뷰포트 내 ${markers.length}개 반환`);

  // 캐시 저장 (30초 - Mock 데이터는 짧게)
  const filterKey = complexFilter ? JSON.stringify(complexFilter) : 'none';
  const cacheKey = `map:${swLat}:${swLng}:${neLat}:${neLng}:${priceFilter ?? 'all'}:${filterKey}`;
  cacheService.set(cacheKey, markers, 30);

  return markers;
}

/**
 * aptCode로 특정 아파트 정보를 조회합니다.
 * TODO: 실 API 연동 시 실제 조회 로직 구현
 * - Mock: APT_BASE_DATA에서 aptCode로 검색
 * - 국토부 코드 형식("11650", "11305-46") 전달 시:
 *   1. getLawdCdCoords()로 시군구 대표 좌표 조회
 *   2. 좌표 범위(±0.1도) 내 가장 가까운 Mock 단지 반환
 *   3. 매칭 단지 없어도 시군구 대표 좌표로 기본 응답 생성 (404 방지)
 *
 * @param aptCode - 아파트 코드 (APT001 형식 또는 국토부 코드 형식)
 */
export async function getApartmentById(aptCode: string): Promise<HotApartment | null> {
  const normalizedAptCode = normalizeApartmentId(aptCode);
  const cacheKey = `apt:${normalizedAptCode}`;

  const cached = cacheService.get<HotApartment>(cacheKey);
  if (cached) {
    console.log(`[Molit] 아파트 상세 캐시 히트: ${normalizedAptCode}`);
    return cached;
  }

  // 1차: Mock 데이터에서 정확한 aptCode 검색 (APT001 형식)
  let found = APT_BASE_DATA.find((apt) => apt.aptCode === normalizedAptCode);

  // 2차: 국토부 코드 형식(숫자 또는 "숫자-숫자")이면 시군구 좌표로 근사 매핑
  if (!found && /^\d/.test(normalizedAptCode)) {
    const coords = getLawdCdCoords(normalizedAptCode);
    if (coords) {
      // 좌표 ±0.1도 이내 가장 가까운 Mock 단지 선택
      const nearby = APT_BASE_DATA.filter(
        (apt) => Math.abs(apt.lat - coords.lat) < 0.1 && Math.abs(apt.lng - coords.lng) < 0.1,
      );
      if (nearby.length > 0) {
        // 직선 거리 최솟값 단지 선택
        found = nearby.reduce((closest, apt) => {
          const d = Math.hypot(apt.lat - coords.lat, apt.lng - coords.lng);
          const dc = Math.hypot(closest.lat - coords.lat, closest.lng - coords.lng);
          return d < dc ? apt : closest;
        });
        console.log(`[Molit] 국토부 코드 "${normalizedAptCode}" → 근사 단지 "${found.aptCode}" (${found.apartmentName}) 반환`);
      } else {
        // 인근 단지가 없어도 시군구 대표 좌표로 최소 응답 생성 (FE 404 방지)
        console.log(`[Molit] 국토부 코드 "${normalizedAptCode}" → 시군구 대표 좌표 기본 응답 생성`);
        const fallback: HotApartment = {
          rank: 0,
          aptCode: normalizedAptCode,
          apartmentName: `아파트 (${normalizedAptCode})`,
          lawdNm: normalizedAptCode.split('-')[0],
          recentPrice: 0,
          area: 84,
          tradeCount: 0,
          priceChange: 0,
          priceChangeRate: 0,
          lat: coords.lat,
          lng: coords.lng,
          areas: [{ area: 84, recentPrice: 0 }],
        };
        cacheService.set(cacheKey, fallback, CACHE_TTL.APARTMENT_TRADE);
        return fallback;
      }
    }
  }

  if (!found) {
    console.log(`[Molit] 아파트 없음: aptCode=${normalizedAptCode}`);
    return null;
  }

  // 대표 면적 유형 목록 (84㎡ 중심으로 ±20㎡ 범위 면적 생성)
  const areas = [
    { area: 59, recentPrice: Math.round(found.basePrice * 0.72) },
    { area: 84, recentPrice: found.basePrice },
    { area: 109, recentPrice: Math.round(found.basePrice * 1.28) },
  ];

  // 해당 단지의 24개월 시계열 히스토리 포함 (차트 초기 렌더용)
  // APT_HISTORY_MOCK에 있으면 사용, 없으면 basePrice 기반으로 동적 생성
  const rawHistory = APT_HISTORY_MOCK[found.aptCode] ?? generateHistory(found.basePrice, 24);
  const tradeHistory = rawHistory.slice(-24);

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
    // 아파트 상세 추가 필드
    totalUnits: found.totalUnits,
    buildYear: found.builtYear,
    builder: found.builder,
    areas,
    tradeHistory,
    // lawdNm에서 법정동 코드(lawdCd) 매핑은 미지원 → 필드 생략
  };

  cacheService.set(cacheKey, result, CACHE_TTL.APARTMENT_TRADE);
  return result;
}

/**
 * 특정 아파트의 분양가(최근 실거래 기반 근사치)를 반환합니다.
 *
 * 현재는 Mock 데이터의 basePrice를 분양가로 근사 반환합니다.
 * TODO: 국토부 분양가 정보 공개 API(getAptPriceInfo) 연동 시 교체
 *
 * @param aptCode - 아파트 코드 (예: APT001)
 * @returns { salePrice: number | null, date: string | null }
 */
export async function getSalePriceByAptCode(
  aptCode: string,
): Promise<{ salePrice: number | null; date: string | null }> {
  const cacheKey = `sale-price:${aptCode}`;

  const cached = cacheService.get<{ salePrice: number | null; date: string | null }>(cacheKey);
  if (cached) {
    console.log(`[Molit] 분양가 캐시 히트: ${aptCode}`);
    return cached;
  }

  // Mock 데이터에서 aptCode로 검색
  const found = APT_BASE_DATA.find((apt) => apt.aptCode === aptCode);
  if (!found) {
    console.log(`[Molit] 분양가 조회 — 아파트 없음: aptCode=${aptCode}`);
    return { salePrice: null, date: null };
  }

  // 준공 연도 기반 입주 연도를 분양일자로 근사 (실제 분양일 = 준공 약 2년 전)
  const saleYear = found.builtYear ? found.builtYear - 2 : null;
  const saleDate = saleYear ? `${saleYear}-01-01` : null;

  // 분양가는 현재 시세의 70~90% 수준으로 근사 (실 API 없을 때 참고값)
  const approxSalePrice = Math.round(found.basePrice * 0.78);

  const result = {
    salePrice: approxSalePrice,
    date: saleDate,
  };

  cacheService.set(cacheKey, result, CACHE_TTL.APARTMENT_TRADE);
  return result;
}

// ============================================================
// 전세가율 계산 관련 상수 및 함수
// ============================================================

/** 국토부 전세 실거래가 API 직접 호출 URL
 *  - Railway 서버가 해외 IP이므로 WAF 차단 가능성 있음
 *  - 차단 시 null 반환 + 경고 로그로 처리
 */
// 전세 API도 Cloudflare Worker 프록시 경유 (Railway 해외 IP WAF 차단 우회)
const JEONSE_API_URL = 'https://molit-proxy.bomzip.workers.dev/rent';

/**
 * 전세 API 응답 XML 아이템 타입 (xml2js 파싱 결과)
 */
interface JeonseItem {
  aptNm?: string[];
  deposit?: string[];      // 보증금 (만원, 쉼표 포함 가능)
  excluUseAr?: string[];   // 전용면적
  dealYear?: string[];
  dealMonth?: string[];
  dealDay?: string[];
  umdNm?: string[];
  sggCd?: string[];
  aptSeq?: string[];
}

/**
 * 두 단지명의 유사도를 계산합니다 (0~1).
 * 공백 제거 후 포함 여부로 판단하는 간단한 방식.
 */
function calcNameSimilarity(a: string, b: string): number {
  const normalize = (s: string) => s.replace(/\s/g, '').toLowerCase();
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.8;
  // 공통 글자 수 / 전체 글자 수로 자카드 유사도 근사
  const setA = new Set(na);
  const setB = new Set(nb);
  const intersection = [...setA].filter((c) => setB.has(c)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * 숫자 배열에서 중위값(median)을 반환합니다.
 */
function calcMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * 특정 아파트 단지의 전세가율을 계산합니다.
 *
 * 알고리즘:
 * 1. 국토부 전세 API를 최근 6개월 순차 시도하여 해당 지역 전세 거래 수집
 * 2. aptCode(단지 시퀀스) 또는 단지명 유사도로 해당 단지 거래 필터링
 * 3. 같은 기간 매매 실거래 수집 (fetchMolitApi 사용)
 * 4. 전세가율 = 전세 중위가 / 매매 중위가 × 100 (소수점 1자리 반올림)
 *
 * @param aptCode - 단지 시퀀스 코드 또는 단지명
 * @param lawdCd - 법정동 코드 앞 5자리 (시군구 코드)
 * @returns 전세가율(%), 전세 중위가, 매매 중위가 — 계산 불가 시 null
 */
export async function getJeonseRate(
  aptCode: string,
  lawdCd: string,
): Promise<{
  jeonseRate: number | null;
  jeonsePrice: number | null;
  tradePrice: number | null;
}> {
  const cacheKey = `jeonse-rate:${aptCode}:${lawdCd}`;

  // 캐시 확인 (5분 TTL)
  const cached = cacheService.get<{
    jeonseRate: number | null;
    jeonsePrice: number | null;
    tradePrice: number | null;
  }>(cacheKey);
  if (cached) {
    console.log(`[Molit] 전세가율 캐시 히트: ${cacheKey}`);
    return cached;
  }

  const apiKey = process.env.MOLIT_API_KEY;
  if (!isRealApiKey(apiKey)) {
    console.warn('[Molit] getJeonseRate: MOLIT_API_KEY 없음 → null 반환');
    return { jeonseRate: null, jeonsePrice: null, tradePrice: null };
  }

  // 최근 6개월 YYYYMM 목록 생성
  const now = new Date();
  const recentMonths: string[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    recentMonths.push(
      `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`,
    );
  }

  // ---- 전세 데이터 수집 ----
  const allJeonseDeposits: number[] = [];
  let aptNameFromApi: string | null = null; // API에서 확인한 단지명

  for (const ym of recentMonths) {
    try {
      const response = await axios.get<string>(JEONSE_API_URL, {
        params: {
          serviceKey: apiKey,
          LAWD_CD: lawdCd,
          DEAL_YMD: ym,
          pageNo: '1',
          numOfRows: '100',
        },
        timeout: API_TIMEOUT,
        responseType: 'text',
      });

      const parsed = (await parseStringPromise(response.data)) as MolitApiResponse;
      const body = parsed.response?.body?.[0];
      const rawItems: JeonseItem[] = body?.items?.[0]?.item ?? [];

      // aptCode(aptSeq) 또는 단지명 유사도로 해당 단지 필터링
      const matched = rawItems.filter((item) => {
        const seq = item.aptSeq?.[0]?.trim() ?? '';
        const nm = item.aptNm?.[0]?.trim() ?? '';
        if (seq && seq === aptCode) return true;
        return calcNameSimilarity(aptCode, nm) >= 0.7;
      });

      matched.forEach((item) => {
        const raw = item.deposit?.[0]?.replace(/,/g, '').trim() ?? '0';
        const deposit = parseInt(raw, 10);
        if (deposit > 0) {
          allJeonseDeposits.push(deposit);
          // 단지명 기록 (첫 번째 매칭)
          if (!aptNameFromApi) {
            aptNameFromApi = item.aptNm?.[0]?.trim() ?? null;
          }
        }
      });

      console.log(
        `[Molit] 전세 조회 ${ym}: ${rawItems.length}건 중 매칭 ${matched.length}건`,
      );

      // 충분한 데이터 수집 시 중단 (10건 이상)
      if (allJeonseDeposits.length >= 10) break;
    } catch (err) {
      console.warn(`[Molit] 전세 API 호출 실패 (${ym}):`, err);
      // 개별 월 실패는 무시하고 다음 월 시도
    }
  }

  if (allJeonseDeposits.length === 0) {
    console.warn(
      `[Molit] 전세 데이터 없음: aptCode=${aptCode}, lawdCd=${lawdCd} (해외 IP 차단 가능성)`,
    );
    const result = { jeonseRate: null, jeonsePrice: null, tradePrice: null };
    cacheService.set(cacheKey, result, 300); // 5분 캐시 (재시도 방지)
    return result;
  }

  // ---- 매매 데이터 수집 ----
  const allTradePrices: number[] = [];

  for (const ym of recentMonths) {
    try {
      const { items } = await fetchMolitApi(lawdCd, ym, 1, 100);

      // aptCode(aptSeq) 또는 단지명으로 필터링
      const targetName = aptNameFromApi ?? aptCode;
      const matched = items.filter((item) => {
        if (item.aptCode && item.aptCode === aptCode) return true;
        return calcNameSimilarity(targetName, item.apartmentName) >= 0.7;
      });

      matched.forEach((item) => {
        if (item.price > 0) allTradePrices.push(item.price);
      });

      console.log(`[Molit] 매매 조회 ${ym}: 매칭 ${matched.length}건`);

      if (allTradePrices.length >= 10) break;
    } catch (err) {
      console.warn(`[Molit] 매매 API 호출 실패 (${ym}):`, err);
    }
  }

  if (allTradePrices.length === 0) {
    console.warn(
      `[Molit] 매매 데이터 없음: aptCode=${aptCode}, lawdCd=${lawdCd}`,
    );
    const result = { jeonseRate: null, jeonsePrice: null, tradePrice: null };
    cacheService.set(cacheKey, result, 300);
    return result;
  }

  // ---- 전세가율 계산 ----
  const jeonseMedian = Math.round(calcMedian(allJeonseDeposits));
  const tradeMedian = Math.round(calcMedian(allTradePrices));

  if (tradeMedian === 0) {
    const result = { jeonseRate: null, jeonsePrice: jeonseMedian, tradePrice: null };
    cacheService.set(cacheKey, result, 300);
    return result;
  }

  // 소수점 1자리 반올림
  const jeonseRate = Math.round((jeonseMedian / tradeMedian) * 1000) / 10;

  console.log(
    `[Molit] 전세가율 계산 완료: aptCode=${aptCode}, 전세=${jeonseMedian}만원, 매매=${tradeMedian}만원, 전세가율=${jeonseRate}%`,
  );

  const result = {
    jeonseRate,
    jeonsePrice: jeonseMedian,
    tradePrice: tradeMedian,
  };

  // 5분 캐시
  cacheService.set(cacheKey, result, 300);
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

// ============================================================
// [P1-01] 주변 단지 좌표 기반 검색
// ============================================================

/**
 * Haversine 공식으로 두 좌표 간 직선 거리를 미터 단위로 계산합니다.
 */
function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // 지구 반경 (미터)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * 기준 좌표에서 반경 내 아파트 단지를 최대 10개 반환합니다.
 * Mock 모드: APT_BASE_DATA 기반 Haversine 거리 필터링
 *
 * @param lat     기준 위도
 * @param lng     기준 경도
 * @param radius  검색 반경 (미터)
 */
export async function getNearbyApartments(
  lat: number,
  lng: number,
  radius: number,
): Promise<HotApartment[]> {
  const cacheKey = `nearby:${lat.toFixed(4)}:${lng.toFixed(4)}:${radius}`;
  const cached = cacheService.get<HotApartment[]>(cacheKey);
  if (cached) {
    console.log(`[Molit] 주변 단지 캐시 히트: lat=${lat}, lng=${lng}, radius=${radius}`);
    return cached;
  }

  // APT_BASE_DATA에서 반경 내 단지 필터링 후 거리 오름차순 정렬, 최대 10개
  const nearby = APT_BASE_DATA
    .map((apt) => ({
      apt,
      distance: calcDistance(lat, lng, apt.lat, apt.lng),
    }))
    .filter(({ distance }) => distance <= radius)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 10)
    .map(({ apt }, idx) => ({
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

  console.log(`[Molit] 주변 단지 검색: lat=${lat}, lng=${lng}, radius=${radius} → ${nearby.length}건`);

  // 캐시 저장 (30초)
  cacheService.set(cacheKey, nearby, 30);

  return nearby;
}

// ============================================================
// 지도 마커용 단지별 최근 거래가 요약 Mock 데이터
// 실 API 키 없을 때 또는 조회 결과 0건일 때 fallback으로 사용
// ============================================================
const MAP_PRICES_MOCK: ApartmentPrice[] = [
  { aptName: '래미안 원베일리',      recentPrice: 280000, dealDate: '2025-02-15', floor: 12, area: 84.9 },
  { aptName: '아크로리버파크',        recentPrice: 310000, dealDate: '2025-02-10', floor: 20, area: 84.9 },
  { aptName: '헬리오시티',           recentPrice: 175000, dealDate: '2025-02-20', floor: 8,  area: 84.9 },
  { aptName: '잠실엘스',             recentPrice: 195000, dealDate: '2025-02-18', floor: 15, area: 84.9 },
  { aptName: '디에이치아너힐즈',      recentPrice: 235000, dealDate: '2025-02-05', floor: 10, area: 84.9 },
  { aptName: '반포자이',             recentPrice: 260000, dealDate: '2025-02-12', floor: 7,  area: 84.9 },
  { aptName: '도곡렉슬',             recentPrice: 210000, dealDate: '2025-02-08', floor: 18, area: 84.9 },
  { aptName: '타워팰리스',           recentPrice: 190000, dealDate: '2025-02-22', floor: 35, area: 84.9 },
  { aptName: '은마아파트',            recentPrice: 160000, dealDate: '2025-02-14', floor: 5,  area: 76.8 },
  { aptName: '마포래미안푸르지오',    recentPrice: 155000, dealDate: '2025-02-17', floor: 9,  area: 84.9 },
  { aptName: '성수동 트리마제',       recentPrice: 245000, dealDate: '2025-02-03', floor: 22, area: 84.9 },
  { aptName: '올림픽파크 포레온',     recentPrice: 168000, dealDate: '2025-02-25', floor: 11, area: 84.9 },
];

/**
 * 지도 마커용 단지별 최근 거래가 요약을 조회합니다.
 *
 * - 동일 lawdCd + 동일 아파트명 중 가장 최근 거래 1건만 반환합니다.
 * - dealYmd 미지정 시 현재 달부터 최대 3개월 전까지 자동 조회합니다.
 * - 실 API 키 없거나 결과 0건 시 Mock fallback을 반환합니다.
 * - 캐시 TTL: 1시간
 *
 * @param lawdCd  법정동 코드 5자리
 * @param year    조회 년도 (미지정 시 현재 년도)
 * @param month   조회 월 (미지정 시 현재 월부터 3개월 전까지 순차 시도)
 */
export async function getMapPrices(
  lawdCd: string,
  year?: number,
  month?: number,
): Promise<{ data: ApartmentPrice[]; cached: boolean }> {
  const cacheKey = `map-prices:${lawdCd}:${year ?? 'auto'}:${month ?? 'auto'}`;

  const cachedResult = cacheService.get<ApartmentPrice[]>(cacheKey);
  if (cachedResult) {
    console.log(`[Molit] map-prices 캐시 히트: ${cacheKey}`);
    return { data: cachedResult, cached: true };
  }

  // 실 API 키 없으면 즉시 Mock 반환
  if (!isRealApiKey(process.env.MOLIT_API_KEY)) {
    console.warn('[Molit] map-prices: API 키 없음 → Mock fallback 반환');
    cacheService.set(cacheKey, MAP_PRICES_MOCK, CACHE_TTL.MAP_PRICES);
    return { data: MAP_PRICES_MOCK, cached: false };
  }

  // 조회할 년월 목록 결정
  // year/month 지정 시 해당 월만, 미지정 시 현재 달 포함 최근 3개월
  const now = new Date();
  let yearMonths: string[];

  if (year !== undefined && month !== undefined) {
    yearMonths = [`${year}${String(month).padStart(2, '0')}`];
  } else {
    yearMonths = [0, 1, 2].map((offset) => {
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
  }

  // 월별 병렬 조회 (최대 1000건/월)
  const allTrades: ApartmentTrade[] = [];

  const results = await Promise.allSettled(
    yearMonths.map((ym) => fetchMolitApi(lawdCd, ym, 1, 1000)),
  );

  results.forEach((result, idx) => {
    if (result.status === 'fulfilled') {
      allTrades.push(...result.value.items);
    } else {
      console.warn(`[Molit] map-prices ${yearMonths[idx]} 조회 실패:`, result.reason);
    }
  });

  // 결과 없으면 Mock fallback
  if (allTrades.length === 0) {
    console.warn(`[Molit] map-prices: 실 데이터 0건 → Mock fallback (lawdCd=${lawdCd})`);
    cacheService.set(cacheKey, MAP_PRICES_MOCK, CACHE_TTL.MAP_PRICES);
    return { data: MAP_PRICES_MOCK, cached: false };
  }

  // 아파트명별로 그룹핑해 가장 최근 거래 1건만 추출
  const latestByName = new Map<string, ApartmentTrade>();

  for (const trade of allTrades) {
    const name = trade.apartmentName.trim();
    const existing = latestByName.get(name);
    if (!existing || trade.dealDate > existing.dealDate) {
      latestByName.set(name, trade);
    }
  }

  const data: ApartmentPrice[] = Array.from(latestByName.values()).map((trade) => ({
    aptName:     trade.apartmentName.trim(),
    recentPrice: trade.price,
    dealDate:    trade.dealDate,
    floor:       trade.floor,
    area:        trade.area,
  }));

  // 거래일 내림차순 정렬 (최신 거래 먼저)
  data.sort((a, b) => b.dealDate.localeCompare(a.dealDate));

  console.log(`[Molit] map-prices 조회 완료: lawdCd=${lawdCd}, 단지수=${data.length}건`);
  cacheService.set(cacheKey, data, CACHE_TTL.MAP_PRICES);

  return { data, cached: false };
}

// ============================================================
// 신고가 경신 단지 API — getRecordHighApartments
// ============================================================

/** 신고가 경신 단지 응답 항목 */
export interface RecordHighItem {
  aptName: string;
  location: string;
  area: number;
  recentPrice: number;
  previousPrice: number;
  priceChangeRate: number;
  dealDate: string;
  lawdCd: string;
}

/** 수도권 주요 lawdCd 목록 */
const METROPOLITAN_LAWD_CODES = [
  '11110', '11140', '11170', '11200', '11215', '11230', '11260', '11290',
  '11305', '11320', '11350', '11380', '11410', '11440', '11470', '11500',
  '11530', '11545', '11560', '11590', '11620', '11650', '11680', '11710',
  '41135', '41171', '41281', '41461', '41463',
];

/** 전국 추가 주요 lawdCd 목록 (수도권 외) */
const NATIONWIDE_EXTRA_LAWD_CODES = [
  '26110', '26140', '26170', '26200', '26230', '26260', '26290', '26320',
  '26350', '26380', '26410', '26440', '26470', '26500', '26530',
  '27110', '27140', '27170', '27200', '27230', '27260', '27290',
  '28110', '28140', '28170', '28200', '28237', '28245', '28260', '28710',
];

/** Mock 데이터 (실 API 실패 시 fallback) */
const RECORD_HIGH_MOCK: RecordHighItem[] = [
  { aptName: '래미안원베일리', location: '서울 서초구', area: 84, recentPrice: 150000, previousPrice: 138000, priceChangeRate: 8.7, dealDate: '2026-03', lawdCd: '11650' },
  { aptName: '아크로리버파크', location: '서울 서초구', area: 59, recentPrice: 135000, previousPrice: 128000, priceChangeRate: 5.5, dealDate: '2026-03', lawdCd: '11650' },
  { aptName: '헬리오시티', location: '서울 송파구', area: 84, recentPrice: 105000, previousPrice: 98000, priceChangeRate: 7.1, dealDate: '2026-03', lawdCd: '11710' },
  { aptName: '디에이치자이개포', location: '서울 강남구', area: 84, recentPrice: 145000, previousPrice: 140000, priceChangeRate: 3.6, dealDate: '2026-03', lawdCd: '11680' },
  { aptName: '레미안퍼스티지', location: '서울 서초구', area: 115, recentPrice: 180000, previousPrice: 170000, priceChangeRate: 5.9, dealDate: '2026-03', lawdCd: '11650' },
];

/** lawdCd → 지역명 매핑 (신고가 응답 location 필드용) */
const LAWD_CD_TO_LOCATION: Record<string, string> = {
  '11110': '서울 종로구', '11140': '서울 중구', '11170': '서울 용산구',
  '11200': '서울 성동구', '11215': '서울 광진구', '11230': '서울 동대문구',
  '11260': '서울 중랑구', '11290': '서울 성북구', '11305': '서울 강북구',
  '11320': '서울 도봉구', '11350': '서울 노원구', '11380': '서울 은평구',
  '11410': '서울 서대문구', '11440': '서울 마포구', '11470': '서울 양천구',
  '11500': '서울 강서구', '11530': '서울 구로구', '11545': '서울 금천구',
  '11560': '서울 영등포구', '11590': '서울 동작구', '11620': '서울 관악구',
  '11650': '서울 서초구', '11680': '서울 강남구', '11710': '서울 송파구',
  '41135': '경기 성남시 분당구', '41171': '경기 수원시 영통구',
  '41281': '경기 용인시 수지구', '41461': '경기 화성시',
  '41463': '경기 화성시 동탄',
};

/**
 * 수도권/전국 신고가 경신 단지를 조회합니다.
 *
 * 로직:
 * 1. 이번 달(baseMonth)과 이전 달(prevMonth) 실거래가를 병렬 조회
 * 2. 단지명+면적 기준으로 그룹화
 * 3. 이번 달 최고가 > 이전 달 최고가인 항목 = 신고가 경신으로 판단
 * 4. priceChangeRate 내림차순 정렬 후 limit 건 반환
 * 5. 실 데이터 없으면 Mock fallback (ADR-006 준수)
 *
 * @param region  '수도권' | '전국' (기본: '수도권')
 * @param limit   반환 건수 (기본: 5, 최대: 10)
 */
export async function getRecordHighApartments(
  region: '수도권' | '전국' = '수도권',
  limit: number = 5,
): Promise<{ data: RecordHighItem[]; meta: { baseMonth: string; region: string } }> {
  const now = new Date();
  const baseYear = now.getFullYear();
  const baseMonth = now.getMonth() + 1; // 1-based

  const baseYm = `${baseYear}${String(baseMonth).padStart(2, '0')}`;
  const prevDate = new Date(baseYear, baseMonth - 2, 1); // 이전 달
  const prevYm = `${prevDate.getFullYear()}${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  const baseMonthStr = `${baseYear}-${String(baseMonth).padStart(2, '0')}`;

  const cacheKey = `record-highs:${region}:${baseYm}:${limit}`;
  const cached = cacheService.get<RecordHighItem[]>(cacheKey);
  if (cached) {
    console.log(`[Molit] record-highs 캐시 히트: ${cacheKey}`);
    return { data: cached, meta: { baseMonth: baseMonthStr, region } };
  }

  // 실 API 키 없으면 Mock 반환
  if (!isRealApiKey(process.env.MOLIT_API_KEY)) {
    console.warn('[Molit] record-highs: API 키 없음 → Mock fallback 반환');
    const mockSlice = RECORD_HIGH_MOCK.slice(0, limit);
    cacheService.set(cacheKey, mockSlice, CACHE_TTL.MAP_PRICES);
    return { data: mockSlice, meta: { baseMonth: baseMonthStr, region } };
  }

  const lawdCodes = region === '전국'
    ? [...METROPOLITAN_LAWD_CODES, ...NATIONWIDE_EXTRA_LAWD_CODES]
    : METROPOLITAN_LAWD_CODES;

  try {
    // 이번 달 + 이전 달 데이터를 모든 lawdCd에 대해 병렬 조회
    const fetchAll = async (ym: string): Promise<ApartmentTrade[]> => {
      const results = await Promise.allSettled(
        lawdCodes.map((cd) => fetchMolitApi(cd, ym, 1, 1000)),
      );
      const trades: ApartmentTrade[] = [];
      results.forEach((r) => {
        if (r.status === 'fulfilled') trades.push(...r.value.items);
      });
      return trades;
    };

    const [baseTrades, prevTrades] = await Promise.all([
      fetchAll(baseYm),
      fetchAll(prevYm),
    ]);

    // 실 데이터 없으면 Mock fallback
    if (baseTrades.length === 0) {
      console.warn('[Molit] record-highs: 이번 달 실 데이터 0건 → Mock fallback');
      const mockSlice = RECORD_HIGH_MOCK.slice(0, limit);
      cacheService.set(cacheKey, mockSlice, CACHE_TTL.MAP_PRICES);
      return { data: mockSlice, meta: { baseMonth: baseMonthStr, region } };
    }

    // 단지명 + 면적(반올림) 기준 키 생성 헬퍼
    const makeKey = (aptName: string, area: number) =>
      `${aptName.trim()}::${Math.round(area)}`;

    // 이번 달: 단지+면적 기준 최고가 추출
    const baseMaxMap = new Map<string, { price: number; trade: ApartmentTrade }>();
    for (const t of baseTrades) {
      const key = makeKey(t.apartmentName, t.area);
      const existing = baseMaxMap.get(key);
      if (!existing || t.price > existing.price) {
        baseMaxMap.set(key, { price: t.price, trade: t });
      }
    }

    // 이전 달: 단지+면적 기준 최고가 추출
    const prevMaxMap = new Map<string, number>();
    for (const t of prevTrades) {
      const key = makeKey(t.apartmentName, t.area);
      const existing = prevMaxMap.get(key) ?? 0;
      if (t.price > existing) prevMaxMap.set(key, t.price);
    }

    // 신고가 경신 판별: 이번 달 최고가 > 이전 달 최고가
    const recordHighs: RecordHighItem[] = [];

    for (const [key, { price: recentPrice, trade }] of baseMaxMap.entries()) {
      const previousPrice = prevMaxMap.get(key);
      if (!previousPrice || recentPrice <= previousPrice) continue;

      const changeRate = Math.round(((recentPrice - previousPrice) / previousPrice) * 1000) / 10;

      recordHighs.push({
        aptName: trade.apartmentName.trim(),
        location: LAWD_CD_TO_LOCATION[trade.lawdCd] ?? trade.lawdNm,
        area: Math.round(trade.area),
        recentPrice,
        previousPrice,
        priceChangeRate: changeRate,
        dealDate: baseMonthStr,
        lawdCd: trade.lawdCd,
      });
    }

    // priceChangeRate 내림차순 정렬
    recordHighs.sort((a, b) => b.priceChangeRate - a.priceChangeRate);

    const result = recordHighs.slice(0, limit);

    // 신고가 경신 단지가 없으면 Mock fallback
    if (result.length === 0) {
      console.warn('[Molit] record-highs: 신고가 경신 단지 없음 → Mock fallback');
      const mockSlice = RECORD_HIGH_MOCK.slice(0, limit);
      cacheService.set(cacheKey, mockSlice, CACHE_TTL.MAP_PRICES);
      return { data: mockSlice, meta: { baseMonth: baseMonthStr, region } };
    }

    console.log(`[Molit] record-highs 조회 완료: region=${region}, 경신 단지=${result.length}건`);
    cacheService.set(cacheKey, result, CACHE_TTL.MAP_PRICES);
    return { data: result, meta: { baseMonth: baseMonthStr, region } };

  } catch (err) {
    console.error('[Molit] record-highs 조회 실패 → Mock fallback:', err);
    const mockSlice = RECORD_HIGH_MOCK.slice(0, limit);
    cacheService.set(cacheKey, mockSlice, CACHE_TTL.MAP_PRICES);
    return { data: mockSlice, meta: { baseMonth: baseMonthStr, region } };
  }
}
