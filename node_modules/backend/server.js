const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
// Load .env from backend directory regardless of where process starts
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// --------------------------
// PRODUCTION-SAFE MIDDLEWARE
// --------------------------

// 1. CORS (allow all needed origins, including mobile/non-browser)
const allowedOrigins = [
  'https://awgp-audiocatalog-bhaskar.netlify.app',
  'http://localhost:5173',
  'http://172.20.17.89:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  // Add any other production origins here if needed
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) return callback(null, true);
    // Allow any LAN/private IP range for cross-machine access
    if (/^http:\/\/(192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|10\.)/.test(origin)) return callback(null, true);
    if (origin.startsWith('http://172.20.')) return callback(null, true);
    // For production safety, log disallowed origins but don't fail (or fail as needed)
    console.warn('[CORS] Disallowed origin:', origin);
    // Allow for now - uncomment next line to block strictly
    // return callback(new Error('Not allowed by CORS'));
    return callback(null, true); 
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length', 'Content-Type'],
  credentials: true,
}));

app.use(compression());
app.use(express.json());

// --------------------------
// UPLOADS & STORAGE
// --------------------------

// Ensure all storage folders exist (critical for production)
const { STORAGE_FOLDERS, getUploadsDir } = require('./utils/localStorage');

// 2. Serve uploads with explicit checks - BEFORE any catch-all routes!
const uploadsPath = getUploadsDir();
console.log('[Server] Uploads directory:', uploadsPath);
console.log('[Server] STORAGE_FOLDERS:', Object.entries(STORAGE_FOLDERS).map(([k, v]) => `${k}: ${v}`));

// Audio MIME types map for proper browser playback
const AUDIO_MIME_TYPES = {
  '.mp3':  'audio/mpeg',
  '.wav':  'audio/wav',
  '.ogg':  'audio/ogg',
  '.flac': 'audio/flac',
  '.aac':  'audio/aac',
  '.m4a':  'audio/mp4',
  '.opus': 'audio/opus',
  '.webm': 'audio/webm',
};

app.use('/uploads', (req, res, next) => {
  // Log uploads requests for production debugging
  console.log('[Uploads] Request:', req.method, req.path);

  const filePath = path.join(uploadsPath, req.path);

  if (!fs.existsSync(filePath)) {
    console.warn('[Uploads] File not found:', filePath);
    return next(); // fallthrough
  }

  const ext = path.extname(req.path).toLowerCase();
  const mimeType = AUDIO_MIME_TYPES[ext];

  // ── Handle audio files with proper Range-request streaming ──
  if (mimeType) {
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const rangeHeader = req.headers['range'];

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Type', mimeType);

    if (rangeHeader) {
      // Partial content (seek / stream)
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end   = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = (end - start) + 1;

      res.writeHead(206, {
        'Content-Range':  `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges':  'bytes',
        'Content-Length': chunkSize,
        'Content-Type':   mimeType,
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
      // Full file
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type':   mimeType,
      });
      fs.createReadStream(filePath).pipe(res);
    }
    return; // Response handled
  }

  // Non-audio files: serve normally
  console.log('[Uploads] Serving file:', filePath);
  next();
}, express.static(uploadsPath, {
  maxAge: '7d',
  etag: true,
  lastModified: true,
  fallthrough: true,
}));

// Serve frontend
const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');
console.log('[Server] Frontend dist path:', frontendDistPath);
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
} else {
  console.warn('[Server] Frontend dist not found - running in API-only mode');
}

// --------------------------
// ROUTES
// --------------------------
const authRoutes = require('./routes/auth');
const publicAuthRoutes = require('./routes/publicAuth');
const engagementRoutes = require('./routes/engagement');
const categoryRoutes = require('./routes/categories');
const audioRoutes = require('./routes/audios');
const settingsRoutes = require('./routes/settings');
const albumRoutes = require('./routes/albums');
const userRoutes = require('./routes/users');
const galleryRoutes = require('./routes/gallery');
const searchRoutes = require('./routes/search');
const roleRoutes = require('./routes/roles');
const reportRoutes = require('./routes/reports');

app.use('/api/search', searchRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', publicAuthRoutes);
app.use('/api', engagementRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/audios', audioRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/users', userRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/reports', reportRoutes);

// --------------------------
// HEALTH CHECK & DIAGNOSTICS
// --------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uploadsDir: uploadsPath,
    uploadsExists: fs.existsSync(uploadsPath),
    frontendDistExists: fs.existsSync(frontendDistPath),
  });
});

// --------------------------
// SPA CATCH-ALL (PRODUCTION SAFE)
// --------------------------
app.use((req, res, next) => {
  // Only handle GET requests for SPA
  if (req.method !== 'GET') {
    return next();
  }
  
  // Never serve index.html for /api or /uploads requests!
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
    return res.status(404).json({ 
      message: 'Not found', 
      path: req.path,
      requestedFile: path.join(uploadsPath, req.path.replace('/uploads', ''))
    });
  }
  
  const indexPath = path.join(frontendDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  
  // If we get here, it's a 404 for non-SPA paths
  res.status(404).send(`
    <h1>AWGP Audio Catalog - Backend Running</h1>
    <p>Frontend not found. Build with npm run build in frontend.</p>
    <p>Check /api/health for diagnostics.</p>
  `);
});

// --------------------------
// DATABASE
// --------------------------
const User = require('./models/User');
const Role = require('./models/Role');
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('[DB] Connected to MongoDB');
    
    // Seed default roles
    const defaultRoles = [
      { name: 'admin', displayName: 'Admin', permissions: ['admin'], enabled: true, isSystem: true },
      { name: 'public_user', displayName: 'Public User', permissions: ['audios_read', 'albums_read', 'categories_read'], enabled: true, isSystem: true },
      { name: 'onlyuser', displayName: 'Operator', permissions: ['audios_read', 'audios_create', 'audios_update', 'audios_delete', 'albums_read', 'categories_read'], enabled: true, isSystem: true }
    ];

    for (const defRole of defaultRoles) {
      let roleDoc = await Role.findOne({ name: defRole.name });
      if (!roleDoc) {
        roleDoc = new Role(defRole);
        await roleDoc.save();
        console.log(`[DB] Seeded default role: ${defRole.name}`);
      }
    }

    const adminUsername = process.env.ADMIN_USERNAME || 'shantikunjadmin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Shantikunj2026';
    let admin = await User.findOne({ username: adminUsername });
    if (!admin) {
      admin = new User({ username: adminUsername, role: 'admin' });
      console.log('[DB] Default admin created:', adminUsername);
    }
    // Always update admin password to ensure it's correct
    await admin.setPassword(adminPassword);
    await admin.save();
    console.log('[DB] Admin credentials updated');
  })
  .catch(err => {
    console.error('[DB] Connection Error:', err.message);
    process.exit(1); // Exit on DB failure - production safety
  });

// --------------------------
// START SERVER
// --------------------------
const server = app.listen(PORT, () => {
  console.log('=========================================');
  console.log('🚀 AWGP Audio Catalog Server Started');
  console.log(`📡 Port: ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗂️  Uploads Dir: ${uploadsPath}`);
  console.log('=========================================');
});
server.keepAliveTimeout = 310000;
server.headersTimeout = 320000;
