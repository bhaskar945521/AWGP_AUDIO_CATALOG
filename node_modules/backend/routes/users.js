const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ListeningHistory = require('../models/ListeningHistory');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const bcrypt = require('bcryptjs');

// GET all users (admin only) – omit passwordHash
router.get('/', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET current user listening history (last 7 days)
router.get('/user/history', auth, async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const history = await ListeningHistory.find({
      userId: req.user._id,
      sessionStart: { $gte: sevenDaysAgo }
    })
      .populate('audioId', '-audioFile')
      .sort({ sessionStart: -1 });
    res.json(history);
  } catch (err) {
    console.error('Get user history error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE current user's listening history (clear all)
router.delete('/user/history', auth, async (req, res) => {
  try {
    await ListeningHistory.deleteMany({ userId: req.user._id });
    res.json({ message: 'Listening history cleared' });
  } catch (err) {
    console.error('Clear history error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// CREATE new user (admin only)
router.post('/', auth, roleCheck(['admin']), async (req, res) => {
  const { username, password, role, fullName, email, permissions, assignedWork } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'Username and password required' });
  try {
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ message: 'Username already exists' });
    const user = new User({ 
      username, 
      role: role || 'onlyuser', // Default to onlyuser for new admin-created users
      fullName: fullName || '',
      email: email || '',
      permissions: permissions || [],
      assignedWork: assignedWork || ''
    });
    await user.setPassword(password);
    await user.save();
    const userObj = user.toObject();
    delete userObj.passwordHash;
    res.status(201).json(userObj);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// UPDATE user (admin only) – allow role change, password reset, and permissions update
router.put('/:id', auth, roleCheck(['admin']), async (req, res) => {
  const { role, password, fullName, email, permissions, assignedWork } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Safety check: Don't allow changing last admin's role to non-admin
    if (user.role === 'admin' && role && role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(403).json({ message: 'Must have at least one admin' });
      }
    }
    
    if (role) user.role = role;
    if (password) await user.setPassword(password);
    if (fullName !== undefined) user.fullName = fullName;
    if (email !== undefined) user.email = email;
    if (permissions !== undefined) user.permissions = permissions;
    if (assignedWork !== undefined) user.assignedWork = assignedWork;
    
    await user.save();
    const userObj = user.toObject();
    delete userObj.passwordHash;
    res.json(userObj);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN: Get any user's listening history (last 7 days)
router.get('/users/:id/history', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const history = await ListeningHistory.find({
      userId: req.params.id,
      sessionStart: { $gte: sevenDaysAgo }
    })
      .populate('audioId', '-audioFile')
      .sort({ sessionStart: -1 });
    res.json(history);
  } catch (err) {
    console.error('Admin get history error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN: Clear any user's listening history
router.delete('/users/:id/history', auth, roleCheck(['admin']), async (req, res) => {
  try {
    await ListeningHistory.deleteMany({ userId: req.params.id });
    res.json({ message: 'User listening history cleared' });
  } catch (err) {
    console.error('Admin clear history error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
