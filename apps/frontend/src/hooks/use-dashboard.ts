'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useDashboardRealtime } from './use-ticket-realtime';

export function useDashboardMetrics() {
  useDashboardRealtime();

  return useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const res = await api.get('/dashboard/metrics');
      return res.data;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useDashboardTrends() {
  return useQuery({
    queryKey: ['dashboard-trends'],
    queryFn: async () => {
      const res = await api.get('/dashboard/trends');
      return res.data;
    },
    staleTime: 60_000,
  });
}

export function useAiInsights() {
  return useQuery({
    queryKey: ['ai-insights'],
    queryFn: async () => {
      const res = await api.get('/dashboard/ai-insights');
      return res.data;
    },
    staleTime: 300_000,
  });
}
