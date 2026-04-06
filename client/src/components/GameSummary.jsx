import { useGame } from '../context/GameContext';

export default function GameSummary() {
  const { summary, reset } = useGame();

  if (!summary) return null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      <div className="card-enter text-center mb-12">
        <h2 className="text-5xl font-black mb-3 tracking-tight">Game Over!</h2>
        <p className="text-white/30 text-base">{summary.totalQuestions} questions answered</p>
      </div>

      <div className="card-enter card-enter-delay-1 w-full max-w-sm space-y-5 mb-12">
        {summary.mostDivisive && (
          <div className="surface p-6">
            <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold mb-3">Most Divisive</p>
            <p className="text-white font-bold text-lg leading-snug mb-4">
              {summary.mostDivisive.questionText}
            </p>
            <div className="flex items-center gap-3">
              <span className="text-yes font-extrabold text-lg">{summary.mostDivisive.yesCount}</span>
              <span className="text-white/15 text-sm">/</span>
              <span className="text-no font-extrabold text-lg">{summary.mostDivisive.noCount}</span>
            </div>
          </div>
        )}

        {summary.mostUnanimous && summary.mostUnanimous !== summary.mostDivisive && (
          <div className="surface p-6">
            <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold mb-3">Most Unanimous</p>
            <p className="text-white font-bold text-lg leading-snug mb-4">
              {summary.mostUnanimous.questionText}
            </p>
            <div className="flex items-center gap-3">
              <span className="text-yes font-extrabold text-lg">{summary.mostUnanimous.yesCount}</span>
              <span className="text-white/15 text-sm">/</span>
              <span className="text-no font-extrabold text-lg">{summary.mostUnanimous.noCount}</span>
            </div>
          </div>
        )}
      </div>

      <div className="card-enter card-enter-delay-2 w-full max-w-xs">
        <button onClick={reset} className="btn-primary text-xl">
          Play Again
        </button>
      </div>
    </div>
  );
}
