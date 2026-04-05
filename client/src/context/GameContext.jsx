import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';

const GameContext = createContext(null);

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

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const socket = useSocket();

  useEffect(() => {
    socket.on('room:created', ({ roomCode }) => {
      dispatch({ type: 'SET_HOST', roomCode });
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

    socket.on('game:reveal', (tally) => {
      dispatch({ type: 'SET_REVEAL', tally });
    });

    socket.on('game:ended', (summary) => {
      dispatch({ type: 'SET_ENDED', summary });
    });

    socket.on('error', ({ message }) => {
      dispatch({ type: 'SET_ERROR', message });
    });

    return () => {
      socket.off('room:created');
      socket.off('room:playerJoined');
      socket.off('room:playerLeft');
      socket.off('room:role');
      socket.off('game:question');
      socket.off('game:voteProgress');
      socket.off('game:reveal');
      socket.off('game:ended');
      socket.off('error');
    };
  }, [socket]);

  const hostCreate = useCallback((name) => {
    socket.emit('host:create', { name });
  }, [socket]);

  const playerJoin = useCallback((roomCode, name) => {
    socket.emit('player:join', { roomCode, name });
    dispatch({ type: 'SET_JOINED', roomCode: roomCode.toUpperCase(), playerName: name });
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

  const nextQuestion = useCallback(() => {
    socket.emit('host:nextQuestion');
  }, [socket]);

  const endGame = useCallback(() => {
    socket.emit('host:endGame');
  }, [socket]);

  const reset = useCallback(() => {
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
