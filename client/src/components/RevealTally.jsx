import { useGame } from '../context/GameContext';

export default function RevealTally() {
  const { tally, isHost, nextQuestion, endGame } = useGame();

  if (!tally) return null;

  const { yesCount, noCount, totalVotes } = tally;
  const yesPercent = totalVotes > 0 ? (yesCount / totalVotes) * 100 : 50;

  return (
    <div className="card-enter mt-8 w-full max-w-sm mx-auto px-4 space-y-6">
      {/* Counts */}
      <div className="flex justify-between items-end">
        <div className="text-center">
          <p className="text-5xl font-black text-yes">{yesCount}</p>
          <p className="text-yes/60 font-bold text-sm uppercase tracking-wider">Yes</p>
        </div>
        <div className="text-center">
          <p className="text-5xl font-black text-no">{noCount}</p>
          <p className="text-no/60 font-bold text-sm uppercase tracking-wider">No</p>
        </div>
      </div>

      {/* Bar */}
      <div className="h-4 bg-white/10 rounded-full overflow-hidden flex">
        <div
          className="h-full bg-yes rounded-l-full bar-fill"
          style={{ width: `${yesPercent}%` }}
        />
        <div
          className="h-full bg-no rounded-r-full bar-fill"
          style={{ width: `${100 - yesPercent}%` }}
        />
      </div>

      {/* Discussion prompt */}
      <p className="text-center text-white/40 text-sm">Discuss!</p>

      {/* Host controls */}
      {isHost && (
        <div className="flex gap-3">
          <button
            onClick={nextQuestion}
            className="flex-1 py-4 bg-accent text-dark font-bold text-lg rounded-2xl hover:bg-accent-hover transition-colors active:scale-95"
          >
            Next Question
          </button>
          <button
            onClick={endGame}
            className="py-4 px-5 bg-white/10 text-white/60 font-medium rounded-2xl hover:bg-white/20 transition-colors active:scale-95"
          >
            End
          </button>
        </div>
      )}
    </div>
  );
}
