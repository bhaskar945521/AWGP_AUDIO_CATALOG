const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// In-memory settings store (can be replaced with a DB model later)
let appSettings = {
  siteName: 'AWGP Audio Catalog',
  siteTagline: 'Spiritual Audio Library',
  maintenanceMode: false,
  allowPublicAccess: true,
  maxUploadSizeMB: 50,
  featuredAudioIds: [],
  updatedAt: new Date().toISOString(),
};

// GET /api/settings — public
router.get('/', (req, res) => {
  res.json(appSettings);
});

// PUT /api/settings — admin only
router.put('/', auth, roleCheck(['admin']), (req, res) => {
  const allowed = [
    'siteName',
    'siteTagline',
    'maintenanceMode',
    'allowPublicAccess',
    'maxUploadSizeMB',
    'featuredAudioIds',
  ];
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) {
      appSettings[key] = req.body[key];
    }
  });
  appSettings.updatedAt = new Date().toISOString();
  res.json(appSettings);
});

module.exports = router;
