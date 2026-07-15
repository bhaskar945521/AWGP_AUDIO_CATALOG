const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define all possible permissions
const ALL_PERMISSIONS = [
  'audio_view',
  'audio_upload',
  'audio_edit',
  'audio_delete',
  'category_view',
  'category_create',
  'category_edit',
  'category_delete',
  'album_view',
  'album_create',
  'album_edit',
  'album_delete',
  'feedback_view',
  'feedback_delete',
  'analytics_view',
  'users_manage',
  'settings_manage',
  'admin_settings_manage'
];

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String }, // Optional/unique for public users
  fullName: { type: String }, // Optional/for public users
  avatarUrl: { type: String, default: '' }, // Profile photo URL
  passwordHash: { type: String, required: true },
  // Allow flexible role values dynamically mapped
  role: { type: String, default: 'public_user' },
  // Simple work assignment – can be a free‑form description or list of audio IDs
  assignedWork: { type: String, default: '' },
  // Dynamic permissions array
  permissions: {
    type: [String],
    default: []
  },
  activityScore: { type: Number, default: 0 },
  createCount: { type: Number, default: 0 },
  updateCount: { type: Number, default: 0 },
  deleteCount: { type: Number, default: 0 },
  lastActivity: { type: Date },
  status: { type: String, default: 'Active' }
});

// Helper to set password
UserSchema.methods.setPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(plainPassword, salt);
};

// Helper to validate password
UserSchema.methods.validatePassword = async function (plainPassword) {
  return await bcrypt.compare(plainPassword, this.passwordHash);
};

module.exports = mongoose.model('User', UserSchema);
