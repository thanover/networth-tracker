import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar */}
      <header className="border-b border-gh-border bg-gh-surface px-6 py-3 flex items-center justify-between">
        <span className="text-gh-bright font-bold text-sm">Net Worth Tracker</span>
        <div className="flex items-center gap-4">
          <span className="text-gh-muted text-xs">{user.username}</span>
          <button
            onClick={logout}
            className="text-xs text-gh-muted hover:text-gh-text transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Placeholder content */}
      <main className="flex flex-1 items-center justify-center">
        <p className="text-gh-muted text-sm">Dashboard coming soon.</p>
      </main>
    </div>
  );
}
