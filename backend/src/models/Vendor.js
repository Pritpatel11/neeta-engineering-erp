const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vendor / Company Name is required'],
      unique: true,
      trim: true,
    },
    contactPerson: {
      type: String,
      default: '',
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Contact phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Vendor email address is required for RFQ dispatch'],
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    city: {
      type: String,
      default: '',
      trim: true,
    },
    state: {
      type: String,
      default: 'Gujarat',
      trim: true,
    },
    stateCode: {
      type: String,
      default: '24',
      trim: true,
    },
    pincode: {
      type: String,
      default: '',
      trim: true,
    },
    gst: {
      type: String,
      default: '',
      trim: true,
      uppercase: true,
    },
    pan: {
      type: String,
      default: '',
      trim: true,
      uppercase: true,
    },
    bankDetails: {
      bankName: { type: String, default: '' },
      accountNo: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
      branch: { type: String, default: '' },
      accountHolder: { type: String, default: '' },
    },
    paymentTerms: {
      type: String,
      default: '30 Days Net',
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Vendor', vendorSchema);
