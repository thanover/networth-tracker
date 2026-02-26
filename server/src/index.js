const mongoose = require('mongoose');
const app = require('./app');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/networth')
  .then(async () => {
    console.log('Connected to MongoDB');
    if (process.env.SEED_DEMO_DATA === 'true') {
      const seedDemoData = require('./seed');
      await seedDemoData();
    }
    app.listen(PORT, '::', () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
