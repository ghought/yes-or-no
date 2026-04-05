import { useState } from 'react';

export default function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        onLogin();
      } else {
        setError('Wrong password');
      }
    } catch {
      setError('Connection error');
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      <h1 className="text-3xl font-black mb-8">Admin Login</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full py-4 px-6 bg-white/10 text-white text-center text-xl rounded-2xl placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-accent"
          autoFocus
        />
        {error && <p className="text-no text-center text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading || !password}
          className="w-full py-4 bg-accent text-dark font-bold text-xl rounded-2xl hover:bg-accent-hover transition-colors disabled:opacity-30"
        >
          {loading ? 'Checking...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
