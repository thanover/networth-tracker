import { useState, useRef } from 'react';
import { DropdownMenu, Dialog } from 'radix-ui';
import { useAuth } from '@/context/AuthContext';
import { useAccounts } from '@/hooks/useAccounts';
import { useEvents } from '@/hooks/useEvents';
import AccountModal from '@/components/AccountModal';
import AccountDetailModal from '@/components/AccountDetailModal';
import NetWorthChart from '@/components/NetWorthChart';
import AccountMiniChart from '@/components/AccountMiniChart';
import BirthdayBanner from '@/components/BirthdayBanner';
import { api } from '@/api/client';

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function fmtN(n, decimals = 2) {
  return n % 1 === 0 ? String(n) : n.toFixed(decimals).replace(/\.?0+$/, '');
}

function accountStats(a) {
  const parts = [];
  switch (a.type) {
    case 'investment':
      if (a.expectedGrowthRate  != null) parts.push(`${a.expectedGrowthRate > 0 ? '+' : ''}${fmtN(a.expectedGrowthRate)}%/yr`);
      if (a.monthlyContribution != null) parts.push(`+${fmt(a.monthlyContribution)}/mo`);
      break;
    case 'property':
      if (a.expectedGrowthRate != null) parts.push(`${a.expectedGrowthRate > 0 ? '+' : ''}${fmtN(a.expectedGrowthRate)}%/yr`);
      break;
    case 'vehicle':
      if (a.expectedGrowthRate != null) parts.push(`${fmtN(a.expectedGrowthRate)}%/yr`);
      break;
    case 'cash':
      if (a.interestRate        != null) parts.push(`${fmtN(a.interestRate)}% APY`);
      if (a.monthlyContribution != null) parts.push(`+${fmt(a.monthlyContribution)}/mo`);
      break;
    case 'loan': {
      if (a.interestRate  != null) parts.push(`${fmtN(a.interestRate)}% APR`);
      if (a.monthlyPayment != null) parts.push(`${fmt(a.monthlyPayment)}/mo`);
      if (a.remainingTerm  != null) {
        const yrs = a.remainingTerm / 12;
        parts.push(yrs >= 2 ? `${Math.round(yrs)} yrs left` : `${a.remainingTerm} mo left`);
      }
      break;
    }
    case 'credit_card':
      if (a.interestRate   != null) parts.push(`${fmtN(a.interestRate)}% APR`);
      if (a.monthlyPayment != null) parts.push(`${fmt(a.monthlyPayment)}/mo`);
      break;
    default: break;
  }
  return parts;
}

const TYPE_LABELS = {
  investment:  'Investment',
  property:    'Property',
  vehicle:     'Vehicle',
  cash:        'Cash',
  loan:        'Loan',
  credit_card: 'Credit Card',
};

function AccountRow({ account, onClick }) {
  const stats = accountStats(account);
  return (
    <button
      onClick={() => onClick(account)}
      className="w-full flex items-center justify-between py-3 border-b border-gh-border/50 last:border-0 hover:bg-gh-raised/40 transition-colors text-left"
    >
      <div className="min-w-0">
        <p className="text-gh-text text-sm">{account.name}</p>
        <p className="text-gh-muted text-xs mt-0.5">
          {TYPE_LABELS[account.type]}
          {stats.length > 0 && (
            <span className="text-gh-muted/70"> · {stats.join(' · ')}</span>
          )}
        </p>
      </div>
      <span className={`text-sm font-medium tabular-nums shrink-0 ml-4 ${account.category === 'asset' ? 'text-gh-green' : 'text-gh-red'}`}>
        {fmt(account.balance)}
      </span>
    </button>
  );
}

// ── Settings modal ─────────────────────────────────────────────────────────────
function SettingsModal({ open, onOpenChange }) {
  const { user, updateBirthday, updateInflationRate } = useAuth();
  const [dobValue, setDobValue] = useState('');
  const [rateValue, setRateValue] = useState('');
  const [savingDob, setSavingDob] = useState(false);
  const [savingRate, setSavingRate] = useState(false);

  function handleOpen(isOpen) {
    if (isOpen) {
      setDobValue(user.birthday ? user.birthday.slice(0, 10) : '');
      setRateValue(String(user.inflationRate ?? 3.5));
    }
    onOpenChange(isOpen);
  }

  async function handleSaveDob() {
    setSavingDob(true);
    try { await updateBirthday(dobValue || null); } finally { setSavingDob(false); }
  }

  async function handleSaveRate() {
    const rate = parseFloat(rateValue);
    if (isNaN(rate) || rate < 0) return;
    setSavingRate(true);
    try { await updateInflationRate(rate); } finally { setSavingRate(false); }
  }

  const rateChanged = parseFloat(rateValue) !== user.inflationRate;
  const dobChanged  = (dobValue || null) !== (user.birthday ? user.birthday.slice(0, 10) : null);

  return (
    <Dialog.Root open={open} onOpenChange={handleOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-gh-border bg-gh-surface shadow-xl focus:outline-none">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gh-border">
            <Dialog.Title className="text-sm font-bold text-gh-bright">Settings</Dialog.Title>
            <Dialog.Close className="text-gh-muted hover:text-gh-text transition-colors">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.749.749 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.749.749 0 1 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06z"/>
              </svg>
            </Dialog.Close>
          </div>
          <div className="px-6 py-5 space-y-5">
            {/* Date of birth */}
            <div>
              <label className="block text-xs text-gh-muted uppercase tracking-wide mb-1.5">
                Date of birth
                <span className="normal-case ml-1.5 text-gh-muted/60">(used for age axis on chart)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dobValue}
                  onChange={e => setDobValue(e.target.value)}
                  className="flex-1 rounded-md border border-gh-border bg-gh-raised px-3 py-2 text-sm text-gh-text outline-none focus:border-gh-blue"
                />
                {dobChanged && (
                  <button
                    onClick={handleSaveDob}
                    disabled={savingDob}
                    className="rounded-md bg-gh-blue px-3 py-2 text-xs text-white hover:bg-gh-blue/90 disabled:opacity-50 transition-colors"
                  >
                    {savingDob ? 'Saving…' : 'Save'}
                  </button>
                )}
              </div>
            </div>
            {/* Inflation rate */}
            <div>
              <label className="block text-xs text-gh-muted uppercase tracking-wide mb-1.5">
                Inflation rate
                <span className="normal-case ml-1.5 text-gh-muted/60">(% per year)</span>
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={rateValue}
                  onChange={e => setRateValue(e.target.value)}
                  className="w-24 rounded-md border border-gh-border bg-gh-raised px-3 py-2 text-sm text-gh-text outline-none focus:border-gh-blue"
                />
                <span className="text-xs text-gh-muted">%/yr</span>
                {rateChanged && (
                  <button
                    onClick={handleSaveRate}
                    disabled={savingRate}
                    className="rounded-md bg-gh-blue px-3 py-2 text-xs text-white hover:bg-gh-blue/90 disabled:opacity-50 transition-colors"
                  >
                    {savingRate ? 'Saving…' : 'Save'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── User menu dropdown ──────────────────────────────────────────────────────────
const itemCls = 'flex items-center px-3 py-1.5 text-xs text-gh-text rounded cursor-pointer outline-none select-none data-[highlighted]:bg-gh-raised data-[highlighted]:text-gh-bright data-[disabled]:opacity-40 data-[disabled]:cursor-default';
const subTriggerCls = `${itemCls} justify-between gap-4`;

function UserMenu({ username, onExport, onImport, onSettings, onSignOut, exporting, reading }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-1 text-xs text-gh-muted hover:text-gh-text transition-colors outline-none">
          {username}
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="opacity-60">
            <path d="M4.427 7.427l3.396 3.396a.25.25 0 0 0 .354 0l3.396-3.396A.25.25 0 0 0 11.396 7H4.604a.25.25 0 0 0-.177.427z"/>
          </svg>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[160px] rounded-lg border border-gh-border bg-gh-surface shadow-xl p-1 animate-in fade-in-0 zoom-in-95"
        >
          <DropdownMenu.Item className={itemCls} onSelect={onSettings}>
            Settings
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 h-px bg-gh-border" />

          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger className={subTriggerCls}>
              Tools
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" className="opacity-60">
                <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06z"/>
              </svg>
            </DropdownMenu.SubTrigger>
            <DropdownMenu.Portal>
              <DropdownMenu.SubContent
                sideOffset={4}
                className="z-50 min-w-[140px] rounded-lg border border-gh-border bg-gh-surface shadow-xl p-1 animate-in fade-in-0 zoom-in-95"
              >
                <DropdownMenu.Item className={itemCls} onSelect={onExport} disabled={exporting}>
                  {exporting ? 'Exporting…' : 'Export'}
                </DropdownMenu.Item>
                <DropdownMenu.Item className={itemCls} onSelect={onImport} disabled={reading}>
                  {reading ? 'Reading…' : 'Import'}
                </DropdownMenu.Item>
              </DropdownMenu.SubContent>
            </DropdownMenu.Portal>
          </DropdownMenu.Sub>

          <DropdownMenu.Separator className="my-1 h-px bg-gh-border" />

          <DropdownMenu.Item className={`${itemCls} text-gh-red data-[highlighted]:text-gh-red`} onSelect={onSignOut}>
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function Section({ title, accounts, total, colorClass, onRowClick, onAdd, chart }) {
  return (
    <div className="rounded-lg border border-gh-border bg-gh-surface">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gh-border">
        <span className="text-xs uppercase tracking-widest text-gh-muted font-medium">{title}</span>
        <button onClick={onAdd} className="text-xs text-gh-blue hover:underline">+ Add</button>
      </div>
      {chart}
      <div className="px-4 overflow-hidden">
        {accounts.length === 0 ? (
          <p className="py-4 text-xs text-gh-muted">No {title.toLowerCase()} added yet.</p>
        ) : (
          accounts.map(a => (
            <AccountRow key={a._id} account={a} onClick={onRowClick} />
          ))
        )}
      </div>
      {accounts.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gh-border bg-gh-raised/50 rounded-b-lg">
          <span className="text-xs uppercase tracking-widest text-gh-muted font-medium">Total</span>
          <span className={`text-sm font-bold tabular-nums ${colorClass}`}>{fmt(total)}</span>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { accounts, assets, debts, totalAssets, totalDebts, netWorth, loading, error, create, update, remove, reload } = useAccounts();
  const { events, byAccount, createEvent, removeEvent, reload: reloadEvents } = useEvents();

  const [modalOpen, setModalOpen] = useState(false);
  const [editAccount, setEditAccount] = useState(null);
  const [defaultCategory, setDefaultCategory] = useState('asset');

  const [detailAccount, setDetailAccount] = useState(null);
  const [rangeIdx, setRangeIdx] = useState(1);
  const [real, setReal] = useState(false);
  // months for mini-charts, kept in sync with the net worth chart range
  const RANGE_MONTHS = [12, 60, 120, 480];
  const months = RANGE_MONTHS[rangeIdx];

  const [settingsOpen, setSettingsOpen] = useState(false);

  // Export / Import state
  const fileInputRef = useRef(null);
  const [importPreview, setImportPreview] = useState(null); // { accounts: N, raw: {...} }
  const [importError, setImportError] = useState('');
  const [reading, setReading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  function openAdd(category) {
    setEditAccount(null);
    setDefaultCategory(category);
    setModalOpen(true);
  }

  function openEdit(account) {
    setEditAccount(account);
    setModalOpen(true);
  }

  async function handleSave(data) {
    if (editAccount) {
      await update(editAccount._id, data);
    } else {
      await create({ ...data, category: data.category || defaultCategory });
    }
  }

  // Called by AccountDetailModal save
  async function handleDetailSave(id, data) {
    await update(id, data);
    setDetailAccount(prev => prev ? { ...prev, ...data, _id: prev._id } : prev);
  }

  async function handleExport() {
    setExporting(true);
    try {
      await api.download('/export', `networth-export-${new Date().toISOString().slice(0, 10)}.json`);
    } finally {
      setExporting(false);
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setImportError('');
    setReading(true);

    const reader = new FileReader();
    reader.onload = (ev) => {
      setReading(false);
      try {
        const raw = JSON.parse(ev.target.result);
        if (raw.version !== 1) throw new Error('Unsupported export version');
        setImportPreview({
          accounts: Array.isArray(raw.accounts) ? raw.accounts.length : 0,
          raw,
        });
      } catch (err) {
        setImportError(`Invalid file: ${err.message}`);
      }
    };
    reader.onerror = () => {
      setReading(false);
      setImportError('Failed to read file.');
    };
    reader.readAsText(file);
  }

  async function handleImportConfirm() {
    if (!importPreview) return;
    setImporting(true);
    setImportError('');
    try {
      const result = await api.post('/export', importPreview.raw);
      await Promise.all([reload(), reloadEvents()]);
      if (result.failures?.length) {
        const lines = result.failures.map(f => `• ${f.name}: ${f.reason}`).join('\n');
        setImportError(`Imported ${result.imported.accounts} account(s). Skipped ${result.failures.length}:\n${lines}`);
        setImportPreview(null);
      } else {
        setImportPreview(null);
      }
    } catch (err) {
      setImportError(err.message);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gh-bg">
      {/* Top bar */}
      <header className="border-b border-gh-border bg-gh-surface px-6 py-3 flex items-center justify-between">
        <span className="text-gh-bright font-bold text-sm">Net Worth Tracker</span>
        <UserMenu
          username={user.username}
          onExport={handleExport}
          onImport={() => fileInputRef.current?.click()}
          onSettings={() => setSettingsOpen(true)}
          onSignOut={logout}
          exporting={exporting}
          reading={reading}
        />
        <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileSelect} />
      </header>

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-8 space-y-6">
        {/* Birthday banner */}
        {!user.birthday && <BirthdayBanner />}

        {importError && <pre className="text-gh-red text-xs whitespace-pre-wrap">{importError}</pre>}

        {/* Net worth summary */}
        <div className="rounded-lg border border-gh-border bg-gh-surface px-6 py-5">
          <p className="text-xs uppercase tracking-widest text-gh-muted mb-2">Net Worth</p>
          {loading ? (
            <p className="text-gh-muted text-sm">Loading…</p>
          ) : (
            <p className={`text-4xl font-bold tabular-nums ${netWorth >= 0 ? 'text-gh-green' : 'text-gh-red'}`}>
              {fmt(netWorth)}
            </p>
          )}
          {!loading && (
            <div className="flex gap-6 mt-3">
              <span className="text-xs text-gh-muted">Assets <span className="text-gh-green">{fmt(totalAssets)}</span></span>
              <span className="text-xs text-gh-muted">Debts <span className="text-gh-red">{fmt(totalDebts)}</span></span>
            </div>
          )}
        </div>

        {error && <p className="text-gh-red text-xs">{error}</p>}

        {/* Net worth chart (history + projection) */}
        <NetWorthChart
          accounts={accounts}
          events={events}
          birthday={user.birthday}
          inflationRate={user.inflationRate}
          rangeIdx={rangeIdx}
          onRangeChange={setRangeIdx}
          real={real}
          onRealChange={setReal}
        />

        {/* Assets + Debts side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Section
            title="Assets"
            accounts={assets}
            total={totalAssets}
            colorClass="text-gh-green"
            onRowClick={setDetailAccount}
            onAdd={() => openAdd('asset')}
            chart={<AccountMiniChart accounts={assets} events={events} months={months} category="asset" real={real} inflationRate={user.inflationRate} />}
          />
          <Section
            title="Debts"
            accounts={debts}
            total={totalDebts}
            colorClass="text-gh-red"
            onRowClick={setDetailAccount}
            onAdd={() => openAdd('debt')}
            chart={<AccountMiniChart accounts={debts} events={events} months={months} category="debt" real={real} inflationRate={user.inflationRate} />}
          />
        </div>
      </main>

      {/* Import confirmation overlay */}
      {importPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm mx-4 rounded-lg border border-gh-border bg-gh-surface p-6 space-y-4">
            <p className="text-sm text-gh-text">
              Import <span className="font-medium text-gh-bright">{importPreview.accounts} account{importPreview.accounts !== 1 ? 's' : ''}</span>
              {' '}— this will <span className="text-gh-red font-medium">replace all existing accounts</span>.
            </p>
            {importError && <p className="text-gh-red text-xs">{importError}</p>}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => { setImportPreview(null); setImportError(''); }}
                className="text-xs text-gh-muted hover:text-gh-text"
              >
                Cancel
              </button>
              <button
                onClick={handleImportConfirm}
                disabled={importing}
                className="px-4 py-1.5 rounded text-xs bg-gh-blue text-white hover:bg-gh-blue/90 disabled:opacity-50 transition-colors"
              >
                {importing ? 'Importing…' : 'Confirm import'}
              </button>
            </div>
          </div>
        </div>
      )}

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />

      <AccountModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        account={editAccount}
        defaultCategory={defaultCategory}
        onSave={handleSave}
      />

      <AccountDetailModal
        open={Boolean(detailAccount)}
        onOpenChange={open => { if (!open) setDetailAccount(null); }}
        account={detailAccount}
        events={detailAccount ? (byAccount[String(detailAccount._id)] ?? []) : []}
        onSave={handleDetailSave}
        onDelete={remove}
        onCreateEvent={createEvent}
        onDeleteEvent={removeEvent}
      />
    </div>
  );
}
