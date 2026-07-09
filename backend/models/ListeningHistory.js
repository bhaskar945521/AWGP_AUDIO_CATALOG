const mongoose = require('mongoose');

const listeningHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  audioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Audio',
    required: true
  },
  sessionStart: {
    type: Date,
    required: true,
    default: Date.now
  },
  sessionEnd: {
    type: Date,
    default: null
  },
  // Total seconds listened in this session
  durationListened: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

listeningHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('ListeningHistory', listeningHistorySchema);
