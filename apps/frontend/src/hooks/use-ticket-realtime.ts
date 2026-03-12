'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from './use-socket';
import type { Ticket } from '@/types/ticket.types';

export function useTicketRealtime(ticketId?: string) {
  const queryClient = useQueryClient();
  const { on, joinRoom, leaveRoom } = useSocket();

  // Join the ticket's real-time room
  useEffect(() => {
    if (!ticketId) return;
    joinRoom(ticketId);
    return () => leaveRoom(ticketId);
  }, [ticketId, joinRoom, leaveRoom]);

  // Listen for ticket updates
  useEffect(() => {
    const cleanup = on<{ type: string; ticket: Ticket }>('ticket.updated', (data) => {
      if (ticketId && data.ticket.id !== ticketId) return;

      // Update the specific ticket cache
      queryClient.setQueryData(['ticket', data.ticket.id], data.ticket);

      // Invalidate the list query to refresh counts/filters
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    });
    return cleanup;
  }, [on, queryClient, ticketId]);

  // Listen for new tickets (for list pages)
  useEffect(() => {
    const cleanup = on<{ type: string; ticket: Ticket }>('ticket.created', () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    });
    return cleanup;
  }, [on, queryClient]);
}

export function useDashboardRealtime() {
  const queryClient = useQueryClient();
  const { on } = useSocket();

  useEffect(() => {
    const cleanup = on<{ metrics: Record<string, number> }>('metric.update', () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    });
    return cleanup;
  }, [on, queryClient]);
}
