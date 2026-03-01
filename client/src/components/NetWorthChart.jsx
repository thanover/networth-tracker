import { useState, useMemo } from 'react';
import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis,
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

// Green shades for asset accounts (light → dark)
const ASSET_COLORS = ['#85e89d', '#56d364', '#3fb950', '#2ea043', '#238636', '#1a7f37', '#196c2e', '#144620'];
// Red shades for debt accounts (light → dark)
const DEBT_COLORS  = ['#ffa198', '#ff7b72', '#f85149', '#da3633', '#b62324', '#8e1519', '#67060c', '#490202'];

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

function CustomTooltip({ active, payload, label, months, birthday, real, assetAccounts, debtAccounts }) {
  if (!active || !payload?.length) return null;

  let title;
  if (birthday) {
    const { age, year } = ageAtMonth(birthday, label);
    title = `Age ${age} (${year})`;
  } else {
    const yr = (label / 12).toFixed(1);
    title = months <= 12 ? `Month ${label}` : `Year ${yr}`;
  }

  const byKey = Object.fromEntries(payload.map(p => [p.dataKey, p]));

  const totalAssets = assetAccounts.reduce((s, a) => s + (byKey[a._id]?.value ?? 0), 0);
  const totalDebts  = debtAccounts.reduce((s, a)  => s - (byKey[a._id]?.value ?? 0), 0);
  const netWorthEntry = byKey['netWorth'];

  return (
    <div className="rounded-md border border-gh-border bg-gh-surface px-3 py-2 text-xs shadow-lg">
      <p className="text-gh-muted mb-1">{title}{real ? ' · real' : ''}</p>

      {assetAccounts.length > 0 && (
        <>
          <p className="text-gh-muted mt-1 mb-0.5 font-semibold">Assets {fmtCurrency(totalAssets)}</p>
          {assetAccounts.map(a => {
            const entry = byKey[a._id];
            if (!entry) return null;
            return (
              <p key={a._id} style={{ color: entry.color }} className="pl-2">
                {a.name}: {fmtCurrency(entry.value)}
              </p>
            );
          })}
        </>
      )}

      {debtAccounts.length > 0 && (
        <>
          <p className="text-gh-muted mt-1 mb-0.5 font-semibold">Debts {fmtCurrency(totalDebts)}</p>
          {debtAccounts.map(a => {
            const entry = byKey[a._id];
            if (!entry) return null;
            return (
              <p key={a._id} style={{ color: entry.color }} className="pl-2">
                {a.name}: {fmtCurrency(Math.abs(entry.value))}
              </p>
            );
          })}
        </>
      )}

      {netWorthEntry && (
        <p style={{ color: netWorthEntry.color }} className="mt-1 font-semibold">
          Net Worth: {fmtCurrency(netWorthEntry.value)}
        </p>
      )}
    </div>
  );
}

function applyInflation(data, inflationRate, accountIds) {
  const r = inflationRate / 100 / 12;
  return data.map(d => {
    const deflator = Math.pow(1 + r, d.month);
    const deflated = {
      ...d,
      assets:   d.assets   / deflator,
      debts:    d.debts    / deflator,
      netWorth: d.netWorth / deflator,
    };
    accountIds.forEach(id => {
      if (d[id] !== undefined) deflated[id] = d[id] / deflator;
    });
    return deflated;
  });
}

export default function NetWorthChart({ accounts, birthday, inflationRate = 3.5 }) {
  const { updateBirthday, updateInflationRate } = useAuth();
  const [rangeIdx, setRangeIdx] = useState(1);
  const [real, setReal] = useState(false);
  const [editingDob, setEditingDob] = useState(false);
  const [dobValue, setDobValue] = useState('');
  const [rateInput, setRateInput] = useState(String(inflationRate));
  const [savingDob, setSavingDob] = useState(false);
  const [savingRate, setSavingRate] = useState(false);
  const { months } = RANGES[rangeIdx];

  const currentAge = birthday ? ageAtMonth(birthday, 0).age : null;
  const rateChanged = parseFloat(rateInput) !== inflationRate;

  const assetAccounts = useMemo(() => accounts.filter(a => a.category === 'asset'), [accounts]);
  const debtAccounts  = useMemo(() => accounts.filter(a => a.category === 'debt'),  [accounts]);
  const accountIds    = useMemo(() => accounts.map(a => a._id), [accounts]);

  const data = useMemo(() => {
    if (!accounts.length) return [];
    const raw = project(accounts, months);
    const step = months <= 60 ? 1 : months <= 120 ? 3 : 6;
    const thinned = raw.filter((_, i) => i % step === 0);
    return real ? applyInflation(thinned, inflationRate, accountIds) : thinned;
  }, [accounts, months, real, inflationRate, accountIds]);

  async function handleDobSave() {
    if (!dobValue) return;
    setSavingDob(true);
    try {
      await updateBirthday(dobValue);
      setEditingDob(false);
    } finally {
      setSavingDob(false);
    }
  }

  async function handleRateSave() {
    const rate = parseFloat(rateInput);
    if (isNaN(rate) || rate < 0) return;
    setSavingRate(true);
    try {
      await updateInflationRate(rate);
    } finally {
      setSavingRate(false);
    }
  }

  const tickInterval = months <= 12 ? 3 : months <= 60 ? 12 : months <= 120 ? 24 : 96;
  const ticks = Array.from({ length: Math.floor(months / tickInterval) }, (_, i) => (i + 1) * tickInterval);

  const xAxisProps = birthday
    ? { ticks, tick: (props) => <AgeTick {...props} birthday={birthday} />, height: 40 }
    : { ticks, tickFormatter: m => fmtMonth(m, months), tick: { fill: '#8b949e', fontSize: 11 } };

  if (!accounts.length) return null;

  return (
    <div className="rounded-lg border border-gh-border bg-gh-surface">
      {/* Header — title + range buttons only */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gh-border">
        <span className="text-xs uppercase tracking-widest text-gh-muted font-medium">Projected Net Worth</span>
        <div className="flex gap-1">
          {RANGES.map((r, i) => (
            <button
              key={r.label}
              onClick={() => setRangeIdx(i)}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                i === rangeIdx ? 'bg-gh-raised text-gh-bright' : 'text-gh-muted hover:text-gh-text'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="px-2 py-4" style={{ height: birthday ? 300 : 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
            <XAxis dataKey="month" axisLine={{ stroke: '#30363d' }} tickLine={false} {...xAxisProps} />
            <YAxis tickFormatter={fmtCurrency} tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
            <Tooltip
              content={
                <CustomTooltip
                  months={months}
                  birthday={birthday}
                  real={real}
                  assetAccounts={assetAccounts}
                  debtAccounts={debtAccounts}
                />
              }
            />
            <Legend wrapperStyle={{ fontSize: 11, color: '#8b949e', paddingTop: 8 }} iconType="rect" />

            {/* Asset accounts — stacked green areas */}
            {assetAccounts.map((account, i) => (
              <Area
                key={account._id}
                type="monotone"
                dataKey={account._id}
                name={account.name}
                stackId="assets"
                stroke={ASSET_COLORS[i % ASSET_COLORS.length]}
                fill={ASSET_COLORS[i % ASSET_COLORS.length]}
                fillOpacity={0.5}
                dot={false}
                strokeWidth={1}
              />
            ))}

            {/* Debt accounts — stacked red areas (negative values go below zero) */}
            {debtAccounts.map((account, i) => (
              <Area
                key={account._id}
                type="monotone"
                dataKey={account._id}
                name={account.name}
                stackId="debts"
                stroke={DEBT_COLORS[i % DEBT_COLORS.length]}
                fill={DEBT_COLORS[i % DEBT_COLORS.length]}
                fillOpacity={0.5}
                dot={false}
                strokeWidth={1}
              />
            ))}

            {/* Net worth line */}
            <Line type="monotone" dataKey="netWorth" name="Net Worth" stroke="#388bfd" dot={false} strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-gh-border">
        {/* Left — age + DOB edit */}
        <div className="flex items-center gap-2">
          {editingDob ? (
            <>
              <input
                type="date"
                value={dobValue}
                onChange={e => setDobValue(e.target.value)}
                className="bg-gh-raised border border-gh-border rounded px-2 py-1 text-xs text-gh-text focus:outline-none focus:border-gh-blue"
              />
              <button onClick={handleDobSave} disabled={!dobValue || savingDob}
                className="text-xs text-gh-green hover:underline disabled:opacity-50">
                {savingDob ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => setEditingDob(false)} className="text-xs text-gh-muted hover:text-gh-text">
                Cancel
              </button>
            </>
          ) : birthday ? (
            <>
              <span className="text-xs text-gh-muted">Age <span className="text-gh-text font-medium">{currentAge}</span></span>
              <button
                onClick={() => { setDobValue(''); setEditingDob(true); }}
                className="text-xs text-gh-muted hover:text-gh-blue transition-colors"
              >
                Change DOB
              </button>
            </>
          ) : null}
        </div>

        {/* Right — inflation toggle + rate input */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={real}
              onChange={e => setReal(e.target.checked)}
              className="accent-gh-blue"
            />
            <span className="text-xs text-gh-muted">Inflation-adjusted</span>
          </label>
          {real && (
            <>
              <input
                type="number"
                min="0"
                step="0.1"
                value={rateInput}
                onChange={e => setRateInput(e.target.value)}
                className="w-14 bg-gh-raised border border-gh-border rounded px-2 py-1 text-xs text-gh-text focus:outline-none focus:border-gh-blue"
              />
              <span className="text-xs text-gh-muted">%/yr</span>
              {rateChanged && (
                <button onClick={handleRateSave} disabled={savingRate}
                  className="text-xs text-gh-green hover:underline disabled:opacity-50">
                  {savingRate ? 'Saving…' : 'Save'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
