import { useState, useEffect } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import HomeScreen from './components/HomeScreen';
import Lobby from './components/Lobby';
import QuestionCard from './components/QuestionCard';
import VoteButtons from './components/VoteButtons';
import RevealTally from './components/RevealTally';
import GameSummary from './components/GameSummary';
import AdminLogin from './components/Admin/AdminLogin';
import AdminDashboard from './components/Admin/AdminDashboard';

function GameScreen() {
  const { screen, question, questionNumber, totalQuestions, error, clearError } = useGame();

  return (
    <div className="flex-1 flex flex-col min-h-dvh">
      {/* Error toast */}
      {error && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-no/90 text-white px-6 py-3 rounded-xl font-medium shadow-lg cursor-pointer"
          onClick={clearError}
        >
          {error}
        </div>
      )}

      {screen === 'home' && <HomeScreen />}
      {screen === 'lobby' && <Lobby />}
      {(screen === 'voting' || screen === 'reveal') && (
        <div className="flex-1 flex flex-col items-center" style={{ paddingTop: '48px', paddingBottom: '40px' }}>
          <QuestionCard text={question} number={questionNumber} total={totalQuestions} />
          {screen === 'voting' && <VoteButtons />}
          {screen === 'reveal' && <RevealTally />}
        </div>
      )}
      {screen === 'ended' && <GameSummary />}
    </div>
  );
}

function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch('/api/admin/check', { credentials: 'include' })
      .then(res => {
        if (res.ok) setAuthed(true);
      })
      .finally(() => setChecking(false));
  }, []);

  if (checking) return <div className="flex-1 flex items-center justify-center text-white/40">Loading...</div>;
  if (!authed) return <AdminLogin onLogin={() => setAuthed(true)} />;
  return <AdminDashboard onLogout={() => setAuthed(false)} />;
}

export default function App() {
  const isAdmin = window.location.pathname === '/admin';

  if (isAdmin) {
    return <AdminPage />;
  }

  return (
    <GameProvider>
      <GameScreen />
    </GameProvider>
  );
}
