const router = require('express').Router();
const Account = require('../models/Account');
const AccountEvent = require('../models/AccountEvent');

// GET /api/events — all events for current user, sorted by date asc
router.get('/', async (req, res) => {
  try {
    const events = await AccountEvent.find({ userId: req.userId }).sort({ date: 1 });
    res.json(events);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/events — create a new event
router.post('/', async (req, res) => {
  const { accountId, type, date, balance } = req.body;

  if (!accountId || !type || !date) {
    return res.status(400).json({ error: 'accountId, type, and date are required' });
  }

  const VALID_TYPES = ['account_opened', 'balance_update', 'account_closed'];
  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: `type must be one of: ${VALID_TYPES.join(', ')}` });
  }

  if (type !== 'account_closed' && (balance === undefined || balance === null)) {
    return res.status(400).json({ error: 'balance is required for account_opened and balance_update events' });
  }

  try {
    // Verify account belongs to user
    const account = await Account.findOne({ _id: accountId, userId: req.userId });
    if (!account) return res.status(404).json({ error: 'Account not found' });

    const event = await AccountEvent.create({
      accountId,
      userId: req.userId,
      type,
      date: new Date(date),
      ...(balance !== undefined && balance !== null ? { balance } : {}),
    });

    // If this is a balance_update, check if it's the most-recent event for this account.
    // If so, also update account.balance so it reflects the latest snapshot.
    if (type === 'balance_update') {
      const latestEvent = await AccountEvent.findOne({
        accountId,
        type: { $in: ['account_opened', 'balance_update'] },
      }).sort({ date: -1, _id: -1 });

      if (latestEvent && latestEvent._id.equals(event._id)) {
        await Account.findByIdAndUpdate(accountId, { balance });
      }
    }

    res.status(201).json(event);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/events/:id — update an event
router.put('/:id', async (req, res) => {
  const { date, balance } = req.body;

  try {
    const event = await AccountEvent.findOne({ _id: req.params.id, userId: req.userId });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    if (date !== undefined) event.date = new Date(date);
    if (balance !== undefined) event.balance = balance;
    await event.save();

    res.json(event);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/events/:id — delete an event
router.delete('/:id', async (req, res) => {
  try {
    const event = await AccountEvent.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ message: 'Event deleted' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
