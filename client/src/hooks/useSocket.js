import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';
const SESSION_KEY = 'yn_session';

// Shared session read so the socket auth always sees the latest session data
function readSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return {
      roomCode: parsed.roomCode || null,
      playerName: parsed.playerName || null,
    };
  } catch {
    return {};
  }
}

export function useSocket() {
  const socketRef = useRef(null);

  if (!socketRef.current) {
    socketRef.current = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      // Callback form: re-evaluated on every connect/reconnect so the current
      // session is sent in the handshake. Server middleware uses this to
      // re-bind the socket to the player BEFORE any buffered emits are
      // processed — preventing "voting not active" races.
      auth: (cb) => cb(readSession()),
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
