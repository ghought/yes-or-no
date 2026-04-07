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
    <div className="flex-1 flex flex-col items-center justify-center" style={{ padding: '48px 24px' }}>
      <div className="card-enter text-center" style={{ marginBottom: '40px' }}>
        <h1 className="text-4xl font-black tracking-tight" style={{ marginBottom: '8px' }}>
          Admin
        </h1>
        <p className="text-white/30 text-base">Enter your password to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="card-enter card-enter-delay-1 w-full" style={{ maxWidth: '360px' }}>
        <div style={{ marginBottom: '16px' }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="input-field"
            autoFocus
          />
        </div>

        {error && (
          <p className="text-no text-center text-sm font-semibold" style={{ marginBottom: '16px' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !password}
          className="btn-primary text-xl"
        >
          {loading ? 'Checking...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
