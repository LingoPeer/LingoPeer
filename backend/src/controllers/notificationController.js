import {
  getUnreadCount,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../models/Notification.js';
import { AppError } from '../utils/AppError.js';

export async function getNotifications(req, res) {
  const userId = req.user.id;
  const { limit = 20, offset = 0 } = req.query;
  
  const notifications = await getUserNotifications(userId, {
    limit: parseInt(limit),
    offset: parseInt(offset),
  });
  
  res.json({
    success: true,
    notifications,
  });
}

export async function getUnreadNotificationsCount(req, res) {
  const userId = req.user.id;
  const count = await getUnreadCount(userId);
  
  res.json({
    success: true,
    unreadCount: count,
  });
}

export async function markNotificationAsRead(req, res) {
  const userId = req.user.id;
  const notificationId = parseInt(req.params.id);
  
  if (!notificationId || isNaN(notificationId)) {
    throw new AppError('Invalid notification ID', 400, 'VALIDATION');
  }
  
  const notification = await markAsRead(notificationId, userId);
  if (!notification) {
    throw new AppError('Notification not found', 404, 'NOT_FOUND');
  }
  
  res.json({
    success: true,
    notification,
  });
}

export async function markAllNotificationsAsRead(req, res) {
  const userId = req.user.id;
  const notifications = await markAllAsRead(userId);
  
  res.json({
    success: true,
    notifications,
    markedCount: notifications.length,
  });
}

export async function deleteNotificationById(req, res) {
  const userId = req.user.id;
  const notificationId = parseInt(req.params.id);
  
  if (!notificationId || isNaN(notificationId)) {
    throw new AppError('Invalid notification ID', 400, 'VALIDATION');
  }
  
  const notification = await deleteNotification(notificationId, userId);
  if (!notification) {
    throw new AppError('Notification not found', 404, 'NOT_FOUND');
  }
  
  res.json({
    success: true,
    notification,
  });
}
