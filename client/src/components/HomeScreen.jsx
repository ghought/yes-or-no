import { useState } from 'react';
import { useGame } from '../context/GameContext';

export default function HomeScreen({ onQuickPlay }) {
  const { hostCreate, playerJoin } = useGame();
  const [mode, setMode] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [name, setName] = useState('');

  const handleHost = (e) => {
    e.preventDefault();
    if (name.trim()) hostCreate(name.trim());
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (roomCode.trim() && name.trim()) playerJoin(roomCode.trim(), name.trim());
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 gap-10 relative" style={{ paddingBottom: '80px' }}>
      {/* Logo */}
      <div className="card-enter text-center">
        <h1 className="text-[4.5rem] sm:text-8xl font-black tracking-tight mb-6 leading-[0.9]">
          YES <span className="text-accent">OR</span> NO
        </h1>
        <p className="text-white/35 text-base sm:text-lg tracking-wide">The party game that starts conversations</p>
      </div>

      {/* Main buttons */}
      {!mode && (
        <div className="card-enter card-enter-delay-1 flex flex-col gap-6 w-full max-w-xs">
          <button onClick={() => setMode('host')} className="btn-primary">
            Host Game
          </button>
          <button onClick={() => setMode('join')} className="btn-secondary">
            Join Game
          </button>
          <button onClick={onQuickPlay} className="btn-ghost" style={{ marginTop: '8px', fontSize: '1rem' }}>
            Quick Play
          </button>
        </div>
      )}

      {/* Host form */}
      {mode === 'host' && (
        <form onSubmit={handleHost} className="card-enter flex flex-col gap-6 w-full max-w-xs">
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={20}
            className="input-field"
            autoFocus
          />
          <button type="submit" disabled={!name.trim()} className="btn-primary">
            Create Room
          </button>
          <button type="button" onClick={() => { setMode(null); setName(''); }} className="btn-ghost">
            Back
          </button>
        </form>
      )}

      {/* Join form */}
      {mode === 'join' && (
        <form onSubmit={handleJoin} className="card-enter flex flex-col gap-6 w-full max-w-xs">
          <input
            type="text"
            placeholder="Room Code"
            value={roomCode}
            onChange={e => setRoomCode(e.target.value.toUpperCase())}
            maxLength={4}
            className="input-field text-2xl font-bold tracking-[0.2em] uppercase"
            autoFocus
          />
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={20}
            className="input-field"
          />
          <button type="submit" disabled={!roomCode.trim() || !name.trim()} className="btn-primary">
            Join
          </button>
          <button type="button" onClick={() => { setMode(null); setName(''); setRoomCode(''); }} className="btn-ghost">
            Back
          </button>
        </form>
      )}
      {/* Credits */}
      <footer className="absolute bottom-6 left-0 right-0 text-center" style={{ padding: '0 24px' }}>
        <div className="border-t border-white/10" style={{ paddingTop: '16px' }}>
          <p className="text-white/30 text-sm">
            Created by{' '}
            <a href="https://www.alexcrawfordphoto.com/" target="_blank" rel="noopener noreferrer" className="text-white/50 underline decoration-white/20 underline-offset-2 hover:text-white/70 transition-colors">
              Alex
            </a>
            {' | '}
            Developed by{' '}
            <a href="https://garretthoughton.com/" target="_blank" rel="noopener noreferrer" className="text-white/50 underline decoration-white/20 underline-offset-2 hover:text-white/70 transition-colors">
              Garrett
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
