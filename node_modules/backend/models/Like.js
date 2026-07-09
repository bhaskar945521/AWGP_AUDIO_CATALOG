const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  audioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Audio',
    required: true
  }
}, { timestamps: true });

// One like per user per track
likeSchema.index({ userId: 1, audioId: 1 }, { unique: true });

module.exports = mongoose.model('Like', likeSchema);
