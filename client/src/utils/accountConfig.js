export const TYPE_CONFIG = {
  investment: {
    label: 'Investment', category: 'asset', balanceLabel: 'Current Value ($)',
    fields: [
      { key: 'expectedGrowthRate',  required: true  },
      { key: 'monthlyContribution', required: false },
    ],
  },
  property: {
    label: 'Property', category: 'asset', balanceLabel: 'Current Value ($)',
    fields: [
      { key: 'expectedGrowthRate', required: false },
    ],
  },
  vehicle: {
    label: 'Vehicle', category: 'asset', balanceLabel: 'Current Value ($)',
    defaults: { expectedGrowthRate: -15 },
    fields: [
      { key: 'expectedGrowthRate', required: false },
    ],
  },
  cash: {
    label: 'Cash', category: 'asset', balanceLabel: 'Balance ($)',
    fields: [
      { key: 'interestRate',        required: false },
      { key: 'monthlyContribution', required: false },
    ],
  },
  loan: {
    label: 'Loan', category: 'debt', balanceLabel: 'Outstanding Balance ($)',
    fields: [
      { key: 'interestRate',   required: true },
      { key: 'monthlyPayment', required: true },
      { key: 'remainingTerm',  required: true },
    ],
  },
  credit_card: {
    label: 'Credit Card', category: 'debt', balanceLabel: 'Outstanding Balance ($)',
    fields: [
      { key: 'interestRate',   required: true },
      { key: 'monthlyPayment', required: true },
    ],
  },
};

export const FIELD_META = {
  expectedGrowthRate:  { label: 'Annual Growth Rate (%)',   placeholder: 'e.g. 7'    },
  monthlyContribution: { label: 'Monthly Contribution ($)', placeholder: 'e.g. 500'  },
  interestRate:        { label: 'Annual Interest Rate (%)', placeholder: 'e.g. 6.5'  },
  monthlyPayment:      { label: 'Monthly Payment ($)',      placeholder: 'e.g. 1800' },
  remainingTerm:       { label: 'Remaining Term (months)',  placeholder: 'e.g. 300'  },
};

export const ASSET_TYPES = Object.entries(TYPE_CONFIG).filter(([, v]) => v.category === 'asset');
export const DEBT_TYPES  = Object.entries(TYPE_CONFIG).filter(([, v]) => v.category === 'debt');

export function typeDefaults(type) {
  return Object.fromEntries(
    Object.entries(TYPE_CONFIG[type]?.defaults ?? {}).map(([k, v]) => [k, String(v)])
  );
}

export function emptyForm(account = null, defaultCategory = 'asset') {
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
