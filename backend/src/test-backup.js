require('dotenv').config();
const mongoose = require('mongoose');
const backupDatabase = require('./utils/backup');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/erp_db');
        console.log('Connected to DB');
        await backupDatabase();
        console.log('Backup successful');
        process.exit(0);
    } catch (err) {
        console.error('Backup error:', err);
        process.exit(1);
    }
}

run();
