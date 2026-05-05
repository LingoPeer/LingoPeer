import { createNotification } from '../models/Notification.js';
import { findUserById } from '../models/User.js';
import { getCommunityIO } from '../socket/communitySocket.js';

export async function createPracticeRequestNotification(receiverId, senderId, requestId) {
  console.log('🔔 DEBUG: Creating practice request notification', { receiverId, senderId, requestId });
  const sender = await findUserById(senderId);
  if (!sender) {
    console.log('❌ DEBUG: Sender not found', { senderId });
    return null;
  }

  const notification = await createNotification({
    userId: receiverId,
    type: 'practice_request',
    title: 'New Practice Request',
    message: `${sender.username} wants to practice with you`,
    relatedId: requestId,
    senderId,
  });
  console.log('✅ DEBUG: Practice request notification created', { notificationId: notification.id });

  // Emit real-time notification to receiver
  const io = getCommunityIO();
  if (io) {
    io.to(`user:${receiverId}`).emit('notification:new', notification);
  }

  return notification;
}

export async function createPracticeAcceptedNotification(senderId, receiverId, requestId) {
  const receiver = await findUserById(receiverId);
  if (!receiver) return null;

  const notification = await createNotification({
    userId: senderId,
    type: 'practice_accepted',
    title: 'Practice Request Accepted',
    message: `${receiver.username} accepted your practice request`,
    relatedId: requestId,
    senderId: receiverId,
  });

  // Emit real-time notification to sender
  const io = getCommunityIO();
  if (io) {
    io.to(`user:${senderId}`).emit('notification:new', notification);
  }

  return notification;
}

export async function createCommunityMessageNotification(userId, senderId, messageId, room) {
  // Only create notification if user is not the sender
  if (userId === senderId) return null;

  const sender = await findUserById(senderId);
  if (!sender) return null;

  const notification = await createNotification({
    userId,
    type: 'community_message',
    title: 'New Community Message',
    message: `${sender.username} sent a message in ${room}`,
    relatedId: messageId,
    senderId,
  });

  // Emit real-time notification to receiver
  const io = getCommunityIO();
  if (io) {
    io.to(`user:${userId}`).emit('notification:new', notification);
  }

  return notification;
}

export async function createPrivateMessageNotification(receiverId, senderId, messageId) {
  console.log('🔔 DEBUG: Creating private message notification', { receiverId, senderId, messageId });
  const sender = await findUserById(senderId);
  if (!sender) {
    console.log('❌ DEBUG: Sender not found', { senderId });
    return null;
  }

  const notification = await createNotification({
    userId: receiverId,
    type: 'private_message',
    title: 'New Private Message',
    message: `${sender.username} sent you a private message`,
    relatedId: messageId,
    senderId,
  });
  console.log('✅ DEBUG: Private message notification created', { notificationId: notification.id });

  // Emit real-time notification to receiver
  const io = getCommunityIO();
  if (io) {
    io.to(`user:${receiverId}`).emit('notification:new', notification);
  }

  return notification;
}
