const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
const mongoose = require('mongoose');
const Audio = require('../models/Audio');
const Album = require('../models/Album');
const Category = require('../models/Category');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const permissionCheck = require('../middleware/permissionCheck');
const { STORAGE_FOLDERS, generateUniqueFilename, deleteLocalFile } = require('../utils/localStorage');

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Bilingual synonym map for Hindi ↔ English search (same as search.js)
const bilingualSynonyms = {
  // Hindi → English
  'भजन': ['bhajan', 'bhajans', 'devotional', 'devotional song', 'devotional songs'],
  'प्रवचन': ['pravachan', 'pravachans', 'discourse', 'discourses', 'lecture', 'lectures', 'sermon', 'sermons'],
  'स्पिरिचुअल': ['spiritual', 'spirituality', 'spiritualism'],
  'आध्यात्मिक': ['spiritual', 'spirituality', 'spiritualism'],
  'ध्यान': ['meditation', 'meditate', 'meditating'],
  'ज्ञान': ['wisdom', 'knowledge', 'gyan'],
  'गुरु': ['guru', 'teacher', 'master', 'spiritual teacher'],
  'संत': ['sant', 'saint', 'saints', 'saintly'],
  'भक्ति': ['bhakti', 'devotion', 'devotional'],
  'आरती': ['aarti', 'aarati', 'prayer', 'prayers'],
  'कीर्तन': ['kirtan', 'keertan', 'devotional singing'],
  'मंत्र': ['mantra', 'mantras', 'chant', 'chants'],
  'पूजा': ['pooja', 'puja', 'worship', 'worshiping'],
  'सत्संग': ['satsang', 'spiritual gathering', 'spiritual gatherings'],
  'सत्य': ['truth', 'satya'],
  'शांति': ['peace', 'shanti'],
  'प्रेम': ['love', 'prem'],
  // English → Hindi (for reverse search)
  'bhajan': ['भजन', 'भजनें'],
  'pravachan': ['प्रवचन', 'प्रवचनें'],
  'spiritual': ['स्पिरिचुअल', 'आध्यात्मिक'],
  'spirituality': ['स्पिरिचुअलता', 'आध्यात्मिकता'],
  'meditation': ['ध्यान'],
  'meditate': ['ध्यान करना'],
  'wisdom': ['ज्ञान'],
  'knowledge': ['ज्ञान'],
  'gyan': ['ज्ञान'],
  'guru': ['गुरु'],
  'teacher': ['गुरु', 'शिक्षक'],
  'master': ['गुरु', 'मास्टर'],
  'saint': ['संत'],
  'saints': ['संत'],
  'devotion': ['भक्ति'],
  'devotional': ['भक्ति', 'भक्तिपूर्ण'],
  'aarti': ['आरती'],
  'kirtan': ['कीर्तन'],
  'mantra': ['मंत्र'],
  'pooja': ['पूजा'],
  'puja': ['पूजा'],
  'worship': ['पूजा', 'पूजा करना'],
  'satsang': ['सत्संग'],
  'truth': ['सत्य'],
  'satya': ['सत्य'],
  'peace': ['शांति'],
  'shanti': ['शांति'],
  'love': ['प्रेम'],
  'prem': ['प्रेम']
};

// Function to get all search terms (original + synonyms + transliterations)
const getAllSearchTerms = (query) => {
  const terms = [query.toLowerCase()];
  const words = query.toLowerCase().split(/\s+/);
  
  words.forEach(word => {
    if (bilingualSynonyms[word]) {
      terms.push(...bilingualSynonyms[word].map(s => s.toLowerCase()));
    }
  });
  
  return [...new Set(terms)]; // Remove duplicates
};

// Multer Storage — both audio and images go to disk
const audioStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'audioFile') {
      cb(null, STORAGE_FOLDERS.tmp);
    } else if (file.fieldname === 'imageFile') {
      cb(null, STORAGE_FOLDERS.audioImages);
    } else {
      cb(null, STORAGE_FOLDERS.tmp);
    }
  },
  filename: function (req, file, cb) {
    cb(null, generateUniqueFilename(file.originalname));
  }
});

const upload = multer({
  storage: audioStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
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

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
} else {
  console.warn('[AudioRoute] ffmpeg-static binary not found; audio conversion will be unavailable.');
}

function convertAudioToMp3(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions(['-y'])
      .audioCodec('libmp3lame')
      .audioBitrate('128k')
      .format('mp3')
      .on('end', () => resolve(outputPath))
      .on('error', err => reject(err))
      .save(outputPath);
  });
}

function cleanupFiles(paths = []) {
  paths.forEach(filePath => {
    if (filePath && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) { console.warn('[AudioUpload] cleanup failed', filePath, e.message); }
    }
  });
}

// Middleware to reject any legacy category fields
function rejectCategoryFields(req, res, next) {
  if (req.body.category || req.body.categoryIds) {
    return res.status(400).json({ message: 'Category fields are not allowed in audio requests.' });
  }
  next();
}

// Build duplicate-found response
async function buildDuplicateResponse(existing) {
  const albumIdsList = existing.albumIds ? existing.albumIds.map(a => a._id) : [];
  const albums = await Album.find({ _id: { $in: albumIdsList } }).populate('categoryId');
  const categoriesMap = {};
  albums.forEach(al => {
    if (al.categoryId) categoriesMap[al.categoryId._id.toString()] = al.categoryId.name;
  });
  const categories = Object.keys(categoriesMap).map(id => ({ _id: id, name: categoriesMap[id] }));
  const albumDetails = albums.map(al => ({ _id: al._id, title: al.title || al.name }));
  return { message: 'This audio file already exists in the library.', existingTitle: existing.title, existingId: existing._id, albums: albumDetails, categories };
}

// ─── GET /api/audios ────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { page, limit, sort = '-createdAt', album, extension, category, search } = req.query;
    const filters = {};

    if (album) {
      filters.albumIds = { $in: [album] };
    }

    if (category) {
      const categoryOr = [];
      if (mongoose.isValidObjectId(category)) {
        const albumIds = await Album.find({ categoryId: category }).distinct('_id');
        if (albumIds.length > 0) categoryOr.push({ albumIds: { $in: albumIds } });
      }
      const categoryRegex = new RegExp(`^${escapeRegExp(category)}$`, 'i');
      const categoryObj = await Category.findOne({ name: categoryRegex });
      if (categoryObj) {
        const albumIds = await Album.find({ categoryId: categoryObj._id }).distinct('_id');
        if (albumIds.length > 0) categoryOr.push({ albumIds: { $in: albumIds } });
      }
      categoryOr.push({ category: categoryRegex });
      filters.$or = categoryOr;
    }

    if (extension) {
      filters.originalExtension = extension.toLowerCase();
    }

    const searchActive = search && search.trim().length > 0;
    const lowerQuery = searchActive ? search.trim().toLowerCase() : '';
    let searchTerms = [];
    if (searchActive) {
      searchTerms = getAllSearchTerms(search.trim());
      const regexPattern = searchTerms.map(term => escapeRegExp(term)).join('|');
      const regex = new RegExp(regexPattern, 'i');
      filters.$or = [
        { title: regex },
        { speaker: regex },
        { description: regex },
        { tags: { $in: searchTerms.map(t => new RegExp(t, 'i')) } }
      ];
    }

    const sortObj = {};
    const direction = sort.startsWith('-') ? -1 : 1;
    const field = sort.replace(/^-/, '');
    sortObj[field] = direction;

    if (page || limit) {
      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 20;
      const skip = (pageNum - 1) * limitNum;

      if (searchActive) {
        // Fetch all matching records, score them in memory, sort by score, then paginate
        const rawAudios = await Audio.find(filters).populate('albumIds').lean();
        
        const scoredAudios = rawAudios.map(audio => {
          let score = 0;
          const lowerTitle = (audio.title || '').toLowerCase();
          const lowerSpeaker = (audio.speaker || '').toLowerCase();
          const lowerDesc = (audio.description || '').toLowerCase();
          const tags = audio.tags || [];

          // Title Matches
          if (lowerTitle === lowerQuery) {
            score += 150;
          } else if (lowerTitle.startsWith(lowerQuery)) {
            score += 100;
          } else if (lowerTitle.includes(lowerQuery)) {
            score += 80;
          } else {
            const matchesSynonym = searchTerms.some(term => lowerTitle.includes(term));
            if (matchesSynonym) score += 50;
          }

          // Speaker Matches
          if (lowerSpeaker === lowerQuery) {
            score += 60;
          } else if (lowerSpeaker.includes(lowerQuery)) {
            score += 40;
          }

          // Tags Matches
          if (tags.length > 0) {
            const matchesTag = tags.some(tag => {
              const t = tag.toLowerCase();
              return t === lowerQuery || searchTerms.includes(t) || t.includes(lowerQuery);
            });
            if (matchesTag) score += 30;
          }

          // Description Matches
          if (lowerDesc.includes(lowerQuery)) {
            score += 10;
          }

          return { ...audio, searchScore: score };
        });

        // Sort: primary by relevance score descending, secondary by createdAt descending
        scoredAudios.sort((a, b) => {
          if (b.searchScore !== a.searchScore) {
            return b.searchScore - a.searchScore;
          }
          return new Date(b.createdAt) - new Date(a.createdAt);
        });

        const total = scoredAudios.length;
        const paginated = scoredAudios.slice(skip, skip + limitNum);
        
        // Clean temporary searchScore properties before returning
        const cleanedData = paginated.map(({ searchScore, ...rest }) => rest);
        
        res.json({ data: cleanedData, total, page: pageNum, limit: limitNum });
      } else {
        // Normal database pagination and sorting
        const [total, audios] = await Promise.all([
          Audio.countDocuments(filters),
          Audio.find(filters).populate('albumIds').sort(sortObj).skip(skip).limit(limitNum)
        ]);
        res.json({ data: audios, total, page: pageNum, limit: limitNum });
      }
    } else {
      if (searchActive) {
        const rawAudios = await Audio.find(filters).populate('albumIds').lean();
        const scoredAudios = rawAudios.map(audio => {
          let score = 0;
          const lowerTitle = (audio.title || '').toLowerCase();
          const lowerSpeaker = (audio.speaker || '').toLowerCase();
          const lowerDesc = (audio.description || '').toLowerCase();
          const tags = audio.tags || [];

          if (lowerTitle === lowerQuery) score += 150;
          else if (lowerTitle.startsWith(lowerQuery)) score += 100;
          else if (lowerTitle.includes(lowerQuery)) score += 80;
          else if (searchTerms.some(term => lowerTitle.includes(term))) score += 50;

          if (lowerSpeaker === lowerQuery) score += 60;
          else if (lowerSpeaker.includes(lowerQuery)) score += 40;

          if (tags.length > 0) {
            const matchesTag = tags.some(tag => {
              const t = tag.toLowerCase();
              return t === lowerQuery || searchTerms.includes(t) || t.includes(lowerQuery);
            });
            if (matchesTag) score += 30;
          }

          if (lowerDesc.includes(lowerQuery)) score += 10;

          return { ...audio, searchScore: score };
        });

        scoredAudios.sort((a, b) => b.searchScore - a.searchScore);
        const cleanedData = scoredAudios.map(({ searchScore, ...rest }) => rest);
        res.json(cleanedData);
      } else {
        const audios = await Audio.find(filters).populate('albumIds').sort(sortObj);
        res.json(audios);
      }
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/audios/recent/count ───────────────────────────────────────────
router.get('/recent/count', async (req, res) => {
  try {
    const hours = Number(req.query.hours) || 24;
    const sinceDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    const items = await Audio.find({ createdAt: { $gte: sinceDate } })
      .populate('albumIds')
      .sort({ createdAt: -1 });
    res.json({ items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/audios/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const audio = await Audio.findById(req.params.id).populate('albumIds');
    if (!audio) return res.status(404).json({ message: 'Audio not found' });
    res.json(audio);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/audios ────────────────────────────────────────────────────────
router.post(
  '/',
  auth,
  permissionCheck(['audio_upload']),
  upload.fields([
    { name: 'audioFile', maxCount: 1 },
    { name: 'imageFile', maxCount: 1 }
  ]),
  rejectCategoryFields,
  async (req, res) => {
    // Collect all local temp paths for cleanup
    const tempFiles = [];
    let finalAudioPath = null;

    try {
      req.setTimeout(300000); // 5 minutes

      const { title, speaker, duration, tags, albumIds } = req.body;
      const audioFile = req.files?.audioFile?.[0];
      const imageFile = req.files?.imageFile?.[0];

      if (!audioFile) return res.status(400).json({ message: 'No audio file uploaded.' });

      tempFiles.push(audioFile.path);

      const originalExt = path.extname(audioFile.originalname).replace('.', '').toLowerCase() || 'mp3';
      let processedAudioPath = audioFile.path;
      let hash = '';

      // ── Step 1: Convert to MP3 if needed & compute hash ──────────────────
      if (originalExt === 'mp3') {
        const fileData = await fs.promises.readFile(audioFile.path);
        hash = crypto.createHash('sha256').update(fileData).digest('hex');

        const existing = await Audio.findOne({ fileHash: hash }).populate('albumIds');
        if (existing) {
          cleanupFiles(tempFiles);
          return res.status(409).json(await buildDuplicateResponse(existing));
        }
      } else {
        // Convert audio to MP3 for maximum mobile compatibility
        if (!ffmpegPath) {
          cleanupFiles(tempFiles);
          return res.status(500).json({ message: 'Audio conversion is not available on the server.' });
        }

        const baseName = path.basename(audioFile.filename, path.extname(audioFile.filename));
        const convertedFilename = `${baseName}.mp3`;
        const convertedPath = path.join(path.dirname(audioFile.path), convertedFilename);
        tempFiles.push(convertedPath);

        try {
          await convertAudioToMp3(audioFile.path, convertedPath);
          processedAudioPath = convertedPath;
        } catch (convertErr) {
          cleanupFiles(tempFiles);
          console.error('[AudioUpload] Conversion failed:', convertErr);
          return res.status(400).json({ message: 'Failed to convert audio to mobile-friendly format. Please upload a supported audio file.' });
        }

        const fileData = await fs.promises.readFile(processedAudioPath);
        hash = crypto.createHash('sha256').update(fileData).digest('hex');

        const existing = await Audio.findOne({ fileHash: hash }).populate('albumIds');
        if (existing) {
          cleanupFiles(tempFiles);
          return res.status(409).json(await buildDuplicateResponse(existing));
        }
      }

      // ── Step 2: Save processed audio to permanent local storage ─────────
      const finalAudioFilename = generateUniqueFilename('audio.mp3');
      finalAudioPath = path.join(STORAGE_FOLDERS.audios, finalAudioFilename);
      fs.copyFileSync(processedAudioPath, finalAudioPath);
      const audioUrl = `/uploads/audios/${finalAudioFilename}`;

      // ── Step 3: Use thumbnail image from local storage (if provided) ─────
      let imageUrl = '/placeholder.png';
      if (imageFile) {
        imageUrl = `/uploads/audio-images/${imageFile.filename}`;
      }

      // ── Step 4: Clean up temp files ──────────────────────────────────────
      cleanupFiles(tempFiles);

      // ── Step 5: Save to DB with local URLs ───────────────────────────────
      const newAudio = new Audio({
        title,
        speaker,
        description: req.body.description || '',
        duration: duration || '0:00',
        imageUrl,
        albumIds: parseArrayField(albumIds),
        tags: parseArrayField(tags),
        audioUrl,
        fileHash: hash,
        fileExtension: 'mp3',
        originalExtension: originalExt
      });
      const saved = await newAudio.save();
      res.status(201).json(saved);

    } catch (err) {
      cleanupFiles(tempFiles);
      if (finalAudioPath) deleteLocalFile(finalAudioPath);
      console.error('[AudioUpload] Error:', err);
      res.status(400).json({ message: err.message });
    }
  }
);

// ─── PUT /api/audios/:id ─────────────────────────────────────────────────────
router.put('/:id', auth, permissionCheck(['audio_edit']), upload.single('imageFile'), rejectCategoryFields, async (req, res) => {
  try {
    const { title, speaker, duration, description, albumIds, tags, imageUrl } = req.body;
    const audio = await Audio.findById(req.params.id);
    if (!audio) {
      if (req.file) deleteLocalFile(`/uploads/audio-images/${req.file.filename}`);
      return res.status(404).json({ message: 'Audio not found' });
    }
    
    if (title) audio.title = title;
    if (speaker !== undefined) audio.speaker = speaker;
    if (duration) audio.duration = duration;
    if (description !== undefined) audio.description = description;
    if (albumIds !== undefined) audio.albumIds = parseArrayField(albumIds);
    if (tags !== undefined) audio.tags = parseArrayField(tags);

    // Handle cover image replacement
    let newImageUrl = null;
    if (req.file) {
      newImageUrl = `/uploads/audio-images/${req.file.filename}`;
    } else if (imageUrl) {
      newImageUrl = imageUrl;
    }

    let oldImageUrl = null;
    if (newImageUrl && newImageUrl !== audio.imageUrl) {
      oldImageUrl = audio.imageUrl;
      audio.imageUrl = newImageUrl;
    }

    const saved = await audio.save();

    // Delete old local image ONLY after successful DB save, if it's not a placeholder
    if (oldImageUrl && oldImageUrl !== '/placeholder.png' && !oldImageUrl.startsWith('http')) {
      if (oldImageUrl !== newImageUrl) {
        deleteLocalFile(oldImageUrl);
      }
    }

    res.json(saved);
  } catch (err) {
    if (req.file) {
      deleteLocalFile(`/uploads/audio-images/${req.file.filename}`);
    }
    res.status(400).json({ message: err.message });
  }
});

// ─── DELETE /api/audios/:id ──────────────────────────────────────────────────
router.delete('/:id', auth, permissionCheck(['audio_delete']), async (req, res) => {
  try {
    const audio = await Audio.findById(req.params.id);
    if (!audio) return res.status(404).json({ message: 'Audio not found' });

    // Delete audio file from local storage
    if (audio.audioUrl) {
      deleteLocalFile(audio.audioUrl);
    }
    // Delete thumbnail image from local storage
    if (audio.imageUrl && audio.imageUrl !== '/placeholder.png') {
      deleteLocalFile(audio.imageUrl);
    }

    await Audio.findByIdAndDelete(req.params.id);
    res.json({ message: 'Audio deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PATCH /api/audios/:id/favorite ─────────────────────────────────────────
router.patch('/:id/favorite', async (req, res) => {
  try {
    const audio = await Audio.findById(req.params.id);
    if (!audio) return res.status(404).json({ message: 'Audio not found' });
    audio.isFavorite = !audio.isFavorite;
    await audio.save();
    res.json(audio);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
