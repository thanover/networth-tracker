const mongoose = require('mongoose');
const app = require('./app');
require('dotenv').config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/networth';
const MAX_RETRIES = 5;

async function start() {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(MONGO_URI);
      break;
    } catch (err) {
      if (attempt === MAX_RETRIES) {
        console.error('MongoDB connection failed after all retries:', err);
        process.exit(1);
      }
      const delay = 1000 * 2 ** (attempt - 1); // 1s, 2s, 4s, 8s
      console.log(`MongoDB not ready (attempt ${attempt}/${MAX_RETRIES}), retrying in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  console.log('Connected to MongoDB');

  if (process.env.SEED_DEMO_DATA === 'true') {
    const seedDemoData = require('./seed');
    await seedDemoData();
  }

  app.listen(PORT, '::', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
