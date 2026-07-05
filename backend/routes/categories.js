const express = require('express');
const router = express.Router();
const path = require('path');
const Category = require('../models/Category');
const Audio = require('../models/Audio');
const Album = require('../models/Album');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const multer = require('multer');
const { STORAGE_FOLDERS, generateUniqueFilename, deleteLocalFile } = require('../utils/localStorage');

// Use disk storage for category images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, STORAGE_FOLDERS.categories);
  },
  filename: function (req, file, cb) {
    cb(null, generateUniqueFilename(file.originalname));
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit for images
});

// GET all categories (public – needed by upload modal and dashboard)
router.get('/', async (req, res) => {
  try {
    const categories = await Category.aggregate([
      { $lookup: { from: 'albums', localField: '_id', foreignField: 'categoryId', as: 'albums' } },
      { $addFields: { albumCount: { $size: '$albums' } } },
      { $project: { albums: 0 } },
      { $sort: { name: 1 } }
    ]);
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create new category
router.post('/', auth, roleCheck(['admin', 'user', 'onlyuser']), upload.single('coverImage'), async (req, res) => {
  try {
    const { name } = req.body;
    const existing = await Category.findOne({ name });
    if (existing) return res.status(409).json({ message: 'Category already exists' });

    let coverImageUrl = req.body.coverImageUrl || '';

    if (req.file) {
      // Use local disk storage
      coverImageUrl = `/uploads/categories/${req.file.filename}`;
    }

    const newCat = new Category({ name, coverImageUrl });
    const saved = await newCat.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH rename / update cover image of a category
router.patch('/:id', auth, roleCheck(['admin', 'user', 'onlyuser']), upload.single('coverImage'), async (req, res) => {
  try {
    const { name } = req.body;
    const cat = await Category.findById(req.params.id);
    if (!cat) return res.status(404).json({ message: 'Category not found' });

    if (name) cat.name = name;

    if (req.file) {
      // Delete the old cover image from local storage (if it exists)
      if (cat.coverImageUrl) {
        deleteLocalFile(cat.coverImageUrl);
      }
      // Save new cover image to local storage
      cat.coverImageUrl = `/uploads/categories/${req.file.filename}`;
    } else if (req.body.coverImageUrl !== undefined) {
      cat.coverImageUrl = req.body.coverImageUrl;
    }

    const saved = await cat.save();
    res.json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE category
router.delete('/:id', auth, roleCheck(['admin', 'user', 'onlyuser']), async (req, res) => {
  try {
    const cat = await Category.findByIdAndDelete(req.params.id);
    if (!cat) return res.status(404).json({ message: 'Category not found' });

    // Delete cover image from local storage
    if (cat.coverImageUrl) {
      deleteLocalFile(cat.coverImageUrl);
    }

    // Clean up category references in Audio and Album
    await Promise.all([
      Audio.updateMany(
        { categoryIds: req.params.id },
        { $pull: { categoryIds: req.params.id } }
      ),
      Album.updateMany(
        { categoryIds: req.params.id },
        { $pull: { categoryIds: req.params.id } }
      )
    ]);

    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
