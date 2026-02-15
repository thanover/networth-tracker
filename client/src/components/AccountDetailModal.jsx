import { useState, useEffect } from 'react';
import { Dialog } from 'radix-ui';
import { TYPE_CONFIG, FIELD_META, ASSET_TYPES, DEBT_TYPES, typeDefaults, emptyForm } from '@/utils/accountConfig';

const fmt = n =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

// ── Read-only field row ────────────────────────────────────────────────────────
function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between items-baseline py-2 border-b border-gh-border/40 last:border-0">
      <span className="text-xs text-gh-muted uppercase tracking-wide">{label}</span>
      <span className="text-sm text-gh-text font-medium tabular-nums">{value}</span>
    </div>
  );
}

// ── Editable field ─────────────────────────────────────────────────────────────
function Field({ label, hint, id, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs text-gh-muted mb-1.5 uppercase tracking-wide">
        {label}
        {hint && <span className="normal-case ml-1.5 text-gh-muted/60">({hint})</span>}
      </label>
      <input
        id={id}
        {...props}
        className="w-full rounded-md border border-gh-border bg-gh-raised px-3 py-2 text-gh-text text-sm outline-none focus:border-gh-blue focus:ring-1 focus:ring-gh-blue"
      />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function AccountDetailModal({ open, onOpenChange, account, onSave, onDelete }) {
  // 'view' | 'edit' | 'delete'
  const [mode, setMode] = useState('view');
  const [form, setForm] = useState(() => emptyForm(account));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (open) {
      setMode('view');
      setForm(emptyForm(account));
      setError('');
    }
  }, [open, account]);

  function set(key, value) {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'category') {
        next.type = value === 'asset' ? 'investment' : 'loan';
        Object.assign(next, typeDefaults(next.type));
      }
      if (key === 'type') {
        Object.assign(next, typeDefaults(value));
      }
      return next;
    });
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const extraFields = TYPE_CONFIG[form.type]?.fields ?? [];
      const payload = {
        name:     form.name,
        category: form.category,
        type:     form.type,
        balance:  parseFloat(form.balance),
      };
      for (const { key } of extraFields) {
        const val = form[key];
        if (val !== '' && val !== undefined) payload[key] = parseFloat(val);
      }
      await onSave(account._id, payload);
      onOpenChange(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await onDelete(account._id);
      onOpenChange(false);
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  if (!account) return null;

  const cfg         = TYPE_CONFIG[account.type];
  const editCfg     = TYPE_CONFIG[form.type];
  const typeOptions = form.category === 'asset' ? ASSET_TYPES : DEBT_TYPES;
  const extraFields = editCfg?.fields ?? [];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-gh-border bg-gh-surface shadow-xl focus:outline-none">

          {/* Header */}
          <div className="flex items-start justify-between px-6 py-4 border-b border-gh-border">
            <div>
              <Dialog.Title className="text-base font-bold text-gh-bright leading-tight">
                {account.name}
              </Dialog.Title>
              <span className="inline-block mt-1 text-xs text-gh-muted px-1.5 py-0.5 rounded border border-gh-border/60 bg-gh-raised">
                {cfg?.label ?? account.type}
              </span>
            </div>
            <Dialog.Close className="text-gh-muted hover:text-gh-text transition-colors mt-0.5">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.749.749 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.749.749 0 1 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06z"/>
              </svg>
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="px-6 py-4">

            {/* ── VIEW mode ── */}
            {mode === 'view' && (
              <div className="space-y-0">
                <DetailRow
                  label={cfg?.balanceLabel?.replace(' ($)', '') ?? 'Balance'}
                  value={<span className={account.category === 'asset' ? 'text-gh-green' : 'text-gh-red'}>{fmt(account.balance)}</span>}
                />
                {cfg?.fields.map(({ key }) =>
                  account[key] != null ? (
                    <DetailRow key={key} label={FIELD_META[key].label} value={formatFieldValue(key, account[key])} />
                  ) : null
                )}
              </div>
            )}

            {/* ── EDIT mode ── */}
            {mode === 'edit' && (
              <form id="edit-form" onSubmit={handleSave} className="space-y-4">
                <Field
                  id="name"
                  label="Name"
                  type="text"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  required
                />

                <div>
                  <label className="block text-xs text-gh-muted mb-1.5 uppercase tracking-wide">Category</label>
                  <div className="flex gap-2">
                    {['asset', 'debt'].map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => set('category', cat)}
                        className={`flex-1 rounded-md border px-3 py-2 text-sm capitalize transition-colors ${
                          form.category === cat
                            ? 'border-gh-blue bg-gh-blue/10 text-gh-blue'
                            : 'border-gh-border bg-gh-raised text-gh-muted hover:text-gh-text'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="type" className="block text-xs text-gh-muted mb-1.5 uppercase tracking-wide">Type</label>
                  <select
                    id="type"
                    value={form.type}
                    onChange={e => set('type', e.target.value)}
                    className="w-full rounded-md border border-gh-border bg-gh-raised px-3 py-2 text-gh-text text-sm outline-none focus:border-gh-blue"
                  >
                    {typeOptions.map(([val, c]) => (
                      <option key={val} value={val}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <Field
                  id="balance"
                  label={editCfg?.balanceLabel ?? 'Balance ($)'}
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.balance}
                  onChange={e => set('balance', e.target.value)}
                  required
                />

                {extraFields.map(({ key, required }) => (
                  <Field
                    key={key}
                    id={key}
                    label={FIELD_META[key].label}
                    hint={required ? null : 'optional'}
                    type="number"
                    step="0.01"
                    value={form[key]}
                    onChange={e => set(key, e.target.value)}
                    required={required}
                    placeholder={FIELD_META[key].placeholder}
                  />
                ))}

                {error && <p className="text-gh-red text-xs">{error}</p>}
              </form>
            )}

            {/* ── DELETE CONFIRM mode ── */}
            {mode === 'delete' && (
              <div className="py-2 space-y-3">
                <p className="text-sm text-gh-text">
                  Delete <span className="font-medium text-gh-bright">{account.name}</span>? This cannot be undone.
                </p>
                {error && <p className="text-gh-red text-xs">{error}</p>}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gh-border flex items-center justify-between">

            {mode === 'view' && (
              <>
                <button
                  onClick={() => setMode('delete')}
                  className="text-xs text-gh-muted hover:text-gh-red transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => { setError(''); setMode('edit'); }}
                  className="rounded-md bg-gh-blue px-4 py-2 text-sm font-medium text-white hover:bg-gh-blue/90 transition-colors"
                >
                  Edit
                </button>
              </>
            )}

            {mode === 'edit' && (
              <>
                <button
                  type="button"
                  onClick={() => { setMode('view'); setForm(emptyForm(account)); setError(''); }}
                  className="text-xs text-gh-muted hover:text-gh-text transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="edit-form"
                  disabled={saving}
                  className="rounded-md bg-gh-blue px-4 py-2 text-sm font-medium text-white hover:bg-gh-blue/90 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </>
            )}

            {mode === 'delete' && (
              <>
                <button
                  onClick={() => { setMode('view'); setError(''); }}
                  className="text-xs text-gh-muted hover:text-gh-text transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-md bg-gh-red px-4 py-2 text-sm font-medium text-white hover:bg-gh-red/90 disabled:opacity-50 transition-colors"
                >
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function formatFieldValue(key, value) {
  switch (key) {
    case 'expectedGrowthRate':
      return `${value > 0 ? '+' : ''}${value}% / yr`;
    case 'interestRate':
      return `${value}% APR`;
    case 'monthlyContribution':
      return `${fmt(value)} / mo`;
    case 'monthlyPayment':
      return `${fmt(value)} / mo`;
    case 'remainingTerm': {
      const yrs = value / 12;
      return yrs >= 2 ? `${yrs.toFixed(1)} yrs (${value} mo)` : `${value} months`;
    }
    default:
      return String(value);
  }
}
