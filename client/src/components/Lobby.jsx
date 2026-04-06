import { useGame } from '../context/GameContext';

export default function Lobby() {
  const { roomCode, players, isHost, startGame } = useGame();

  return (
    <div className="flex-1 flex flex-col items-center justify-center" style={{ padding: '48px 24px' }}>
      {/* Room code */}
      <div className="card-enter text-center" style={{ marginBottom: '56px' }}>
        <p className="text-white/40 text-xs uppercase tracking-[0.2em] font-semibold mb-4">Room Code</p>
        <div className="surface inline-block px-10 py-6 mb-5">
          <h2 className="text-6xl font-black tracking-[0.35em] text-accent leading-none">{roomCode}</h2>
        </div>
        <p className="text-white/30 text-sm">Share this code with your friends</p>
      </div>

      {/* Player list */}
      <div className="card-enter card-enter-delay-1 w-full max-w-sm" style={{ marginBottom: '48px' }}>
        <p className="text-white/40 text-xs uppercase tracking-[0.2em] font-semibold mb-5 text-center">
          Players ({players.length})
        </p>
        <div className="surface p-3 space-y-2 max-h-72 overflow-y-auto">
          {players.length === 0 ? (
            <p className="text-white/25 text-center py-8 pulse-subtle text-sm">Waiting for players...</p>
          ) : (
            players.map((player, i) => (
              <div key={player.id} className="flex items-center gap-4 px-4 py-3.5 bg-white/[0.03] rounded-xl transition-colors hover:bg-white/[0.06]">
                <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center text-accent font-bold text-sm shrink-0 border border-accent/20">
                  {player.name[0].toUpperCase()}
                </div>
                <span className="text-white font-semibold text-base">{player.name}</span>
                {i === 0 && (
                  <span className="ml-auto text-[10px] text-accent/50 uppercase tracking-[0.15em] font-bold bg-accent/8 px-2.5 py-1 rounded-full">
                    Host
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Start button */}
      {isHost && (
        <div className="card-enter card-enter-delay-2 w-full max-w-sm">
          <button onClick={startGame} disabled={players.length < 1} className="btn-primary text-xl">
            Start Game
          </button>
        </div>
      )}

      {!isHost && (
        <p className="card-enter card-enter-delay-2 text-white/30 text-sm pulse-subtle">Waiting for host to start...</p>
      )}
    </div>
  );
}
