import { useState, useEffect } from 'react';
import { Dialog } from 'radix-ui';
import { TYPE_CONFIG, FIELD_META, ASSET_TYPES, DEBT_TYPES, typeDefaults, emptyForm } from '@/utils/accountConfig';

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

const TODAY = new Date().toISOString().slice(0, 10);

export default function AccountModal({ open, onOpenChange, account, defaultCategory = 'asset', onSave }) {
  const isEdit = Boolean(account);
  const [form, setForm] = useState(() => emptyForm(account, defaultCategory));
  const [openedAt, setOpenedAt] = useState(TODAY);
  const [openingBalance, setOpeningBalance] = useState('');
  const [currentBalance, setCurrentBalance] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const openedInPast = !isEdit && openedAt < TODAY;

  // Reset form when the modal opens or the account changes
  useEffect(() => {
    if (open) {
      setForm(emptyForm(account, defaultCategory));
      setOpenedAt(TODAY);
      setOpeningBalance('');
      setCurrentBalance('');
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
        balance:  isEdit
          ? parseFloat(form.balance)
          : parseFloat(openedInPast && currentBalance !== '' ? currentBalance : openingBalance || form.balance),
      };
      for (const { key } of extraFields) {
        const val = form[key];
        if (val !== '' && val !== undefined) payload[key] = parseFloat(val);
      }
      if (!isEdit) {
        payload.openedAt = openedAt;
        payload.openingBalance = parseFloat(openingBalance || form.balance);
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

            {/* Opening date — add mode only */}
            {!isEdit && (
              <Field
                id="openedAt"
                label="Date opened"
                type="date"
                max={TODAY}
                value={openedAt}
                onChange={e => setOpenedAt(e.target.value)}
                required
              />
            )}

            {/* Balance fields */}
            {isEdit ? (
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
            ) : (
              <>
                <Field
                  id="openingBalance"
                  label={openedInPast ? 'Opening balance ($)' : balanceLabel}
                  hint={openedInPast ? `balance on ${openedAt}` : null}
                  type="number"
                  min="0"
                  step="0.01"
                  value={openingBalance}
                  onChange={e => setOpeningBalance(e.target.value)}
                  required
                  placeholder="e.g. 10000"
                />
                {openedInPast && (
                  <Field
                    id="currentBalance"
                    label="Current balance ($)"
                    hint="optional — leave blank if unknown"
                    type="number"
                    min="0"
                    step="0.01"
                    value={currentBalance}
                    onChange={e => setCurrentBalance(e.target.value)}
                    placeholder="e.g. 12000"
                  />
                )}
              </>
            )}

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
