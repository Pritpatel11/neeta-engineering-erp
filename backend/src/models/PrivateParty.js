const mongoose = require('mongoose');

const privatePartySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  contactPerson: {
    type: String,
    default: '',
    trim: true
  },
  phone: {
    type: String,
    default: '',
    trim: true
  },
  email: {
    type: String,
    default: '',
    trim: true
  },
  address: {
    type: String,
    default: '',
    trim: true
  },
  shippingAddress: {
    type: String,
    default: '',
    trim: true
  },
  gst: {
    type: String,
    default: '',
    trim: true,
    uppercase: true
  },
  pan: {
    type: String,
    default: '',
    trim: true,
    uppercase: true
  },
  state: {
    type: String,
    default: 'Gujarat',
    trim: true
  },
  stateCode: {
    type: String,
    default: '24',
    trim: true
  },
  city: {
    type: String,
    default: '',
    trim: true
  },
  district: {
    type: String,
    default: '',
    trim: true
  },
  pincode: {
    type: String,
    default: '',
    trim: true
  },
  notes: {
    type: String,
    default: '',
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('PrivateParty', privatePartySchema);
