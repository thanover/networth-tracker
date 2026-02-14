const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  try {
    const user = await User.create({ username, password });
    const token = signToken(user._id);
    res.status(201).json({ token, username: user.username });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Username already taken' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  try {
    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = signToken(user._id);
    res.json({ token, username: user.username });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
