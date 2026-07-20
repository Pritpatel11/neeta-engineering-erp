const mongoose = require('mongoose');

const financialYearSchema = new mongoose.Schema({
  year: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('FinancialYear', financialYearSchema);
