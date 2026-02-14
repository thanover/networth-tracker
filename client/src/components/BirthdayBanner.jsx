import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function BirthdayBanner() {
  const { updateBirthday } = useAuth();
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!value) return;
    setSaving(true);
    setError('');
    try {
      await updateBirthday(value);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-yellow-600/50 bg-yellow-900/20 px-4 py-3 flex items-center justify-between gap-4">
      <p className="text-xs text-yellow-300/90 shrink-0">
        Enter your date of birth to show age-based projections on the chart.
      </p>
      <div className="flex items-center gap-2 shrink-0">
        <input
          type="date"
          value={value}
          onChange={e => setValue(e.target.value)}
          className="bg-gh-raised border border-gh-border rounded px-2 py-1 text-xs text-gh-text focus:outline-none focus:border-yellow-500"
        />
        <button
          onClick={handleSave}
          disabled={!value || saving}
          className="px-3 py-1 rounded text-xs bg-yellow-700/60 text-yellow-200 hover:bg-yellow-700/80 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        {error && <span className="text-xs text-gh-red">{error}</span>}
      </div>
    </div>
  );
}
