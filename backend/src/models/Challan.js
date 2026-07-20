const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  unit: { type: String, required: true },
  qty: { type: Number, required: true }
}, { _id: false });

const challanSchema = new mongoose.Schema({
  challanNo: { type: String, required: true, },
  contractorName: { type: String, required: true },
  gatePassNo: { type: String, required: true },
  gatePassDate: { type: String },
  date: { type: String, required: true },
  divisionName: { type: String, required: true },
  subDivisionName: { type: String, required: true },
  vehicleNumber: { type: String, required: true },
  driverName: { type: String, required: true },
  status: { type: String, enum: ['Dispatched', 'Pending'], default: 'Pending' },
  materials: [materialSchema],
  financialYear: { type: String, required: true, default: '2025-26' }
}, { timestamps: true });

challanSchema.index({ challanNo: 1, financialYear: 1 }, { unique: true });

module.exports = mongoose.model('Challan', challanSchema);
