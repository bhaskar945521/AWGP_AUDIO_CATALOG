const path = require('path');
const fs = require('fs');

// Function to ensure directory exists
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
}

// Get uploads base directory
const getUploadsDir = () => {
  return path.join(__dirname, '..', 'uploads');
};

// Define storage folders
const STORAGE_FOLDERS = {
  categories: ensureDir(path.join(getUploadsDir(), 'categories')),
  albumCovers: ensureDir(path.join(getUploadsDir(), 'album-covers')),
  audios: ensureDir(path.join(getUploadsDir(), 'audios')),
  audioImages: ensureDir(path.join(getUploadsDir(), 'audio-images')),
  gallery: ensureDir(path.join(getUploadsDir(), 'gallery')),
  tmp: ensureDir(path.join(getUploadsDir(), 'tmp')),
};

// Generate unique filename
function generateUniqueFilename(originalName) {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1e9);
  const ext = path.extname(originalName);
  return `${timestamp}-${random}${ext}`;
}

// Delete file from local storage
function deleteLocalFile(filePath) {
  if (!filePath) return;
  // If filePath is a URL-like path (e.g., /uploads/categories/...), convert to absolute
  let absolutePath = filePath;
  if (filePath.startsWith('/uploads/')) {
    absolutePath = path.join(__dirname, '..', filePath);
  }
  if (fs.existsSync(absolutePath)) {
    try {
      fs.unlinkSync(absolutePath);
    } catch (err) {
      console.warn('[LocalStorage] Failed to delete file:', absolutePath, err.message);
    }
  }
}

module.exports = {
  ensureDir,
  getUploadsDir,
  STORAGE_FOLDERS,
  generateUniqueFilename,
  deleteLocalFile,
};
