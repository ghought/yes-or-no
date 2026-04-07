import { useState } from 'react';

export default function QuestionEditor({ question, tab, allDecks, onUpdate, onDelete, onApprove, onReject, onUpdateDecks }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(question.text);
  const [showDecks, setShowDecks] = useState(false);
  const [expanded, setExpanded] = useState(false);

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
    <div className="surface group transition-colors hover:bg-white/[0.06]" style={{ padding: '16px 20px' }}>
      <div className="flex items-start" style={{ gap: '12px' }}>
        <span className="text-white/15 text-xs font-mono shrink-0" style={{ marginTop: '3px' }}>
          {question.id}
        </span>

        {editing ? (
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="flex-1 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-accent"
            style={{ background: 'rgba(255,255,255,0.1)', padding: '8px 14px', fontSize: '0.95rem' }}
            autoFocus
          />
        ) : (
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => setExpanded(!expanded)}
          >
            <p
              className="text-white/80 hover:text-white transition-colors"
              style={{ fontSize: '0.95rem', lineHeight: '1.5' }}
            >
              {question.text}
            </p>
            {question.submitted_by && (
              <p className="text-white/20 text-xs" style={{ marginTop: '4px' }}>
                by {question.submitted_by}
              </p>
            )}
            {/* Deck badges (published tab only) */}
            {tab === 'published' && question.decks && question.decks.length > 0 && (
              <div className="flex flex-wrap" style={{ gap: '5px', marginTop: '8px' }}>
                {question.decks.map(d => (
                  <span
                    key={d.id}
                    className="text-accent/60 font-semibold"
                    style={{ fontSize: '10px', background: 'rgba(226,255,63,0.08)', padding: '2px 10px', borderRadius: '99px' }}
                  >
                    {d.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Desktop actions — visible on hover */}
        <div className="hidden sm:flex items-center shrink-0" style={{ gap: '8px' }}>
          {tab === 'draft' && (
            <>
              <button
                onClick={() => onApprove(question.id)}
                className="text-yes/70 hover:text-yes font-bold transition-colors"
                style={{ fontSize: '13px', padding: '6px 10px' }}
                title="Approve"
              >
                ✓
              </button>
              <button
                onClick={() => onReject(question.id)}
                className="text-no/70 hover:text-no font-bold transition-colors"
                style={{ fontSize: '13px', padding: '6px 10px' }}
                title="Reject"
              >
                ↓
              </button>
            </>
          )}

          {tab === 'rejected' && (
            <button
              onClick={() => onApprove(question.id)}
              className="text-yes/70 hover:text-yes font-bold transition-colors"
              style={{ fontSize: '13px', padding: '6px 10px' }}
              title="Approve"
            >
              ✓
            </button>
          )}

          {tab === 'published' && allDecks && allDecks.length > 0 && (
            <button
              onClick={() => setShowDecks(!showDecks)}
              className={`transition-colors font-semibold ${showDecks ? 'text-accent' : 'text-white/25 hover:text-white/50'}`}
              style={{ fontSize: '11px', padding: '6px 10px' }}
            >
              Decks
            </button>
          )}

          <button
            onClick={() => onDelete(question.id)}
            className="text-no/30 hover:text-no opacity-0 group-hover:opacity-100 transition-all"
            style={{ fontSize: '12px', padding: '6px 10px' }}
            title="Delete"
          >
            🗑
          </button>
        </div>

        {/* Mobile: expand chevron */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="sm:hidden text-white/25 shrink-0 transition-transform"
          style={{ fontSize: '14px', padding: '4px 6px', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          ▾
        </button>
      </div>

      {/* Mobile expanded actions */}
      {expanded && (
        <div className="sm:hidden flex flex-wrap items-center" style={{ gap: '8px', marginTop: '12px', marginLeft: '32px' }}>
          <button
            onClick={() => setEditing(true)}
            style={{ fontSize: '12px', padding: '8px 16px', borderRadius: '12px' }}
            className="bg-white/8 text-white/60 font-semibold transition-colors active:bg-white/15"
          >
            Edit
          </button>

          {tab === 'draft' && (
            <>
              <button
                onClick={() => onApprove(question.id)}
                style={{ fontSize: '12px', padding: '8px 16px', borderRadius: '12px' }}
                className="bg-yes/15 text-yes/80 font-semibold transition-colors active:bg-yes/25"
              >
                Approve
              </button>
              <button
                onClick={() => onReject(question.id)}
                style={{ fontSize: '12px', padding: '8px 16px', borderRadius: '12px' }}
                className="bg-no/15 text-no/80 font-semibold transition-colors active:bg-no/25"
              >
                Reject
              </button>
            </>
          )}

          {tab === 'rejected' && (
            <button
              onClick={() => onApprove(question.id)}
              style={{ fontSize: '12px', padding: '8px 16px', borderRadius: '12px' }}
              className="bg-yes/15 text-yes/80 font-semibold transition-colors active:bg-yes/25"
            >
              Approve
            </button>
          )}

          {tab === 'published' && allDecks && allDecks.length > 0 && (
            <button
              onClick={() => setShowDecks(!showDecks)}
              style={{ fontSize: '12px', padding: '8px 16px', borderRadius: '12px' }}
              className={`font-semibold transition-colors ${showDecks ? 'bg-accent/15 text-accent' : 'bg-white/8 text-white/60 active:bg-white/15'}`}
            >
              Decks
            </button>
          )}

          <button
            onClick={() => onDelete(question.id)}
            style={{ fontSize: '12px', padding: '8px 16px', borderRadius: '12px' }}
            className="bg-no/10 text-no/50 font-semibold transition-colors active:bg-no/20"
          >
            Delete
          </button>
        </div>
      )}

      {/* Deck assignment pills */}
      {showDecks && tab === 'published' && (
        <div className="flex flex-wrap" style={{ gap: '8px', marginTop: '12px', marginLeft: '32px' }}>
          {allDecks.map(d => {
            const isActive = questionDeckIds.includes(d.id);
            return (
              <button
                key={d.id}
                onClick={() => toggleDeck(d.id)}
                style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '99px', border: '1px solid' }}
                className={`font-semibold transition-all ${
                  isActive
                    ? 'bg-accent/15 text-accent border-accent/25'
                    : 'bg-white/5 text-white/30 border-white/10 hover:text-white/50 hover:border-white/20'
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
