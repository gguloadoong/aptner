import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

// BE redevelopment.service.ts의 RedevelopmentProject와 필드 일치
export type RedevelopmentType = 'redevelopment' | 'reconstruction' | 'newtown';
export type RedevelopmentStatus = 'planning' | 'approved' | 'construction' | 'completed';

export interface RedevelopmentProject {
  id: string;
  name: string;
  type: RedevelopmentType;
  status: RedevelopmentStatus;
  lat: number;
  lng: number;
  address: string;
  estimatedUnits?: number;
  completionYear?: number;
}

interface BBox {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}

export function useRedevelopmentProjects(region?: string, bbox?: BBox, enabled = false) {
  return useQuery({
    queryKey: ['redevelopment', region, bbox],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (region) params.set('region', region);
      if (bbox) {
        params.set('swLat', String(bbox.swLat));
        params.set('swLng', String(bbox.swLng));
        params.set('neLat', String(bbox.neLat));
        params.set('neLng', String(bbox.neLng));
      }
      const res = await api.get<{ success: boolean; data: RedevelopmentProject[] }>(
        `/redevelopment?${params}`
      );
      return res.data.data;
    },
    enabled,
    staleTime: 30 * 60 * 1000, // 정비사업 데이터는 잘 바뀌지 않음 — 30분 캐시
    gcTime: 60 * 60 * 1000,
  });
}

// 정비사업 타입 한국어 레이블
export const REDEVELOPMENT_TYPE_LABEL: Record<RedevelopmentType, string> = {
  redevelopment: '재개발',
  reconstruction: '재건축',
  newtown: '뉴타운',
};

// 정비사업 진행 상태 한국어 레이블
export const REDEVELOPMENT_STATUS_LABEL: Record<RedevelopmentStatus, string> = {
  planning: '계획중',
  approved: '사업승인',
  construction: '공사중',
  completed: '완료',
};
