const mongoose = require('mongoose');

const balanceMaterialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  qty: { type: Number, required: true, default: 0 },
  manualAdjustment: { type: Number, default: 0 }
}, { _id: false });

const divisionBalanceSchema = new mongoose.Schema({
  divisionName: { type: String, required: true, },
  materials: [balanceMaterialSchema],
  financialYear: { type: String, required: true, default: '2025-26' }
}, { timestamps: true });

divisionBalanceSchema.index({ divisionName: 1, financialYear: 1 }, { unique: true });

module.exports = mongoose.model('DivisionBalance', divisionBalanceSchema);
