const mongoose = require('mongoose');

const AudioSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    speaker: { type: String, trim: true, default: '' },
    description: { type: String, default: '' },
    duration: { type: String, default: '0:00' },
    audioUrl: { type: String, required: true },
    imageUrl: { type: String, default: '/placeholder.png' },
    fileHash: { type: String, default: '' },
    fileExtension: { type: String, default: 'mp3' },
    originalExtension: { type: String, default: 'mp3' },
    tags: { type: [String], default: [] },
    albumIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Album' }],
    // Legacy category field (kept for backward compat)
    category: { type: String, default: '' },
    isFavorite: { type: Boolean, default: false },
    playCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    dislikeCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Audio', AudioSchema);
