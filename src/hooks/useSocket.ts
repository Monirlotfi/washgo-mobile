import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { CAROUSEL_KEY } from './useCarousel';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://192.168.1.24:3000';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (socketRef.current?.connected) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('[Socket] connected');
    });

    socket.on('carousel.updated', () => {
      console.log('[Socket] carousel.updated — refetching');
      queryClient.invalidateQueries({ queryKey: CAROUSEL_KEY });
    });

    socket.on('disconnect', () => {
      console.log('[Socket] disconnected');
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [queryClient]);
}
