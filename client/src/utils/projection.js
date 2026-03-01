/**
 * Step a single account balance forward by one month.
 * Returns the new balance (never below 0).
 */
export function stepAccount(account, balance, month) {
  const { type, interestRate, expectedGrowthRate, monthlyContribution, monthlyPayment, remainingTerm } = account;

  switch (type) {
    case 'investment': {
      const r = (expectedGrowthRate ?? 0) / 100 / 12;
      return balance * (1 + r) + (monthlyContribution ?? 0);
    }
    case 'cash': {
      const r = (interestRate ?? 0) / 100 / 12;
      return balance * (1 + r) + (monthlyContribution ?? 0);
    }
    case 'property':
    case 'vehicle': {
      const r = (expectedGrowthRate ?? 0) / 100 / 12;
      return balance * (1 + r);
    }
    case 'loan': {
      if (remainingTerm !== undefined && month >= remainingTerm) return 0;
      const r = (interestRate ?? 0) / 100 / 12;
      const interest = balance * r;
      const principal = (monthlyPayment ?? 0) - interest;
      return Math.max(0, balance - principal);
    }
    case 'credit_card': {
      const r = (interestRate ?? 0) / 100 / 12;
      const interest = balance * r;
      return Math.max(0, balance + interest - (monthlyPayment ?? 0));
    }
    default:
      return balance;
  }
}

/**
 * Build monthly projection data for a set of accounts over `months` months.
 * Returns an array of { month, assets, debts, netWorth } objects.
 * month=0 is today's balances.
 */
export function project(accounts, months) {
  const assets = accounts.filter(a => a.category === 'asset');
  const debts  = accounts.filter(a => a.category === 'debt');

  // Track current balance per account
  const assetBalances = assets.map(a => a.balance);
  const debtBalances  = debts.map(a => a.balance);

  const data = [];

  for (let m = 0; m <= months; m++) {
    const totalAssets = assetBalances.reduce((s, b) => s + b, 0);
    const totalDebts  = debtBalances.reduce((s, b) => s + b, 0);
    data.push({ month: m, assets: totalAssets, debts: totalDebts, netWorth: totalAssets - totalDebts });

    if (m < months) {
      for (let i = 0; i < assets.length; i++) {
        assetBalances[i] = stepAccount(assets[i], assetBalances[i], m);
      }
      for (let i = 0; i < debts.length; i++) {
        debtBalances[i] = stepAccount(debts[i], debtBalances[i], m);
      }
    }
  }

  return data;
}

/**
 * Build monthly projection data broken down by individual account.
 * Returns an array of { month, [account._id]: balance, ... } objects.
 * Balances are always positive (raw). Accounts can be a filtered subset.
 */
export function projectByAccount(accounts, months) {
  const balances = accounts.map(a => a.balance);
  const data = [];

  for (let m = 0; m <= months; m++) {
    const point = { month: m };
    accounts.forEach((a, i) => { point[a._id] = balances[i]; });
    data.push(point);

    if (m < months) {
      for (let i = 0; i < accounts.length; i++) {
        balances[i] = stepAccount(accounts[i], balances[i], m);
      }
    }
  }

  return data;
}
