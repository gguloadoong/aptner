import api from './api';
import type { Subscription, SubscriptionStatus, SortOrder } from '../types';
import { MOCK_SUBSCRIPTIONS } from '../mocks/subscriptions.mock';

const USE_MOCK =
  import.meta.env.VITE_USE_MOCK === 'true' ||
  import.meta.env.VITE_KAKAO_MAP_KEY === 'demo_key_replace_with_real_key' ||
  !import.meta.env.VITE_API_BASE_URL; // API URL 없으면 자동 Mock

// FE 약칭 → BE 전체 명칭 매핑 (MAJOR-05 수정)
const REGION_MAP: Record<string, string> = {
  서울: '서울특별시',
  경기: '경기도',
  인천: '인천광역시',
  부산: '부산광역시',
  대구: '대구광역시',
  광주: '광주광역시',
  대전: '대전광역시',
  울산: '울산광역시',
  세종: '세종특별자치시',
  강원: '강원특별자치도',
  충북: '충청북도',
  충남: '충청남도',
  전북: '전북특별자치도',
  전남: '전라남도',
  경북: '경상북도',
  경남: '경상남도',
  제주: '제주특별자치도',
};

// BE Subscription → FE Subscription 어댑터 (CRIT-01)
function adaptSubscription(raw: Record<string, unknown>): Subscription {
  const endDate = (raw.endDate as string | undefined) ?? '';
  const dDay = calcDayDiff(endDate);
  return {
    id: raw.id as string,
    name: raw.name as string,
    location: (raw.location as string | undefined) ?? `${(raw.sido as string | undefined) ?? ''} ${(raw.sigungu as string | undefined) ?? ''}`.trim(),
    status: raw.status as SubscriptionStatus,
    startDate: (raw.startDate as string | undefined) ?? '',
    endDate,
    dDay,
    totalUnits: (raw.totalSupply as number | undefined) ?? (raw['세대수'] as number | undefined) ?? 0,
    // BE minPrice는 만원 단위, formatPrice도 만원 단위 → 그대로 사용. 0은 미확정으로 처리
    supplyPrice: raw.minPrice != null && (raw.minPrice as number) > 0 ? (raw.minPrice as number) : undefined,
    district: (raw.sigungu as string | undefined) ?? '',
    areas: ((raw.areas as Array<{ area?: number; price?: number; supply?: number }> | undefined) ?? []).map((a) => ({
      area: String(Math.round(a.area ?? 0)),
      price: a.price ?? 0,
      units: a.supply ?? 0,
      generalRatio: 70,
      lotteryRatio: 30,
    })),
    // MAJOR-03: BE schedule 필드 직접 매핑
    schedule: raw.schedule
      ? {
          announceDate: (raw.schedule as Record<string, string>).announceDate,
          contractStartDate: (raw.schedule as Record<string, string>).contractStartDate,
          contractEndDate: (raw.schedule as Record<string, string>).contractEndDate,
        }
      : undefined,
    address: (raw.address as string | undefined) ?? undefined,
    lat: raw.lat as number | undefined,
    lng: raw.lng as number | undefined,
  };
}

// endDate 기준 D-day 숫자 계산 (오늘 = 0, 미래 = 양수, 과거 = 음수)
function calcDayDiff(endDate: string): number {
  if (!endDate) return -999;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// Mock 필터/정렬/페이지네이션 공통 로직
function applyMockFilters(params: {
  status?: SubscriptionStatus;
  region?: string;
  sort?: SortOrder;
  page?: number;
  pageSize?: number;
}): { data: Subscription[]; total: number } {
  let data = [...MOCK_SUBSCRIPTIONS];

  if (params.status) {
    data = data.filter((s) => s.status === params.status);
  }
  if (params.region && params.region !== '전국') {
    data = data.filter((s) => s.location.includes(params.region!));
  }
  if (params.sort === 'deadline') {
    data.sort((a, b) => a.endDate.localeCompare(b.endDate));
  } else if (params.sort === 'price') {
    data.sort((a, b) => (a.supplyPrice ?? 0) - (b.supplyPrice ?? 0));
  } else if (params.sort === 'latest') {
    data.sort((a, b) => b.startDate.localeCompare(a.startDate));
  }

  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const start = (page - 1) * pageSize;
  return { data: data.slice(start, start + pageSize), total: data.length };
}

// 청약 목록 조회
export async function getSubscriptions(params: {
  status?: SubscriptionStatus;
  region?: string;
  sort?: SortOrder;
  page?: number;
  pageSize?: number;
}): Promise<{ data: Subscription[]; total: number }> {
  if (USE_MOCK) {
    await delay(300);
    return applyMockFilters(params);
  }

  try {
    // FE SortOrder → BE sort 파라미터 변환 (MAJOR-04)
    // latest(최신순)는 BE 미지원 → undefined로 처리하여 기본 dDay 정렬 사용
    const SORT_MAP: Record<string, string | undefined> = {
      deadline: 'dDay',
      price: 'price',
      latest: undefined,
    };

    // 실 API: 파라미터 변환 후 전송
    const beParams: Record<string, unknown> = {
      page: params.page ?? 1,
      limit: params.pageSize ?? 20,
      status: params.status,
      sort: params.sort ? SORT_MAP[params.sort] : undefined,
      sido: params.region && params.region !== '전국' ? (REGION_MAP[params.region] ?? params.region) : undefined,
    };

    const response = await api.get<{ success: true; data: Record<string, unknown>[]; meta: { total: number } }>(
      '/subscriptions',
      { params: beParams },
    );
    const raw = response.data;
    return {
      data: raw.data.map(adaptSubscription),
      total: raw.meta?.total ?? 0,
    };
  } catch (err) {
    // API 서버 미실행 또는 에러 시 Mock 데이터로 자동 폴백
    console.warn('[subscription.service] API 호출 실패, Mock 데이터로 폴백:', err);
    await delay(300);
    return applyMockFilters(params);
  }
}

// 청약 상세 조회
export async function getSubscriptionDetail(id: string): Promise<Subscription | null> {
  if (USE_MOCK) {
    await delay(200);
    return MOCK_SUBSCRIPTIONS.find((s) => s.id === id) ?? null;
  }

  const response = await api.get<{ success: true; data: Record<string, unknown> }>(`/subscriptions/${id}`);
  return adaptSubscription(response.data.data);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
