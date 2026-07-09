require('dotenv').config();
console.log('=== STEP 1: Loading modules ===');

try {
  const express = require('express');
  console.log('✅ express loaded');
} catch (e) {
  console.error('❌ express error:', e.message);
  process.exit(1);
}

try {
  const cors = require('cors');
  console.log('✅ cors loaded');
} catch (e) {
  console.error('❌ cors error:', e.message);
  process.exit(1);
}

try {
  const path = require('path');
  console.log('✅ path loaded');
} catch (e) {
  console.error('❌ path error:', e.message);
  process.exit(1);
}

try {
  const fs = require('fs');
  console.log('✅ fs loaded');
} catch (e) {
  console.error('❌ fs error:', e.message);
  process.exit(1);
}

try {
  const mongoose = require('mongoose');
  console.log('✅ mongoose loaded');
} catch (e) {
  console.error('❌ mongoose error:', e.message);
  process.exit(1);
}

console.log('=== STEP 2: Loading routes ===');

try {
  const authRoutes = require('./routes/auth');
  console.log('✅ auth routes loaded');
} catch (e) {
  console.error('❌ auth routes error:', e.message);
  process.exit(1);
}

try {
  const categoryRoutes = require('./routes/categories');
  console.log('✅ category routes loaded');
} catch (e) {
  console.error('❌ category routes error:', e.message);
  process.exit(1);
}

try {
  const audioRoutes = require('./routes/audios');
  console.log('✅ audio routes loaded');
} catch (e) {
  console.error('❌ audio routes error:', e.message);
  process.exit(1);
}

try {
  const settingsRoutes = require('./routes/settings');
  console.log('✅ settings routes loaded');
} catch (e) {
  console.error('❌ settings routes error:', e.message);
  process.exit(1);
}

try {
  const albumRoutes = require('./routes/albums');
  console.log('✅ album routes loaded');
} catch (e) {
  console.error('❌ album routes error:', e.message);
  process.exit(1);
}

try {
  const userRoutes = require('./routes/users');
  console.log('✅ user routes loaded');
} catch (e) {
  console.error('❌ user routes error:', e.message);
  process.exit(1);
}

try {
  const galleryRoutes = require('./routes/gallery');
  console.log('✅ gallery routes loaded');
} catch (e) {
  console.error('❌ gallery routes error:', e.message);
  process.exit(1);
}

try {
  const searchRoutes = require('./routes/search');
  console.log('✅ search routes loaded');
} catch (e) {
  console.error('❌ search routes error:', e.message);
  process.exit(1);
}

console.log('=== STEP 3: Loading models ===');

try {
  const User = require('./models/User');
  console.log('✅ User model loaded');
} catch (e) {
  console.error('❌ User model error:', e.message);
  process.exit(1);
}

console.log('=== STEP 4: Testing MongoDB connection ===');

const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('✅ MongoDB connected successfully!');
    console.log('=== ALL CHECKS PASSED ===');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

setTimeout(() => {
  console.log('⏱️ Connection timeout');
  process.exit(1);
}, 15000);