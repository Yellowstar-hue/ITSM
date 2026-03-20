'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';

// Socket connects to the same origin — NestJS runs on port 3001 in the same container,
// but the browser connects via the Next.js domain (port 3000 / Railway external port).
// Socket.IO on NestJS needs to be reached directly — use window.location.origin at runtime.
const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

let globalSocket: Socket | null = null;

export function useSocket() {
  const { token } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    if (!globalSocket || !globalSocket.connected) {
      globalSocket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
    }

    socketRef.current = globalSocket;

    return () => {
      // Don't disconnect on unmount — keep the global connection alive
    };
  }, [token]);

  const on = useCallback(<T>(event: string, handler: (data: T) => void) => {
    if (!socketRef.current) return;
    socketRef.current.on(event, handler);
    return () => {
      socketRef.current?.off(event, handler);
    };
  }, []);

  const emit = useCallback((event: string, data?: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  const joinRoom = useCallback((room: string) => {
    socketRef.current?.emit('join:ticket', room);
  }, []);

  const leaveRoom = useCallback((room: string) => {
    socketRef.current?.emit('leave:ticket', room);
  }, []);

  return { socket: socketRef.current, on, emit, joinRoom, leaveRoom };
}

export function disconnectSocket() {
  if (globalSocket) {
    globalSocket.disconnect();
    globalSocket = null;
  }
}
