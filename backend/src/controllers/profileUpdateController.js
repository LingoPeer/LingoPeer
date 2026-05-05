import { findUserById, updateUserAvatar } from '../models/User.js';
import { storeAvatar } from '../services/avatarStorageService.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

export async function uploadAvatar(req, res) {
  if (!req.file) {
    throw new AppError('Avatar image file is required', 400, 'VALIDATION');
  }

  const stored = await storeAvatar(req.file);
  const updated = await updateUserAvatar(req.user.id, stored.url);

  logger.info('avatar.uploaded', { userId: req.user.id, provider: stored.provider });

  res.json({
    success: true,
    avatar: updated.avatar,
    user: {
      id: updated.id,
      username: updated.username,
      email: updated.email,
      avatar: updated.avatar || null,
    },
  });
}

export async function getPublicUser(req, res) {
  const userId = req.params.id;
  const user = await findUserById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }
  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      avatar: user.avatar || null,
    },
  });
}
