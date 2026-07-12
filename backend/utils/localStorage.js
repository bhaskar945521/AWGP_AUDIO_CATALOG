const path = require('path');
const fs = require('fs');

// Base uploads directory — relative to backend folder
const BASE_UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// All storage folder paths
const STORAGE_FOLDERS = {
  audios: path.join(BASE_UPLOADS_DIR, 'audios'),
  audioImages: path.join(BASE_UPLOADS_DIR, 'audio-images'),
  albumCovers: path.join(BASE_UPLOADS_DIR, 'album-covers'),
  categories: path.join(BASE_UPLOADS_DIR, 'categories'),
  gallery: path.join(BASE_UPLOADS_DIR, 'gallery'),
  tmp: path.join(BASE_UPLOADS_DIR, 'tmp'),
};

// Auto-create all folders on startup
Object.values(STORAGE_FOLDERS).forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log('[LocalStorage] Created directory:', dir);
  }
});

/**
 * Returns the base uploads directory path.
 */
function getUploadsDir() {
  return BASE_UPLOADS_DIR;
}

/**
 * Generates a unique filename using timestamp + random suffix.
 * @param {string} originalName - original filename (e.g. "song.mp3")
 * @returns {string} unique filename
 */
function generateUniqueFilename(originalName) {
  const ext = path.extname(originalName) || '';
  const base = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${base}_${timestamp}_${random}${ext}`;
}

/**
 * Deletes a local file given its URL path (e.g. "/uploads/audios/song.mp3")
 * or absolute path.
 * @param {string} fileUrlOrPath
 */
function deleteLocalFile(fileUrlOrPath) {
  if (!fileUrlOrPath) return;

  let absolutePath;
  if (path.isAbsolute(fileUrlOrPath)) {
    absolutePath = fileUrlOrPath;
  } else {
    // Convert URL like /uploads/audios/song.mp3 → absolute path
    const relativePart = fileUrlOrPath.startsWith('/uploads')
      ? fileUrlOrPath.replace('/uploads', '')
      : fileUrlOrPath;
    absolutePath = path.join(BASE_UPLOADS_DIR, relativePart);
  }

  if (fs.existsSync(absolutePath)) {
    try {
      fs.unlinkSync(absolutePath);
      console.log('[LocalStorage] Deleted file:', absolutePath);
    } catch (err) {
      console.warn('[LocalStorage] Failed to delete file:', absolutePath, err.message);
    }
  }
}

module.exports = {
  STORAGE_FOLDERS,
  getUploadsDir,
  generateUniqueFilename,
  deleteLocalFile,
};
