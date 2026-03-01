import { describe, it, expect, beforeEach } from 'vitest';
import { buildHistory, buildHistoryByAccount, computeHistoryMonths } from './history';

// Helper: return a date N months ago
function monthsAgo(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString();
}

const mockAccount = {
  _id: 'acc1',
  category: 'asset',
  type: 'cash',
  balance: 10000,
  interestRate: 0,
  monthlyContribution: 0,
};

describe('computeHistoryMonths', () => {
  it('returns 0 when no events', () => {
    expect(computeHistoryMonths([])).toBe(0);
  });

  it('returns 0 when no account_opened events', () => {
    const events = [{ type: 'balance_update', date: monthsAgo(6), accountId: 'acc1', balance: 5000 }];
    expect(computeHistoryMonths(events)).toBe(0);
  });

  it('returns months from earliest account_opened to today', () => {
    const events = [
      { type: 'account_opened', date: monthsAgo(12), accountId: 'acc1', balance: 5000 },
      { type: 'account_opened', date: monthsAgo(6),  accountId: 'acc2', balance: 3000 },
    ];
    const result = computeHistoryMonths(events);
    expect(result).toBeGreaterThanOrEqual(11);
    expect(result).toBeLessThanOrEqual(13);
  });
});

describe('buildHistory', () => {
  it('returns empty array when historyMonths is 0', () => {
    expect(buildHistory([mockAccount], [], 0)).toEqual([]);
  });

  it('returns array with correct month range', () => {
    const events = [
      { type: 'account_opened', date: monthsAgo(6), accountId: 'acc1', balance: 8000 },
    ];
    const data = buildHistory([mockAccount], events, 3);
    expect(data.length).toBe(4); // months -3, -2, -1, 0
    expect(data[0].month).toBe(-3);
    expect(data[data.length - 1].month).toBe(0);
  });

  it('returns 0 balance for account before its opened date', () => {
    const events = [
      { type: 'account_opened', date: monthsAgo(2), accountId: 'acc1', balance: 5000 },
    ];
    const data = buildHistory([mockAccount], events, 6);
    // Month -6, -5, -4, -3 should all be 0 (before account opened at -2)
    const beforeOpened = data.filter(d => d.month < -2);
    beforeOpened.forEach(d => {
      expect(d.assets).toBe(0);
    });
  });

  it('uses balance from account_opened event at opening date', () => {
    const events = [
      { type: 'account_opened', date: monthsAgo(6), accountId: 'acc1', balance: 8000 },
    ];
    const data = buildHistory([mockAccount], events, 6);
    // At month -6, balance should be 8000 (the opening balance)
    const atOpening = data.find(d => d.month === -6);
    expect(atOpening).toBeDefined();
    expect(atOpening.assets).toBeCloseTo(8000, -1);
  });

  it('returns 0 balance after account_closed', () => {
    const events = [
      { type: 'account_opened', date: monthsAgo(6), accountId: 'acc1', balance: 5000 },
      { type: 'account_closed', date: monthsAgo(3), accountId: 'acc1' },
    ];
    const data = buildHistory([mockAccount], events, 6);
    // Months -2, -1, 0 should all be 0 (after account closed at -3)
    const afterClosed = data.filter(d => d.month > -3);
    afterClosed.forEach(d => {
      expect(d.assets).toBe(0);
    });
  });

  it('uses most-recent balance_update as anchor', () => {
    const events = [
      { type: 'account_opened',  date: monthsAgo(6), accountId: 'acc1', balance: 5000 },
      { type: 'balance_update',  date: monthsAgo(3), accountId: 'acc1', balance: 7000 },
    ];
    const data = buildHistory([mockAccount], events, 6);
    // At month -3, balance should be ~7000 (from the balance_update)
    const atUpdate = data.find(d => d.month === -3);
    expect(atUpdate.assets).toBeCloseTo(7000, -1);
  });

  it('includes both assets and debts in totals', () => {
    const debtAccount = {
      _id: 'debt1',
      category: 'debt',
      type: 'loan',
      balance: 5000,
      interestRate: 5,
      monthlyPayment: 200,
      remainingTerm: 60,
    };
    const events = [
      { type: 'account_opened', date: monthsAgo(3), accountId: 'acc1',  balance: 10000 },
      { type: 'account_opened', date: monthsAgo(3), accountId: 'debt1', balance: 5000  },
    ];
    const data = buildHistory([mockAccount, debtAccount], events, 3);
    const latest = data.find(d => d.month === 0);
    expect(latest.assets).toBeGreaterThan(0);
    expect(latest.debts).toBeGreaterThan(0);
    expect(latest.netWorth).toBe(latest.assets - latest.debts);
  });
});

describe('buildHistoryByAccount', () => {
  it('returns per-account balances keyed by _id', () => {
    const acc2 = { ...mockAccount, _id: 'acc2', balance: 5000 };
    const events = [
      { type: 'account_opened', date: monthsAgo(3), accountId: 'acc1', balance: 10000 },
      { type: 'account_opened', date: monthsAgo(3), accountId: 'acc2', balance: 5000 },
    ];
    const data = buildHistoryByAccount([mockAccount, acc2], events, 2);
    expect(data.length).toBe(3); // -2, -1, 0
    expect(data[0]).toHaveProperty('acc1');
    expect(data[0]).toHaveProperty('acc2');
  });
});
