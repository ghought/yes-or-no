import { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';

const GameContext = createContext(null);

const SESSION_KEY = 'yn_session';

const initialState = {
  screen: 'home', // home | lobby | voting | reveal | ended
  roomCode: null,
  playerName: null,
  players: [],
  isHost: false,
  question: null,
  questionNumber: 0,
  totalQuestions: 0,
  votedCount: 0,
  totalPlayers: 0,
  hasVoted: false,
  tally: null,
  summary: null,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_HOST':
      return { ...state, isHost: true, roomCode: action.roomCode, screen: 'lobby' };
    case 'SET_JOINED':
      return { ...state, roomCode: action.roomCode, playerName: action.playerName, screen: 'lobby' };
    case 'SET_ROLE':
      return { ...state, isHost: action.isHost };
    case 'SET_PLAYERS':
      return { ...state, players: action.players };
    case 'SET_QUESTION':
      return {
        ...state,
        screen: 'voting',
        question: action.questionText,
        questionNumber: action.questionNumber,
        totalQuestions: action.totalQuestions,
        hasVoted: false,
        tally: null,
      };
    case 'SET_VOTE_PROGRESS':
      return { ...state, votedCount: action.votedCount, totalPlayers: action.totalPlayers };
    case 'SET_VOTED':
      return { ...state, hasVoted: true };
    case 'SET_REVEAL':
      return { ...state, screen: 'reveal', tally: action.tally };
    case 'SET_ENDED':
      return { ...state, screen: 'ended', summary: action.summary };
    case 'SET_ERROR':
      return { ...state, error: action.message };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.roomCode || !parsed.playerName) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveSession(data) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch {}
}

function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {}
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const socket = useSocket();
  // Keep current session info in a ref so the reconnect handler always has fresh values
  const sessionRef = useRef({ roomCode: null, playerName: null });

  // Persist roomCode + playerName as they change
  useEffect(() => {
    if (state.roomCode && state.playerName) {
      sessionRef.current = { roomCode: state.roomCode, playerName: state.playerName };
      saveSession(sessionRef.current);
    } else if (state.screen === 'home') {
      sessionRef.current = { roomCode: null, playerName: null };
      clearSession();
    }
  }, [state.roomCode, state.playerName, state.screen]);

  useEffect(() => {
    // On (re)connect, if we have an active session, ask the server to rejoin us.
    const handleConnect = () => {
      const { roomCode, playerName } = sessionRef.current;
      if (roomCode && playerName) {
        socket.emit('player:rejoin', { roomCode, name: playerName });
      }
    };

    socket.on('connect', handleConnect);

    socket.on('room:created', ({ roomCode }) => {
      dispatch({ type: 'SET_HOST', roomCode });
    });

    socket.on('room:rejoined', () => {
      // Server confirmed rejoin; state will follow via game:* events. Clear any stale error.
      dispatch({ type: 'CLEAR_ERROR' });
    });

    socket.on('room:rejoinFailed', () => {
      // Room no longer exists — reset to home so user isn't stuck
      clearSession();
      sessionRef.current = { roomCode: null, playerName: null };
      dispatch({ type: 'RESET' });
    });

    socket.on('room:playerJoined', ({ players }) => {
      dispatch({ type: 'SET_PLAYERS', players });
    });

    socket.on('room:playerLeft', ({ players }) => {
      dispatch({ type: 'SET_PLAYERS', players });
    });

    socket.on('room:role', ({ isHost }) => {
      dispatch({ type: 'SET_ROLE', isHost });
    });

    socket.on('game:question', (data) => {
      dispatch({ type: 'SET_QUESTION', ...data });
    });

    socket.on('game:voteProgress', ({ votedCount, totalPlayers }) => {
      dispatch({ type: 'SET_VOTE_PROGRESS', votedCount, totalPlayers });
    });

    socket.on('game:alreadyVoted', () => {
      dispatch({ type: 'SET_VOTED' });
    });

    socket.on('game:reveal', (tally) => {
      dispatch({ type: 'SET_REVEAL', tally });
    });

    socket.on('game:ended', (summary) => {
      dispatch({ type: 'SET_ENDED', summary });
    });

    socket.on('error', ({ message }) => {
      dispatch({ type: 'SET_ERROR', message });
    });

    // On first mount, restore any stored session so rejoin will fire on connect
    const stored = loadSession();
    if (stored) {
      sessionRef.current = stored;
      // Optimistically put user back in the lobby; server state will overwrite once rejoined
      dispatch({ type: 'SET_JOINED', roomCode: stored.roomCode, playerName: stored.playerName });
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('room:created');
      socket.off('room:rejoined');
      socket.off('room:rejoinFailed');
      socket.off('room:playerJoined');
      socket.off('room:playerLeft');
      socket.off('room:role');
      socket.off('game:question');
      socket.off('game:voteProgress');
      socket.off('game:alreadyVoted');
      socket.off('game:reveal');
      socket.off('game:ended');
      socket.off('error');
    };
  }, [socket]);

  const hostCreate = useCallback((name, deckId = null) => {
    sessionRef.current = { roomCode: null, playerName: name };
    socket.emit('host:create', { name, deckId });
  }, [socket]);

  const playerJoin = useCallback((roomCode, name) => {
    const code = roomCode.toUpperCase();
    sessionRef.current = { roomCode: code, playerName: name };
    saveSession(sessionRef.current);
    socket.emit('player:join', { roomCode: code, name });
    dispatch({ type: 'SET_JOINED', roomCode: code, playerName: name });
  }, [socket]);

  const startGame = useCallback(() => {
    socket.emit('host:startGame');
  }, [socket]);

  const vote = useCallback((answer) => {
    socket.emit('player:vote', { answer });
    dispatch({ type: 'SET_VOTED' });
  }, [socket]);

  const forceReveal = useCallback(() => {
    socket.emit('host:forceReveal');
  }, [socket]);

  const skipQuestion = useCallback(() => {
    socket.emit('host:skipQuestion');
  }, [socket]);

  const nextQuestion = useCallback(() => {
    socket.emit('host:nextQuestion');
  }, [socket]);

  const endGame = useCallback(() => {
    socket.emit('host:endGame');
  }, [socket]);

  const reset = useCallback(() => {
    clearSession();
    sessionRef.current = { roomCode: null, playerName: null };
    dispatch({ type: 'RESET' });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  return (
    <GameContext.Provider value={{
      ...state,
      hostCreate,
      playerJoin,
      startGame,
      vote,
      forceReveal,
      skipQuestion,
      nextQuestion,
      endGame,
      reset,
      clearError,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
