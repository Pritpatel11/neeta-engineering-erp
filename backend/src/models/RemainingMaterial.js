const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  unit: { type: String, required: true },
  qty: { type: Number, required: true }
}, { _id: false });

const remainingMaterialSchema = new mongoose.Schema({
  originalChallanNo: { type: String, required: true },
  contractorName: { type: String, required: true },
  divisionName: { type: String },
  date: { type: String, required: true },
  materials: [materialSchema],
  financialYear: { type: String, required: true, default: '2025-26' }
}, { timestamps: true });

module.exports = mongoose.model('RemainingMaterial', remainingMaterialSchema);
