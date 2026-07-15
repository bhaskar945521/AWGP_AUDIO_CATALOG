const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  user: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  role: { type: String, required: true },
  module: { type: String, required: true },
  action: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  previousData: { type: mongoose.Schema.Types.Mixed },
  updatedData: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
