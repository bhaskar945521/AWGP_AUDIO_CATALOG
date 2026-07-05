const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();

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
    if (origin.startsWith('http://172.20.')) return callback(null, true);
    // For production safety, log disallowed origins but don't fail (or fail as needed)
    console.warn('[CORS] Disallowed origin:', origin);
    // Allow for now - uncomment next line to block strictly
    // return callback(new Error('Not allowed by CORS'));
    return callback(null, true); 
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
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

app.use('/uploads', (req, res, next) => {
  // Log uploads requests for production debugging
  console.log('[Uploads] Request:', req.method, req.path);
  
  // Check if file exists before serving
  const requestedFile = path.join(uploadsPath, req.path.replace('/uploads', ''));
  if (!fs.existsSync(requestedFile)) {
    console.warn('[Uploads] File not found:', requestedFile);
  } else {
    console.log('[Uploads] Serving file:', requestedFile);
  }
  next();
}, express.static(uploadsPath, {
  maxAge: '30d',
  etag: false,
  lastModified: true,
  fallthrough: true, // Let next middleware handle 404s
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
const categoryRoutes = require('./routes/categories');
const audioRoutes = require('./routes/audios');
const settingsRoutes = require('./routes/settings');
const albumRoutes = require('./routes/albums');
const userRoutes = require('./routes/users');
const galleryRoutes = require('./routes/gallery');
const searchRoutes = require('./routes/search');

app.use('/api/search', searchRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/audios', audioRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/users', userRoutes);
app.use('/api/gallery', galleryRoutes);

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
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('[DB] Connected to MongoDB');
    const adminUsername = process.env.ADMIN_USERNAME || 'shantikunjadmin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Shantikunj2026';
    const adminExists = await User.findOne({ username: adminUsername });
    if (!adminExists) {
      const admin = new User({ username: adminUsername, role: 'admin' });
      await admin.setPassword(adminPassword);
      await admin.save();
      console.log('[DB] Default admin created:', adminUsername);
    }
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
