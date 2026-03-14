import { useQuery } from '@tanstack/react-query';
import { getSubscriptions, getSubscriptionDetail } from '../services/subscription.service';
import type { SubscriptionStatus, SortOrder } from '../types';

// 청약 목록 조회 훅
export function useSubscriptions(params: {
  status?: SubscriptionStatus;
  region?: string;
  sort?: SortOrder;
  page?: number;
}) {
  return useQuery({
    queryKey: ['subscriptions', params],
    queryFn: () => getSubscriptions(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

// 청약 상세 조회 훅
export function useSubscriptionDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['subscription', id],
    queryFn: () => getSubscriptionDetail(id!),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}
