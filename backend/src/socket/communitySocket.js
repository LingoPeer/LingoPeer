import jwt from 'jsonwebtoken';
import { findUserById } from '../models/User.js';
import {
  createCommunityMessage,
  serializeCommunityMessage,
} from '../models/CommunityMessage.js';
import { logger } from '../utils/logger.js';
import { 
  createPracticeRequestNotification,
  createPracticeAcceptedNotification,
  createCommunityMessageNotification,
  createPrivateMessageNotification,
} from '../services/notificationService.js';

export const COMMUNITY_ROOM = 'global';

let ioRef = null;

function extractToken(socket) {
  const authToken = socket.handshake.auth?.token;
  if (authToken) return String(authToken);

  const header = socket.handshake.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return null;
}

async function buildSenderPayload(userId) {
  const user = await findUserById(userId);
  return {
    sender: String(userId),
    senderName: user?.username || 'Learner',
    senderAvatar: user?.avatar || null,
  };
}

export function getCommunityIO() {
  return ioRef;
}

export async function createAndBroadcastCommunityTextMessage({
  userId,
  text,
  room = COMMUNITY_ROOM,
}) {
  const trimmed = String(text || '').trim();
  if (!trimmed) {
    throw new Error('Message text is required');
  }
  if (trimmed.length > 1000) {
    throw new Error('Message is too long');
  }

  const sender = await buildSenderPayload(userId);
  const created = await createCommunityMessage({
    senderId: sender.sender,
    senderName: sender.senderName,
    senderAvatar: sender.senderAvatar,
    type: 'text',
    text: trimmed,
    room,
  });
  const payload = serializeCommunityMessage(created);

  if (ioRef) {
    ioRef.to(room).emit('community:message:new', payload);
  }

  return payload;
}

export function initCommunitySocket(io) {
  ioRef = io;

  io.use(async (socket, next) => {
    try {
      const token = extractToken(socket);
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        return next(new Error('Server misconfiguration'));
      }

      const decoded = jwt.verify(token, secret);
      const id = decoded.userId ?? decoded.sub;
      if (!id) {
        return next(new Error('Invalid token payload'));
      }

      socket.user = { id: String(id), email: decoded.email || '' };
      return next();
    } catch (err) {
      return next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    // Automatically join user to their personal room for notifications
    const userRoom = `user:${socket.user.id}`;
    socket.join(userRoom);
    logger.info('socket.user_joined_room', { userId: socket.user.id, room: userRoom });

    socket.on('community:join', async ({ room = COMMUNITY_ROOM } = {}) => {
      try {
        socket.join(room);
        socket.emit('community:joined', { room });
      } catch (err) {
        logger.error('community.join_failed', { message: err.message });
        socket.emit('community:error', { message: 'Community service unavailable' });
      }
    });

    socket.on('community:text:send', async (payload = {}, ack) => {
      try {
        const room = payload.room || COMMUNITY_ROOM;
        const message = await createAndBroadcastCommunityTextMessage({
          userId: socket.user.id,
          text: payload.text,
          room,
        });
        if (typeof ack === 'function') ack({ ok: true, message });
      } catch (err) {
        logger.error('community.text_send_failed', {
          userId: socket.user?.id,
          message: err.message,
        });
        if (typeof ack === 'function') ack({ ok: false, error: err.message });
        socket.emit('community:error', { message: err.message });
      }
    });

    // Notification events for real-time updates
    socket.on('notification:mark_read', async (notificationId) => {
      try {
        // This would be handled by API endpoint
        logger.info('notification.mark_read', { notificationId, userId: socket.user.id });
      } catch (err) {
        logger.error('notification.mark_read_failed', { error: err.message });
      }
    });
  });
}

export { serializeCommunityMessage };
