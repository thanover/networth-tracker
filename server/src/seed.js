const User = require('./models/User');
const Account = require('./models/Account');

const DEMO_USERNAME = process.env.SEED_DEMO_USERNAME || 'demo';
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || 'demo1234';

const DEMO_ACCOUNTS = [
  {
    name: '401(k)',
    category: 'asset',
    type: 'investment',
    balance: 45000,
    expectedGrowthRate: 7,
    monthlyContribution: 500,
  },
  {
    name: 'Brokerage Account',
    category: 'asset',
    type: 'investment',
    balance: 18000,
    expectedGrowthRate: 8,
    monthlyContribution: 200,
  },
  {
    name: 'Primary Home',
    category: 'asset',
    type: 'property',
    balance: 320000,
    expectedGrowthRate: 3,
  },
  {
    name: 'Toyota Camry',
    category: 'asset',
    type: 'vehicle',
    balance: 18000,
    expectedGrowthRate: -15,
  },
  {
    name: 'High-Yield Savings',
    category: 'asset',
    type: 'cash',
    balance: 12000,
    interestRate: 4.5,
    monthlyContribution: 200,
  },
  {
    name: 'Checking Account',
    category: 'asset',
    type: 'cash',
    balance: 3500,
  },
  {
    name: 'Home Mortgage',
    category: 'debt',
    type: 'loan',
    balance: 260000,
    interestRate: 6.5,
    monthlyPayment: 1800,
    remainingTerm: 300,
  },
  {
    name: 'Visa Credit Card',
    category: 'debt',
    type: 'credit_card',
    balance: 3200,
    interestRate: 22,
    monthlyPayment: 200,
  },
];

async function seedDemoData() {
  const existing = await User.findOne({ username: DEMO_USERNAME });
  if (existing) {
    console.log(`Seed: demo user "${DEMO_USERNAME}" already exists — skipping`);
    return;
  }

  const user = await User.create({ username: DEMO_USERNAME, password: DEMO_PASSWORD });
  const accounts = DEMO_ACCOUNTS.map((a) => ({ ...a, userId: user._id }));
  await Account.insertMany(accounts);
  console.log(`Seed: created demo user "${DEMO_USERNAME}" with ${accounts.length} accounts`);
}

module.exports = seedDemoData;
