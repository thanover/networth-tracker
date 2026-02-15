import { useState, useEffect } from 'react';
import { Dialog } from 'radix-ui';

// Which extra fields each account type shows, and whether each is required
const TYPE_CONFIG = {
  investment:  {
    label: 'Investment',  category: 'asset', balanceLabel: 'Current Value ($)',
    fields: [
      { key: 'expectedGrowthRate',  required: true  },
      { key: 'monthlyContribution', required: false },
    ],
  },
  property: {
    label: 'Property',    category: 'asset', balanceLabel: 'Current Value ($)',
    fields: [
      { key: 'expectedGrowthRate',  required: false },
    ],
  },
  vehicle: {
    label: 'Vehicle',     category: 'asset', balanceLabel: 'Current Value ($)',
    defaults: { expectedGrowthRate: -15 },
    fields: [
      { key: 'expectedGrowthRate',  required: false },
    ],
  },
  cash: {
    label: 'Cash',        category: 'asset', balanceLabel: 'Balance ($)',
    fields: [
      { key: 'interestRate',        required: false },
      { key: 'monthlyContribution', required: false },
    ],
  },
  loan: {
    label: 'Loan',        category: 'debt',  balanceLabel: 'Outstanding Balance ($)',
    fields: [
      { key: 'interestRate',   required: true  },
      { key: 'monthlyPayment', required: true  },
      { key: 'remainingTerm',  required: true  },
    ],
  },
  credit_card: {
    label: 'Credit Card', category: 'debt',  balanceLabel: 'Outstanding Balance ($)',
    fields: [
      { key: 'interestRate',   required: true },
      { key: 'monthlyPayment', required: true },
    ],
  },
};

const FIELD_META = {
  expectedGrowthRate:  { label: 'Expected Annual Growth (%)', placeholder: 'e.g. 7'    },
  monthlyContribution: { label: 'Monthly Contribution ($)',   placeholder: 'e.g. 500'  },
  interestRate:        { label: 'Annual Interest Rate (%)',   placeholder: 'e.g. 6.5'  },
  monthlyPayment:      { label: 'Monthly Payment ($)',        placeholder: 'e.g. 1800' },
  remainingTerm:       { label: 'Remaining Term (months)',    placeholder: 'e.g. 300'  },
};

const ASSET_TYPES = Object.entries(TYPE_CONFIG).filter(([, v]) => v.category === 'asset');
const DEBT_TYPES  = Object.entries(TYPE_CONFIG).filter(([, v]) => v.category === 'debt');

function typeDefaults(type) {
  return Object.fromEntries(
    Object.entries(TYPE_CONFIG[type]?.defaults ?? {}).map(([k, v]) => [k, String(v)])
  );
}

function emptyForm(account = null, defaultCategory = 'asset') {
  const category = account?.category ?? defaultCategory;
  const type     = account?.type     ?? (category === 'asset' ? 'investment' : 'loan');
  return {
    name:                account?.name                ?? '',
    category,
    type,
    balance:             account?.balance             ?? '',
    expectedGrowthRate:  account?.expectedGrowthRate  != null ? String(account.expectedGrowthRate) : (typeDefaults(type).expectedGrowthRate ?? ''),
    monthlyContribution: account?.monthlyContribution ?? '',
    interestRate:        account?.interestRate         ?? '',
    monthlyPayment:      account?.monthlyPayment       ?? '',
    remainingTerm:       account?.remainingTerm        ?? '',
  };
}

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

export default function AccountModal({ open, onOpenChange, account, defaultCategory = 'asset', onSave }) {
  const isEdit = Boolean(account);
  const [form, setForm] = useState(() => emptyForm(account, defaultCategory));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset form when the modal opens or the account changes
  useEffect(() => {
    if (open) {
      setForm(emptyForm(account, defaultCategory));
      setError('');
    }
  }, [open, account, defaultCategory]);

  function set(key, value) {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'category') {
        // Reset type to first option of that category
        next.type = value === 'asset' ? 'investment' : 'loan';
        // Apply defaults for the new type
        Object.assign(next, typeDefaults(next.type));
      }
      if (key === 'type') {
        // Apply defaults for the newly selected type
        Object.assign(next, typeDefaults(value));
      }
      return next;
    });
  }

  const extraFields = TYPE_CONFIG[form.type]?.fields ?? [];
  const balanceLabel = TYPE_CONFIG[form.type]?.balanceLabel ?? 'Balance ($)';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
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
      await onSave(payload);
      onOpenChange(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const typeOptions = form.category === 'asset' ? ASSET_TYPES : DEBT_TYPES;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-gh-border bg-gh-surface p-6 shadow-xl focus:outline-none">
          <Dialog.Title className="text-sm font-bold text-gh-bright mb-4">
            {isEdit ? 'Edit Account' : 'Add Account'}
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              id="name"
              label="Name"
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              required
              placeholder="e.g. Chase Savings"
            />

            {/* Category */}
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

            {/* Type */}
            <div>
              <label htmlFor="type" className="block text-xs text-gh-muted mb-1.5 uppercase tracking-wide">Type</label>
              <select
                id="type"
                value={form.type}
                onChange={e => set('type', e.target.value)}
                className="w-full rounded-md border border-gh-border bg-gh-raised px-3 py-2 text-gh-text text-sm outline-none focus:border-gh-blue focus:ring-1 focus:ring-gh-blue"
              >
                {typeOptions.map(([val, cfg]) => (
                  <option key={val} value={val}>{cfg.label}</option>
                ))}
              </select>
            </div>

            <Field
              id="balance"
              label={balanceLabel}
              type="number"
              min="0"
              step="0.01"
              value={form.balance}
              onChange={e => set('balance', e.target.value)}
              required
              placeholder="e.g. 10000"
            />

            {/* Dynamic type-specific fields */}
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

            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-md border border-gh-border bg-gh-raised px-4 py-2 text-sm text-gh-muted hover:text-gh-text transition-colors"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-gh-blue px-4 py-2 text-sm font-medium text-white hover:bg-gh-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add account'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
