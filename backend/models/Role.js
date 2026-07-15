const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  permissions: { type: [String], default: [] },
  enabled: { type: Boolean, default: true },
  isSystem: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Role', RoleSchema);
