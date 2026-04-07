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

  if (loading) return <p className="text-white/30 text-center py-8">Loading...</p>;

  return (
    <div>
      {/* Create deck */}
      <form onSubmit={createDeck} className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="New deck name..."
          value={newName}
          onChange={e => setNewName(e.target.value)}
          className="flex-1 py-3 px-4 bg-white/10 text-white rounded-xl placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          type="submit"
          disabled={!newName.trim()}
          className="px-6 py-3 bg-accent text-dark font-bold rounded-xl hover:bg-accent-hover transition-colors disabled:opacity-30"
        >
          Create
        </button>
      </form>

      {/* Deck list */}
      <div className="space-y-2">
        {decks.length === 0 ? (
          <p className="text-white/20 text-center py-8">No decks yet. Create one above.</p>
        ) : (
          decks.map(d => (
            <div key={d.id} className="group flex items-center gap-3 bg-white/5 hover:bg-white/8 rounded-xl px-4 py-3 transition-colors">
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
                  className="flex-1 bg-white/10 text-white px-3 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  autoFocus
                />
              ) : (
                <p
                  className="flex-1 text-white/80 cursor-pointer hover:text-white font-semibold"
                  onClick={() => { setEditingId(d.id); setEditName(d.name); }}
                >
                  {d.name}
                </p>
              )}
              <span className="text-white/30 text-sm shrink-0">{d.questionCount} questions</span>
              <button
                onClick={() => deleteDeck(d.id)}
                className="text-no/40 hover:text-no opacity-0 group-hover:opacity-100 transition-opacity text-sm shrink-0"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
