const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  unit: { type: String, required: true },
  mrQuantities: { type: Map, of: Number, default: {} },
  qty: { type: Number, required: true }
}, { _id: false });

const statementSchema = new mongoose.Schema({
  statementNo: { type: String, required: true, },
  poNo: { type: String },
  relNo: { type: String },
  poNumbers: { type: Map, of: String, default: {} },
  relNumbers: { type: Map, of: String, default: {} },
  gpNo: { type: String },
  gpDate: { type: String },
  dcNo: { type: String },
  dcDate: { type: String },
  date: { type: String, required: true },
  contractorName: { type: String, required: true },
  divisionName: { type: String, required: true },
  subDivisionName: { type: String, required: true },
  mrNumbers: [{ type: String }],
  status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
  materials: [materialSchema],
  financialYear: { type: String, required: true, default: '2025-26' }
}, { timestamps: true });

statementSchema.index({ statementNo: 1, financialYear: 1 }, { unique: true });

module.exports = mongoose.model('Statement', statementSchema);
