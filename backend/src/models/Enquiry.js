const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
  date: { type: String }, // e.g. "06/02/2026"
  time: { type: String }, // e.g. "23:11:14"
  name: { type: String },
  email: { type: String },
  phone: { type: String },
  subject: { type: String },
  message: { type: String },
  status: { type: String, default: 'Pending', enum: ['Pending', 'Contacted', 'Converted', 'Rejected'] },
  remarks: { type: String, default: '' },
  financialYear: { type: String, default: '2025-26' },
  syncedAt: { type: Date, default: Date.now }
});

// We can create a compound index to avoid duplicating the same enquiry on multiple syncs
// Assuming an enquiry is unique by date + time + email/phone
enquirySchema.index({ date: 1, time: 1, email: 1, phone: 1 }, { });

module.exports = mongoose.model('Enquiry', enquirySchema);
