import { useGame } from '../context/GameContext';

export default function Lobby() {
  const { roomCode, players, isHost, startGame } = useGame();

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      <div className="card-enter text-center mb-8">
        <p className="text-white/50 text-sm uppercase tracking-widest mb-2">Room Code</p>
        <h2 className="text-6xl font-black tracking-[0.3em] text-accent">{roomCode}</h2>
        <p className="text-white/40 text-sm mt-2">Share this code with your friends</p>
      </div>

      <div className="card-enter w-full max-w-xs mb-8">
        <p className="text-white/50 text-sm uppercase tracking-widest mb-3 text-center">
          Players ({players.length})
        </p>
        <div className="bg-white/5 rounded-2xl p-4 space-y-2 max-h-64 overflow-y-auto">
          {players.length === 0 ? (
            <p className="text-white/30 text-center py-4 pulse-subtle">Waiting for players...</p>
          ) : (
            players.map((player, i) => (
              <div key={player.id} className="flex items-center gap-3 px-3 py-2 bg-white/5 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                  {player.name[0].toUpperCase()}
                </div>
                <span className="text-white font-medium">{player.name}</span>
                {i === 0 && <span className="ml-auto text-xs text-accent/60 uppercase tracking-wider">Host</span>}
              </div>
            ))
          )}
        </div>
      </div>

      {isHost && (
        <button
          onClick={startGame}
          disabled={players.length < 1}
          className="card-enter w-full max-w-xs py-4 bg-accent text-dark font-bold text-xl rounded-2xl hover:bg-accent-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
        >
          Start Game
        </button>
      )}

      {!isHost && (
        <p className="card-enter text-white/40 text-sm pulse-subtle">Waiting for host to start...</p>
      )}
    </div>
  );
}
