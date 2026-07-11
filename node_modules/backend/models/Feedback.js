const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  audioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Audio',
    default: null
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  // General feedback not tied to any specific audio
  isGeneral: {
    type: Boolean,
    default: false
  },
  approved: {
    type: Boolean,
    default: false
  },
  shortFeedback: {
    type: String,
    maxlength: 150,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
