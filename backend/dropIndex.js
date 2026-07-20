const mongoose = require('mongoose');
const DivisionBalance = require('./src/models/DivisionBalance');
require('dotenv').config();

async function syncDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/erp_db');
    console.log('Connected to MongoDB.');
    // This will drop indexes not in schema and build missing ones
    await DivisionBalance.syncIndexes();
    console.log('Indexes synced for DivisionBalance.');
  } catch(e) {
    console.error(e);
  } finally {
    mongoose.disconnect();
  }
}
syncDB();
