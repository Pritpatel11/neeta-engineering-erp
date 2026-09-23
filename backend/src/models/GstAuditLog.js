const mongoose = require('mongoose');

const gstAuditLogSchema = new mongoose.Schema(
  {
    gstin: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'invalid_format', 'not_found'],
      required: true,
    },
    source: {
      type: String,
      enum: ['database', 'sandbox', 'cache', 'mock'],
      default: 'sandbox',
    },
    legalName: {
      type: String,
      default: '',
    },
    tradeName: {
      type: String,
      default: '',
    },
    stateCode: {
      type: String,
      default: '',
    },
    isInterState: {
      type: Boolean,
      default: false,
    },
    errorMessage: {
      type: String,
      default: '',
    },
    rawResponseSnippet: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

gstAuditLogSchema.index({ gstin: 1, createdAt: -1 });

module.exports = mongoose.model('GstAuditLog', gstAuditLogSchema);
