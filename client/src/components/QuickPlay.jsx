import { useState, useEffect } from 'react';

export default function QuickPlay({ onExit }) {
  const [decks, setDecks] = useState([]);
  const [selectedDeck, setSelectedDeck] = useState('');
  const [deckChosen, setDeckChosen] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch decks on mount
  useEffect(() => {
    fetch('/api/decks')
      .then(res => res.json())
      .then(data => {
        setDecks(data.decks || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Fetch questions once deck is chosen
  useEffect(() => {
    if (!deckChosen) return;
    setLoading(true);
    const url = selectedDeck
      ? `/api/quickplay/questions?deckId=${selectedDeck}`
      : '/api/quickplay/questions';
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setQuestions(data.questions);
        setIndex(0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [deckChosen, selectedDeck]);

  // Deck selection screen
  if (!deckChosen) {
    if (loading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white/40 text-lg">Loading...</p>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
        <div className="card-enter text-center">
          <h2 className="text-3xl font-black tracking-tight" style={{ marginBottom: '8px' }}>
            Choose a Deck
          </h2>
          <p className="text-white/40 text-base">
            Pick which questions to play with
          </p>
        </div>

        <div className="card-enter card-enter-delay-1 flex flex-col gap-4 w-full max-w-xs">
          <select
            value={selectedDeck}
            onChange={e => setSelectedDeck(e.target.value)}
            className="input-field"
            style={{ textAlign: 'center', appearance: 'none', WebkitAppearance: 'none' }}
          >
            <option value="">All Questions</option>
            {decks.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.questionCount})
              </option>
            ))}
          </select>

          <button
            onClick={() => setDeckChosen(true)}
            className="btn-primary"
          >
            Start Game
          </button>
          <button onClick={onExit} className="btn-ghost">
            Back
          </button>
        </div>
      </div>
    );
  }

  // Loading questions
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
        <p className="text-white/40 text-lg" style={{ marginBottom: '32px' }}>No questions in this deck.</p>
        <button onClick={() => setDeckChosen(false)} className="btn-secondary" style={{ maxWidth: '320px', marginBottom: '16px' }}>
          Choose Another Deck
        </button>
        <button onClick={onExit} className="btn-ghost">
          Back to Home
        </button>
      </div>
    );
  }

  const current = questions[index];
  const isLast = index >= questions.length - 1;

  const handleNext = () => {
    if (isLast) {
      setIndex(0);
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
