import fs from 'fs/promises';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../utils/logger.js';

function cloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
  );
}

function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

async function saveLocalAvatar(file) {
  const uploadsDir = path.resolve(process.cwd(), 'uploads', 'avatars');
  await fs.mkdir(uploadsDir, { recursive: true });

  const ext = path.extname(file.originalname || '') || '.png';
  const filename = `avatar-${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
  const outputPath = path.join(uploadsDir, filename);

  await fs.writeFile(outputPath, file.buffer);
  return {
    url: `/uploads/avatars/${filename}`,
    provider: 'local',
  };
}

function uploadAvatarToCloudinary(file) {
  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: 'lingopeer/avatars',
        resource_type: 'image',
      },
      (err, result) => {
        if (err) return reject(err);
        return resolve({
          url: result.secure_url,
          provider: 'cloudinary',
        });
      },
    );
    upload.end(file.buffer);
  });
}

export async function storeAvatar(file) {
  if (!file?.buffer) {
    throw new Error('Avatar file buffer is required');
  }

  if (cloudinaryConfigured()) {
    try {
      configureCloudinary();
      return await uploadAvatarToCloudinary(file);
    } catch (err) {
      logger.error('Cloudinary avatar upload failed, falling back to local storage', {
        message: err.message,
      });
    }
  }

  return saveLocalAvatar(file);
}
