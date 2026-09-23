const mongoose = require('mongoose');

const privatePaymentSchema = new mongoose.Schema({
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PrivateInvoice',
    required: true
  },
  partyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PrivateParty'
  },
  partyName: {
    type: String,
    required: true,
    trim: true
  },
  invoiceNo: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Payment amount must be greater than 0']
  },
  paymentDate: {
    type: String,
    required: true // YYYY-MM-DD
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'UPI', 'NEFT', 'RTGS', 'Cheque', 'Bank Transfer', 'Other'],
    default: 'NEFT'
  },
  reference: {
    type: String,
    default: '',
    trim: true // UTR, Cheque No, Transaction Ref
  },
  bankDetails: {
    type: String,
    default: '',
    trim: true // Bank Name, Account, Branch if applicable
  },
  notes: {
    type: String,
    default: '',
    trim: true
  },
  financialYear: {
    type: String,
    default: '2025-26'
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

privatePaymentSchema.index({ partyId: 1, paymentDate: -1 });
privatePaymentSchema.index({ invoiceId: 1 });

module.exports = mongoose.model('PrivatePayment', privatePaymentSchema);
