import {
  createPracticeRequest,
  listPracticeRequestsForUser,
  listPendingPracticeRequestsForReceiver,
  findPracticeRequestById,
  updatePracticeRequestStatus,
  findExistingRequestBetweenUsers,
} from '../models/PracticeRequest.js';
import { findUserById } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { getCommunityIO } from '../socket/communitySocket.js';
import { 
  createPracticeRequestNotification,
  createPracticeAcceptedNotification,
} from '../services/notificationService.js';

function serializeRequest(row) {
  return {
    id: row.id,
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    status: row.status,
    message: row.message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    senderName: row.sender_name || 'Learner',
    senderAvatar: row.sender_avatar || null,
    receiverName: row.receiver_name || 'Learner',
    receiverAvatar: row.receiver_avatar || null,
  };
}

export async function sendPracticeRequest(req, res) {
  const senderId = req.user.id;
  const { receiverId, message = '' } = req.body;

  if (!receiverId || receiverId === senderId) {
    throw new AppError('Invalid receiver', 400, 'VALIDATION');
  }

  const receiver = await findUserById(receiverId);
  if (!receiver) {
    throw new AppError('Receiver not found', 404, 'NOT_FOUND');
  }

  const existing = await findExistingRequestBetweenUsers(senderId, receiverId);
  if (existing && existing.status === 'pending') {
    throw new AppError('Practice request already pending', 409, 'DUPLICATE');
  }
  if (existing && existing.status === 'accepted') {
    throw new AppError('You already have an active practice session', 409, 'DUPLICATE');
  }

  const created = await createPracticeRequest({
    senderId,
    receiverId,
    message: String(message || '').trim().slice(0, 500),
  });

  const full = await findPracticeRequestById(created.id);
  const payload = serializeRequest(full);

  const io = getCommunityIO();
  if (io) {
    io.to(`user:${receiverId}`).emit('practice:request:new', payload);
  }

  // Create notification for receiver (don't fail if notification fails)
  try {
    await createPracticeRequestNotification(receiverId, senderId, created.id);
  } catch (notificationError) {
    logger.error('practice.request.notification_failed', { 
      requestId: created.id, 
      senderId, 
      receiverId, 
      error: notificationError.message 
    });
  }

  logger.info('practice.request.sent', { requestId: created.id, senderId, receiverId });

  res.status(201).json({ success: true, request: payload });
}

export async function listMyRequests(req, res) {
  const rows = await listPracticeRequestsForUser(req.user.id);
  res.json({ success: true, requests: rows.map(serializeRequest) });
}

export async function listIncomingPending(req, res) {
  const rows = await listPendingPracticeRequestsForReceiver(req.user.id);
  res.json({ success: true, requests: rows.map(serializeRequest) });
}

export async function respondToRequest(req, res) {
  const userId = req.user.id;
  const { id } = req.params;
  const { status } = req.body;

  if (!['accepted', 'declined'].includes(status)) {
    throw new AppError('Status must be accepted or declined', 400, 'VALIDATION');
  }

  const request = await findPracticeRequestById(id);
  if (!request) {
    throw new AppError('Request not found', 404, 'NOT_FOUND');
  }
  if (String(request.receiver_id) !== userId) {
    throw new AppError('Not authorized', 403, 'FORBIDDEN');
  }
  if (request.status !== 'pending') {
    throw new AppError('Request already responded', 409, 'CONFLICT');
  }

  const updated = await updatePracticeRequestStatus(id, status);
  const full = await findPracticeRequestById(id);
  const payload = serializeRequest(full);

  const io = getCommunityIO();
  if (io) {
    io.to(`user:${request.sender_id}`).emit('practice:request:updated', payload);
    io.to(`user:${request.receiver_id}`).emit('practice:request:updated', payload);
  }

  // Create notification for sender if request was accepted (don't fail if notification fails)
  if (status === 'accepted') {
    try {
      await createPracticeAcceptedNotification(request.sender_id, request.receiver_id, id);
    } catch (notificationError) {
      logger.error('practice.accepted.notification_failed', { 
        requestId: id, 
        senderId: request.sender_id, 
        receiverId: request.receiver_id, 
        error: notificationError.message 
      });
    }
  }

  logger.info('practice.request.responded', { requestId: id, status, responder: userId });

  res.json({ success: true, request: payload });
}

export async function cancelRequest(req, res) {
  const userId = req.user.id;
  const { id } = req.params;

  const request = await findPracticeRequestById(id);
  if (!request) {
    throw new AppError('Request not found', 404, 'NOT_FOUND');
  }
  if (String(request.sender_id) !== userId) {
    throw new AppError('Not authorized', 403, 'FORBIDDEN');
  }
  if (request.status !== 'pending') {
    throw new AppError('Request already responded', 409, 'CONFLICT');
  }

  const updated = await updatePracticeRequestStatus(id, 'declined');
  const payload = serializeRequest(updated);

  const io = getCommunityIO();
  if (io) {
    io.to(`user:${request.receiver_id}`).emit('practice:request:updated', payload);
  }

  res.json({ success: true, request: payload });
}
