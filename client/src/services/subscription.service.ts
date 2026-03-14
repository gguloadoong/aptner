import api from './api';
import type { Subscription, SubscriptionStatus, SortOrder } from '../types';
import { MOCK_SUBSCRIPTIONS } from '../mocks/subscriptions.mock';

const USE_MOCK = import.meta.env.VITE_KAKAO_MAP_KEY === 'demo_key_replace_with_real_key';

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

// BE Subscription → FE Subscription 어댑터 (CRIT-01 수정)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adaptSubscription(raw: any): Subscription {
  return {
    id: raw.id,
    name: raw.name,
    location: `${raw.sido ?? ''} ${raw.sigungu ?? ''}`.trim(),
    district: raw.sigungu ?? '',
    startPrice: raw.minPrice ?? 0,
    maxPrice: raw.maxPrice ?? 0,
    deadline: raw.endDate ?? '',
    startDate: raw.startDate ?? '',
    status: raw.status as SubscriptionStatus,
    supplyUnits: raw.totalSupply ?? 0,
    type: raw.type?.includes('특별') ? 'special' : 'general',  // CRIT-03 수정
    areas: (raw.areas ?? []).map((a: any) => ({
      area: String(Math.round(a.area ?? 0)),
      price: a.price ?? 0,
      units: a.supply ?? 0,
      generalRatio: 70,
      lotteryRatio: 30,
    })),
    // MAJOR-03: BE schedule 필드 직접 매핑
    schedule: raw.schedule
      ? {
          announceDate: raw.schedule.announceDate,
          contractStartDate: raw.schedule.contractStartDate,
          contractEndDate: raw.schedule.contractEndDate,
        }
      : undefined,
    lat: raw.lat,
    lng: raw.lng,
  };
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
    let data = [...MOCK_SUBSCRIPTIONS];

    // 상태 필터
    if (params.status) {
      data = data.filter((s) => s.status === params.status);
    }

    // 지역 필터
    if (params.region && params.region !== '전국') {
      data = data.filter((s) => s.location.includes(params.region!));
    }

    // 정렬
    if (params.sort === 'deadline') {
      data.sort((a, b) => a.deadline.localeCompare(b.deadline));
    } else if (params.sort === 'price') {
      data.sort((a, b) => a.startPrice - b.startPrice);
    } else if (params.sort === 'latest') {
      data.sort((a, b) => b.startDate.localeCompare(a.startDate));
    }

    // 페이지네이션
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    const paginated = data.slice(start, start + pageSize);

    return { data: paginated, total: data.length };
  }

  // 실 API: 파라미터 변환 후 전송
  const beParams: Record<string, unknown> = {
    page: params.page ?? 1,
    limit: params.pageSize ?? 20,
    status: params.status,
    sort: params.sort,
    sido: params.region && params.region !== '전국' ? (REGION_MAP[params.region] ?? params.region) : undefined,
  };

  const response = await api.get<{ success: true; data: unknown[]; meta: { total: number } }>(
    '/subscriptions',
    { params: beParams },
  );
  const raw = response.data;
  return {
    data: raw.data.map(adaptSubscription),
    total: raw.meta?.total ?? 0,
  };
}

// 청약 상세 조회
export async function getSubscriptionDetail(id: string): Promise<Subscription | null> {
  if (USE_MOCK) {
    await delay(200);
    return MOCK_SUBSCRIPTIONS.find((s) => s.id === id) ?? null;
  }

  const response = await api.get<{ success: true; data: unknown }>(`/subscriptions/${id}`);
  return adaptSubscription(response.data.data);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
