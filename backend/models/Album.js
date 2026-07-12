const mongoose = require('mongoose');

const AlbumSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    name: { type: String, trim: true }, // alias for title
    description: { type: String, default: '' },
    coverImage: { type: String, default: '/placeholder.png' },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    order: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Album', AlbumSchema);
