import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export type RenewalType = 'redevelopment' | 'reconstruction' | 'newtown';
export type RenewalStatus = 'planning' | 'approved' | 'under_construction' | 'completed';

export interface RenewalProject {
  id: string;
  name: string;
  district: string;
  dong: string;
  type: RenewalType;
  status: RenewalStatus;
  lat: number;
  lng: number;
  totalUnits?: number;
  completionYear?: number;
}

interface BBox {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}

export function useRenewalProjects(bbox?: BBox, enabled = false) {
  return useQuery({
    queryKey: ['renewal', bbox],
    queryFn: async () => {
      const params = bbox
        ? new URLSearchParams({
            swLat: String(bbox.swLat),
            swLng: String(bbox.swLng),
            neLat: String(bbox.neLat),
            neLng: String(bbox.neLng),
          })
        : new URLSearchParams();
      const res = await api.get<{ success: boolean; data: RenewalProject[] }>(
        `/renewal?${params}`
      );
      return res.data.data;
    },
    enabled,
    staleTime: 30 * 60 * 1000, // 정비사업 데이터는 잘 바뀌지 않음 — 30분 캐시
    gcTime: 60 * 60 * 1000,
  });
}

// 정비사업 타입 한국어 레이블
export const RENEWAL_TYPE_LABEL: Record<RenewalType, string> = {
  redevelopment: '재개발',
  reconstruction: '재건축',
  newtown: '뉴타운',
};

// 정비사업 진행 상태 한국어 레이블
export const RENEWAL_STATUS_LABEL: Record<RenewalStatus, string> = {
  planning: '계획중',
  approved: '사업승인',
  under_construction: '공사중',
  completed: '완료',
};
