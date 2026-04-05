import { useState } from 'react';
import { useGame } from '../context/GameContext';

export default function HomeScreen() {
  const { hostCreate, playerJoin } = useGame();
  const [mode, setMode] = useState(null); // null | 'host' | 'join'
  const [roomCode, setRoomCode] = useState('');
  const [name, setName] = useState('');

  const handleHost = (e) => {
    e.preventDefault();
    if (name.trim()) {
      hostCreate(name.trim());
    }
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (roomCode.trim() && name.trim()) {
      playerJoin(roomCode.trim(), name.trim());
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      <div className="card-enter text-center mb-12">
        <h1 className="text-6xl font-black tracking-tight mb-2">
          YES <span className="text-accent">OR</span> NO
        </h1>
        <p className="text-white/50 text-lg">The party game that starts conversations</p>
      </div>

      {!mode && (
        <div className="card-enter flex flex-col gap-4 w-full max-w-xs">
          <button
            onClick={() => setMode('host')}
            className="w-full py-4 bg-accent text-dark font-bold text-xl rounded-2xl hover:bg-accent-hover transition-colors active:scale-95"
          >
            Host Game
          </button>
          <button
            onClick={() => setMode('join')}
            className="w-full py-4 bg-white/10 text-white font-bold text-xl rounded-2xl hover:bg-white/20 transition-colors active:scale-95"
          >
            Join Game
          </button>
        </div>
      )}

      {mode === 'host' && (
        <form onSubmit={handleHost} className="card-enter flex flex-col gap-4 w-full max-w-xs">
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={20}
            className="w-full py-4 px-6 bg-white/10 text-white text-center text-xl rounded-2xl placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-accent"
            autoFocus
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-4 bg-accent text-dark font-bold text-xl rounded-2xl hover:bg-accent-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
          >
            Create Room
          </button>
          <button
            type="button"
            onClick={() => { setMode(null); setName(''); }}
            className="text-white/40 hover:text-white/60 text-sm"
          >
            Back
          </button>
        </form>
      )}

      {mode === 'join' && (
        <form onSubmit={handleJoin} className="card-enter flex flex-col gap-4 w-full max-w-xs">
          <input
            type="text"
            placeholder="Room Code"
            value={roomCode}
            onChange={e => setRoomCode(e.target.value.toUpperCase())}
            maxLength={4}
            className="w-full py-4 px-6 bg-white/10 text-white text-center text-2xl font-bold rounded-2xl placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-accent uppercase tracking-widest"
            autoFocus
          />
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={20}
            className="w-full py-4 px-6 bg-white/10 text-white text-center text-xl rounded-2xl placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            type="submit"
            disabled={!roomCode.trim() || !name.trim()}
            className="w-full py-4 bg-accent text-dark font-bold text-xl rounded-2xl hover:bg-accent-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
          >
            Join
          </button>
          <button
            type="button"
            onClick={() => { setMode(null); setName(''); setRoomCode(''); }}
            className="text-white/40 hover:text-white/60 text-sm"
          >
            Back
          </button>
        </form>
      )}
    </div>
  );
}
