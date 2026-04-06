import { useState } from 'react';

export default function SubmitQuestion({ onBack }) {
  const [name, setName] = useState('');
  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !question.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), question: question.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
      } else {
        setSubmitted(true);
      }
    } catch {
      setError('Failed to submit. Please try again.');
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
        <div className="card-enter text-center">
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>
            {'\u2705'}
          </div>
          <h2 className="text-3xl font-black tracking-tight" style={{ marginBottom: '12px' }}>
            Question Submitted!
          </h2>
          <p className="text-white/40 text-base">
            Your question will be reviewed and added to the game if approved.
          </p>
        </div>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button
            onClick={() => { setSubmitted(false); setName(''); setQuestion(''); }}
            className="btn-primary"
          >
            Submit Another
          </button>
          <button onClick={onBack} className="btn-ghost">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
      <div className="card-enter text-center">
        <h2 className="text-3xl font-black tracking-tight" style={{ marginBottom: '8px' }}>
          Submit a Question
        </h2>
        <p className="text-white/40 text-base">
          Suggest a YES or NO question for the game
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card-enter card-enter-delay-1 flex flex-col gap-6 w-full max-w-sm">
        <div>
          <label className="block text-white/40 text-xs font-semibold uppercase tracking-[0.15em] mb-2">
            Your Name
          </label>
          <input
            type="text"
            placeholder="e.g. Sarah"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={40}
            className="input-field"
            style={{ textAlign: 'left' }}
            autoFocus
          />
        </div>

        <div>
          <label className="block text-white/40 text-xs font-semibold uppercase tracking-[0.15em] mb-2">
            Your Question
          </label>
          <textarea
            placeholder="Would you rather..."
            value={question}
            onChange={e => setQuestion(e.target.value)}
            maxLength={200}
            rows={3}
            className="input-field resize-none"
            style={{ textAlign: 'left' }}
          />
          <p className="text-white/20 text-xs mt-1 text-right">{question.length}/200</p>
        </div>

        {error && (
          <p className="text-no text-sm text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={!name.trim() || !question.trim() || submitting}
          className="btn-primary"
        >
          {submitting ? 'Submitting...' : 'Submit Question'}
        </button>

        <button type="button" onClick={onBack} className="btn-ghost">
          Back
        </button>
      </form>
    </div>
  );
}
