function App() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gh-bright mb-4">
          Net Worth Tracker
        </h1>
        <p className="text-gh-muted text-sm">
          Track your assets, debts, and projected net worth over time.
        </p>
        <div className="mt-8 inline-block rounded-lg border border-gh-border bg-gh-surface px-6 py-3">
          <span className="text-gh-green text-2xl font-bold">$0.00</span>
        </div>
      </div>
    </div>
  )
}

export default App
