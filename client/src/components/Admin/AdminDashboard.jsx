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
    <div className="flex-1 flex flex-col w-full" style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 24px 40px' }}>
      {/* Header */}
      <div className="card-enter flex items-center justify-between" style={{ marginBottom: '28px' }}>
        <h1 className="text-3xl font-black tracking-tight">Admin</h1>
        <button onClick={handleLogout} className="btn-ghost">
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="card-enter card-enter-delay-1 surface flex" style={{ padding: '5px', marginBottom: '28px' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{ padding: '12px 8px', borderRadius: '14px', flex: 1 }}
            className={`text-sm font-bold transition-all ${
              tab === t.key
                ? 'bg-accent text-dark'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            {t.label}
            {t.key !== 'decks' && counts[t.key] > 0 && (
              <span className={`text-xs font-semibold ${
                tab === t.key ? 'text-dark/40' : 'text-white/20'
              }`} style={{ marginLeft: '6px' }}>
                {counts[t.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Decks tab */}
      {tab === 'decks' && (
        <div className="card-enter">
          <DeckManager onLogout={onLogout} />
        </div>
      )}

      {/* Question tabs */}
      {tab !== 'decks' && (
        <div className="card-enter card-enter-delay-2 flex-1 flex flex-col">
          {/* Add question (only on published tab) */}
          {tab === 'published' && (
            <div style={{ marginBottom: '24px' }}>
              <form onSubmit={addQuestion} className="flex gap-3" style={{ marginBottom: '12px' }}>
                <input
                  type="text"
                  placeholder="Add a question..."
                  value={newQuestion}
                  onChange={e => setNewQuestion(e.target.value)}
                  className="input-field"
                  style={{ textAlign: 'left', fontSize: '0.95rem', padding: '14px 18px' }}
                />
                <button
                  type="submit"
                  disabled={!newQuestion.trim()}
                  style={{ padding: '14px 24px', borderRadius: '16px', whiteSpace: 'nowrap' }}
                  className="bg-accent text-dark font-bold rounded-2xl hover:bg-accent-hover transition-colors disabled:opacity-30 shrink-0"
                >
                  Add
                </button>
              </form>

              <button
                onClick={() => setShowBulk(!showBulk)}
                className="text-accent/60 hover:text-accent text-sm font-medium transition-colors"
              >
                {showBulk ? 'Hide bulk import' : '+ Bulk import'}
              </button>

              {showBulk && (
                <div style={{ marginTop: '12px' }}>
                  <textarea
                    value={bulkText}
                    onChange={e => setBulkText(e.target.value)}
                    placeholder="Paste questions here, one per line..."
                    rows={5}
                    className="w-full text-white rounded-2xl placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                    style={{ padding: '16px 18px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.95rem' }}
                  />
                  <button
                    onClick={bulkImport}
                    disabled={!bulkText.trim()}
                    style={{ marginTop: '10px', padding: '12px 24px', borderRadius: '14px' }}
                    className="bg-accent text-dark font-bold hover:bg-accent-hover transition-colors disabled:opacity-30"
                  >
                    Import
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Pending review instructions */}
          {tab === 'draft' && questions.length > 0 && (
            <p className="text-white/30 text-xs font-medium" style={{ marginBottom: '16px' }}>
              User-submitted questions awaiting review. Approve to add to the game or reject.
            </p>
          )}

          {/* Question list */}
          <div className="flex-1 overflow-y-auto" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {loading ? (
              <p className="text-white/30 text-center pulse-subtle" style={{ padding: '48px 0' }}>Loading...</p>
            ) : questions.length === 0 ? (
              <div className="text-center" style={{ padding: '56px 0' }}>
                <p className="text-white/20 text-base">
                  {tab === 'draft' ? 'No pending submissions' : tab === 'rejected' ? 'No rejected questions' : 'No published questions'}
                </p>
              </div>
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
        </div>
      )}
    </div>
  );
}
