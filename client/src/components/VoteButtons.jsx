import { useGame } from '../context/GameContext';

export default function VoteButtons() {
  const { vote, hasVoted, votedCount, totalPlayers, isHost, forceReveal } = useGame();

  if (hasVoted) {
    return (
      <div className="text-center mt-8 space-y-4">
        <div className="inline-flex items-center gap-2 px-6 py-3 bg-accent/10 rounded-full">
          <span className="text-accent font-bold text-lg">Vote locked in!</span>
        </div>
        <p className="text-white/40 text-sm pulse-subtle">
          {votedCount}/{totalPlayers} voted
        </p>
        {isHost && votedCount < totalPlayers && (
          <button
            onClick={forceReveal}
            className="mt-2 px-6 py-2 bg-white/10 text-white/70 rounded-xl text-sm hover:bg-white/20 transition-colors"
          >
            Reveal Early
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      <div className="flex gap-4 px-4 max-w-sm mx-auto">
        <button
          onClick={() => vote('yes')}
          className="vote-btn flex-1 py-6 bg-yes/20 hover:bg-yes/30 border-2 border-yes/40 rounded-2xl transition-all flex flex-col items-center gap-1"
        >
          <span className="text-4xl">👍</span>
          <span className="text-yes font-bold text-lg">YES</span>
        </button>
        <button
          onClick={() => vote('no')}
          className="vote-btn flex-1 py-6 bg-no/20 hover:bg-no/30 border-2 border-no/40 rounded-2xl transition-all flex flex-col items-center gap-1"
        >
          <span className="text-4xl">👎</span>
          <span className="text-no font-bold text-lg">NO</span>
        </button>
      </div>
      <p className="text-center text-white/40 text-sm">
        {votedCount}/{totalPlayers} voted
      </p>
      {isHost && votedCount > 0 && (
        <div className="text-center">
          <button
            onClick={forceReveal}
            className="px-6 py-2 bg-white/10 text-white/70 rounded-xl text-sm hover:bg-white/20 transition-colors"
          >
            Reveal Early
          </button>
        </div>
      )}
    </div>
  );
}
