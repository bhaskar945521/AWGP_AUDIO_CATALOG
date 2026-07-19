const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const auth = require('../middleware/auth');
const permissionCheck = require('../middleware/permissionCheck');
const { STORAGE_FOLDERS, generateUniqueFilename, deleteLocalFile } = require('../utils/localStorage');
const GalleryImage = require('../models/GalleryImage');

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

// GET /api/gallery — requires auth and any create/update permission (gallery is admin-side)
router.get('/', auth, permissionCheck(['albums_create', 'albums_update', 'audios_create', 'audios_update', 'categories_create', 'categories_update']), async (req, res) => {
  try {
    const images = await GalleryImage.find().sort({ createdAt: -1 });
    res.json(images);
  } catch (err) {
    console.error('[Gallery] GET error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/gallery — admin or users with standard create/update permissions
router.post('/', auth, permissionCheck(['albums_create', 'albums_update', 'audios_create', 'audios_update', 'categories_create', 'categories_update']), upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file provided' });
  }

  try {
    const url = `/uploads/gallery/${req.file.filename}`;
    const newImage = new GalleryImage({
      url,
      title: req.body.title || req.file.originalname || '',
    });
    const saved = await newImage.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('[Gallery] POST error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/gallery/upload — upload multiple images to gallery
router.post('/upload', auth, permissionCheck(['albums_create', 'albums_update', 'audios_create', 'audios_update', 'categories_create', 'categories_update']), upload.array('images'), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No image files provided' });
  }

  try {
    const savedImages = [];
    for (const file of req.files) {
      const url = `/uploads/gallery/${file.filename}`;
      const newImage = new GalleryImage({
        url,
        title: file.originalname || '',
      });
      const saved = await newImage.save();
      savedImages.push(saved);
    }
    res.status(201).json(savedImages);
  } catch (err) {
    console.error('[Gallery] upload error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/gallery/:id
router.delete('/:id', auth, permissionCheck(['albums_create', 'albums_update', 'audios_create', 'audios_update', 'categories_create', 'categories_update']), async (req, res) => {
  try {
    const image = await GalleryImage.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ message: 'Gallery item not found' });
    }

    // Delete from local storage
    deleteLocalFile(image.url);

    // Delete from DB
    await GalleryImage.findByIdAndDelete(req.params.id);
    res.json({ message: 'Gallery item deleted' });
  } catch (err) {
    console.error('[Gallery] DELETE error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
