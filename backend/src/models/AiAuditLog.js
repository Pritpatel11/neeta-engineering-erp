const mongoose = require('mongoose');

const aiAuditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    userRole: {
      type: String,
      required: true,
    },
    userDepartment: {
      type: String,
      default: 'all',
    },
    prompt: {
      type: String,
      required: true,
    },
    response: {
      type: String,
      required: true,
    },
    toolsUsed: [
      {
        name: { type: String, required: true },
        arguments: { type: mongoose.Schema.Types.Mixed },
        resultSummary: { type: String },
        success: { type: Boolean, default: true },
      },
    ],
    documentCreated: {
      docType: { type: String }, // 'Challan', 'Statement', etc.
      docId: { type: String },
      docNumber: { type: String },
      summary: { type: String },
    },
    securityFlag: {
      type: String,
      enum: ['NORMAL', 'PROMPT_INJECTION_BLOCKED', 'OUT_OF_SCOPE_DOMAIN', 'ACCESS_DENIED'],
      default: 'NORMAL',
    },
  },
  {
    timestamps: true,
  }
);

aiAuditLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('AiAuditLog', aiAuditLogSchema);
