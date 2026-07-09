const mongoose = require('mongoose');

const galleryImageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.model('GalleryImage', galleryImageSchema);
