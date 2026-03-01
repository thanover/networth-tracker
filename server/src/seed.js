const User = require('./models/User');
const Account = require('./models/Account');
const AccountEvent = require('./models/AccountEvent');

const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || 'demo1234';
const DEMO_USERNAME = process.env.SEED_DEMO_USERNAME || 'demo';

// Helper: return a Date for `n` months before today
function monthsAgo(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
}

// ── Persona 1: Average — the existing demo user ───────────────────────────────
const AVERAGE_USER = {
  username: DEMO_USERNAME,
  password: DEMO_PASSWORD,
  birthday: new Date('1985-03-22'),
  accounts: [
    {
      name: '401(k)',
      category: 'asset',
      type: 'investment',
      balance: 45000,
      expectedGrowthRate: 7,
      monthlyContribution: 500,
      events: [
        { type: 'account_opened', monthsAgo: 60, balance: 18000 },
        { type: 'balance_update',  monthsAgo: 48, balance: 23500 },
        { type: 'balance_update',  monthsAgo: 36, balance: 29800 },
        { type: 'balance_update',  monthsAgo: 24, balance: 35200 },
        { type: 'balance_update',  monthsAgo: 12, balance: 40100 },
        { type: 'balance_update',  monthsAgo: 0,  balance: 45000 },
      ],
    },
    {
      name: 'Brokerage Account',
      category: 'asset',
      type: 'investment',
      balance: 18000,
      expectedGrowthRate: 8,
      monthlyContribution: 200,
      events: [
        { type: 'account_opened', monthsAgo: 36, balance: 5000 },
        { type: 'balance_update',  monthsAgo: 24, balance: 9200 },
        { type: 'balance_update',  monthsAgo: 12, balance: 13800 },
        { type: 'balance_update',  monthsAgo: 0,  balance: 18000 },
      ],
    },
    {
      name: 'Primary Home',
      category: 'asset',
      type: 'property',
      balance: 320000,
      expectedGrowthRate: 3,
      events: [
        { type: 'account_opened', monthsAgo: 72, balance: 270000 },
        { type: 'balance_update',  monthsAgo: 48, balance: 285000 },
        { type: 'balance_update',  monthsAgo: 24, balance: 302000 },
        { type: 'balance_update',  monthsAgo: 0,  balance: 320000 },
      ],
    },
    {
      name: 'Toyota Camry',
      category: 'asset',
      type: 'vehicle',
      balance: 18000,
      expectedGrowthRate: -15,
      events: [
        { type: 'account_opened', monthsAgo: 30, balance: 28000 },
        { type: 'balance_update',  monthsAgo: 18, balance: 24000 },
        { type: 'balance_update',  monthsAgo: 6,  balance: 20000 },
        { type: 'balance_update',  monthsAgo: 0,  balance: 18000 },
      ],
    },
    {
      name: 'High-Yield Savings',
      category: 'asset',
      type: 'cash',
      balance: 12000,
      interestRate: 4.5,
      monthlyContribution: 200,
      events: [
        { type: 'account_opened', monthsAgo: 24, balance: 6000 },
        { type: 'balance_update',  monthsAgo: 12, balance: 9100 },
        { type: 'balance_update',  monthsAgo: 0,  balance: 12000 },
      ],
    },
    {
      name: 'Checking Account',
      category: 'asset',
      type: 'cash',
      balance: 3500,
      events: [
        { type: 'account_opened', monthsAgo: 60, balance: 2000 },
        { type: 'balance_update',  monthsAgo: 24, balance: 2800 },
        { type: 'balance_update',  monthsAgo: 0,  balance: 3500 },
      ],
    },
    {
      name: 'Home Mortgage',
      category: 'debt',
      type: 'loan',
      balance: 260000,
      interestRate: 6.5,
      monthlyPayment: 1800,
      remainingTerm: 300,
      events: [
        { type: 'account_opened', monthsAgo: 72, balance: 290000 },
        { type: 'balance_update',  monthsAgo: 48, balance: 283000 },
        { type: 'balance_update',  monthsAgo: 24, balance: 272000 },
        { type: 'balance_update',  monthsAgo: 0,  balance: 260000 },
      ],
    },
    {
      name: 'Visa Credit Card',
      category: 'debt',
      type: 'credit_card',
      balance: 3200,
      interestRate: 22,
      monthlyPayment: 200,
      events: [
        { type: 'account_opened', monthsAgo: 18, balance: 0 },
        { type: 'balance_update',  monthsAgo: 12, balance: 1500 },
        { type: 'balance_update',  monthsAgo: 6,  balance: 2800 },
        { type: 'balance_update',  monthsAgo: 0,  balance: 3200 },
      ],
    },
  ],
};

// ── Persona 2: Wealthy — high net worth individual ────────────────────────────
const WEALTHY_USER = {
  username: 'wealthy',
  password: DEMO_PASSWORD,
  birthday: new Date('1965-07-04'),
  accounts: [
    {
      name: 'Stock Portfolio',
      category: 'asset',
      type: 'investment',
      balance: 1_450_000,
      expectedGrowthRate: 9,
      monthlyContribution: 8000,
      events: [
        { type: 'account_opened', monthsAgo: 120, balance: 380000 },
        { type: 'balance_update',  monthsAgo: 96,  balance: 560000 },
        { type: 'balance_update',  monthsAgo: 72,  balance: 740000 },
        { type: 'balance_update',  monthsAgo: 48,  balance: 960000 },
        { type: 'balance_update',  monthsAgo: 24,  balance: 1180000 },
        { type: 'balance_update',  monthsAgo: 0,   balance: 1450000 },
      ],
    },
    {
      name: 'Vanguard Index Funds',
      category: 'asset',
      type: 'investment',
      balance: 820000,
      expectedGrowthRate: 8,
      monthlyContribution: 4000,
      events: [
        { type: 'account_opened', monthsAgo: 180, balance: 80000 },
        { type: 'balance_update',  monthsAgo: 120, balance: 240000 },
        { type: 'balance_update',  monthsAgo: 72,  balance: 460000 },
        { type: 'balance_update',  monthsAgo: 36,  balance: 650000 },
        { type: 'balance_update',  monthsAgo: 0,   balance: 820000 },
      ],
    },
    {
      name: 'Primary Residence',
      category: 'asset',
      type: 'property',
      balance: 2_100_000,
      expectedGrowthRate: 4,
      events: [
        { type: 'account_opened', monthsAgo: 144, balance: 1100000 },
        { type: 'balance_update',  monthsAgo: 96,  balance: 1400000 },
        { type: 'balance_update',  monthsAgo: 48,  balance: 1750000 },
        { type: 'balance_update',  monthsAgo: 0,   balance: 2100000 },
      ],
    },
    {
      name: 'Rental Property',
      category: 'asset',
      type: 'property',
      balance: 780000,
      expectedGrowthRate: 4,
      events: [
        { type: 'account_opened', monthsAgo: 84, balance: 520000 },
        { type: 'balance_update',  monthsAgo: 48, balance: 620000 },
        { type: 'balance_update',  monthsAgo: 12, balance: 740000 },
        { type: 'balance_update',  monthsAgo: 0,  balance: 780000 },
      ],
    },
    {
      name: 'Tesla Model S',
      category: 'asset',
      type: 'vehicle',
      balance: 55000,
      expectedGrowthRate: -18,
      events: [
        { type: 'account_opened', monthsAgo: 24, balance: 90000 },
        { type: 'balance_update',  monthsAgo: 12, balance: 72000 },
        { type: 'balance_update',  monthsAgo: 0,  balance: 55000 },
      ],
    },
    {
      name: 'Money Market Account',
      category: 'asset',
      type: 'cash',
      balance: 180000,
      interestRate: 5.2,
      monthlyContribution: 3000,
      events: [
        { type: 'account_opened', monthsAgo: 60, balance: 60000 },
        { type: 'balance_update',  monthsAgo: 36, balance: 100000 },
        { type: 'balance_update',  monthsAgo: 12, balance: 150000 },
        { type: 'balance_update',  monthsAgo: 0,  balance: 180000 },
      ],
    },
    {
      name: 'Business Checking',
      category: 'asset',
      type: 'cash',
      balance: 95000,
      events: [
        { type: 'account_opened', monthsAgo: 120, balance: 20000 },
        { type: 'balance_update',  monthsAgo: 60,  balance: 50000 },
        { type: 'balance_update',  monthsAgo: 0,   balance: 95000 },
      ],
    },
    {
      name: 'Rental Property Mortgage',
      category: 'debt',
      type: 'loan',
      balance: 290000,
      interestRate: 5.5,
      monthlyPayment: 3200,
      remainingTerm: 180,
      events: [
        { type: 'account_opened', monthsAgo: 84, balance: 415000 },
        { type: 'balance_update',  monthsAgo: 48, balance: 370000 },
        { type: 'balance_update',  monthsAgo: 12, balance: 310000 },
        { type: 'balance_update',  monthsAgo: 0,  balance: 290000 },
      ],
    },
  ],
};

// ── Persona 3: Struggling — high debt, low assets ─────────────────────────────
const STRUGGLING_USER = {
  username: 'struggling',
  password: DEMO_PASSWORD,
  birthday: new Date('1996-11-30'),
  accounts: [
    {
      name: 'Checking Account',
      category: 'asset',
      type: 'cash',
      balance: 750,
      events: [
        { type: 'account_opened', monthsAgo: 48, balance: 1200 },
        { type: 'balance_update',  monthsAgo: 24, balance: 900 },
        { type: 'balance_update',  monthsAgo: 6,  balance: 400 },
        { type: 'balance_update',  monthsAgo: 0,  balance: 750 },
      ],
    },
    {
      name: 'Honda Civic (2016)',
      category: 'asset',
      type: 'vehicle',
      balance: 4500,
      expectedGrowthRate: -18,
      events: [
        { type: 'account_opened', monthsAgo: 36, balance: 9000 },
        { type: 'balance_update',  monthsAgo: 18, balance: 6500 },
        { type: 'balance_update',  monthsAgo: 0,  balance: 4500 },
      ],
    },
    {
      name: 'Federal Student Loan',
      category: 'debt',
      type: 'loan',
      balance: 31500,
      interestRate: 6.5,
      monthlyPayment: 350,
      remainingTerm: 108,
      events: [
        { type: 'account_opened', monthsAgo: 48, balance: 36000 },
        { type: 'balance_update',  monthsAgo: 24, balance: 34200 },
        { type: 'balance_update',  monthsAgo: 0,  balance: 31500 },
      ],
    },
    {
      name: 'Private Student Loan',
      category: 'debt',
      type: 'loan',
      balance: 18800,
      interestRate: 9.8,
      monthlyPayment: 220,
      remainingTerm: 84,
      events: [
        { type: 'account_opened', monthsAgo: 48, balance: 20000 },
        { type: 'balance_update',  monthsAgo: 24, balance: 19600 },
        { type: 'balance_update',  monthsAgo: 0,  balance: 18800 },
      ],
    },
    {
      name: 'Car Loan',
      category: 'debt',
      type: 'loan',
      balance: 6200,
      interestRate: 11.5,
      monthlyPayment: 280,
      remainingTerm: 24,
      events: [
        { type: 'account_opened', monthsAgo: 36, balance: 12000 },
        { type: 'balance_update',  monthsAgo: 18, balance: 9100 },
        { type: 'balance_update',  monthsAgo: 0,  balance: 6200 },
      ],
    },
    {
      name: 'Discover Card',
      category: 'debt',
      type: 'credit_card',
      balance: 7200,
      interestRate: 24.99,
      monthlyPayment: 200,
      events: [
        { type: 'account_opened', monthsAgo: 30, balance: 0 },
        { type: 'balance_update',  monthsAgo: 18, balance: 3400 },
        { type: 'balance_update',  monthsAgo: 6,  balance: 6100 },
        { type: 'balance_update',  monthsAgo: 0,  balance: 7200 },
      ],
    },
    {
      name: 'Chase Freedom Card',
      category: 'debt',
      type: 'credit_card',
      balance: 4800,
      interestRate: 21.99,
      monthlyPayment: 130,
      events: [
        { type: 'account_opened', monthsAgo: 24, balance: 0 },
        { type: 'balance_update',  monthsAgo: 12, balance: 2900 },
        { type: 'balance_update',  monthsAgo: 0,  balance: 4800 },
      ],
    },
    {
      name: 'Medical Debt',
      category: 'debt',
      type: 'credit_card',
      balance: 3100,
      interestRate: 0,
      monthlyPayment: 75,
      events: [
        { type: 'account_opened', monthsAgo: 18, balance: 4200 },
        { type: 'balance_update',  monthsAgo: 9,  balance: 3600 },
        { type: 'balance_update',  monthsAgo: 0,  balance: 3100 },
      ],
    },
  ],
};

// ── Seed helper ────────────────────────────────────────────────────────────────

async function seedUser({ username, password, birthday, accounts }) {
  const existing = await User.findOne({ username });
  if (existing) {
    console.log(`Seed: user "${username}" already exists — skipping`);
    return;
  }

  const user = await User.create({ username, password, birthday });
  const allEvents = [];

  for (const { events: accountEvents, ...accountData } of accounts) {
    const account = await Account.create({ ...accountData, userId: user._id });

    for (const ev of (accountEvents ?? [])) {
      allEvents.push({
        accountId: account._id,
        userId: user._id,
        type: ev.type,
        date: monthsAgo(ev.monthsAgo),
        ...(ev.balance !== undefined ? { balance: ev.balance } : {}),
      });
    }
  }

  if (allEvents.length) {
    await AccountEvent.insertMany(allEvents);
  }

  console.log(`Seed: created user "${username}" with ${accounts.length} accounts and ${allEvents.length} events`);
}

async function seedDemoData() {
  await seedUser(AVERAGE_USER);
  await seedUser(WEALTHY_USER);
  await seedUser(STRUGGLING_USER);
}

module.exports = seedDemoData;
