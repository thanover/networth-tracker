const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Account = require('../models/Account');
const AccountEvent = require('../models/AccountEvent');

// GET /api/export  — download all user data as JSON
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('username birthday inflationRate');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const accountDocs = await Account.find({ userId: req.userId }).lean();

    const accounts = accountDocs.map(({ _id, userId, __v, createdAt, updatedAt, ...rest }) => ({
      _exportId: String(_id),
      ...rest,
    }));

    const rawEvents = await AccountEvent.find({ userId: req.userId })
      .sort({ date: 1 })
      .lean();

    const events = rawEvents.map(({ _id, userId, __v, ...rest }) => ({
      ...rest,
      accountId: String(rest.accountId),
    }));

    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      profile: {
        username: user.username,
        birthday: user.birthday ?? null,
        inflationRate: user.inflationRate,
      },
      accounts,
      events,
    };

    res.setHeader('Content-Disposition', `attachment; filename="networth-export-${Date.now()}.json"`);
    res.setHeader('Content-Type', 'application/json');
    res.json(payload);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/import  — restore data from an export file
router.post('/', auth, async (req, res) => {
  const { version, profile, accounts, events } = req.body;

  if (version !== 1) {
    return res.status(400).json({ error: 'Unsupported export version' });
  }

  try {
    let importedAccounts = 0;
    let importedEvents = 0;
    const failures = [];

    // Map from export _exportId → new MongoDB _id
    const accountIdMap = new Map();

    if (Array.isArray(accounts)) {
      // Validate each account before touching the DB
      const valid = [];
      for (const a of accounts) {
        const { _exportId, ...accountData } = a;
        const doc = new Account({ ...accountData, userId: req.userId });
        const err = doc.validateSync();
        if (err) {
          failures.push({ name: a.name || '(unnamed)', reason: Object.values(err.errors).map(e => e.message).join(', ') });
        } else {
          if (_exportId) accountIdMap.set(_exportId, doc._id);
          valid.push(doc);
        }
      }

      await Account.deleteMany({ userId: req.userId });
      await AccountEvent.deleteMany({ userId: req.userId });

      if (valid.length) {
        await Account.insertMany(valid);
      }
      importedAccounts = valid.length;
    }

    if (Array.isArray(events) && events.length) {
      const validEvents = [];
      for (const e of events) {
        const newAccountId = accountIdMap.get(e.accountId);
        if (!newAccountId) continue;
        validEvents.push({
          accountId: newAccountId,
          userId: req.userId,
          type: e.type,
          date: e.date,
          ...(e.balance !== undefined ? { balance: e.balance } : {}),
        });
      }
      if (validEvents.length) {
        await AccountEvent.insertMany(validEvents);
        importedEvents = validEvents.length;
      }
    }

    if (profile) {
      const update = {};
      if ('birthday' in profile)      update.birthday      = profile.birthday ?? null;
      if ('inflationRate' in profile)  update.inflationRate = profile.inflationRate;
      if (Object.keys(update).length) {
        await User.findByIdAndUpdate(req.userId, update);
      }
    }

    res.json({ imported: { accounts: importedAccounts, events: importedEvents }, failures });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
