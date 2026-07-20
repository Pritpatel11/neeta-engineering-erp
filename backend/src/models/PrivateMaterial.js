const mongoose = require('mongoose');

const privateMaterialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  order: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('PrivateMaterial', privateMaterialSchema);
