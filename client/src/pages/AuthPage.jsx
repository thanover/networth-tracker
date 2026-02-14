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

  function toggleMode() {
    setMode(m => (m === 'login' ? 'register' : 'login'));
    setError('');
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-xl font-bold text-gh-bright mb-1">Net Worth Tracker</h1>
          <p className="text-gh-muted text-xs">
            {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-lg border border-gh-border bg-gh-surface p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
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
            </div>

            {error && (
              <p className="text-gh-red text-xs">{error}</p>
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

        {/* Toggle */}
        <p className="mt-4 text-center text-xs text-gh-muted">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={toggleMode}
            className="text-gh-blue hover:underline"
          >
            {mode === 'login' ? 'Register' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
