const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Public User Registration
router.post('/register', async (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).json({ message: 'All fields (fullName, email, password) are required' });
  }

  try {
    // Check if user already exists
    const existing = await User.findOne({ 
      $or: [
        { username: email.toLowerCase() },
        { email: email.toLowerCase() }
      ] 
    });
    if (existing) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    const newUser = new User({
      username: email.toLowerCase(),
      email: email.toLowerCase(),
      fullName: fullName,
      role: 'public_user'
    });

    await newUser.setPassword(password);
    await newUser.save();

    // Sign token for direct login on register
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role, permissions: newUser.permissions || [] },
      process.env.JWT_SECRET || 'defaultsecret',
      { expiresIn: '7d' }
    );

    res.status(201).json({ 
      token, 
      role: newUser.role, 
      permissions: newUser.permissions || [],
      fullName: newUser.fullName,
      email: newUser.email,
      username: newUser.username
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Public User Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ 
      $or: [
        { username: email.toLowerCase() },
        { email: email.toLowerCase() }
      ]
    });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await user.validatePassword(password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, permissions: user.permissions || [] },
      process.env.JWT_SECRET || 'defaultsecret',
      { expiresIn: '7d' }
    );

    res.json({ 
      token, 
      role: user.role, 
      permissions: user.permissions || [],
      fullName: user.fullName,
      email: user.email,
      username: user.username
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Public User Logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
