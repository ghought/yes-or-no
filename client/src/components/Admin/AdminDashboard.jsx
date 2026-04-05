import { useState, useEffect, useCallback } from 'react';
import QuestionEditor from './QuestionEditor';

export default function AdminDashboard({ onLogout }) {
  const [questions, setQuestions] = useState([]);
  const [count, setCount] = useState(0);
  const [newQuestion, setNewQuestion] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [showBulk, setShowBulk] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchQuestions = useCallback(async () => {
    try {
      const res = await fetch('/api/questions', { credentials: 'include' });
      if (res.status === 401) {
        onLogout();
        return;
      }
      const data = await res.json();
      setQuestions(data.questions);
      setCount(data.count);
    } catch {
      // ignore
    }
    setLoading(false);
  }, [onLogout]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const addQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ text: newQuestion.trim() }),
    });
    setNewQuestion('');
    fetchQuestions();
  };

  const bulkImport = async () => {
    const lines = bulkText.split('\n').filter(l => l.trim());
    if (lines.length === 0) return;
    await fetch('/api/questions/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ questions: lines }),
    });
    setBulkText('');
    setShowBulk(false);
    fetchQuestions();
  };

  const updateQuestion = async (id, text) => {
    await fetch(`/api/questions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ text }),
    });
    fetchQuestions();
  };

  const deleteQuestion = async (id) => {
    await fetch(`/api/questions/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    fetchQuestions();
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    onLogout();
  };

  if (loading) return <div className="flex-1 flex items-center justify-center text-white/40">Loading...</div>;

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">Questions</h1>
          <p className="text-white/40 text-sm">{count} total</p>
        </div>
        <button onClick={handleLogout} className="text-white/40 hover:text-white text-sm">
          Logout
        </button>
      </div>

      {/* Add single question */}
      <form onSubmit={addQuestion} className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Add a question..."
          value={newQuestion}
          onChange={e => setNewQuestion(e.target.value)}
          className="flex-1 py-3 px-4 bg-white/10 text-white rounded-xl placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          type="submit"
          disabled={!newQuestion.trim()}
          className="px-6 py-3 bg-accent text-dark font-bold rounded-xl hover:bg-accent-hover transition-colors disabled:opacity-30"
        >
          Add
        </button>
      </form>

      {/* Bulk import toggle */}
      <button
        onClick={() => setShowBulk(!showBulk)}
        className="text-accent/70 hover:text-accent text-sm mb-4 text-left"
      >
        {showBulk ? 'Hide bulk import' : 'Bulk import (one per line)'}
      </button>

      {showBulk && (
        <div className="mb-4 space-y-2">
          <textarea
            value={bulkText}
            onChange={e => setBulkText(e.target.value)}
            placeholder="Paste questions here, one per line..."
            rows={6}
            className="w-full py-3 px-4 bg-white/10 text-white rounded-xl placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
          />
          <button
            onClick={bulkImport}
            disabled={!bulkText.trim()}
            className="px-6 py-2 bg-accent text-dark font-bold rounded-xl hover:bg-accent-hover transition-colors disabled:opacity-30"
          >
            Import
          </button>
        </div>
      )}

      {/* Question list */}
      <div className="space-y-2 overflow-y-auto flex-1">
        {questions.map(q => (
          <QuestionEditor
            key={q.id}
            question={q}
            onUpdate={updateQuestion}
            onDelete={deleteQuestion}
          />
        ))}
      </div>
    </div>
  );
}
