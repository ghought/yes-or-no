import { useGame } from '../context/GameContext';

export default function GameSummary() {
  const { summary, reset } = useGame();

  if (!summary) return null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
      <div className="card-enter text-center mb-8">
        <h2 className="text-4xl font-black mb-2">Game Over!</h2>
        <p className="text-white/40">{summary.totalQuestions} questions answered</p>
      </div>

      <div className="card-enter w-full max-w-sm space-y-4 mb-8">
        {summary.mostDivisive && (
          <div className="bg-white/5 rounded-2xl p-5">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Most Divisive</p>
            <p className="text-white font-bold text-lg leading-snug mb-2">
              {summary.mostDivisive.questionText}
            </p>
            <p className="text-sm">
              <span className="text-yes font-bold">{summary.mostDivisive.yesCount} Yes</span>
              {' / '}
              <span className="text-no font-bold">{summary.mostDivisive.noCount} No</span>
            </p>
          </div>
        )}

        {summary.mostUnanimous && summary.mostUnanimous !== summary.mostDivisive && (
          <div className="bg-white/5 rounded-2xl p-5">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Most Unanimous</p>
            <p className="text-white font-bold text-lg leading-snug mb-2">
              {summary.mostUnanimous.questionText}
            </p>
            <p className="text-sm">
              <span className="text-yes font-bold">{summary.mostUnanimous.yesCount} Yes</span>
              {' / '}
              <span className="text-no font-bold">{summary.mostUnanimous.noCount} No</span>
            </p>
          </div>
        )}
      </div>

      <button
        onClick={reset}
        className="card-enter w-full max-w-xs py-4 bg-accent text-dark font-bold text-xl rounded-2xl hover:bg-accent-hover transition-colors active:scale-95"
      >
        Play Again
      </button>
    </div>
  );
}
