import {
  createPrivateMessage,
  listPrivateMessages,
  serializePrivateMessage,
} from '../models/PrivateMessage.js';
import { findPracticeRequestById } from '../models/PracticeRequest.js';
import { findUserById } from '../models/User.js';
import { storeCommunityAudio } from '../services/communityStorageService.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { getCommunityIO } from '../socket/communitySocket.js';
import { createPrivateMessageNotification } from '../services/notificationService.js';

export async function getPrivateMessages(req, res) {
  const { requestId } = req.params;
  const userId = req.user.id;

  const request = await findPracticeRequestById(requestId);
  if (!request) {
    throw new AppError('Practice session not found', 404, 'NOT_FOUND');
  }
  if (request.status !== 'accepted') {
    throw new AppError('Practice session not active', 403, 'FORBIDDEN');
  }
  if (String(request.sender_id) !== userId && String(request.receiver_id) !== userId) {
    throw new AppError('Not authorized', 403, 'FORBIDDEN');
  }

  const rows = await listPrivateMessages(requestId, 100);
  const messages = rows.map(serializePrivateMessage);
  res.json({ success: true, messages: messages.reverse() });
}

export async function sendPrivateText(req, res) {
  const userId = req.user.id;
  const { requestId } = req.params;
  const { text } = req.body;

  const trimmed = String(text || '').trim();
  if (!trimmed || trimmed.length > 1000) {
    throw new AppError('Message text is required (max 1000 chars)', 400, 'VALIDATION');
  }

  const request = await findPracticeRequestById(requestId);
  if (!request || request.status !== 'accepted') {
    throw new AppError('Practice session not active', 403, 'FORBIDDEN');
  }
  if (String(request.sender_id) !== userId && String(request.receiver_id) !== userId) {
    throw new AppError('Not authorized', 403, 'FORBIDDEN');
  }

  const receiverId = String(request.sender_id) === userId ? request.receiver_id : request.sender_id;
  const sender = await findUserById(userId);

  const created = await createPrivateMessage({
    requestId,
    senderId: userId,
    receiverId,
    type: 'text',
    text: trimmed,
  });

  const message = serializePrivateMessage(created);
  message.senderName = sender?.username || 'Learner';
  message.senderAvatar = sender?.avatar || null;

  const io = getCommunityIO();
  if (io) {
    io.to(`user:${receiverId}`).emit('private:message:new', message);
    io.to(`user:${userId}`).emit('private:message:new', message);
  }

  // Create notification for receiver (don't fail if notification fails)
  try {
    await createPrivateMessageNotification(receiverId, userId, created.id);
  } catch (notificationError) {
    logger.error('private.text.notification_failed', { 
      requestId, 
      senderId: userId, 
      receiverId, 
      error: notificationError.message 
    });
  }

  logger.info('private.text_sent', { requestId, senderId: userId, receiverId });

  res.status(201).json({ success: true, message });
}

export async function sendPrivateVoice(req, res) {
  if (!req.file) {
    throw new AppError('Voice audio file is required', 400, 'VALIDATION');
  }

  const userId = req.user.id;
  const { requestId } = req.params;
  const durationValue = Number(req.body.duration);
  const duration = Number.isFinite(durationValue) ? Math.max(0, Math.round(durationValue)) : null;

  const request = await findPracticeRequestById(requestId);
  if (!request || request.status !== 'accepted') {
    throw new AppError('Practice session not active', 403, 'FORBIDDEN');
  }
  if (String(request.sender_id) !== userId && String(request.receiver_id) !== userId) {
    throw new AppError('Not authorized', 403, 'FORBIDDEN');
  }

  const receiverId = String(request.sender_id) === userId ? request.receiver_id : request.sender_id;
  const sender = await findUserById(userId);

  const stored = await storeCommunityAudio(req.file);

  const created = await createPrivateMessage({
    requestId,
    senderId: userId,
    receiverId,
    type: 'voice',
    audioUrl: stored.url,
    duration,
  });

  const message = serializePrivateMessage(created);
  message.senderName = sender?.username || 'Learner';
  message.senderAvatar = sender?.avatar || null;

  const io = getCommunityIO();
  if (io) {
    io.to(`user:${receiverId}`).emit('private:message:new', message);
    io.to(`user:${userId}`).emit('private:message:new', message);
  }

  // Create notification for receiver (don't fail if notification fails)
  try {
    await createPrivateMessageNotification(receiverId, userId, created.id);
  } catch (notificationError) {
    logger.error('private.voice.notification_failed', { 
      requestId, 
      senderId: userId, 
      receiverId, 
      error: notificationError.message 
    });
  }

  logger.info('private.voice_sent', { requestId, senderId: userId, receiverId });

  res.status(201).json({ success: true, message });
}
