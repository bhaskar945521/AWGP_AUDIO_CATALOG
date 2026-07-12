const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { STORAGE_FOLDERS, generateUniqueFilename, deleteLocalFile } = require('../utils/localStorage');

// Multer storage for gallery images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, STORAGE_FOLDERS.gallery);
  },
  filename: function (req, file, cb) {
    cb(null, generateUniqueFilename(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (allowedTypes.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// In-memory gallery store (replace with MongoDB model if needed)
let galleryItems = [];

// GET /api/gallery
router.get('/', (req, res) => {
  res.json(galleryItems);
});

// POST /api/gallery — admin only
router.post('/', auth, roleCheck(['admin']), upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file provided' });
  }

  const item = {
    _id: Date.now().toString(),
    title: req.body.title || '',
    description: req.body.description || '',
    imageUrl: `/uploads/gallery/${req.file.filename}`,
    createdAt: new Date().toISOString(),
  };

  galleryItems.unshift(item);
  res.status(201).json(item);
});

// DELETE /api/gallery/:id — admin only
router.delete('/:id', auth, roleCheck(['admin']), (req, res) => {
  const idx = galleryItems.findIndex((g) => g._id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ message: 'Gallery item not found' });
  }

  const item = galleryItems[idx];
  deleteLocalFile(item.imageUrl);
  galleryItems.splice(idx, 1);
  res.json({ message: 'Gallery item deleted' });
});

module.exports = router;
