import { useGame } from '../context/GameContext';

export default function VoteButtons() {
  const { vote, hasVoted, votedCount, totalPlayers, isHost, forceReveal } = useGame();

  if (hasVoted) {
    return (
      <div className="text-center mt-14 space-y-6">
        <div className="inline-flex items-center gap-2.5 px-8 py-4 surface border-accent/20">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-accent font-bold text-base">Vote locked in</span>
        </div>
        <p className="text-white/30 text-sm pulse-subtle">
          {votedCount} of {totalPlayers} voted
        </p>
        {isHost && votedCount < totalPlayers && (
          <button onClick={forceReveal} className="btn-ghost mt-2">
            Reveal Early
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-8 w-full max-w-md mx-auto">
      <div className="flex gap-5">
        <button
          onClick={() => vote('yes')}
          className="vote-btn flex-1 py-9 bg-yes/10 hover:bg-yes/20 border border-yes/25 hover:border-yes/40 rounded-[20px] flex flex-col items-center gap-3 shadow-[0_4px_20px_var(--color-yes-glow)] hover:shadow-[0_8px_30px_var(--color-yes-glow)]"
        >
          <span className="text-5xl">👍</span>
          <span className="text-yes font-extrabold text-xl tracking-wide">YES</span>
        </button>
        <button
          onClick={() => vote('no')}
          className="vote-btn flex-1 py-9 bg-no/10 hover:bg-no/20 border border-no/25 hover:border-no/40 rounded-[20px] flex flex-col items-center gap-3 shadow-[0_4px_20px_var(--color-no-glow)] hover:shadow-[0_8px_30px_var(--color-no-glow)]"
        >
          <span className="text-5xl">👎</span>
          <span className="text-no font-extrabold text-xl tracking-wide">NO</span>
        </button>
      </div>

      <p className="text-center text-white/25 text-sm font-medium">
        {votedCount} of {totalPlayers} voted
      </p>

      {isHost && votedCount > 0 && (
        <div className="text-center">
          <button onClick={forceReveal} className="btn-ghost">
            Reveal Early
          </button>
        </div>
      )}
    </div>
  );
}
