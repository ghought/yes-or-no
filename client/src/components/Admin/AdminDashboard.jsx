import { useState, useEffect, useCallback } from 'react';
import QuestionEditor from './QuestionEditor';
import DeckManager from './DeckManager';

const TABS = [
  { key: 'draft', label: 'Pending' },
  { key: 'published', label: 'Published' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'decks', label: 'Decks' },
];

export default function AdminDashboard({ onLogout }) {
  const [tab, setTab] = useState('draft');
  const [questions, setQuestions] = useState([]);
  const [counts, setCounts] = useState({ published: 0, draft: 0, rejected: 0 });
  const [allDecks, setAllDecks] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [showBulk, setShowBulk] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDecks = useCallback(async () => {
    try {
      const res = await fetch('/api/decks', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setAllDecks(data.decks || []);
      }
    } catch {}
  }, []);

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/questions/counts', { credentials: 'include' });
      if (res.status === 401) { onLogout(); return; }
      const data = await res.json();
      setCounts(data);
    } catch {}
  }, [onLogout]);

  const fetchQuestions = useCallback(async () => {
    if (tab === 'decks') { setLoading(false); return; }
    try {
      const res = await fetch(`/api/questions?status=${tab}`, { credentials: 'include' });
      if (res.status === 401) { onLogout(); return; }
      const data = await res.json();
      setQuestions(data.questions);
    } catch {}
    setLoading(false);
  }, [onLogout, tab]);

  useEffect(() => {
    setLoading(true);
    fetchQuestions();
    fetchCounts();
    fetchDecks();
  }, [fetchQuestions, fetchCounts, fetchDecks]);

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
    fetchCounts();
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
    fetchCounts();
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
    await fetch(`/api/questions/${id}`, { method: 'DELETE', credentials: 'include' });
    fetchQuestions();
    fetchCounts();
  };

  const approveQuestion = async (id) => {
    await fetch(`/api/questions/${id}/approve`, { method: 'POST', credentials: 'include' });
    fetchQuestions();
    fetchCounts();
  };

  const rejectQuestion = async (id) => {
    await fetch(`/api/questions/${id}/reject`, { method: 'POST', credentials: 'include' });
    fetchQuestions();
    fetchCounts();
  };

  const updateQuestionDecks = async (id, deckIds) => {
    await fetch(`/api/questions/${id}/decks`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ deckIds }),
    });
    fetchQuestions();
    fetchDecks();
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    onLogout();
  };

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">Admin Panel</h1>
        </div>
        <button onClick={handleLogout} className="text-white/40 hover:text-white text-sm">
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
              tab === t.key
                ? 'bg-accent text-dark'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            {t.label}
            {t.key !== 'decks' && counts[t.key] > 0 && (
              <span className={`ml-1.5 text-xs ${
                tab === t.key ? 'text-dark/50' : 'text-white/30'
              }`}>
                {counts[t.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Decks tab */}
      {tab === 'decks' && (
        <DeckManager onLogout={onLogout} />
      )}

      {/* Question tabs */}
      {tab !== 'decks' && (
        <>
          {/* Add question (only on published tab) */}
          {tab === 'published' && (
            <>
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
            </>
          )}

          {/* Pending review instructions */}
          {tab === 'draft' && questions.length > 0 && (
            <p className="text-white/30 text-xs mb-4">
              User-submitted questions awaiting review. Approve to add to the game or reject.
            </p>
          )}

          {/* Question list */}
          <div className="space-y-2 overflow-y-auto flex-1">
            {loading ? (
              <p className="text-white/30 text-center py-8">Loading...</p>
            ) : questions.length === 0 ? (
              <p className="text-white/20 text-center py-8">
                {tab === 'draft' ? 'No pending submissions' : tab === 'rejected' ? 'No rejected questions' : 'No published questions'}
              </p>
            ) : (
              questions.map(q => (
                <QuestionEditor
                  key={q.id}
                  question={q}
                  tab={tab}
                  allDecks={allDecks}
                  onUpdate={updateQuestion}
                  onDelete={deleteQuestion}
                  onApprove={approveQuestion}
                  onReject={rejectQuestion}
                  onUpdateDecks={updateQuestionDecks}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
