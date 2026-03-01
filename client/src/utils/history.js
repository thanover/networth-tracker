import { stepAccount } from './projection';

/**
 * Convert a month offset to a { year, month } pair representing that calendar month.
 * monthOffset = 0 → current month, monthOffset = -6 → 6 months ago.
 */
function offsetToYearMonth(monthOffset) {
  const d = new Date();
  d.setMonth(d.getMonth() + monthOffset);
  return { year: d.getFullYear(), month: d.getMonth() };
}

/**
 * Extract { year, month } from a date value (string or Date).
 */
function toYearMonth(date) {
  const d = new Date(date);
  return { year: d.getFullYear(), month: d.getMonth() };
}

/**
 * Return true if ym1 <= ym2 (year-month comparison).
 */
function ymLte(ym1, ym2) {
  return ym1.year < ym2.year || (ym1.year === ym2.year && ym1.month <= ym2.month);
}

/**
 * Return the number of months between two year-month objects (ym2 - ym1).
 */
function monthsBetween(ym1, ym2) {
  return (ym2.year - ym1.year) * 12 + (ym2.month - ym1.month);
}

/**
 * Find the most-recent event of type account_opened or balance_update
 * at or before the target year-month. Returns null if none found.
 */
function latestAnchorBefore(accountEvents, targetYM) {
  const anchors = accountEvents
    .filter(e =>
      (e.type === 'account_opened' || e.type === 'balance_update') &&
      ymLte(toYearMonth(e.date), targetYM)
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  return anchors[0] ?? null;
}

/**
 * Compute the balance of an account at a given historical month offset.
 *
 * @param {object} account - Account document
 * @param {object[]} accountEvents - Events for this account
 * @param {number} monthOffset - Negative integer (months before today)
 * @returns {number} balance at that point in time
 */
function balanceAtMonth(account, accountEvents, monthOffset) {
  const targetYM = offsetToYearMonth(monthOffset);

  const openedEvent = accountEvents.find(e => e.type === 'account_opened');
  const closedEvent = accountEvents.find(e => e.type === 'account_closed');

  // Account didn't exist yet (opened after target month)
  if (openedEvent && !ymLte(toYearMonth(openedEvent.date), targetYM)) return 0;

  // Account was closed at or before target month
  if (closedEvent && ymLte(toYearMonth(closedEvent.date), targetYM)) return 0;

  // Find the most-recent anchor at or before target month
  const anchor = latestAnchorBefore(accountEvents, targetYM);
  if (!anchor) {
    // No events before this date — flat fallback using current balance
    return account.balance;
  }

  // Project forward from anchor month to target month using stepAccount
  const anchorYM = toYearMonth(anchor.date);
  const monthsDiff = monthsBetween(anchorYM, targetYM);

  if (monthsDiff <= 0) return anchor.balance;

  let bal = anchor.balance;
  for (let i = 0; i < monthsDiff; i++) {
    bal = stepAccount(account, bal, i);
    if (bal < 0) bal = 0;
  }
  return bal;
}

/**
 * Build monthly historical data for a set of accounts.
 *
 * @param {object[]} accounts - All account documents
 * @param {object[]} events - All events for the user
 * @param {number} historyMonths - Number of months to look back (positive integer)
 * @returns {Array<{month, assets, debts, netWorth}>} - month values are -historyMonths..0
 */
export function buildHistory(accounts, events, historyMonths) {
  if (historyMonths <= 0) return [];

  const assets = accounts.filter(a => a.category === 'asset');
  const debts  = accounts.filter(a => a.category === 'debt');

  // Build per-account event lookup
  const eventsByAccount = {};
  for (const ev of events) {
    const key = String(ev.accountId);
    if (!eventsByAccount[key]) eventsByAccount[key] = [];
    eventsByAccount[key].push(ev);
  }

  const data = [];

  for (let m = -historyMonths; m <= 0; m++) {
    let totalAssets = 0;
    let totalDebts  = 0;

    for (const account of assets) {
      const evs = eventsByAccount[String(account._id)] ?? [];
      totalAssets += balanceAtMonth(account, evs, m);
    }
    for (const account of debts) {
      const evs = eventsByAccount[String(account._id)] ?? [];
      totalDebts += balanceAtMonth(account, evs, m);
    }

    data.push({ month: m, assets: totalAssets, debts: totalDebts, netWorth: totalAssets - totalDebts });
  }

  return data;
}

/**
 * Build per-account monthly historical data (for stacked area charts).
 *
 * @param {object[]} accounts - Filtered accounts (assets OR debts)
 * @param {object[]} events - All events for the user
 * @param {number} historyMonths - Number of months to look back
 * @returns {Array<{month, [accountId]: balance}>}
 */
export function buildHistoryByAccount(accounts, events, historyMonths) {
  if (historyMonths <= 0) return [];

  const eventsByAccount = {};
  for (const ev of events) {
    const key = String(ev.accountId);
    if (!eventsByAccount[key]) eventsByAccount[key] = [];
    eventsByAccount[key].push(ev);
  }

  const data = [];

  for (let m = -historyMonths; m <= 0; m++) {
    const point = { month: m };
    for (const account of accounts) {
      const evs = eventsByAccount[String(account._id)] ?? [];
      point[account._id] = balanceAtMonth(account, evs, m);
    }
    data.push(point);
  }

  return data;
}

/**
 * Compute the number of months from the earliest account_opened event to today.
 * Returns 0 if no events.
 */
export function computeHistoryMonths(events) {
  const openedEvents = events.filter(e => e.type === 'account_opened');
  if (!openedEvents.length) return 0;

  const earliest = openedEvents.reduce((min, e) =>
    new Date(e.date) < new Date(min.date) ? e : min
  );

  const nowYM = offsetToYearMonth(0);
  const openedYM = toYearMonth(earliest.date);
  return Math.max(0, monthsBetween(openedYM, nowYM));
}
