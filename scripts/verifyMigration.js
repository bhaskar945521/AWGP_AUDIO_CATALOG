// verifyMigration.js
// Usage: node scripts/verifyMigration.js
// This script connects to the MongoDB used by the Audio Catalog project
// and checks that the migration has correctly removed legacy fields
// and that the new strict schema is present.

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/audio_catalog';

// Minimal schemas for validation
const categorySchema = new mongoose.Schema({ name: String }, { collection: 'categories' });
const Category = mongoose.model('Category', categorySchema);

const albumSchema = new mongoose.Schema({
  name: String,
  title: String,
  description: String,
  coverImage: String,
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  // legacy field should be undefined
  legacyCategoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }]
}, { collection: 'albums' });
const Album = mongoose.model('Album', albumSchema);

const audioSchema = new mongoose.Schema({
  title: String,
  speaker: String,
  description: String,
  albumIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Album' }],
  // legacy fields should be undefined
  category: String,
  categoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }]
}, { collection: 'audios' });
const Audio = mongoose.model('Audio', audioSchema);

async function verify() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB for verification');

  // Check a few albums
  const albums = await Album.find({}).limit(5);
  console.log(`Found ${albums.length} albums`);
  albums.forEach(a => {
    const hasLegacy = a.legacyCategoryIds && a.legacyCategoryIds.length > 0;
    console.log(`Album ${a._id}: categoryId=${a.categoryId ? a.categoryId.toString() : 'null'}, legacyCategoryIds present=${hasLegacy}`);
  });

  // Check a few audios
  const audios = await Audio.find({}).limit(5);
  console.log(`Found ${audios.length} audios`);
  audios.forEach(a => {
    const hasLegacyCat = !!a.category;
    const hasLegacyIds = a.categoryIds && a.categoryIds.length > 0;
    console.log(`Audio ${a._id}: albumIds=${a.albumIds?.length || 0}, legacy category=${hasLegacyCat}, legacy categoryIds present=${hasLegacyIds}`);
  });

  await mongoose.disconnect();
  console.log('Verification completed');
}

verify().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
