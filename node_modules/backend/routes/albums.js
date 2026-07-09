const express = require('express');
const router = express.Router();
const multer = require('multer');
const Album = require('../models/Album');
const Audio = require('../models/Audio');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { STORAGE_FOLDERS, generateUniqueFilename, deleteLocalFile } = require('../utils/localStorage');

// Multer storage setup for album covers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, STORAGE_FOLDERS.albumCovers);
  },
  filename: function (req, file, cb) {
    cb(null, generateUniqueFilename(file.originalname));
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
});

// Helper to parse array fields (supports JSON array string, comma-separated string, or array)
function parseArrayField(field) {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  try {
    const parsed = JSON.parse(field);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {}
  if (typeof field === 'string') {
    return field.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [field];
}

  // GET all albums (public)
  router.get('/', async (req, res) => {
    try {
      const albums = await Album.find().populate('categoryId').sort({ createdAt: -1 });
      res.json(albums);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // GET single album by ID (public)
  router.get('/:id', async (req, res) => {
    try {
      const album = await Album.findById(req.params.id).populate('categoryId');
      if (!album) return res.status(404).json({ message: 'Album not found' });
      res.json(album);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // CREATE new album with optional cover image
  router.post('/', auth, roleCheck(['admin','user','onlyuser']), upload.single('coverImage'), async (req, res) => {
    try {
      const { name, title, description, categoryId, audioIds } = req.body;
    let coverImage = req.body.coverImage || '/album_placeholder.png';
    
    if (req.file) {
      coverImage = `/uploads/album-covers/${req.file.filename}`;
    }

    const newAlbum = new Album({ name, title, description, coverImage, categoryId, audioIds });
    await newAlbum.save();
    res.status(201).json(newAlbum);
    } catch (err) {
      console.error(err);
      if (err.code === 11000) {
        return res.status(400).json({ error: 'An album with this Name / Slug already exists. Please choose a unique name.' });
      }
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

  // UPDATE album with optional cover image
  router.put('/:id', auth, roleCheck(['admin','user','onlyuser']), upload.single('coverImage'), async (req, res) => {
    try {
      const { name, title, description, categoryId, audioIds } = req.body;
    const album = await Album.findById(req.params.id);
    if (!album) return res.status(404).json({ message: 'Album not found' });
    if (name !== undefined) album.name = name;
    if (title !== undefined) album.title = title;
    if (description !== undefined) album.description = description;
    if (categoryId !== undefined) album.categoryId = categoryId;
    if (audioIds !== undefined) album.audioIds = audioIds;

      if (req.file) {
        // Delete old cover image if it exists and is not placeholder
        if (album.coverImage && album.coverImage !== '/album_placeholder.png' && !album.coverImage.startsWith('http') && album.coverImage !== req.body.coverImage) {
          deleteLocalFile(album.coverImage);
        }
        // Set new cover image
        album.coverImage = `/uploads/album-covers/${req.file.filename}`;
      } else if (req.body.coverImage !== undefined) {
        album.coverImage = req.body.coverImage;
      }

    await album.save();
      res.json(album);
    } catch (err) {
      console.error(err);
      if (err.code === 11000) {
        return res.status(400).json({ error: 'An album with this Name / Slug already exists. Please choose a unique name.' });
      }
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

// DELETE album
router.delete('/:id', auth, roleCheck(['admin','user','onlyuser']), async (req, res) => {
  try {
    const album = await Album.findByIdAndDelete(req.params.id);
    if (!album) return res.status(404).json({ message: 'Album not found' });

    // Delete cover image from local storage if it's not the placeholder
    if (album.coverImage && album.coverImage !== '/album_placeholder.png') {
      deleteLocalFile(album.coverImage);
    }

    // Clean up references in Audio (remove this album from audio albumIds)
    await Audio.updateMany(
      { albumIds: req.params.id },
      { $pull: { albumIds: req.params.id } }
    );

    res.json({ message: 'Album deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
// New endpoint: Create Album from selected Audios (existing) with optional cover image
router.post('/from-selection', auth, roleCheck(['admin','user','onlyuser']), upload.single('coverImage'), async (req, res) => {
  try {
    const { albumName, title, description, categoryId, audioIds } = req.body;
    let coverImage = req.body.coverImage || '/album_placeholder.png';

    if (!albumName || !categoryId) {
      return res.status(400).json({ error: 'albumName and categoryId are required' });
    }

    if (req.file) {
      coverImage = `/uploads/album-covers/${req.file.filename}`;
    }

    const Category = require('../models/Category');
    const cat = await Category.findById(categoryId);
    if (!cat) return res.status(400).json({ error: 'Invalid categoryId' });
    let validAudioIds = [];
    if (audioIds && audioIds.length) {
      const audios = await Audio.find({ _id: { $in: audioIds } });
      if (audios.length !== audioIds.length) {
        return res.status(400).json({ error: 'One or more audioIds are invalid' });
      }
      validAudioIds = audioIds;
    }
    const newAlbum = new Album({
      name: albumName,
      title: title || albumName,
      description: description || '',
      coverImage,
      categoryId,
      audioIds: validAudioIds
    });
    await newAlbum.save();
    if (validAudioIds.length) {
      await Audio.updateMany({ _id: { $in: validAudioIds } }, { $addToSet: { albumIds: newAlbum._id } });
    }
    await Album.updateMany({ _id: { $ne: newAlbum._id }, audioIds: { $in: validAudioIds } }, { $pull: { audioIds: { $in: validAudioIds } } });
    res.status(201).json(newAlbum);
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'An album with this Name / Slug already exists. Please choose a unique name.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// New endpoint: Create Album from selected Audios with optional audio edits and optional cover image
router.post('/from-selection-with-edits', auth, roleCheck(['admin','user','onlyuser']), upload.single('coverImage'), async (req, res) => {
  try {
    const { albumName, title, description, categoryId, audioIds, audioUpdates } = req.body;
    let coverImage = req.body.coverImage || '/album_placeholder.png';

    if (!albumName || !categoryId) {
      return res.status(400).json({ error: 'albumName and categoryId are required' });
    }

    if (req.file) {
      coverImage = `/uploads/album-covers/${req.file.filename}`;
    }

    const Category = require('../models/Category');
    const cat = await Category.findById(categoryId);
    if (!cat) return res.status(400).json({ error: 'Invalid categoryId' });
    let validAudioIds = [];
    if (audioIds && audioIds.length) {
      const audios = await Audio.find({ _id: { $in: audioIds } });
      if (audios.length !== audioIds.length) {
        return res.status(400).json({ error: 'One or more audioIds are invalid' });
      }
      validAudioIds = audioIds;
    }
    // Apply optional audio edits
    const updatedAudios = [];
    if (Array.isArray(audioUpdates) && audioUpdates.length) {
      for (const upd of audioUpdates) {
        const { audioId, title, speaker, description, tags } = upd;
        const audio = await Audio.findById(audioId);
        if (!audio) continue;
        if (title !== undefined) audio.title = title;
        if (speaker !== undefined) audio.speaker = speaker;
        if (description !== undefined) audio.description = description;
        if (Array.isArray(tags)) audio.tags = tags;
        await audio.save();
        updatedAudios.push(audio);
      }
    }
    const newAlbum = new Album({
      name: albumName,
      title: title || albumName,
      description: description || '',
      coverImage,
      categoryId,
      audioIds: validAudioIds
    });
    await newAlbum.save();
    if (validAudioIds.length) {
      await Audio.updateMany({ _id: { $in: validAudioIds } }, { $addToSet: { albumIds: newAlbum._id } });
    }
    await Album.updateMany({ _id: { $ne: newAlbum._id }, audioIds: { $in: validAudioIds } }, { $pull: { audioIds: { $in: validAudioIds } } });
    res.status(201).json({ album: newAlbum, updatedAudios });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'An album with this Name / Slug already exists. Please choose a unique name.' });
    }
    res.status(500).json({ error: err.message });
  }
});
// ─── PATCH /api/albums/:albumId/add-audios ───────────────────────────────────
// Associate one or more audios to an existing album
router.patch('/:albumId/add-audios', auth, roleCheck(['admin', 'user', 'onlyuser']), async (req, res) => {
  try {
    let { audioIds, audioUpdates } = req.body;

    if (!audioIds) return res.status(400).json({ error: 'audioIds is required' });

    // Normalise: accept JSON string, array, or single string
    if (typeof audioIds === 'string') {
      try { audioIds = JSON.parse(audioIds); } catch (_) {
        audioIds = audioIds.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    if (!Array.isArray(audioIds) || audioIds.length === 0) {
      return res.status(400).json({ error: 'audioIds must be a non-empty array' });
    }

    const album = await Album.findById(req.params.albumId);
    if (!album) return res.status(404).json({ error: 'Album not found' });

    // Verify all audio IDs exist
    const found = await Audio.find({ _id: { $in: audioIds } }).select('_id');
    if (found.length !== audioIds.length) {
      return res.status(400).json({ error: 'One or more audioIds are invalid' });
    }

    // Apply optional audio edits
    const updatedAudios = [];
    if (audioUpdates) {
      let parsedUpdates = audioUpdates;
      if (typeof audioUpdates === 'string') {
        try { parsedUpdates = JSON.parse(audioUpdates); } catch (_) {}
      }
      if (Array.isArray(parsedUpdates) && parsedUpdates.length) {
        for (const upd of parsedUpdates) {
          const { audioId, title, speaker, description, tags } = upd;
          const audio = await Audio.findById(audioId);
          if (!audio) continue;
          if (title !== undefined) audio.title = title;
          if (speaker !== undefined) audio.speaker = speaker;
          if (description !== undefined) audio.description = description;
          if (Array.isArray(tags)) audio.tags = tags;
          await audio.save();
          updatedAudios.push(audio);
        }
      }
    }

    // Add audios to album (avoid duplicates)
    await Album.findByIdAndUpdate(
      album._id,
      { $addToSet: { audioIds: { $each: audioIds } } }
    );

    // Add album reference to each audio
    await Audio.updateMany(
      { _id: { $in: audioIds } },
      { $addToSet: { albumIds: album._id } }
    );

    const updated = await Album.findById(album._id).populate('categoryId');
    res.json({ message: 'Audios associated successfully', album: updated, updatedAudios });
  } catch (err) {
    console.error('[add-audios]', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

