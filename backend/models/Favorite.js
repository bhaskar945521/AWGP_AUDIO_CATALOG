const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
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

// Prevent duplicate favorites for the same user and audio track
favoriteSchema.index({ userId: 1, audioId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
