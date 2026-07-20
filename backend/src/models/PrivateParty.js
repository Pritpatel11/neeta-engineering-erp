const mongoose = require('mongoose');

const privatePartySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  gst: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('PrivateParty', privatePartySchema);
