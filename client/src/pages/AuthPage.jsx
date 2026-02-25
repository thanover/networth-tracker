import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(username, password);
      } else {
        await register(username, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function switchMode(newMode) {
    if (newMode !== mode) {
      setMode(newMode);
      setError('');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-xl font-bold text-gh-bright mb-1">Net Worth Tracker</h1>
        </div>

        {/* Card */}
        <div className="rounded-lg border border-gh-border bg-gh-surface overflow-hidden">
          {/* Tab switcher */}
          <div className="flex border-b border-gh-border">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                mode === 'login'
                  ? 'text-gh-text border-b-2 border-gh-blue bg-gh-raised'
                  : 'text-gh-muted hover:text-gh-text'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                mode === 'register'
                  ? 'text-gh-text border-b-2 border-gh-blue bg-gh-raised'
                  : 'text-gh-muted hover:text-gh-text'
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs text-gh-muted mb-1.5 uppercase tracking-wide">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="w-full rounded-md border border-gh-border bg-gh-raised px-3 py-2 text-gh-text text-sm outline-none focus:border-gh-blue focus:ring-1 focus:ring-gh-blue"
              />
            </div>

            <div>
              <label className="block text-xs text-gh-muted mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="w-full rounded-md border border-gh-border bg-gh-raised px-3 py-2 text-gh-text text-sm outline-none focus:border-gh-blue focus:ring-1 focus:ring-gh-blue"
              />
              {mode === 'register' && (
                <p className="mt-1.5 text-xs text-gh-muted">Must be at least 6 characters.</p>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-md border border-gh-red/40 bg-gh-red/10 px-3 py-2.5">
                <svg
                  className="mt-0.5 h-4 w-4 shrink-0 text-gh-red"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1Zm0 1.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 7.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                </svg>
                <p className="text-gh-red text-sm leading-snug">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-gh-blue px-4 py-2 text-sm font-medium text-white hover:bg-gh-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {loading
                ? (mode === 'login' ? 'Signing in…' : 'Creating account…')
                : (mode === 'login' ? 'Sign in' : 'Create account')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
