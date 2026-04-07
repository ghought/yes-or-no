import { useState } from 'react';

export default function QuestionEditor({ question, tab, allDecks, onUpdate, onDelete, onApprove, onReject, onUpdateDecks }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(question.text);
  const [showDecks, setShowDecks] = useState(false);

  const questionDeckIds = (question.decks || []).map(d => d.id);

  const handleSave = () => {
    if (text.trim() && text.trim() !== question.text) {
      onUpdate(question.id, text.trim());
    }
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setText(question.text);
      setEditing(false);
    }
  };

  const toggleDeck = (deckId) => {
    const current = new Set(questionDeckIds);
    if (current.has(deckId)) {
      current.delete(deckId);
    } else {
      current.add(deckId);
    }
    onUpdateDecks(question.id, Array.from(current));
  };

  return (
    <div className="group bg-white/5 hover:bg-white/8 rounded-xl px-4 py-3 transition-colors">
      <div className="flex items-start gap-3">
        <span className="text-white/20 text-sm font-mono mt-1 shrink-0">{question.id}</span>
        {editing ? (
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-white/10 text-white px-3 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            autoFocus
          />
        ) : (
          <div className="flex-1 min-w-0">
            <p
              className="text-white/80 cursor-pointer hover:text-white"
              onClick={() => setEditing(true)}
            >
              {question.text}
            </p>
            {question.submitted_by && (
              <p className="text-white/25 text-xs mt-1">
                Submitted by {question.submitted_by}
              </p>
            )}
            {/* Deck badges (published tab only) */}
            {tab === 'published' && question.decks && question.decks.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {question.decks.map(d => (
                  <span key={d.id} className="text-[10px] bg-accent/15 text-accent/70 px-2 py-0.5 rounded-full">
                    {d.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 shrink-0">
          {/* Approve/Reject for drafts */}
          {tab === 'draft' && (
            <>
              <button
                onClick={() => onApprove(question.id)}
                className="text-yes/70 hover:text-yes text-sm font-semibold transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => onReject(question.id)}
                className="text-no/70 hover:text-no text-sm font-semibold transition-colors"
              >
                Reject
              </button>
            </>
          )}

          {/* Re-approve for rejected */}
          {tab === 'rejected' && (
            <button
              onClick={() => onApprove(question.id)}
              className="text-yes/70 hover:text-yes text-sm font-semibold transition-colors"
            >
              Approve
            </button>
          )}

          {/* Deck assignment toggle (published tab) */}
          {tab === 'published' && allDecks && allDecks.length > 0 && (
            <button
              onClick={() => setShowDecks(!showDecks)}
              className="text-accent/50 hover:text-accent text-xs transition-colors"
            >
              Decks
            </button>
          )}

          {/* Delete always available */}
          <button
            onClick={() => onDelete(question.id)}
            className="text-no/40 hover:text-no opacity-0 group-hover:opacity-100 transition-opacity text-sm"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Deck assignment pills */}
      {showDecks && tab === 'published' && (
        <div className="flex flex-wrap gap-1.5 mt-2 ml-8">
          {allDecks.map(d => {
            const isActive = questionDeckIds.includes(d.id);
            return (
              <button
                key={d.id}
                onClick={() => toggleDeck(d.id)}
                className={`text-xs px-3 py-1 rounded-full border transition-all ${
                  isActive
                    ? 'bg-accent/20 text-accent border-accent/30'
                    : 'bg-white/5 text-white/30 border-white/10 hover:text-white/50'
                }`}
              >
                {d.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
