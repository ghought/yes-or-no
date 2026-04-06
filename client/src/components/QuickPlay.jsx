import { useState, useEffect } from 'react';

export default function QuickPlay({ onExit }) {
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/quickplay/questions')
      .then(res => res.json())
      .then(data => {
        setQuestions(data.questions);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-white/40 text-lg">Loading questions...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center" style={{ padding: '48px 24px' }}>
        <p className="text-white/40 text-lg" style={{ marginBottom: '32px' }}>No questions available.</p>
        <button onClick={onExit} className="btn-secondary" style={{ maxWidth: '320px' }}>
          Back
        </button>
      </div>
    );
  }

  const current = questions[index];
  const isLast = index >= questions.length - 1;

  const handleNext = () => {
    if (isLast) {
      setIndex(0); // loop back
    } else {
      setIndex(i => i + 1);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center" style={{ paddingTop: '48px', paddingBottom: '40px' }}>
      {/* Question card */}
      <div className="w-full max-w-md mx-auto" style={{ padding: '0 24px' }}>
        <div className="text-center" style={{ marginBottom: '24px' }}>
          <span className="text-white/25 text-xs font-semibold uppercase tracking-[0.2em]">
            Question {index + 1} of {questions.length}
          </span>
        </div>
        <div
          key={index}
          className="card-enter bg-white rounded-[28px] shadow-[0_8px_40px_rgba(0,0,0,0.35),0_2px_8px_rgba(0,0,0,0.2)] min-h-[240px] flex items-center justify-center relative overflow-hidden"
          style={{ padding: '56px 40px' }}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          <p className="text-dark text-[1.65rem] font-extrabold text-center leading-snug tracking-tight">
            {current.text}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full max-w-md mx-auto" style={{ marginTop: '48px', padding: '0 24px' }}>
        <button onClick={handleNext} className="btn-primary text-xl" style={{ marginBottom: '20px' }}>
          Next Question
        </button>
        <div className="text-center">
          <button onClick={onExit} className="btn-ghost">
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}
