import { useGame } from '../context/GameContext';

export default function RevealTally() {
  const { tally, isHost, nextQuestion, endGame } = useGame();

  if (!tally) return null;

  const { yesCount, noCount, totalVotes } = tally;
  const yesPercent = totalVotes > 0 ? (yesCount / totalVotes) * 100 : 50;

  return (
    <div className="card-enter w-full max-w-md mx-auto" style={{ marginTop: '48px', padding: '0 24px' }}>
      {/* Counts */}
      <div className="flex justify-between items-center" style={{ marginBottom: '32px' }}>
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
      <div className="h-5 bg-white/[0.06] rounded-full overflow-hidden flex border border-white/[0.06]" style={{ marginBottom: '32px' }}>
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
      <p className="text-center text-white/25 text-sm font-medium tracking-wide" style={{ marginBottom: '32px' }}>Talk it out.</p>

      {/* Host controls */}
      {isHost && (
        <div className="text-center">
          <button onClick={nextQuestion} className="btn-primary" style={{ marginBottom: '16px' }}>
            Next Question
          </button>
          <button onClick={endGame} className="btn-ghost">
            End Game
          </button>
        </div>
      )}
    </div>
  );
}
