import axios, { type AxiosError } from 'axios';

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/api`
    : '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 공통 에러 처리
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      if (status === 404) {
        console.warn('[API] 리소스를 찾을 수 없습니다.');
      } else if (status === 500) {
        console.error('[API] 서버 오류가 발생했습니다.');
      } else if (status === 429) {
        console.warn('[API] 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
      }
    } else if (error.request) {
      console.error('[API] 서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.');
    }
    return Promise.reject(error);
  }
);

export default api;
