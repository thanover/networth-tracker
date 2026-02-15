const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('username birthday inflationRate');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ username: user.username, birthday: user.birthday, inflationRate: user.inflationRate });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/', auth, async (req, res) => {
  try {
    const { birthday, inflationRate } = req.body;
    const update = {};
    if ('birthday' in req.body)      update.birthday      = birthday ?? null;
    if ('inflationRate' in req.body) update.inflationRate = inflationRate;
    const user = await User.findByIdAndUpdate(
      req.userId,
      update,
      { new: true, select: 'username birthday inflationRate' }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ username: user.username, birthday: user.birthday, inflationRate: user.inflationRate });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
