const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/user', require('./routes/user'));
app.use('/api/export', require('./routes/export'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = app;
