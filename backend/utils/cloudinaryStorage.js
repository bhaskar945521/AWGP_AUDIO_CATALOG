require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

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
 * @param {string} folder - Target Cloudinary folder (e.g. 'awgp/audios', 'awgp/images')
 * @param {string} resourceType - 'auto', 'image', or 'video' (audio files use 'video' or 'auto')
 * @returns {Promise<string|null>} Cloudinary HTTPS URL or null if failed/not configured
 */
async function uploadToCloudinary(localFilePath, folder = 'awgp_audio_catalog', resourceType = 'auto') {
  if (!isCloudinaryConfigured || !localFilePath || !fs.existsSync(localFilePath)) {
    return null;
  }

  try {
    const result = await cloudinary.uploader.upload(localFilePath, {
      folder: folder,
      resource_type: resourceType,
    });
    console.log('[Cloudinary] Upload success:', result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error('[Cloudinary] Upload error:', error.message);
    return null;
  }
}

/**
 * Deletes an asset from Cloudinary given its URL.
 * @param {string} cloudinaryUrl
 */
async function deleteFromCloudinary(cloudinaryUrl) {
  if (!isCloudinaryConfigured || !cloudinaryUrl || !cloudinaryUrl.includes('cloudinary.com')) {
    return;
  }

  try {
    // Extract public ID from Cloudinary URL
    const parts = cloudinaryUrl.split('/');
    const fileWithExt = parts.pop();
    const publicId = parts.slice(parts.indexOf('upload') + 2).join('/') + '/' + fileWithExt.split('.')[0];
    
    await cloudinary.uploader.destroy(publicId);
    console.log('[Cloudinary] Deleted asset:', publicId);
  } catch (err) {
    console.warn('[Cloudinary] Failed to delete asset:', err.message);
  }
}

module.exports = {
  isCloudinaryConfigured,
  uploadToCloudinary,
  deleteFromCloudinary,
};
