/**
 * Admin Migration Script - run from backend/ directory
 * node migrate-admin.js
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');

async function migrateAdmin() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected.\n');

  const OLD_USERNAME = 'shantikunjadmin';
  const NEW_USERNAME = process.env.ADMIN_USERNAME || 'spiritualadmin';
  const NEW_PASSWORD = process.env.ADMIN_PASSWORD || 'Spiritual2026';

  // 1. Delete old admin if exists
  const oldAdmin = await User.findOne({ username: OLD_USERNAME });
  if (oldAdmin) {
    await User.deleteOne({ username: OLD_USERNAME });
    console.log(`🗑️  Deleted old admin user: "${OLD_USERNAME}"`);
  } else {
    console.log(`ℹ️  Old admin "${OLD_USERNAME}" not found (already clean)`);
  }

  // 2. Create or update new admin
  let newAdmin = await User.findOne({ username: NEW_USERNAME });
  if (!newAdmin) {
    newAdmin = new User({ username: NEW_USERNAME, role: 'admin' });
    console.log(`➕ Creating new admin: "${NEW_USERNAME}"`);
  } else {
    console.log(`🔄 Updating existing admin: "${NEW_USERNAME}"`);
  }
  await newAdmin.setPassword(NEW_PASSWORD);
  await newAdmin.save();

  console.log(`\n✅ Migration complete!`);
  console.log(`   Username : ${NEW_USERNAME}`);
  console.log(`   Password : ${NEW_PASSWORD}`);
  await mongoose.disconnect();
  process.exit(0);
}

migrateAdmin().catch(err => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
