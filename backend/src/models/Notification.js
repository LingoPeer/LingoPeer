import pool from '../config/db.js';

export async function createNotification({ userId, type, title, message, relatedId, senderId }) {
  const result = await pool.query(
    `INSERT INTO notifications (user_id, type, title, message, related_id, sender_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, type, title, message, relatedId, senderId]
  );
  return result.rows[0];
}

export async function getUnreadCount(userId) {
  const result = await pool.query(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
    [userId]
  );
  return parseInt(result.rows[0].count);
}

export async function getUserNotifications(userId, { limit = 20, offset = 0 } = {}) {
  const result = await pool.query(
    `SELECT n.*, u.username as sender_name, u.avatar as sender_avatar
     FROM notifications n
     LEFT JOIN users u ON n.sender_id = u.id
     WHERE n.user_id = $1
     ORDER BY n.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return result.rows;
}

export async function markAsRead(notificationId, userId) {
  const result = await pool.query(
    `UPDATE notifications 
     SET is_read = TRUE 
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [notificationId, userId]
  );
  return result.rows[0];
}

export async function markAllAsRead(userId) {
  const result = await pool.query(
    `UPDATE notifications 
     SET is_read = TRUE 
     WHERE user_id = $1 AND is_read = FALSE
     RETURNING *`,
    [userId]
  );
  return result.rows;
}

export async function deleteNotification(notificationId, userId) {
  const result = await pool.query(
    'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *',
    [notificationId, userId]
  );
  return result.rows[0];
}
