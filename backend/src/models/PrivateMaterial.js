const mongoose = require('mongoose');

const privateMaterialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  code: {
    type: String,
    default: '',
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  unit: {
    type: String,
    default: 'Nos',
    trim: true
  },
  hsn: {
    type: String,
    default: '',
    trim: true
  },
  gstRate: {
    type: Number,
    default: 18
  },
  rate: {
    type: Number,
    default: 0
  },
  order: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('PrivateMaterial', privateMaterialSchema);
