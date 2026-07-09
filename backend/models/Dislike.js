const mongoose = require('mongoose');

const dislikeSchema = new mongoose.Schema({
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

// One dislike per user per track
dislikeSchema.index({ userId: 1, audioId: 1 }, { unique: true });

module.exports = mongoose.model('Dislike', dislikeSchema);
