const mongoose = require('mongoose');

const rawMaterialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true,
    default: 'Angles'
  },
  size: {
    type: String,
    default: '',
    trim: true
  },
  grade: {
    type: String,
    default: 'IS 2062',
    trim: true
  },
  unit: {
    type: String,
    default: 'KG',
    trim: true
  },
  hsn: {
    type: String,
    default: '7216',
    trim: true
  },
  gstRate: {
    type: Number,
    default: 18
  },
  defaultRate: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Compound index on name & category
rawMaterialSchema.index({ category: 1, name: 1 });

module.exports = mongoose.model('RawMaterial', rawMaterialSchema);
