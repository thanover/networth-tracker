import { useState, useMemo } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, Legend, CartesianGrid,
} from 'recharts';
import { project } from '@/utils/projection';

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
  // Label x-axis as years when range > 1Y, otherwise as months
  if (months <= 12) return `Mo ${month}`;
  const yr = month / 12;
  return Number.isInteger(yr) ? `Yr ${yr}` : '';
}

function CustomTooltip({ active, payload, label, months }) {
  if (!active || !payload?.length) return null;
  const yr  = (label / 12).toFixed(1);
  const title = months <= 12 ? `Month ${label}` : `Year ${yr}`;
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

export default function NetWorthChart({ accounts }) {
  const [rangeIdx, setRangeIdx] = useState(1); // default 5Y
  const { months } = RANGES[rangeIdx];

  const data = useMemo(() => {
    if (!accounts.length) return [];
    const raw = project(accounts, months);
    // Thin out data points for large ranges to keep rendering fast
    const step = months <= 60 ? 1 : months <= 120 ? 3 : 6;
    return raw.filter((_, i) => i % step === 0);
  }, [accounts, months]);

  if (!accounts.length) return null;

  return (
    <div className="rounded-lg border border-gh-border bg-gh-surface">
      {/* Header with range toggle */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gh-border">
        <span className="text-xs uppercase tracking-widest text-gh-muted font-medium">Projected Net Worth</span>
        <div className="flex gap-1">
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
        </div>
      </div>

      {/* Chart */}
      <div className="px-2 py-4" style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
            <XAxis
              dataKey="month"
              tickFormatter={m => fmtMonth(m, months)}
              tick={{ fill: '#8b949e', fontSize: 11 }}
              axisLine={{ stroke: '#30363d' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={fmtCurrency}
              tick={{ fill: '#8b949e', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip content={<CustomTooltip months={months} />} />
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
