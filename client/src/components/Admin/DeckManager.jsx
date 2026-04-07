import { useState, useEffect, useCallback } from 'react';

export default function DeckManager({ onLogout }) {
  const [decks, setDecks] = useState([]);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchDecks = useCallback(async () => {
    try {
      const res = await fetch('/api/decks', { credentials: 'include' });
      if (res.status === 401) { onLogout(); return; }
      const data = await res.json();
      setDecks(data.decks || []);
    } catch {}
    setLoading(false);
  }, [onLogout]);

  useEffect(() => { fetchDecks(); }, [fetchDecks]);

  const createDeck = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await fetch('/api/decks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: newName.trim() }),
    });
    setNewName('');
    fetchDecks();
  };

  const saveDeckName = async (id) => {
    if (!editName.trim()) return;
    await fetch(`/api/decks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: editName.trim() }),
    });
    setEditingId(null);
    fetchDecks();
  };

  const deleteDeck = async (id) => {
    await fetch(`/api/decks/${id}`, { method: 'DELETE', credentials: 'include' });
    fetchDecks();
  };

  if (loading) {
    return <p className="text-white/30 text-center pulse-subtle" style={{ padding: '48px 0' }}>Loading...</p>;
  }

  return (
    <div>
      {/* Create deck */}
      <form onSubmit={createDeck} className="flex" style={{ gap: '12px', marginBottom: '28px' }}>
        <input
          type="text"
          placeholder="New deck name..."
          value={newName}
          onChange={e => setNewName(e.target.value)}
          className="input-field"
          style={{ textAlign: 'left', fontSize: '0.95rem', padding: '14px 18px' }}
        />
        <button
          type="submit"
          disabled={!newName.trim()}
          style={{ padding: '14px 24px', borderRadius: '16px', whiteSpace: 'nowrap' }}
          className="bg-accent text-dark font-bold hover:bg-accent-hover transition-colors disabled:opacity-30 shrink-0"
        >
          Create
        </button>
      </form>

      {/* Deck list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {decks.length === 0 ? (
          <div className="text-center" style={{ padding: '56px 0' }}>
            <p className="text-white/20 text-base">No decks yet. Create one above.</p>
          </div>
        ) : (
          decks.map(d => (
            <div
              key={d.id}
              className="surface group transition-colors hover:bg-white/[0.06]"
              style={{ padding: '16px 20px' }}
            >
              <div className="flex items-center" style={{ gap: '12px' }}>
                {editingId === d.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onBlur={() => saveDeckName(d.id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') saveDeckName(d.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="flex-1 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-accent"
                    style={{ background: 'rgba(255,255,255,0.1)', padding: '8px 14px', fontSize: '0.95rem' }}
                    autoFocus
                  />
                ) : (
                  <p
                    className="flex-1 text-white/80 cursor-pointer hover:text-white font-semibold transition-colors"
                    onClick={() => { setEditingId(d.id); setEditName(d.name); }}
                    style={{ fontSize: '0.95rem' }}
                  >
                    {d.name}
                  </p>
                )}
                <span className="text-white/25 text-xs font-medium shrink-0">
                  {d.questionCount} questions
                </span>
                <button
                  onClick={() => deleteDeck(d.id)}
                  className="text-no/30 hover:text-no opacity-0 group-hover:opacity-100 transition-all"
                  style={{ fontSize: '13px', padding: '6px 10px' }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
