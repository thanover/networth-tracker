const User = require('./models/User');
const Account = require('./models/Account');
const AccountEvent = require('./models/AccountEvent');

const DEMO_USERNAME = process.env.SEED_DEMO_USERNAME || 'demo';
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || 'demo1234';

// Helper: return a Date for `monthsAgo` months before today
function monthsAgo(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
}

const DEMO_ACCOUNTS = [
  {
    name: '401(k)',
    category: 'asset',
    type: 'investment',
    balance: 45000,
    expectedGrowthRate: 7,
    monthlyContribution: 500,
    // Events: opened ~5 years ago, quarterly balance updates
    events: [
      { type: 'account_opened',  monthsAgo: 60, balance: 18000 },
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
      { type: 'account_opened',  monthsAgo: 36, balance: 5000 },
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
      { type: 'account_opened',  monthsAgo: 72, balance: 270000 },
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
      { type: 'account_opened',  monthsAgo: 30, balance: 28000 },
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
      { type: 'account_opened',  monthsAgo: 24, balance: 6000 },
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
      { type: 'account_opened',  monthsAgo: 60, balance: 2000 },
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
      { type: 'account_opened',  monthsAgo: 72, balance: 290000 },
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
      { type: 'account_opened',  monthsAgo: 18, balance: 0 },
      { type: 'balance_update',  monthsAgo: 12, balance: 1500 },
      { type: 'balance_update',  monthsAgo: 6,  balance: 2800 },
      { type: 'balance_update',  monthsAgo: 0,  balance: 3200 },
    ],
  },
];

async function seedDemoData() {
  const existing = await User.findOne({ username: DEMO_USERNAME });
  if (existing) {
    console.log(`Seed: demo user "${DEMO_USERNAME}" already exists — skipping`);
    return;
  }

  const user = await User.create({
    username: DEMO_USERNAME,
    password: DEMO_PASSWORD,
    birthday: new Date('1985-03-22'),
  });

  const allEvents = [];

  for (const { events: accountEvents, ...accountData } of DEMO_ACCOUNTS) {
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

  const accountCount = DEMO_ACCOUNTS.length;
  console.log(`Seed: created demo user "${DEMO_USERNAME}" with ${accountCount} accounts and ${allEvents.length} events`);
}

module.exports = seedDemoData;
