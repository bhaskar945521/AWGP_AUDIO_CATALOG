const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { expandPermissions } = require('../middleware/permissionCheck');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { STORAGE_FOLDERS, generateUniqueFilename, deleteLocalFile } = require('../utils/localStorage');

// ── Avatar upload setup ──────────────────────────────────────────
const avatarsDir = path.join(__dirname, '..', 'uploads', 'avatars');
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `avatar_${req.user._id}_${Date.now()}${ext}`);
  },
});
const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
});

// Get current user info
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userObj = user.toObject();
    userObj.permissions = req.user.permissions; // fully expanded permissions resolved by auth middleware
    res.json(userObj);
  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Login - public
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required' });
  }
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const valid = await user.validatePassword(password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    if (user.status && user.status !== 'Active') {
      return res.status(403).json({ message: `Your account is ${user.status}. Access denied.` });
    }

    // Resolve permissions
    let permissions = [];
    if (user.role === 'admin') {
      permissions = ['admin'];
    } else {
      const roleDoc = await Role.findOne({ name: user.role });
      if (roleDoc && !roleDoc.enabled) {
        return res.status(403).json({ message: 'Role is disabled. Access denied.' });
      }
      if (user.permissions && user.permissions.length > 0) {
        permissions = user.permissions;
      } else if (roleDoc) {
        permissions = roleDoc.permissions || [];
      } else {
        permissions = user.permissions || [];
      }
    }

    const expandedPerms = expandPermissions(permissions);

    const token = jwt.sign(
      { id: user._id, role: user.role, permissions: expandedPerms },
      process.env.JWT_SECRET || 'defaultsecret',
      { expiresIn: '7d' }
    );
    res.json({ 
      token, 
      role: user.role, 
      permissions: expandedPerms,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl || ''
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Register SubAdmin - only admin can create new users
router.post('/register', auth, roleCheck(['admin']), async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ message: 'All fields required' });
  }
  // Allow any role value (admin or any user‑type role)
  // No strict whitelist here – roleCheck middleware will enforce permissions later
  // if (!['admin', 'user'].includes(role)) { return res.status(400).json({ message: 'Invalid role' }); }

  try {
    const existing = await User.findOne({ username });
    if (existing) return res.status(409).json({ message: 'User already exists' });
    const user = new User({ username, role });
    await user.setPassword(password);
    await user.save();
    res.status(201).json({ message: 'User created', userId: user._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /me — update own profile (fullName, email, password)
router.patch('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { fullName, email, currentPassword, newPassword } = req.body;

    if (fullName !== undefined) user.fullName = fullName;
    if (email !== undefined) user.email = email;

    // Password change — require current password
    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ message: 'Current password required to change password' });
      const valid = await user.validatePassword(currentPassword);
      if (!valid) return res.status(401).json({ message: 'Current password is incorrect' });
      await user.setPassword(newPassword);
    }

    await user.save();
    const userObj = user.toObject();
    delete userObj.passwordHash;
    res.json(userObj);
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /me/avatar — upload profile photo
router.post('/me/avatar', auth, (req, res, next) => {
  avatarUpload.single('avatar')(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Delete old avatar if exists
    if (user.avatarUrl) {
      const oldPath = path.join(__dirname, '..', user.avatarUrl.startsWith('/') ? user.avatarUrl.slice(1) : user.avatarUrl);
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch (_) {}
      }
    }

    // Save new avatar URL
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    user.avatarUrl = avatarUrl;
    await user.save();

    res.json({ avatarUrl, message: 'Profile photo updated' });
  } catch (err) {
    console.error('Avatar upload error:', err);
    res.status(500).json({ message: err.message });
  }
});

// DELETE /me/avatar — remove profile photo
router.delete('/me/avatar', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.avatarUrl) {
      const oldPath = path.join(__dirname, '..', user.avatarUrl.startsWith('/') ? user.avatarUrl.slice(1) : user.avatarUrl);
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch (_) {}
      }
      user.avatarUrl = '';
      await user.save();
    }
    res.json({ message: 'Profile photo removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
