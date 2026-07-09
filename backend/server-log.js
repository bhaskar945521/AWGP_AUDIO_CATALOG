require('dotenv').config();
const fs = require('fs');

function log(msg) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}\n`;
  fs.appendToFile ? null : fs.appendFileSync('server.log', line);
  console.log(msg);
}

const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = function(...args) {
  log(args.join(' '));
  originalConsoleLog.apply(console, args);
};

console.error = function(...args) {
  log('ERROR: ' + args.join(' '));
  originalConsoleError.apply(console, args);
};

log('=== SERVER STARTING ===');
log('MONGODB_URI: ' + (process.env.MONGODB_URI ? 'SET' : 'NOT SET'));
log('PORT: ' + (process.env.PORT || 5000));

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs2 = require('fs');
const mongoose = require('mongoose');

log('Modules loaded');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'https://awgp-audiocatalog-bhaskar.netlify.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');
if (fs2.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  log('Serving frontend from: ' + frontendDistPath);
}

if (!fs2.existsSync(path.join(__dirname, 'uploads'))) {
  fs2.mkdirSync(path.join(__dirname, 'uploads'));
}

const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const audioRoutes = require('./routes/audios');
const settingsRoutes = require('./routes/settings');
const albumRoutes = require('./routes/albums');
const userRoutes = require('./routes/users');
const galleryRoutes = require('./routes/gallery');
const searchRoutes = require('./routes/search');

log('Routes loaded');

app.use('/api/search', searchRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/audios', audioRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/users', userRoutes);
app.use('/api/gallery', galleryRoutes);

app.get('/*', (req, res) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
    return res.status(404).json({ message: 'Not found' });
  }
  const indexPath = path.join(frontendDistPath, 'index.html');
  if (fs2.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend not built. Run "npm run build" in frontend directory.');
  }
});

const User = require('./models/User');

log('Connecting to MongoDB...');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    log('✅ Connected to MongoDB');
    try {
      const adminExists = await User.findOne({ username: 'shantikunjadmin' });
      if (!adminExists) {
        const admin = new User({ username: 'shantikunjadmin', role: 'admin' });
        await admin.setPassword('Shantikunj2026');
        await admin.save();
        log('✅ Default admin user created');
      }
    } catch (e) {
      log('Admin seed error: ' + e.message);
    }
    app.listen(PORT, () => {
      log('🚀 Server running on port ' + PORT);
      log('📱 Frontend: http://localhost:' + PORT);
      log('🔧 API: http://localhost:' + PORT + '/api');
    });
  })
  .catch(err => {
    log('❌ MongoDB Connection Error: ' + err.message);
    log('Full error: ' + JSON.stringify(err));
    process.exit(1);
  });

process.on('unhandledRejection', (reason, promise) => {
  log('Unhandled Rejection at: ' + promise + ' reason: ' + reason);
});