require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const { uploadToCloudinary, isCloudinaryConfigured } = require('../utils/cloudinaryStorage');
const Audio = require('../models/Audio');
const Album = require('../models/Album');
const Category = require('../models/Category');
const GalleryImage = require('../models/GalleryImage');
const User = require('../models/User');

const BASE_UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

function getAbsolutePath(relativeUrl) {
  if (!relativeUrl || !relativeUrl.startsWith('/uploads')) return null;
  const relativePart = relativeUrl.replace('/uploads', '');
  const absPath = path.join(BASE_UPLOADS_DIR, relativePart);
  return fs.existsSync(absPath) ? absPath : null;
}

async function migrate() {
  if (!isCloudinaryConfigured) {
    console.error('❌ Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are missing.');
    process.exit(1);
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI missing in .env');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB. Starting Cloudinary Migration...\n');

  // 1. Migrate Audios
  const audios = await Audio.find();
  console.log(`🔍 Found ${audios.length} audios to inspect.`);
  for (const audio of audios) {
    let updated = false;

    if (audio.audioUrl && audio.audioUrl.startsWith('/uploads')) {
      const localPath = getAbsolutePath(audio.audioUrl);
      if (localPath) {
        console.log(`[Audio File] Uploading ${audio.title}...`);
        const cloudUrl = await uploadToCloudinary(localPath, 'awgp_catalog/audios', 'video');
        if (cloudUrl) {
          audio.audioUrl = cloudUrl;
          updated = true;
        }
      }
    }

    if (audio.imageUrl && audio.imageUrl.startsWith('/uploads')) {
      const localPath = getAbsolutePath(audio.imageUrl);
      if (localPath) {
        console.log(`[Audio Image] Uploading cover for ${audio.title}...`);
        const cloudUrl = await uploadToCloudinary(localPath, 'awgp_catalog/audio_images', 'image');
        if (cloudUrl) {
          audio.imageUrl = cloudUrl;
          updated = true;
        }
      }
    }

    if (updated) {
      await audio.save();
      console.log(`  └─ Updated Audio ID ${audio._id}`);
    }
  }

  // 2. Migrate Albums
  const albums = await Album.find();
  console.log(`\n🔍 Found ${albums.length} albums to inspect.`);
  for (const album of albums) {
    if (album.coverImage && album.coverImage.startsWith('/uploads')) {
      const localPath = getAbsolutePath(album.coverImage);
      if (localPath) {
        console.log(`[Album] Uploading cover for ${album.title || album.name}...`);
        const cloudUrl = await uploadToCloudinary(localPath, 'awgp_catalog/album_covers', 'image');
        if (cloudUrl) {
          album.coverImage = cloudUrl;
          await album.save();
          console.log(`  └─ Updated Album ID ${album._id}`);
        }
      }
    }
  }

  // 3. Migrate Categories
  const categories = await Category.find();
  console.log(`\n🔍 Found ${categories.length} categories to inspect.`);
  for (const cat of categories) {
    if (cat.coverImageUrl && cat.coverImageUrl.startsWith('/uploads')) {
      const localPath = getAbsolutePath(cat.coverImageUrl);
      if (localPath) {
        console.log(`[Category] Uploading image for ${cat.name}...`);
        const cloudUrl = await uploadToCloudinary(localPath, 'awgp_catalog/categories', 'image');
        if (cloudUrl) {
          cat.coverImageUrl = cloudUrl;
          await cat.save();
          console.log(`  └─ Updated Category ID ${cat._id}`);
        }
      }
    }
  }

  // 4. Migrate Gallery
  const galleryImages = await GalleryImage.find();
  console.log(`\n🔍 Found ${galleryImages.length} gallery images to inspect.`);
  for (const item of galleryImages) {
    if (item.url && item.url.startsWith('/uploads')) {
      const localPath = getAbsolutePath(item.url);
      if (localPath) {
        console.log(`[Gallery] Uploading ${item.title || item._id}...`);
        const cloudUrl = await uploadToCloudinary(localPath, 'awgp_catalog/gallery', 'image');
        if (cloudUrl) {
          item.url = cloudUrl;
          await item.save();
          console.log(`  └─ Updated Gallery Image ID ${item._id}`);
        }
      }
    }
  }

  // 5. Migrate User Avatars
  const users = await User.find();
  console.log(`\n🔍 Found ${users.length} users to inspect.`);
  for (const user of users) {
    if (user.avatarUrl && user.avatarUrl.startsWith('/uploads')) {
      const localPath = getAbsolutePath(user.avatarUrl);
      if (localPath) {
        console.log(`[User Avatar] Uploading avatar for ${user.username}...`);
        const cloudUrl = await uploadToCloudinary(localPath, 'awgp_catalog/avatars', 'image');
        if (cloudUrl) {
          user.avatarUrl = cloudUrl;
          await user.save();
          console.log(`  └─ Updated User ID ${user._id}`);
        }
      }
    }
  }

  console.log('\n🎉 Migration complete!');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
