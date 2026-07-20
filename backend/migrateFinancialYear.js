const mongoose = require('mongoose');

// Import all models
const Challan = require('./src/models/Challan');
const Statement = require('./src/models/Statement');
const RemainingMaterial = require('./src/models/RemainingMaterial');
const StoreReceipt = require('./src/models/StoreReceipt');
const Receipt = require('./src/models/Receipt');
const Quotation = require('./src/models/Quotation');
const Enquiry = require('./src/models/Enquiry');
const DivisionBalance = require('./src/models/DivisionBalance');

const defaultYear = '2025-26';

async function migrate() {
  try {
    await mongoose.connect('mongodb://localhost:27017/erp_db');
    console.log('Connected to MongoDB');

    const models = [Challan, Statement, RemainingMaterial, StoreReceipt, Receipt, Quotation, Enquiry, DivisionBalance];

    for (const model of models) {
      console.log(`Migrating ${model.modelName}...`);
      const result = await model.updateMany(
        { financialYear: { $exists: false } },
        { $set: { financialYear: defaultYear } }
      );
      console.log(`${model.modelName} migration complete. Updated ${result.modifiedCount} documents.`);
    }

    console.log('All migrations completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    mongoose.disconnect();
  }
}

migrate();
