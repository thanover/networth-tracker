const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/accounts', require('./routes/accounts'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = app;
