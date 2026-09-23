const mongoose = require('mongoose');

let isConnected = false;
let retryTimer = null;

const connectDB = async (onConnected) => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/erp_db';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    if (typeof onConnected === 'function') {
      onConnected();
    }
    return conn;
  } catch (error) {
    isConnected = false;
    console.error(`[MongoDB] Connection failed: ${error.message}`);
    console.error('[MongoDB] Retrying in 5 seconds... Make sure MongoDB service is running (e.g. net start MongoDB).');
    
    // Auto-retry in 5 seconds without crashing the server
    if (!retryTimer) {
      retryTimer = setTimeout(() => {
        retryTimer = null;
        connectDB(onConnected);
      }, 5000);
    }
  }
};

const isDbConnected = () => mongoose.connection.readyState === 1;

module.exports = connectDB;
module.exports.isDbConnected = isDbConnected;

