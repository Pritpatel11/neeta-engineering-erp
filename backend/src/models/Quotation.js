const mongoose = require('mongoose');

const quotationSchema = new mongoose.Schema({
  quotationNo: {
    type: String,
    required: true,
    },
  date: {
    type: String,
    required: true
  },
  clientName: {
    type: String
  },
  companyName: {
    type: String
  },
  clientEmail: String,
  clientPhone: String,
  clientAddress: String,
  clientCity: { type: String, default: '' },
  clientDistrict: { type: String, default: '' },
  clientPincode: { type: String, default: '' },
  clientGST: String,
  documentType: {
    type: String,
    enum: ['Quotation', 'Proforma Invoice', 'Estimate'],
    default: 'Quotation'
  },
  subject: {
    type: String
  },
  items: [{
    description: String,
    hsn: String,
    quantity: Number,
    unit: String,
    rate: Number,
    amount: Number
  }],
  subTotal: {
    type: Number,
    required: true
  },
  taxPercentage: {
    type: Number,
    default: 0
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  isInterState: {
    type: Boolean,
    default: false
  },
  buyerState: {
    type: String,
    default: ''
  },
  buyerStateCode: {
    type: String,
    default: ''
  },
  cgstAmount: {
    type: Number,
    default: 0
  },
  sgstAmount: {
    type: Number,
    default: 0
  },
  igstAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  terms: {
    type: String
  },
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Accepted', 'Rejected'],
    default: 'Draft'
  },
  financialYear: { type: String, required: true, default: '2025-26' }
}, { timestamps: true });

quotationSchema.index({ quotationNo: 1, financialYear: 1 }, { unique: true });

module.exports = mongoose.model('Quotation', quotationSchema);
