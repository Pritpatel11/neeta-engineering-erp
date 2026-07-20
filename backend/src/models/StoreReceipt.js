const mongoose = require('mongoose');

const receiptMaterialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  qty: { type: Number, required: true, default: 0 }
}, { _id: false });

const storeReceiptSchema = new mongoose.Schema({
  releaseNo: { type: String },
  receiptNo: { type: String, required: true, },
  conName: { type: String },
  oNo: { type: String },
  poNo: { type: String },
  divisionName: { type: String, required: true },
  materials: [receiptMaterialSchema],
  financialYear: { type: String, required: true, default: '2025-26' }
}, { timestamps: true });

storeReceiptSchema.index({ receiptNo: 1, financialYear: 1 }, { unique: true });

module.exports = mongoose.model('StoreReceipt', storeReceiptSchema);
