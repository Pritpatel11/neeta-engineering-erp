const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
  receiptNo: {
    type: String,
    required: true,
    },
  date: {
    type: String, // Stored as DD-MMM-YY or YYYY-MM-DD
    required: true
  },
  partyName: {
    type: String,
    required: true
  },
  chequeNo: {
    type: String
  },
  billNo: {
    type: String
  },
  billDate: {
    type: String
  },
  amount: {
    type: Number,
    required: true
  },
  financialYear: { type: String, required: true, default: '2025-26' }
}, { timestamps: true });

receiptSchema.index({ receiptNo: 1, financialYear: 1 }, { unique: true });

module.exports = mongoose.model('Receipt', receiptSchema);
