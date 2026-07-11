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
  'गायत्री': ['gayatri'],
  'गायत्री मंत्र': ['gayatri mantra', 'gayatri mantras'],
  'पंडित': ['pandit', 'pt'],
  'पंडित श्रीराम': ['pandit shriram', 'pt shriram'],
  'पंडित श्रीराम शर्मा': ['pandit shriram sharma', 'pt shriram sharma'],
  'श्रीराम': ['shriram'],
  'श्रीराम शर्मा': ['shriram sharma'],
  'युग': ['yug'],
  'युग निर्माण': ['yug nirman'],
  'निर्माण': ['nirman'],
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
  'prem': ['प्रेम'],
  'gayatri': ['गायत्री'],
  'gayatri mantra': ['गायत्री मंत्र'],
  'pandit': ['पंडित'],
  'pt': ['पंडित'],
  'pandit shriram': ['पंडित श्रीराम'],
  'pt shriram': ['पंडित श्रीराम'],
  'pandit shriram sharma': ['पंडित श्रीराम शर्मा'],
  'pt shriram sharma': ['पंडित श्रीराम शर्मा'],
  'shriram': ['श्रीराम'],
  'shriram sharma': ['श्रीराम शर्मा'],
  'yug': ['युग'],
  'yug nirman': ['युग निर्माण'],
  'nirman': ['निर्माण']
};

// Function to get all search terms (original + synonyms + transliterations)
const getAllSearchTerms = (query) => {
  const terms = [query.toLowerCase()];
  const lowerQuery = query.toLowerCase();
  const words = lowerQuery.split(/\s+/);

  // First check for multi-word synonyms (longest first to match longer phrases)
  const sortedSynonyms = Object.keys(bilingualSynonyms).sort((a, b) => b.length - a.length);
  sortedSynonyms.forEach(phrase => {
    if (lowerQuery.includes(phrase)) {
      terms.push(...bilingualSynonyms[phrase].map(s => s.toLowerCase()));
    }
  });

  // Then check for individual word synonyms
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
  const lowerQuery = q.toLowerCase();
  
  // Create regex for each search term and combine with OR
  const regexPattern = searchTerms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(regexPattern, 'i');
  
  try {
    const [audios, albums, categories] = await Promise.all([
      Audio.find({
        $or: [
          { title: regex },
          { speaker: regex },
          { description: regex },
          { tags: { $in: searchTerms.map(t => new RegExp(t, 'i')) } }
        ]
      }).select('title speaker _id imageUrl audioUrl duration description tags').lean(),
      Album.find({
        $or: [
          { title: regex },
          { name: regex },
          { description: regex }
        ]
      }).select('title name _id coverImage description').lean(),
      Category.find({
        $or: [
          { name: regex }
        ]
      }).select('name _id coverImage').lean()
    ]);
    
    const results = [];

    // Helper to calculate relevance score
    const scoreItem = (titleOrName, speaker, tags = [], desc = '', type) => {
      let score = 0;
      const lowerName = (titleOrName || '').toLowerCase();
      const lowerSpeaker = (speaker || '').toLowerCase();
      const lowerDesc = (desc || '').toLowerCase();

      // Title/Name Matches
      if (lowerName === lowerQuery) {
        score += 150;
      } else if (lowerName.startsWith(lowerQuery)) {
        score += 100;
      } else if (lowerName.includes(lowerQuery)) {
        score += 80;
      } else {
        // Check synonym matches
        const matchesSynonym = searchTerms.some(term => lowerName.includes(term));
        if (matchesSynonym) score += 50;
      }

      // Speaker Matches
      if (type === 'audio') {
        if (lowerSpeaker === lowerQuery) {
          score += 60;
        } else if (lowerSpeaker.includes(lowerQuery)) {
          score += 40;
        }
      }

      // Tags Matches
      if (tags && tags.length > 0) {
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

      return score;
    };

    audios.forEach(a => {
      const score = scoreItem(a.title, a.speaker, a.tags, a.description, 'audio');
      results.push({
        type: 'audio',
        id: a._id,
        title: a.title,
        speaker: a.speaker,
        imageUrl: a.imageUrl,
        audioUrl: a.audioUrl,
        duration: a.duration,
        score
      });
    });

    albums.forEach(a => {
      const score = scoreItem(a.title || a.name, '', [], a.description, 'album');
      results.push({
        type: 'album',
        id: a._id,
        title: a.title || a.name,
        coverImage: a.coverImage,
        score
      });
    });

    categories.forEach(c => {
      const score = scoreItem(c.name, '', [], '', 'category');
      results.push({
        type: 'category',
        id: c._id,
        name: c.name,
        coverImage: c.coverImage,
        score
      });
    });
    
    // Sort results by score descending (highest relevance first)
    results.sort((a, b) => b.score - a.score);

    // Remove score field from output for API cleanliness
    const cleanedResults = results.map(({ score, ...rest }) => rest);
    
    res.json({ results: cleanedResults });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Search failed' });
  }
});

module.exports = router;
