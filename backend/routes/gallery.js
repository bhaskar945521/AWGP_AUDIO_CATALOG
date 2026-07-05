// backend/routes/gallery.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const GalleryImage = require('../models/GalleryImage');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { STORAGE_FOLDERS, generateUniqueFilename, deleteLocalFile } = require('../utils/localStorage');

// Use disk storage for gallery images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, STORAGE_FOLDERS.gallery);
  },
  filename: function (req, file, cb) {
    cb(null, generateUniqueFilename(file.originalname));
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per image
});

// GET /api/gallery – returns list of gallery images stored in MongoDB
router.get('/', async (req, res) => {
  try {
    const images = await GalleryImage.find().sort({ createdAt: -1 });
    res.json(images.map(img => ({ _id: img._id, url: img.url, title: img.title })));
  } catch (err) {
    console.error('Failed to read gallery images', err);
    res.status(500).json({ message: 'Failed to load gallery' });
  }
});

// POST /api/gallery/upload – upload new images to local storage (admin, user, or onlyuser allowed)
router.post('/upload', auth, roleCheck(['admin', 'user', 'onlyuser']), upload.array('images'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images uploaded' });
    }

    const uploadedImages = [];
    for (const file of req.files) {
      // Save to local storage and persist in MongoDB
      const galleryImg = new GalleryImage({
        url: `/uploads/gallery/${file.filename}`,
        title: file.originalname || '',
      });
      await galleryImg.save();
      uploadedImages.push({ _id: galleryImg._id, url: galleryImg.url });
    }

    res.status(201).json(uploadedImages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/gallery/:id – delete a gallery image from local storage and MongoDB
router.delete('/:id', auth, roleCheck(['admin', 'user', 'onlyuser']), async (req, res) => {
  try {
    const img = await GalleryImage.findByIdAndDelete(req.params.id);
    if (!img) return res.status(404).json({ message: 'Image not found' });
    // Remove from local storage
    if (img.url) {
      deleteLocalFile(img.url);
    }
    res.json({ message: 'Image deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
