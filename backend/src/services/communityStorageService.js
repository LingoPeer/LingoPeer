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

async function saveLocalAudio(file) {
  const uploadsDir = path.resolve(process.cwd(), 'uploads', 'community');
  await fs.mkdir(uploadsDir, { recursive: true });

  const ext =
    path.extname(file.originalname || '') ||
    (file.mimetype?.includes('webm')
      ? '.webm'
      : file.mimetype?.includes('ogg')
        ? '.ogg'
        : file.mimetype?.includes('mpeg')
          ? '.mp3'
          : '.wav');
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
  const outputPath = path.join(uploadsDir, filename);

  await fs.writeFile(outputPath, file.buffer);
  return {
    url: `/uploads/community/${filename}`,
    provider: 'local',
  };
}

function uploadToCloudinary(file) {
  return new Promise((resolve, reject) => {
    const resourceType = 'video';
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: 'lingopeer/community',
        resource_type: resourceType,
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

export async function storeCommunityAudio(file) {
  if (!file?.buffer) {
    throw new Error('Audio file buffer is required');
  }

  if (cloudinaryConfigured()) {
    try {
      configureCloudinary();
      return await uploadToCloudinary(file);
    } catch (err) {
      logger.error('Cloudinary upload failed, falling back to local storage', {
        message: err.message,
      });
    }
  }

  return saveLocalAudio(file);
}
