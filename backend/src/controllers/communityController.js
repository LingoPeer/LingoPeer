import { findUserById } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { storeCommunityAudio } from '../services/communityStorageService.js';
import {
  createCommunityMessage,
  listCommunityMessages,
} from '../models/CommunityMessage.js';
import {
  COMMUNITY_ROOM,
  getCommunityIO,
  serializeCommunityMessage,
} from '../socket/communitySocket.js';

export async function getCommunityMessages(req, res) {
  const room = String(req.query.room || COMMUNITY_ROOM);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(req.query.limit ?? '50', 10) || 50),
  );

  const rows = await listCommunityMessages(room, limit);
  const messages = rows.map(serializeCommunityMessage);

  res.json({
    success: true,
    room,
    messages: messages.reverse(),
  });
}

export async function uploadCommunityVoice(req, res) {
  if (!req.file) {
    throw new AppError('Voice audio file is required', 400, 'VALIDATION');
  }

  const room = String(req.body.room || COMMUNITY_ROOM);
  const durationValue = Number(req.body.duration);
  const duration = Number.isFinite(durationValue)
    ? Math.max(0, Math.round(durationValue))
    : null;

  const senderUser = await findUserById(req.user.id);
  if (!senderUser) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  const stored = await storeCommunityAudio(req.file);

  const created = await createCommunityMessage({
    senderId: String(req.user.id),
    senderName: senderUser.username || 'Learner',
    senderAvatar: null,
    type: 'voice',
    text: '',
    audioUrl: stored.url,
    duration,
    room,
  });

  const message = serializeCommunityMessage(created);
  const io = getCommunityIO();
  if (io) {
    io.to(room).emit('community:message:new', message);
  }

  logger.info('community.voice_uploaded', {
    userId: req.user.id,
    room,
    provider: stored.provider,
  });

  res.status(201).json({
    success: true,
    message,
  });
}
