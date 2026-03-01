import { useMemo } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { projectByAccount } from '@/utils/projection';

// Green shades for asset accounts (light → dark)
const ASSET_COLORS = ['#85e89d', '#56d364', '#3fb950', '#2ea043', '#238636', '#1a7f37', '#196c2e', '#144620'];
// Red shades for debt accounts (light → dark)
const DEBT_COLORS  = ['#ffa198', '#ff7b72', '#f85149', '#da3633', '#b62324', '#8e1519', '#67060c', '#490202'];

function fmtCurrency(n) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)     return `$${(abs / 1_000).toFixed(0)}K`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function fmtMonth(month, months) {
  if (months <= 12) return `Mo ${month}`;
  const yr = month / 12;
  return Number.isInteger(yr) ? `Yr ${yr}` : '';
}

function MiniTooltip({ active, payload, label, months }) {
  if (!active || !payload?.length) return null;
  const yr = (label / 12).toFixed(1);
  const title = months <= 12 ? `Month ${label}` : `Year ${yr}`;
  const total = payload.reduce((s, p) => s + (p.value ?? 0), 0);
  return (
    <div className="rounded-md border border-gh-border bg-gh-surface px-3 py-2 text-xs shadow-lg">
      <p className="text-gh-muted mb-1">{title}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }} className="pl-2">
          {p.name}: {fmtCurrency(p.value)}
        </p>
      ))}
      {payload.length > 1 && (
        <p className="text-gh-muted mt-1">Total: {fmtCurrency(total)}</p>
      )}
    </div>
  );
}

function applyInflation(data, accounts, inflationRate) {
  const r = inflationRate / 100 / 12;
  return data.map(d => {
    const deflator = Math.pow(1 + r, d.month);
    const deflated = { ...d };
    accounts.forEach(a => {
      if (d[a._id] !== undefined) deflated[a._id] = d[a._id] / deflator;
    });
    return deflated;
  });
}

export default function AccountMiniChart({ accounts, months, category, real = false, inflationRate = 3.5 }) {
  const colors = category === 'asset' ? ASSET_COLORS : DEBT_COLORS;

  const data = useMemo(() => {
    if (!accounts.length) return [];
    const raw = projectByAccount(accounts, months);
    const step = months <= 60 ? 1 : months <= 120 ? 3 : 6;
    const thinned = raw.filter((_, i) => i % step === 0);
    return real ? applyInflation(thinned, accounts, inflationRate) : thinned;
  }, [accounts, months, real, inflationRate]);

  if (!accounts.length) return null;

  const tickInterval = months <= 12 ? 3 : months <= 60 ? 12 : months <= 120 ? 24 : 96;
  const ticks = Array.from({ length: Math.floor(months / tickInterval) }, (_, i) => (i + 1) * tickInterval);

  return (
    <div className="px-2 pt-3 pb-2 border-b border-gh-border" style={{ height: 180 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
          <XAxis
            dataKey="month"
            ticks={ticks}
            tickFormatter={m => fmtMonth(m, months)}
            tick={{ fill: '#8b949e', fontSize: 10 }}
            axisLine={{ stroke: '#30363d' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={fmtCurrency}
            tick={{ fill: '#8b949e', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip content={<MiniTooltip months={months} />} />
          {accounts.map((account, i) => (
            <Area
              key={account._id}
              type="monotone"
              dataKey={account._id}
              name={account.name}
              stackId="stack"
              stroke={colors[i % colors.length]}
              fill={colors[i % colors.length]}
              fillOpacity={0.5}
              dot={false}
              strokeWidth={1}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
