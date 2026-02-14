import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAccounts } from '@/hooks/useAccounts';
import AccountModal from '@/components/AccountModal';
import NetWorthChart from '@/components/NetWorthChart';
import BirthdayBanner from '@/components/BirthdayBanner';

const TYPE_LABELS = {
  investment:  'Investment',
  property:    'Property',
  vehicle:     'Vehicle',
  cash:        'Cash',
  loan:        'Loan',
  credit_card: 'Credit Card',
};

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function AccountRow({ account, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gh-border/50 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <p className="text-gh-text text-sm truncate">{account.name}</p>
          <p className="text-gh-muted text-xs">{TYPE_LABELS[account.type]}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 shrink-0 ml-4">
        <span className="text-gh-text text-sm font-medium tabular-nums">{fmt(account.balance)}</span>
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDelete(account._id)}
              className="text-xs text-gh-red hover:underline"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs text-gh-muted hover:text-gh-text"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={() => onEdit(account)}
              className="text-xs text-gh-muted hover:text-gh-blue transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-xs text-gh-muted hover:text-gh-red transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, accounts, total, colorClass, onEdit, onDelete, onAdd }) {
  return (
    <div className="rounded-lg border border-gh-border bg-gh-surface">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gh-border">
        <span className="text-xs uppercase tracking-widest text-gh-muted font-medium">{title}</span>
        <button
          onClick={onAdd}
          className="text-xs text-gh-blue hover:underline"
        >
          + Add
        </button>
      </div>

      {/* Rows */}
      <div className="px-4">
        {accounts.length === 0 ? (
          <p className="py-4 text-xs text-gh-muted">No {title.toLowerCase()} added yet.</p>
        ) : (
          accounts.map(a => (
            <AccountRow key={a._id} account={a} onEdit={onEdit} onDelete={onDelete} />
          ))
        )}
      </div>

      {/* Subtotal */}
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
  const { accounts, assets, debts, totalAssets, totalDebts, netWorth, loading, error, create, update, remove } = useAccounts();

  const [modalOpen, setModalOpen] = useState(false);
  const [editAccount, setEditAccount] = useState(null);
  const [defaultCategory, setDefaultCategory] = useState('asset');

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

  return (
    <div className="flex min-h-screen flex-col bg-gh-bg">
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

      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-8 space-y-6">
        {/* Birthday banner — shown until DOB is set */}
        {!user.birthday && <BirthdayBanner />}

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

        {/* Projection chart */}
        <NetWorthChart accounts={accounts} birthday={user.birthday} />

        {/* Assets */}
        <Section
          title="Assets"
          accounts={assets}
          total={totalAssets}
          colorClass="text-gh-green"
          onEdit={openEdit}
          onDelete={remove}
          onAdd={() => openAdd('asset')}
        />

        {/* Debts */}
        <Section
          title="Debts"
          accounts={debts}
          total={totalDebts}
          colorClass="text-gh-red"
          onEdit={openEdit}
          onDelete={remove}
          onAdd={() => openAdd('debt')}
        />
      </main>

      <AccountModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        account={editAccount}
        onSave={handleSave}
      />
    </div>
  );
}
