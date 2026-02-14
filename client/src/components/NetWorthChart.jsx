import { useState, useMemo } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, Legend, CartesianGrid,
} from 'recharts';
import { project } from '@/utils/projection';
import { useAuth } from '@/context/AuthContext';

const RANGES = [
  { label: '1Y',  months: 12 },
  { label: '5Y',  months: 60 },
  { label: '10Y', months: 120 },
  { label: '40Y', months: 480 },
];

function fmtCurrency(n) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${n < 0 ? '-' : ''}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)     return `${n < 0 ? '-' : ''}$${(abs / 1_000).toFixed(0)}K`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function fmtMonth(month, months) {
  if (months <= 12) return `Mo ${month}`;
  const yr = month / 12;
  return Number.isInteger(yr) ? `Yr ${yr}` : '';
}

function ageAtMonth(birthdayStr, monthOffset) {
  const bd = new Date(birthdayStr);
  const now = new Date();
  const future = new Date(now.getFullYear(), now.getMonth() + monthOffset, now.getDate());
  let age = future.getFullYear() - bd.getFullYear();
  if (
    future.getMonth() < bd.getMonth() ||
    (future.getMonth() === bd.getMonth() && future.getDate() < bd.getDate())
  ) age--;
  return { age, year: future.getFullYear() };
}

function AgeTick({ x, y, payload, birthday }) {
  const { age, year } = ageAtMonth(birthday, payload.value);
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={12} textAnchor="middle" fill="#8b949e" fontSize={11}>
        Age {age}
      </text>
      <text x={0} y={0} dy={24} textAnchor="middle" fill="#6e7681" fontSize={10}>
        {year}
      </text>
    </g>
  );
}

function CustomTooltip({ active, payload, label, months, birthday }) {
  if (!active || !payload?.length) return null;
  let title;
  if (birthday) {
    const { age, year } = ageAtMonth(birthday, label);
    title = `Age ${age} (${year})`;
  } else {
    const yr = (label / 12).toFixed(1);
    title = months <= 12 ? `Month ${label}` : `Year ${yr}`;
  }
  return (
    <div className="rounded-md border border-gh-border bg-gh-surface px-3 py-2 text-xs shadow-lg">
      <p className="text-gh-muted mb-1">{title}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {fmtCurrency(p.value)}
        </p>
      ))}
    </div>
  );
}

export default function NetWorthChart({ accounts, birthday }) {
  const { updateBirthday } = useAuth();
  const [rangeIdx, setRangeIdx] = useState(1); // default 5Y
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const { months } = RANGES[rangeIdx];

  const data = useMemo(() => {
    if (!accounts.length) return [];
    const raw = project(accounts, months);
    const step = months <= 60 ? 1 : months <= 120 ? 3 : 6;
    return raw.filter((_, i) => i % step === 0);
  }, [accounts, months]);

  async function handleEditSave() {
    if (!editValue) return;
    setSaving(true);
    try {
      await updateBirthday(editValue);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  // ~5 evenly spaced ticks regardless of range
  const tickInterval = months <= 12 ? 3 : months <= 60 ? 12 : months <= 120 ? 24 : 96;
  const ticks = Array.from({ length: Math.floor(months / tickInterval) }, (_, i) => (i + 1) * tickInterval);

  // Derive tick props based on birthday
  const xAxisProps = birthday
    ? {
        ticks,
        tick: (props) => <AgeTick {...props} birthday={birthday} />,
        height: 40,
      }
    : {
        ticks,
        tickFormatter: m => fmtMonth(m, months),
        tick: { fill: '#8b949e', fontSize: 11 },
      };

  if (!accounts.length) return null;

  return (
    <div className="rounded-lg border border-gh-border bg-gh-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gh-border">
        <span className="text-xs uppercase tracking-widest text-gh-muted font-medium">Projected Net Worth</span>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <input
                type="date"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                className="bg-gh-raised border border-gh-border rounded px-2 py-0.5 text-xs text-gh-text focus:outline-none focus:border-gh-blue"
              />
              <button
                onClick={handleEditSave}
                disabled={!editValue || saving}
                className="text-xs text-gh-green hover:underline disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-xs text-gh-muted hover:text-gh-text"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              {birthday && (
                <button
                  onClick={() => { setEditValue(''); setEditing(true); }}
                  className="text-xs text-gh-muted hover:text-gh-blue transition-colors"
                >
                  Edit DOB
                </button>
              )}
              {RANGES.map((r, i) => (
                <button
                  key={r.label}
                  onClick={() => setRangeIdx(i)}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    i === rangeIdx
                      ? 'bg-gh-raised text-gh-bright'
                      : 'text-gh-muted hover:text-gh-text'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="px-2 py-4" style={{ height: birthday ? 300 : 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
            <XAxis
              dataKey="month"
              axisLine={{ stroke: '#30363d' }}
              tickLine={false}
              {...xAxisProps}
            />
            <YAxis
              tickFormatter={fmtCurrency}
              tick={{ fill: '#8b949e', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip content={<CustomTooltip months={months} birthday={birthday} />} />
            <Legend
              wrapperStyle={{ fontSize: 11, color: '#8b949e', paddingTop: 8 }}
              iconType="plainline"
            />
            <Line type="monotone" dataKey="assets"   name="Assets"    stroke="#3fb950" dot={false} strokeWidth={1.5} />
            <Line type="monotone" dataKey="debts"    name="Debts"     stroke="#f85149" dot={false} strokeWidth={1.5} />
            <Line type="monotone" dataKey="netWorth" name="Net Worth" stroke="#388bfd" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
