'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { Ticket, PaginatedResponse } from '@/types/ticket.types';

export interface TicketFilters {
  type?: string;
  status?: string;
  priority?: string;
  search?: string;
  assigneeId?: string;
  page?: number;
  limit?: number;
}

export function useTickets(filters: TicketFilters = {}) {
  return useQuery<PaginatedResponse<Ticket>>({
    queryKey: ['tickets', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.set(k, String(v));
      });
      const res = await api.get(`/tickets?${params.toString()}`);
      return res.data;
    },
    staleTime: 10_000,
  });
}

export function useTicket(id?: string) {
  return useQuery<Ticket>({
    queryKey: ['ticket', id],
    queryFn: async () => {
      const res = await api.get(`/tickets/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Ticket>) => api.post('/tickets', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
      qc.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast.success('Ticket created successfully');
    },
    onError: () => toast.error('Failed to create ticket'),
  });
}

export function useUpdateTicket(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Ticket>) => api.patch(`/tickets/${id}`, data).then((r) => r.data),
    onSuccess: (updated) => {
      qc.setQueryData(['ticket', id], updated);
      qc.invalidateQueries({ queryKey: ['tickets'] });
    },
    onError: () => toast.error('Failed to update ticket'),
  });
}

export function useAddWorklog(ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { content: string; timeSpentMinutes?: number; isInternal?: boolean }) =>
      api.post(`/tickets/${ticketId}/worklogs`, data).then((r) => r.data),
    onSuccess: (updated) => {
      qc.setQueryData(['ticket', ticketId], updated);
      toast.success('Work note added');
    },
    onError: () => toast.error('Failed to add work note'),
  });
}

export function useAddComment(ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { content: string; isInternal?: boolean }) =>
      api.post(`/tickets/${ticketId}/comments`, data).then((r) => r.data),
    onSuccess: (updated) => {
      qc.setQueryData(['ticket', ticketId], updated);
      toast.success('Comment added');
    },
    onError: () => toast.error('Failed to add comment'),
  });
}

export function useTicketStats() {
  return useQuery({
    queryKey: ['ticket-stats'],
    queryFn: async () => {
      const res = await api.get('/tickets/stats');
      return res.data;
    },
    staleTime: 30_000,
  });
}
