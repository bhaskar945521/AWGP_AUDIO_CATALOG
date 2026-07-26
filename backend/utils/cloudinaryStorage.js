require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const { deleteLocalFile } = require('./localStorage');

// Configure Cloudinary from environment variables
const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('[Cloudinary] Configured successfully for cloud name:', process.env.CLOUDINARY_CLOUD_NAME);
} else {
  console.log('[Cloudinary] Credentials not set. Falling back to local storage.');
}

/**
 * Uploads a local file to Cloudinary.
 * @param {string} localFilePath - Path to local file on disk
 * @param {string} folder - Target Cloudinary folder (e.g. 'awgp_catalog/audios')
 * @param {string} resourceType - 'auto', 'image', or 'video' (audio uses 'video' or 'auto')
 * @returns {Promise<string|null>} Cloudinary HTTPS URL or null if failed/not configured
 */
async function uploadToCloudinary(localFilePath, folder = 'awgp_catalog', resourceType = 'auto') {
  if (!isCloudinaryConfigured || !localFilePath || !fs.existsSync(localFilePath)) {
    return null;
  }

  try {
    const result = await cloudinary.uploader.upload(localFilePath, {
      folder: folder,
      resource_type: resourceType,
    });
    console.log(`[Cloudinary] Upload success (${folder}):`, result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error(`[Cloudinary] Upload error (${folder}):`, error.message);
    return null;
  }
}

/**
 * Uploads local file to Cloudinary if configured and returns the secure URL.
 * Cleans up local temporary file if Cloudinary upload succeeds.
 * If Cloudinary is not configured or upload fails, falls back to fallbackLocalUrl.
 *
 * @param {string} localFilePath - Absolute path to local file on disk
 * @param {string} folder - Cloudinary folder name
 * @param {string} resourceType - 'auto' | 'image' | 'video'
 * @param {string} fallbackLocalUrl - Local URL path if Cloudinary not used
 * @returns {Promise<string>} Final URL (Cloudinary URL or local URL)
 */
async function processFileUpload(localFilePath, folder = 'awgp_catalog', resourceType = 'auto', fallbackLocalUrl = '') {
  if (!localFilePath || !fs.existsSync(localFilePath)) {
    return fallbackLocalUrl;
  }

  if (isCloudinaryConfigured) {
    const cloudUrl = await uploadToCloudinary(localFilePath, folder, resourceType);
    if (cloudUrl) {
      // Remove temporary file from local disk
      try {
        if (fs.existsSync(localFilePath)) {
          fs.unlinkSync(localFilePath);
        }
      } catch (err) {
        console.warn('[Cloudinary] Failed to remove local file after upload:', err.message);
      }
      return cloudUrl;
    }
  }

  return fallbackLocalUrl;
}

/**
 * Deletes an asset from Cloudinary or local disk given its URL.
 * @param {string} url - Cloudinary HTTPS URL or local /uploads/... path
 */
async function deleteFileByUrl(url) {
  if (!url) return;

  if (url.includes('cloudinary.com')) {
    if (!isCloudinaryConfigured) return;
    try {
      // Extract public ID from Cloudinary URL
      // E.g. https://res.cloudinary.com/cloud/video/upload/v12345/awgp_catalog/audios/file.mp3
      const parts = url.split('/');
      const fileWithExt = parts.pop();
      const filenameWithoutExt = fileWithExt.substring(0, fileWithExt.lastIndexOf('.')) || fileWithExt;
      
      const uploadIdx = parts.indexOf('upload');
      if (uploadIdx !== -1) {
        let pathParts = parts.slice(uploadIdx + 1);
        if (pathParts[0] && /^v\d+$/.test(pathParts[0])) {
          pathParts = pathParts.slice(1); // skip version part
        }
        const publicId = [...pathParts, filenameWithoutExt].join('/');

        let resourceType = 'image';
        if (url.includes('/video/') || /\.(mp3|wav|ogg|flac|aac|m4a|opus|webm)$/i.test(url)) {
          resourceType = 'video';
        }

        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        console.log('[Cloudinary] Deleted asset:', publicId, `(${resourceType})`);
      }
    } catch (err) {
      console.warn('[Cloudinary] Failed to delete asset:', err.message);
    }
  } else if (url.startsWith('/uploads/')) {
    deleteLocalFile(url);
  }
}

/**
 * Deletes an asset from Cloudinary given its URL (legacy wrapper).
 */
async function deleteFromCloudinary(cloudinaryUrl) {
  return deleteFileByUrl(cloudinaryUrl);
}

module.exports = {
  isCloudinaryConfigured,
  uploadToCloudinary,
  processFileUpload,
  deleteFileByUrl,
  deleteFromCloudinary,
};
