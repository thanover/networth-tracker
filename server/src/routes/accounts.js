const router = require('express').Router();
const auth = require('../middleware/auth');
const Account = require('../models/Account');

// All routes require auth
router.use(auth);

// GET /api/accounts
router.get('/', async (req, res) => {
  try {
    const accounts = await Account.find({ userId: req.userId }).sort({ createdAt: 1 });
    res.json(accounts);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/accounts
router.post('/', async (req, res) => {
  const { name, category, type, balance, interestRate, expectedGrowthRate,
          monthlyContribution, monthlyPayment, remainingTerm } = req.body;

  if (!name || !category || !type || balance === undefined) {
    return res.status(400).json({ error: 'name, category, type, and balance are required' });
  }

  try {
    const account = await Account.create({
      userId: req.userId,
      name, category, type, balance,
      interestRate, expectedGrowthRate,
      monthlyContribution, monthlyPayment, remainingTerm,
    });
    res.status(201).json(account);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/accounts/:id
router.put('/:id', async (req, res) => {
  const { name, category, type, balance, interestRate, expectedGrowthRate,
          monthlyContribution, monthlyPayment, remainingTerm } = req.body;
  try {
    const account = await Account.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { name, category, type, balance, interestRate, expectedGrowthRate,
        monthlyContribution, monthlyPayment, remainingTerm },
      { new: true, runValidators: true }
    );
    if (!account) return res.status(404).json({ error: 'Account not found' });
    res.json(account);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/accounts/:id
router.delete('/:id', async (req, res) => {
  try {
    const account = await Account.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!account) return res.status(404).json({ error: 'Account not found' });
    res.json({ message: 'Account deleted' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
