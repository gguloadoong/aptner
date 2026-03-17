// ============================================================
// 시군구 코드 + 바운딩박스 상수
// 법정동 코드 5자리 기준 (시군구 단위)
// 호갱노노/아실처럼 뷰포트 내 겹치는 시군구 코드를 추출해
// 국토부 API를 병렬 조회하는 데 사용한다.
// ============================================================

export interface SigunguInfo {
  code: string;   // 5자리 법정동 코드
  name: string;   // 시도명 + 시군구명
  swLat: number;  // 남서 위도
  swLng: number;  // 남서 경도
  neLat: number;  // 북동 위도
  neLng: number;  // 북동 경도
}

// 서울 25개 구 + 경기 주요 시군구 바운딩박스 테이블
export const SIGUNGU_TABLE: SigunguInfo[] = [
  // ---- 서울 25개 구 ----
  { code: '11110', name: '서울 종로구',      swLat: 37.548, swLng: 126.956, neLat: 37.608, neLng: 127.021 },
  { code: '11140', name: '서울 중구',        swLat: 37.548, swLng: 126.966, neLat: 37.568, neLng: 127.004 },
  { code: '11170', name: '서울 용산구',      swLat: 37.512, swLng: 126.960, neLat: 37.555, neLng: 127.004 },
  { code: '11200', name: '서울 성동구',      swLat: 37.540, swLng: 126.996, neLat: 37.570, neLng: 127.066 },
  { code: '11215', name: '서울 광진구',      swLat: 37.528, swLng: 127.047, neLat: 37.560, neLng: 127.105 },
  { code: '11230', name: '서울 동대문구',    swLat: 37.555, swLng: 127.019, neLat: 37.600, neLng: 127.073 },
  { code: '11260', name: '서울 중랑구',      swLat: 37.578, swLng: 127.067, neLat: 37.622, neLng: 127.111 },
  { code: '11290', name: '서울 성북구',      swLat: 37.580, swLng: 126.993, neLat: 37.636, neLng: 127.059 },
  { code: '11305', name: '서울 강북구',      swLat: 37.619, swLng: 127.003, neLat: 37.659, neLng: 127.052 },
  { code: '11320', name: '서울 도봉구',      swLat: 37.636, swLng: 127.008, neLat: 37.709, neLng: 127.066 },
  { code: '11350', name: '서울 노원구',      swLat: 37.619, swLng: 127.052, neLat: 37.690, neLng: 127.118 },
  { code: '11380', name: '서울 은평구',      swLat: 37.600, swLng: 126.893, neLat: 37.660, neLng: 126.969 },
  { code: '11410', name: '서울 서대문구',    swLat: 37.556, swLng: 126.916, neLat: 37.600, neLng: 126.973 },
  { code: '11440', name: '서울 마포구',      swLat: 37.535, swLng: 126.895, neLat: 37.580, neLng: 126.962 },
  { code: '11470', name: '서울 양천구',      swLat: 37.510, swLng: 126.851, neLat: 37.556, neLng: 126.912 },
  { code: '11500', name: '서울 강서구',      swLat: 37.530, swLng: 126.793, neLat: 37.590, neLng: 126.882 },
  { code: '11530', name: '서울 구로구',      swLat: 37.487, swLng: 126.828, neLat: 37.540, neLng: 126.904 },
  { code: '11545', name: '서울 금천구',      swLat: 37.440, swLng: 126.882, neLat: 37.490, neLng: 126.920 },
  { code: '11560', name: '서울 영등포구',    swLat: 37.497, swLng: 126.883, neLat: 37.544, neLng: 126.951 },
  { code: '11590', name: '서울 동작구',      swLat: 37.483, swLng: 126.916, neLat: 37.524, neLng: 126.982 },
  { code: '11620', name: '서울 관악구',      swLat: 37.456, swLng: 126.917, neLat: 37.499, neLng: 126.993 },
  { code: '11650', name: '서울 서초구',      swLat: 37.464, swLng: 126.981, neLat: 37.517, neLng: 127.075 },
  { code: '11680', name: '서울 강남구',      swLat: 37.494, swLng: 127.022, neLat: 37.545, neLng: 127.104 },
  { code: '11710', name: '서울 송파구',      swLat: 37.483, swLng: 127.082, neLat: 37.545, neLng: 127.182 },
  { code: '11740', name: '서울 강동구',      swLat: 37.534, swLng: 127.100, neLat: 37.584, neLng: 127.188 },

  // ---- 경기 주요 시군구 ----
  { code: '41110', name: '경기 수원 장안구',  swLat: 37.288, swLng: 126.984, neLat: 37.318, neLng: 127.038 },
  { code: '41113', name: '경기 수원 권선구',  swLat: 37.243, swLng: 126.981, neLat: 37.290, neLng: 127.028 },
  { code: '41115', name: '경기 수원 팔달구',  swLat: 37.275, swLng: 127.014, neLat: 37.299, neLng: 127.059 },
  { code: '41117', name: '경기 수원 영통구',  swLat: 37.252, swLng: 127.035, neLat: 37.300, neLng: 127.107 },
  { code: '41131', name: '경기 성남 수정구',  swLat: 37.419, swLng: 127.120, neLat: 37.470, neLng: 127.171 },
  { code: '41133', name: '경기 성남 중원구',  swLat: 37.434, swLng: 127.137, neLat: 37.463, neLng: 127.189 },
  { code: '41135', name: '경기 성남 분당구',  swLat: 37.345, swLng: 127.093, neLat: 37.425, neLng: 127.182 },
  { code: '41150', name: '경기 의정부',       swLat: 37.723, swLng: 127.016, neLat: 37.783, neLng: 127.099 },
  { code: '41171', name: '경기 안양 만안구',  swLat: 37.379, swLng: 126.904, neLat: 37.420, neLng: 126.960 },
  { code: '41173', name: '경기 안양 동안구',  swLat: 37.384, swLng: 126.929, neLat: 37.426, neLng: 126.993 },
  { code: '41190', name: '경기 부천',         swLat: 37.481, swLng: 126.764, neLat: 37.531, neLng: 126.843 },
  { code: '41210', name: '경기 광명',         swLat: 37.448, swLng: 126.845, neLat: 37.493, neLng: 126.897 },
  { code: '41250', name: '경기 평택',         swLat: 36.953, swLng: 126.960, neLat: 37.053, neLng: 127.139 },
  { code: '41271', name: '경기 안산 상록구',  swLat: 37.278, swLng: 126.818, neLat: 37.322, neLng: 126.897 },
  { code: '41273', name: '경기 안산 단원구',  swLat: 37.298, swLng: 126.780, neLat: 37.365, neLng: 126.875 },
  { code: '41281', name: '경기 고양 덕양구',  swLat: 37.625, swLng: 126.810, neLat: 37.720, neLng: 126.931 },
  { code: '41285', name: '경기 고양 일산동구', swLat: 37.650, swLng: 126.767, neLat: 37.698, neLng: 126.832 },
  { code: '41287', name: '경기 고양 일산서구', swLat: 37.660, swLng: 126.715, neLat: 37.709, neLng: 126.779 },
  { code: '41310', name: '경기 과천',         swLat: 37.411, swLng: 126.970, neLat: 37.457, neLng: 127.009 },
  { code: '41360', name: '경기 용인 처인구',  swLat: 37.193, swLng: 127.095, neLat: 37.354, neLng: 127.316 },
  { code: '41363', name: '경기 용인 기흥구',  swLat: 37.264, swLng: 127.049, neLat: 37.321, neLng: 127.153 },
  { code: '41365', name: '경기 용인 수지구',  swLat: 37.310, swLng: 127.055, neLat: 37.362, neLng: 127.127 },
  { code: '41390', name: '경기 파주',         swLat: 37.695, swLng: 126.703, neLat: 37.897, neLng: 126.874 },
  { code: '41410', name: '경기 이천',         swLat: 37.219, swLng: 127.397, neLat: 37.350, neLng: 127.554 },
  { code: '41430', name: '경기 안성',         swLat: 36.928, swLng: 127.198, neLat: 37.096, neLng: 127.422 },
  { code: '41450', name: '경기 김포',         swLat: 37.566, swLng: 126.568, neLat: 37.730, neLng: 126.769 },
  { code: '41460', name: '경기 화성',         swLat: 36.982, swLng: 126.692, neLat: 37.258, neLng: 127.063 },
  { code: '41480', name: '경기 광주',         swLat: 37.381, swLng: 127.215, neLat: 37.509, neLng: 127.387 },
  { code: '41500', name: '경기 양주',         swLat: 37.730, swLng: 126.957, neLat: 37.862, neLng: 127.146 },
  { code: '41550', name: '경기 포천',         swLat: 37.814, swLng: 127.065, neLat: 38.098, neLng: 127.406 },
  { code: '41570', name: '경기 여주',         swLat: 37.282, swLng: 127.558, neLat: 37.401, neLng: 127.772 },
  { code: '41590', name: '경기 연천',         swLat: 37.972, swLng: 127.000, neLat: 38.209, neLng: 127.267 },
  { code: '41610', name: '경기 가평',         swLat: 37.749, swLng: 127.380, neLat: 37.976, neLng: 127.712 },
  { code: '41630', name: '경기 양평',         swLat: 37.355, swLng: 127.422, neLat: 37.659, neLng: 127.736 },
  { code: '41820', name: '경기 하남',         swLat: 37.514, swLng: 127.171, neLat: 37.578, neLng: 127.253 },
  { code: '41830', name: '경기 오산',         swLat: 37.130, swLng: 126.988, neLat: 37.189, neLng: 127.078 },
  { code: '41835', name: '경기 시흥',         swLat: 37.308, swLng: 126.742, neLat: 37.424, neLng: 126.849 },
  { code: '41840', name: '경기 군포',         swLat: 37.344, swLng: 126.913, neLat: 37.386, neLng: 126.960 },
  { code: '41845', name: '경기 의왕',         swLat: 37.337, swLng: 126.952, neLat: 37.389, neLng: 127.011 },
  { code: '41860', name: '경기 구리',         swLat: 37.569, swLng: 127.124, neLat: 37.607, neLng: 127.177 },
  { code: '41870', name: '경기 남양주',       swLat: 37.561, swLng: 127.159, neLat: 37.728, neLng: 127.482 },
];

/**
 * 주어진 뷰포트 바운딩박스와 겹치는 시군구 코드 목록을 반환합니다.
 * AABB 교차 판별: 두 직사각형이 겹치려면 한쪽 끝이 반드시 다른 쪽 안에 있어야 함.
 *
 * @param swLat - 남서 위도
 * @param swLng - 남서 경도
 * @param neLat - 북동 위도
 * @param neLng - 북동 경도
 * @returns 겹치는 시군구 5자리 법정동 코드 배열
 */
export function getOverlappingSigunguCodes(
  swLat: number,
  swLng: number,
  neLat: number,
  neLng: number,
): string[] {
  return SIGUNGU_TABLE.filter(
    (sg) =>
      sg.swLat < neLat &&
      sg.neLat > swLat &&
      sg.swLng < neLng &&
      sg.neLng > swLng,
  ).map((sg) => sg.code);
}
