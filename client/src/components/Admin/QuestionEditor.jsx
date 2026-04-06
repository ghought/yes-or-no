import { useState } from 'react';

export default function QuestionEditor({ question, tab, onUpdate, onDelete, onApprove, onReject }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(question.text);

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

          {/* Delete always available */}
          <button
            onClick={() => onDelete(question.id)}
            className="text-no/40 hover:text-no opacity-0 group-hover:opacity-100 transition-opacity text-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
