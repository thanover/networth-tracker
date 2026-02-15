const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Account = require('../models/Account');

// GET /api/export  — download all user data as JSON
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('username birthday inflationRate');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const accounts = await Account.find({ userId: req.userId })
      .select('-_id -userId -__v -createdAt -updatedAt')
      .lean();

    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      profile: {
        username: user.username,
        birthday: user.birthday ?? null,
        inflationRate: user.inflationRate,
      },
      accounts,
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
  const { version, profile, accounts } = req.body;

  if (version !== 1) {
    return res.status(400).json({ error: 'Unsupported export version' });
  }

  try {
    let importedAccounts = 0;
    const failures = [];

    if (Array.isArray(accounts)) {
      // Validate each account before touching the DB
      const valid = [];
      for (const a of accounts) {
        const doc = new Account({ ...a, userId: req.userId });
        const err = doc.validateSync();
        if (err) {
          failures.push({ name: a.name || '(unnamed)', reason: Object.values(err.errors).map(e => e.message).join(', ') });
        } else {
          valid.push(doc);
        }
      }

      await Account.deleteMany({ userId: req.userId });
      if (valid.length) {
        await Account.insertMany(valid);
      }
      importedAccounts = valid.length;
    }

    if (profile) {
      const update = {};
      if ('birthday' in profile)      update.birthday      = profile.birthday ?? null;
      if ('inflationRate' in profile)  update.inflationRate = profile.inflationRate;
      if (Object.keys(update).length) {
        await User.findByIdAndUpdate(req.userId, update);
      }
    }

    res.json({ imported: { accounts: importedAccounts }, failures });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
