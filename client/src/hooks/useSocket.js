import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';

export function useSocket() {
  const socketRef = useRef(null);

  if (!socketRef.current) {
    socketRef.current = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      // Keep retrying forever so users don't get "stuck" after brief network blips
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
    });
  }

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      // Don't disconnect on unmount to allow reconnection
    };
  }, []);

  return socketRef.current;
}
