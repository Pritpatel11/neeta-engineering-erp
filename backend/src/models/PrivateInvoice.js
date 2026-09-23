const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  hsn: { type: String, default: '' },
  quantity: { type: Number, required: true, default: 1 },
  unit: { type: String, default: 'Nos' },
  rate: { type: Number, required: true, default: 0 },
  amount: { type: Number, required: true, default: 0 }
}, { _id: false });

const privateInvoiceSchema = new mongoose.Schema({
  invoiceNo: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  dueDate: {
    type: String,
    default: ''
  },
  poNumber: {
    type: String,
    default: ''
  },
  partyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PrivateParty'
  },
  clientName: {
    type: String,
    required: true
  },
  companyName: {
    type: String,
    default: ''
  },
  clientEmail: {
    type: String,
    default: ''
  },
  clientPhone: {
    type: String,
    default: ''
  },
  clientAddress: {
    type: String,
    default: ''
  },
  clientCity: {
    type: String,
    default: ''
  },
  clientDistrict: {
    type: String,
    default: ''
  },
  clientPincode: {
    type: String,
    default: ''
  },
  clientGST: {
    type: String,
    default: ''
  },
  buyerState: {
    type: String,
    default: 'Gujarat'
  },
  buyerStateCode: {
    type: String,
    default: '24'
  },
  isInterState: {
    type: Boolean,
    default: false
  },
  documentType: {
    type: String,
    default: 'TAX INVOICE'
  },
  items: [itemSchema],
  subTotal: {
    type: Number,
    required: true,
    default: 0
  },
  taxPercentage: {
    type: Number,
    default: 18
  },
  taxAmount: {
    type: Number,
    default: 0
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
    required: true,
    default: 0
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  balanceAmount: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['Unpaid', 'Partially Paid', 'Fully Paid'],
    default: 'Unpaid'
  },
  payments: [{
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'PrivatePayment' },
    amount: { type: Number, required: true },
    date: { type: String, required: true },
    method: { type: String, default: 'NEFT' },
    reference: { type: String, default: '' },
    bankDetails: { type: String, default: '' },
    notes: { type: String, default: '' },
    recordedAt: { type: Date, default: Date.now }
  }],
  notes: {
    type: String,
    default: 'Thank you for your business!'
  },
  terms: {
    type: String,
    default: '1. Payment: Full payment must be completed immediately upon delivery.\n2. Goods once sold will not be taken back or exchanged.\n3. Subject to Banaskantha/Palanpur jurisdiction.'
  },
  bankDetails: {
    bankName: { type: String, default: 'The Mehsana Urban Co-operative Bank Ltd.' },
    accountNo: { type: String, default: '00141101001022' },
    ifsc: { type: String, default: 'MSNU0000014' },
    branch: { type: String, default: 'Deesa Branch' }
  },
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'],
    default: 'Draft'
  },
  financialYear: {
    type: String,
    required: true,
    default: '2025-26'
  },
  emailHistory: [{
    sentTo: String,
    sentAt: { type: Date, default: Date.now },
    status: String,
    messageId: String
  }]
}, { timestamps: true });

privateInvoiceSchema.index({ invoiceNo: 1, financialYear: 1 }, { unique: true });

module.exports = mongoose.model('PrivateInvoice', privateInvoiceSchema);
