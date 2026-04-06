import { useGame } from '../context/GameContext';

export default function RevealTally() {
  const { tally, isHost, nextQuestion, endGame } = useGame();

  if (!tally) return null;

  const { yesCount, noCount, totalVotes } = tally;
  const yesPercent = totalVotes > 0 ? (yesCount / totalVotes) * 100 : 50;

  return (
    <div className="card-enter mt-10 w-full max-w-md mx-auto space-y-8">
      {/* Counts */}
      <div className="flex justify-between items-center px-4">
        <div className="text-center">
          <p className="count-pop text-6xl font-black text-yes leading-none">{yesCount}</p>
          <p className="text-yes/50 font-bold text-xs uppercase tracking-[0.15em] mt-3">Yes</p>
        </div>
        <div className="text-white/15 text-2xl font-light">/</div>
        <div className="text-center">
          <p className="count-pop text-6xl font-black text-no leading-none">{noCount}</p>
          <p className="text-no/50 font-bold text-xs uppercase tracking-[0.15em] mt-3">No</p>
        </div>
      </div>

      {/* Bar */}
      <div className="h-5 bg-white/[0.06] rounded-full overflow-hidden flex border border-white/[0.06]">
        <div
          className="h-full bg-gradient-to-r from-yes/80 to-yes rounded-l-full bar-fill"
          style={{ width: `${yesPercent}%` }}
        />
        <div
          className="h-full bg-gradient-to-r from-no to-no/80 rounded-r-full bar-fill"
          style={{ width: `${100 - yesPercent}%` }}
        />
      </div>

      {/* Discussion prompt */}
      <p className="text-center text-white/25 text-sm font-medium tracking-wide">Talk it out.</p>

      {/* Host controls */}
      {isHost && (
        <div className="flex gap-4 pt-4">
          <button onClick={nextQuestion} className="btn-primary flex-1">
            Next Question
          </button>
          <button
            onClick={endGame}
            className="px-8 py-[18px] bg-white/[0.06] text-white/40 font-semibold rounded-2xl border border-white/[0.06] hover:bg-white/[0.1] hover:text-white/60 transition-all active:scale-97 shrink-0"
          >
            End
          </button>
        </div>
      )}
    </div>
  );
}
