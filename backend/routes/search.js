const express = require('express');
const router = express.Router();
const Audio = require('../models/Audio');
const Album = require('../models/Album');
const Category = require('../models/Category');

// Bilingual synonym map for Hindi ↔ English search
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

// GET /api/search?q=term
router.get('/', async (req, res) => {
  const q = req.query.q?.trim();
  if (!q) return res.json({ results: [] });
  
  const searchTerms = getAllSearchTerms(q);
  
  // Create regex for each search term and combine with OR
  const regexPattern = searchTerms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(regexPattern, 'i');
  
  try {
    const [audios, albums, categories] = await Promise.all([
      Audio.find({
        $or: [
          { title: regex },
          { speaker: regex },
          { tags: { $in: searchTerms.map(t => new RegExp(t, 'i')) } }
        ]
      }).select('title speaker _id imageUrl audioUrl duration').lean(),
      Album.find({
        $or: [
          { title: regex },
          { name: regex },
          { description: regex }
        ]
      }).select('title name _id coverImage').lean(),
      Category.find({
        $or: [
          { name: regex }
        ]
      }).select('name _id coverImage').lean()
    ]);
    
    const results = [];
    audios.forEach(a => results.push({ type: 'audio', id: a._id, title: a.title, speaker: a.speaker, imageUrl: a.imageUrl, audioUrl: a.audioUrl, duration: a.duration }));
    albums.forEach(a => results.push({ type: 'album', id: a._id, title: a.title || a.name, coverImage: a.coverImage }));
    categories.forEach(c => results.push({ type: 'category', id: c._id, name: c.name, coverImage: c.coverImage }));
    
    res.json({ results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Search failed' });
  }
});

module.exports = router;
