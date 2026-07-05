// migrateCategoryAlbum.js
// Usage: node migrateCategoryAlbum.js
// This script connects to the MongoDB used by the Audio Catalog project and migrates data
// to conform to the new strict schema: Album has a single categoryId, Audio has only albumIds and categoryIds.

const mongoose = require('mongoose');
const path = require('path');

// Load environment variables if .env is used
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Adjust the connection string as needed
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/audio_catalog';

// Define schemas matching the updated models (only fields we need for migration)
const categorySchema = new mongoose.Schema({ name: String }, { collection: 'categories' });
const Category = mongoose.model('Category', categorySchema);

const albumSchema = new mongoose.Schema({
  name: String,
  title: String,
  description: String,
  coverImage: String,
  // New strict field
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  // Legacy field to be removed
  legacyCategoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }]
}, { collection: 'albums' });
const Album = mongoose.model('Album', albumSchema);

const audioSchema = new mongoose.Schema({
  title: String,
  speaker: String,
  description: String,
  // Legacy fields to be removed
  category: { type: String, default: 'Uncategorized' },
  categoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  albumIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Album' }],
  tags: [{ type: String }]
}, { collection: 'audios' });
const Audio = mongoose.model('Audio', audioSchema);

async function migrateAlbums() {
  const albums = await Album.find({});
  for (const album of albums) {
    // If categoryId already set, skip legacy handling
    if (album.categoryId) continue;
    // Use the first legacyCategoryIds if present
    let newCategoryId = null;
    if (album.legacyCategoryIds && album.legacyCategoryIds.length > 0) {
      newCategoryId = album.legacyCategoryIds[0];
    } else {
      // Fallback to a default category named 'Uncategorized'
      let defaultCat = await Category.findOne({ name: 'Uncategorized' });
      if (!defaultCat) {
        defaultCat = await new Category({ name: 'Uncategorized' }).save();
      }
      newCategoryId = defaultCat._id;
    }
    album.categoryId = newCategoryId;
    album.legacyCategoryIds = undefined; // remove field
    await album.save();
    console.log(`Album ${album._id} migrated with categoryId ${newCategoryId}`);
  }
}

async function migrateAudios() {
  const audios = await Audio.find({});
  for (const audio of audios) {
    // Ensure at least one albumId exists – we cannot infer, so just keep existing values.
    // Migrate legacy 'category' string to Category collection if needed.
    if (audio.category && (!audio.categoryIds || audio.categoryIds.length === 0)) {
      const catName = audio.category.trim() || 'Uncategorized';
      let cat = await Category.findOne({ name: catName });
      if (!cat) {
        cat = await new Category({ name: catName }).save();
        console.log(`Created new category ${catName}`);
      }
      audio.categoryIds = [cat._id];
    }
    // Remove legacy fields
    audio.category = undefined;
    await audio.save();
    console.log(`Audio ${audio._id} migrated`);
  }
}

async function runMigration() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    await migrateAlbums();
    await migrateAudios();
    console.log('Migration completed successfully');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

runMigration();
