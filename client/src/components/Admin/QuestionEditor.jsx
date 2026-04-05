import { useState } from 'react';

export default function QuestionEditor({ question, onUpdate, onDelete }) {
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
    <div className="group flex items-start gap-3 bg-white/5 hover:bg-white/8 rounded-xl px-4 py-3 transition-colors">
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
        <p
          className="flex-1 text-white/80 cursor-pointer hover:text-white"
          onClick={() => setEditing(true)}
        >
          {question.text}
        </p>
      )}
      <button
        onClick={() => onDelete(question.id)}
        className="text-no/40 hover:text-no opacity-0 group-hover:opacity-100 transition-opacity text-sm shrink-0"
      >
        Delete
      </button>
    </div>
  );
}
