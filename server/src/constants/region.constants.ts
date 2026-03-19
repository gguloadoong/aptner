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

  // ---- 부산광역시 16개 구군 ----
  { code: '26110', name: '부산 중구',         swLat: 35.090, swLng: 129.016, neLat: 35.112, neLng: 129.046 },
  { code: '26140', name: '부산 서구',         swLat: 35.086, swLng: 128.990, neLat: 35.115, neLng: 129.022 },
  { code: '26170', name: '부산 동구',         swLat: 35.113, swLng: 129.031, neLat: 35.146, neLng: 129.075 },
  { code: '26200', name: '부산 영도구',       swLat: 35.062, swLng: 128.994, neLat: 35.099, neLng: 129.086 },
  { code: '26230', name: '부산 부산진구',     swLat: 35.143, swLng: 129.020, neLat: 35.183, neLng: 129.075 },
  { code: '26260', name: '부산 동래구',       swLat: 35.181, swLng: 129.055, neLat: 35.225, neLng: 129.097 },
  { code: '26290', name: '부산 남구',         swLat: 35.118, swLng: 129.064, neLat: 35.157, neLng: 129.117 },
  { code: '26320', name: '부산 북구',         swLat: 35.179, swLng: 128.975, neLat: 35.241, neLng: 129.033 },
  { code: '26350', name: '부산 해운대구',     swLat: 35.142, swLng: 129.097, neLat: 35.212, neLng: 129.219 },
  { code: '26380', name: '부산 사하구',       swLat: 35.034, swLng: 128.944, neLat: 35.110, neLng: 129.005 },
  { code: '26410', name: '부산 금정구',       swLat: 35.218, swLng: 129.058, neLat: 35.294, neLng: 129.116 },
  { code: '26440', name: '부산 강서구',       swLat: 35.067, swLng: 128.821, neLat: 35.212, neLng: 128.994 },
  { code: '26470', name: '부산 연제구',       swLat: 35.170, swLng: 129.054, neLat: 35.202, neLng: 129.088 },
  { code: '26500', name: '부산 수영구',       swLat: 35.138, swLng: 129.095, neLat: 35.170, neLng: 129.140 },
  { code: '26530', name: '부산 사상구',       swLat: 35.138, swLng: 128.958, neLat: 35.195, neLng: 129.006 },
  { code: '26710', name: '부산 기장군',       swLat: 35.166, swLng: 129.126, neLat: 35.352, neLng: 129.310 },

  // ---- 대구광역시 8개 구군 ----
  { code: '27110', name: '대구 중구',         swLat: 35.855, swLng: 128.580, neLat: 35.882, neLng: 128.616 },
  { code: '27140', name: '대구 동구',         swLat: 35.854, swLng: 128.614, neLat: 35.987, neLng: 128.769 },
  { code: '27170', name: '대구 서구',         swLat: 35.849, swLng: 128.539, neLat: 35.894, neLng: 128.585 },
  { code: '27200', name: '대구 남구',         swLat: 35.833, swLng: 128.573, neLat: 35.860, neLng: 128.618 },
  { code: '27230', name: '대구 북구',         swLat: 35.876, swLng: 128.561, neLat: 35.960, neLng: 128.638 },
  { code: '27260', name: '대구 수성구',       swLat: 35.814, swLng: 128.611, neLat: 35.878, neLng: 128.718 },
  { code: '27290', name: '대구 달서구',       swLat: 35.810, swLng: 128.514, neLat: 35.880, neLng: 128.591 },
  { code: '27710', name: '대구 달성군',       swLat: 35.671, swLng: 128.369, neLat: 35.875, neLng: 128.548 },

  // ---- 인천광역시 10개 구군 ----
  { code: '28110', name: '인천 중구',         swLat: 37.430, swLng: 126.425, neLat: 37.490, neLng: 126.540 },
  { code: '28140', name: '인천 동구',         swLat: 37.468, swLng: 126.619, neLat: 37.490, neLng: 126.647 },
  { code: '28177', name: '인천 미추홀구',     swLat: 37.440, swLng: 126.635, neLat: 37.476, neLng: 126.682 },
  { code: '28185', name: '인천 연수구',       swLat: 37.395, swLng: 126.640, neLat: 37.449, neLng: 126.716 },
  { code: '28200', name: '인천 남동구',       swLat: 37.420, swLng: 126.696, neLat: 37.479, neLng: 126.759 },
  { code: '28237', name: '인천 부평구',       swLat: 37.477, swLng: 126.699, neLat: 37.527, neLng: 126.762 },
  { code: '28245', name: '인천 계양구',       swLat: 37.527, swLng: 126.707, neLat: 37.568, neLng: 126.773 },
  { code: '28260', name: '인천 서구',         swLat: 37.470, swLng: 126.604, neLat: 37.600, neLng: 126.720 },
  { code: '28710', name: '인천 강화군',       swLat: 37.601, swLng: 126.330, neLat: 37.816, neLng: 126.617 },
  { code: '28720', name: '인천 옹진군',       swLat: 37.004, swLng: 125.708, neLat: 37.587, neLng: 126.539 },

  // ---- 광주광역시 5개 구 ----
  { code: '29110', name: '광주 동구',         swLat: 35.128, swLng: 126.892, neLat: 35.177, neLng: 126.960 },
  { code: '29140', name: '광주 서구',         swLat: 35.122, swLng: 126.840, neLat: 35.172, neLng: 126.900 },
  { code: '29155', name: '광주 남구',         swLat: 35.082, swLng: 126.867, neLat: 35.133, neLng: 126.936 },
  { code: '29170', name: '광주 북구',         swLat: 35.162, swLng: 126.868, neLat: 35.270, neLng: 126.990 },
  { code: '29200', name: '광주 광산구',       swLat: 35.115, swLng: 126.786, neLat: 35.216, neLng: 126.879 },

  // ---- 대전광역시 5개 구 ----
  { code: '30110', name: '대전 동구',         swLat: 36.296, swLng: 127.386, neLat: 36.393, neLng: 127.512 },
  { code: '30140', name: '대전 중구',         swLat: 36.296, swLng: 127.364, neLat: 36.357, neLng: 127.434 },
  { code: '30170', name: '대전 서구',         swLat: 36.296, swLng: 127.310, neLat: 36.395, neLng: 127.412 },
  { code: '30200', name: '대전 유성구',       swLat: 36.322, swLng: 127.265, neLat: 36.449, neLng: 127.406 },
  { code: '30230', name: '대전 대덕구',       swLat: 36.332, swLng: 127.393, neLat: 36.436, neLng: 127.497 },

  // ---- 울산광역시 4개 구 1개 군 ----
  { code: '31110', name: '울산 중구',         swLat: 35.534, swLng: 129.270, neLat: 35.583, neLng: 129.340 },
  { code: '31140', name: '울산 남구',         swLat: 35.495, swLng: 129.290, neLat: 35.551, neLng: 129.385 },
  { code: '31170', name: '울산 동구',         swLat: 35.486, swLng: 129.367, neLat: 35.553, neLng: 129.432 },
  { code: '31200', name: '울산 북구',         swLat: 35.541, swLng: 129.312, neLat: 35.634, neLng: 129.396 },
  { code: '31710', name: '울산 울주군',       swLat: 35.334, swLng: 128.986, neLat: 35.594, neLng: 129.365 },

  // ---- 세종특별자치시 ----
  { code: '36110', name: '세종 세종시',       swLat: 36.419, swLng: 127.198, neLat: 36.659, neLng: 127.398 },

  // ---- 강원특별자치도 ----
  { code: '42110', name: '강원 춘천시',       swLat: 37.741, swLng: 127.570, neLat: 37.942, neLng: 127.880 },
  { code: '42130', name: '강원 원주시',       swLat: 37.228, swLng: 127.782, neLat: 37.455, neLng: 128.027 },
  { code: '42150', name: '강원 강릉시',       swLat: 37.639, swLng: 128.740, neLat: 37.889, neLng: 129.037 },
  { code: '42170', name: '강원 동해시',       swLat: 37.451, swLng: 129.023, neLat: 37.569, neLng: 129.166 },
  { code: '42190', name: '강원 태백시',       swLat: 37.094, swLng: 128.869, neLat: 37.218, neLng: 129.033 },
  { code: '42210', name: '강원 속초시',       swLat: 38.133, swLng: 128.541, neLat: 38.253, neLng: 128.651 },
  { code: '42230', name: '강원 삼척시',       swLat: 37.105, swLng: 128.942, neLat: 37.480, neLng: 129.212 },
  { code: '42720', name: '강원 홍천군',       swLat: 37.519, swLng: 127.656, neLat: 37.882, neLng: 128.312 },
  { code: '42730', name: '강원 횡성군',       swLat: 37.340, swLng: 127.838, neLat: 37.564, neLng: 128.147 },
  { code: '42750', name: '강원 영월군',       swLat: 37.028, swLng: 128.140, neLat: 37.361, neLng: 128.623 },
  { code: '42760', name: '강원 평창군',       swLat: 37.312, swLng: 128.175, neLat: 37.700, neLng: 128.614 },
  { code: '42770', name: '강원 정선군',       swLat: 37.197, swLng: 128.513, neLat: 37.499, neLng: 128.959 },
  { code: '42780', name: '강원 철원군',       swLat: 38.004, swLng: 127.068, neLat: 38.288, neLng: 127.548 },
  { code: '42790', name: '강원 화천군',       swLat: 37.968, swLng: 127.468, neLat: 38.221, neLng: 127.792 },
  { code: '42800', name: '강원 양구군',       swLat: 37.975, swLng: 127.699, neLat: 38.245, neLng: 128.033 },
  { code: '42810', name: '강원 인제군',       swLat: 37.798, swLng: 127.922, neLat: 38.310, neLng: 128.457 },
  { code: '42820', name: '강원 고성군',       swLat: 38.193, swLng: 128.343, neLat: 38.615, neLng: 128.666 }, // neLat 38.615 — 휴전선 접경 (의도적 범위)
  { code: '42830', name: '강원 양양군',       swLat: 37.867, swLng: 128.515, neLat: 38.179, neLng: 128.793 },

  // ---- 충청북도 ----
  { code: '43110', name: '충북 청주 상당구',  swLat: 36.606, swLng: 127.419, neLat: 36.775, neLng: 127.641 },
  { code: '43111', name: '충북 청주 서원구',  swLat: 36.560, swLng: 127.367, neLat: 36.657, neLng: 127.516 },
  { code: '43112', name: '충북 청주 흥덕구',  swLat: 36.598, swLng: 127.319, neLat: 36.715, neLng: 127.449 },
  { code: '43113', name: '충북 청주 청원구',  swLat: 36.660, swLng: 127.421, neLat: 36.798, neLng: 127.553 },
  { code: '43130', name: '충북 충주시',       swLat: 36.856, swLng: 127.836, neLat: 37.111, neLng: 128.169 },
  { code: '43150', name: '충북 제천시',       swLat: 37.005, swLng: 128.048, neLat: 37.226, neLng: 128.371 },
  { code: '43720', name: '충북 보은군',       swLat: 36.428, swLng: 127.560, neLat: 36.696, neLng: 127.810 },
  { code: '43730', name: '충북 옥천군',       swLat: 36.231, swLng: 127.495, neLat: 36.466, neLng: 127.757 },
  { code: '43740', name: '충북 영동군',       swLat: 36.007, swLng: 127.612, neLat: 36.297, neLng: 127.925 },
  { code: '43745', name: '충북 증평군',       swLat: 36.732, swLng: 127.524, neLat: 36.830, neLng: 127.627 },
  { code: '43750', name: '충북 진천군',       swLat: 36.786, swLng: 127.348, neLat: 36.950, neLng: 127.568 },
  { code: '43760', name: '충북 괴산군',       swLat: 36.681, swLng: 127.587, neLat: 36.965, neLng: 127.927 },
  { code: '43770', name: '충북 음성군',       swLat: 36.850, swLng: 127.423, neLat: 37.049, neLng: 127.652 },
  { code: '43800', name: '충북 단양군',       swLat: 36.887, swLng: 128.114, neLat: 37.120, neLng: 128.523 },

  // ---- 충청남도 ----
  { code: '44130', name: '충남 천안 동남구',  swLat: 36.730, swLng: 127.302, neLat: 36.882, neLng: 127.491 },
  { code: '44131', name: '충남 천안 서북구',  swLat: 36.784, swLng: 127.096, neLat: 36.951, neLng: 127.334 },
  { code: '44150', name: '충남 공주시',       swLat: 36.282, swLng: 126.905, neLat: 36.621, neLng: 127.277 },
  { code: '44180', name: '충남 보령시',       swLat: 36.141, swLng: 126.454, neLat: 36.470, neLng: 126.779 },
  { code: '44195', name: '충남 아산시',       swLat: 36.698, swLng: 126.817, neLat: 36.930, neLng: 127.096 },
  { code: '44200', name: '충남 서산시',       swLat: 36.652, swLng: 126.313, neLat: 36.944, neLng: 126.660 },
  { code: '44210', name: '충남 논산시',       swLat: 35.967, swLng: 127.021, neLat: 36.281, neLng: 127.298 },
  { code: '44220', name: '충남 계룡시',       swLat: 36.229, swLng: 127.197, neLat: 36.327, neLng: 127.286 },
  { code: '44230', name: '충남 당진시',       swLat: 36.785, swLng: 126.513, neLat: 37.042, neLng: 126.750 },
  { code: '44710', name: '충남 금산군',       swLat: 35.988, swLng: 127.389, neLat: 36.276, neLng: 127.671 },
  { code: '44760', name: '충남 부여군',       swLat: 36.119, swLng: 126.760, neLat: 36.403, neLng: 127.090 },
  { code: '44770', name: '충남 서천군',       swLat: 35.991, swLng: 126.580, neLat: 36.267, neLng: 126.847 },
  { code: '44790', name: '충남 청양군',       swLat: 36.340, swLng: 126.754, neLat: 36.609, neLng: 127.004 },
  { code: '44800', name: '충남 홍성군',       swLat: 36.390, swLng: 126.484, neLat: 36.705, neLng: 126.776 },
  { code: '44810', name: '충남 예산군',       swLat: 36.500, swLng: 126.681, neLat: 36.794, neLng: 126.966 },
  { code: '44825', name: '충남 태안군',       swLat: 36.532, swLng: 126.109, neLat: 36.902, neLng: 126.552 },

  // ---- 전북특별자치도 ----
  { code: '45110', name: '전북 전주 완산구',  swLat: 35.768, swLng: 127.072, neLat: 35.844, neLng: 127.153 },
  { code: '45111', name: '전북 전주 덕진구',  swLat: 35.820, swLng: 127.083, neLat: 35.905, neLng: 127.195 },
  { code: '45130', name: '전북 군산시',       swLat: 35.869, swLng: 126.498, neLat: 36.046, neLng: 126.810 },
  { code: '45140', name: '전북 익산시',       swLat: 35.882, swLng: 126.872, neLat: 36.093, neLng: 127.073 },
  { code: '45180', name: '전북 정읍시',       swLat: 35.430, swLng: 126.735, neLat: 35.719, neLng: 127.036 },
  { code: '45190', name: '전북 남원시',       swLat: 35.290, swLng: 127.196, neLat: 35.579, neLng: 127.539 },
  { code: '45210', name: '전북 김제시',       swLat: 35.676, swLng: 126.729, neLat: 35.902, neLng: 127.003 },
  { code: '45710', name: '전북 완주군',       swLat: 35.755, swLng: 127.035, neLat: 36.031, neLng: 127.348 },
  { code: '45720', name: '전북 진안군',       swLat: 35.611, swLng: 127.274, neLat: 35.858, neLng: 127.614 },
  { code: '45730', name: '전북 무주군',       swLat: 35.776, swLng: 127.560, neLat: 36.058, neLng: 127.921 },
  { code: '45740', name: '전북 장수군',       swLat: 35.446, swLng: 127.404, neLat: 35.722, neLng: 127.706 },
  { code: '45750', name: '전북 임실군',       swLat: 35.440, swLng: 127.133, neLat: 35.700, neLng: 127.443 },
  { code: '45770', name: '전북 순창군',       swLat: 35.279, swLng: 126.908, neLat: 35.530, neLng: 127.239 },
  { code: '45790', name: '전북 고창군',       swLat: 35.333, swLng: 126.452, neLat: 35.614, neLng: 126.817 },
  { code: '45800', name: '전북 부안군',       swLat: 35.556, swLng: 126.430, neLat: 35.811, neLng: 126.801 },

  // ---- 전라남도 ----
  { code: '46110', name: '전남 목포시',       swLat: 34.742, swLng: 126.349, neLat: 34.845, neLng: 126.449 },
  { code: '46130', name: '전남 여수시',       swLat: 34.575, swLng: 127.542, neLat: 34.832, neLng: 127.896 },
  { code: '46150', name: '전남 순천시',       swLat: 34.801, swLng: 127.330, neLat: 35.024, neLng: 127.640 },
  { code: '46170', name: '전남 나주시',       swLat: 34.928, swLng: 126.662, neLat: 35.157, neLng: 126.974 },
  { code: '46230', name: '전남 광양시',       swLat: 34.823, swLng: 127.537, neLat: 35.082, neLng: 127.790 },
  { code: '46710', name: '전남 담양군',       swLat: 35.156, swLng: 126.841, neLat: 35.430, neLng: 127.103 },
  { code: '46720', name: '전남 곡성군',       swLat: 35.059, swLng: 127.148, neLat: 35.329, neLng: 127.412 },
  { code: '46730', name: '전남 구례군',       swLat: 35.015, swLng: 127.340, neLat: 35.278, neLng: 127.580 },
  { code: '46770', name: '전남 고흥군',       swLat: 34.445, swLng: 127.069, neLat: 34.768, neLng: 127.564 },
  { code: '46780', name: '전남 보성군',       swLat: 34.583, swLng: 126.838, neLat: 34.913, neLng: 127.223 },
  { code: '46790', name: '전남 화순군',       swLat: 34.835, swLng: 126.844, neLat: 35.117, neLng: 127.184 },
  { code: '46800', name: '전남 장흥군',       swLat: 34.498, swLng: 126.700, neLat: 34.810, neLng: 127.014 },
  { code: '46810', name: '전남 강진군',       swLat: 34.500, swLng: 126.540, neLat: 34.745, neLng: 126.829 },
  { code: '46820', name: '전남 해남군',       swLat: 34.201, swLng: 126.260, neLat: 34.660, neLng: 126.760 },
  { code: '46830', name: '전남 영암군',       swLat: 34.638, swLng: 126.450, neLat: 34.880, neLng: 126.753 },
  { code: '46840', name: '전남 무안군',       swLat: 34.736, swLng: 126.330, neLat: 34.991, neLng: 126.637 },
  { code: '46860', name: '전남 함평군',       swLat: 34.900, swLng: 126.434, neLat: 35.138, neLng: 126.664 },
  { code: '46870', name: '전남 영광군',       swLat: 35.087, swLng: 126.344, neLat: 35.400, neLng: 126.640 },
  { code: '46880', name: '전남 장성군',       swLat: 35.188, swLng: 126.693, neLat: 35.463, neLng: 126.942 },
  { code: '46900', name: '전남 완도군',       swLat: 34.003, swLng: 126.497, neLat: 34.497, neLng: 127.045 },
  { code: '46910', name: '전남 진도군',       swLat: 34.172, swLng: 126.009, neLat: 34.580, neLng: 126.529 },
  { code: '46920', name: '전남 신안군',       swLat: 34.217, swLng: 125.643, neLat: 35.092, neLng: 126.447 },

  // ---- 경상북도 ----
  { code: '47110', name: '경북 포항 남구',    swLat: 35.869, swLng: 129.244, neLat: 36.065, neLng: 129.465 },
  { code: '47111', name: '경북 포항 북구',    swLat: 36.010, swLng: 129.197, neLat: 36.333, neLng: 129.450 },
  { code: '47130', name: '경북 경주시',       swLat: 35.680, swLng: 128.948, neLat: 36.125, neLng: 129.413 },
  { code: '47150', name: '경북 김천시',       swLat: 36.022, swLng: 127.870, neLat: 36.374, neLng: 128.189 },
  { code: '47170', name: '경북 안동시',       swLat: 36.447, swLng: 128.512, neLat: 36.803, neLng: 128.936 },
  { code: '47190', name: '경북 구미시',       swLat: 36.061, swLng: 128.261, neLat: 36.334, neLng: 128.538 },
  { code: '47210', name: '경북 영주시',       swLat: 36.719, swLng: 128.376, neLat: 36.981, neLng: 128.709 },
  { code: '47230', name: '경북 영천시',       swLat: 35.876, swLng: 128.826, neLat: 36.157, neLng: 129.097 },
  { code: '47250', name: '경북 상주시',       swLat: 36.175, swLng: 127.922, neLat: 36.564, neLng: 128.372 },
  { code: '47280', name: '경북 문경시',       swLat: 36.472, swLng: 127.897, neLat: 36.814, neLng: 128.281 },
  { code: '47290', name: '경북 경산시',       swLat: 35.779, swLng: 128.673, neLat: 36.001, neLng: 128.904 },
  { code: '47720', name: '경북 군위군',       swLat: 36.151, swLng: 128.393, neLat: 36.448, neLng: 128.700 },
  { code: '47730', name: '경북 의성군',       swLat: 36.272, swLng: 128.452, neLat: 36.662, neLng: 128.855 },
  { code: '47750', name: '경북 청송군',       swLat: 36.244, swLng: 128.889, neLat: 36.666, neLng: 129.218 },
  { code: '47760', name: '경북 영양군',       swLat: 36.524, swLng: 129.002, neLat: 36.848, neLng: 129.297 },
  { code: '47770', name: '경북 영덕군',       swLat: 36.262, swLng: 129.136, neLat: 36.618, neLng: 129.449 },
  { code: '47820', name: '경북 청도군',       swLat: 35.609, swLng: 128.641, neLat: 35.882, neLng: 128.964 },
  { code: '47830', name: '경북 고령군',       swLat: 35.658, swLng: 128.212, neLat: 35.833, neLng: 128.491 },
  { code: '47840', name: '경북 성주군',       swLat: 35.808, swLng: 128.082, neLat: 36.083, neLng: 128.392 },
  { code: '47850', name: '경북 칠곡군',       swLat: 35.895, swLng: 128.341, neLat: 36.139, neLng: 128.574 },
  { code: '47900', name: '경북 예천군',       swLat: 36.537, swLng: 128.177, neLat: 36.798, neLng: 128.529 },
  { code: '47920', name: '경북 봉화군',       swLat: 36.777, swLng: 128.512, neLat: 37.092, neLng: 128.972 },
  { code: '47930', name: '경북 울진군',       swLat: 36.553, swLng: 129.060, neLat: 37.060, neLng: 129.437 },
  { code: '47940', name: '경북 울릉군',       swLat: 37.415, swLng: 130.746, neLat: 37.571, neLng: 130.943 },

  // ---- 경상남도 ----
  { code: '48120', name: '경남 창원 의창구',  swLat: 35.218, swLng: 128.552, neLat: 35.348, neLng: 128.735 },
  { code: '48121', name: '경남 창원 성산구',  swLat: 35.195, swLng: 128.614, neLat: 35.266, neLng: 128.723 },
  { code: '48123', name: '경남 창원 마산합포구', swLat: 35.113, swLng: 128.472, neLat: 35.230, neLng: 128.589 },
  { code: '48125', name: '경남 창원 마산회원구', swLat: 35.192, swLng: 128.521, neLat: 35.282, neLng: 128.615 },
  { code: '48127', name: '경남 창원 진해구',  swLat: 35.100, swLng: 128.613, neLat: 35.209, neLng: 128.740 },
  { code: '48170', name: '경남 진주시',       swLat: 34.985, swLng: 127.959, neLat: 35.278, neLng: 128.257 },
  { code: '48220', name: '경남 통영시',       swLat: 34.618, swLng: 128.194, neLat: 34.907, neLng: 128.614 },
  { code: '48240', name: '경남 사천시',       swLat: 34.870, swLng: 127.889, neLat: 35.101, neLng: 128.175 },
  { code: '48250', name: '경남 김해시',       swLat: 35.136, swLng: 128.726, neLat: 35.309, neLng: 128.939 },
  { code: '48270', name: '경남 밀양시',       swLat: 35.313, swLng: 128.614, neLat: 35.611, neLng: 129.040 },
  { code: '48310', name: '경남 거제시',       swLat: 34.678, swLng: 128.464, neLat: 34.970, neLng: 128.808 },
  { code: '48330', name: '경남 양산시',       swLat: 35.237, swLng: 128.898, neLat: 35.534, neLng: 129.148 },
  { code: '48720', name: '경남 의령군',       swLat: 35.185, swLng: 128.097, neLat: 35.430, neLng: 128.425 },
  { code: '48730', name: '경남 함안군',       swLat: 35.175, swLng: 128.274, neLat: 35.375, neLng: 128.553 },
  { code: '48740', name: '경남 창녕군',       swLat: 35.357, swLng: 128.337, neLat: 35.647, neLng: 128.672 },
  { code: '48820', name: '경남 고성군',       swLat: 34.842, swLng: 128.068, neLat: 35.143, neLng: 128.385 },
  { code: '48840', name: '경남 남해군',       swLat: 34.673, swLng: 127.732, neLat: 34.935, neLng: 128.093 },
  { code: '48850', name: '경남 하동군',       swLat: 34.859, swLng: 127.540, neLat: 35.176, neLng: 127.917 },
  { code: '48860', name: '경남 산청군',       swLat: 35.109, swLng: 127.693, neLat: 35.479, neLng: 128.029 },
  { code: '48870', name: '경남 함양군',       swLat: 35.344, swLng: 127.563, neLat: 35.682, neLng: 127.898 },
  { code: '48880', name: '경남 거창군',       swLat: 35.528, swLng: 127.800, neLat: 35.824, neLng: 128.108 },
  { code: '48890', name: '경남 합천군',       swLat: 35.422, swLng: 127.952, neLat: 35.725, neLng: 128.384 },

  // ---- 제주특별자치도 ----
  { code: '50110', name: '제주 제주시',       swLat: 33.312, swLng: 126.150, neLat: 33.574, neLng: 126.758 },
  { code: '50130', name: '제주 서귀포시',     swLat: 33.200, swLng: 126.200, neLat: 33.427, neLng: 126.984 },
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
