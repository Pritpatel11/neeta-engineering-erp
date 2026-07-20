const mongoose = require('mongoose');

const receiptPartySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  }
});

module.exports = mongoose.model('ReceiptParty', receiptPartySchema);
