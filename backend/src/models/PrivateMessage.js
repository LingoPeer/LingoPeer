import pool from '../config/db.js';

export function serializePrivateMessage(row) {
  return {
    id: row.id,
    requestId: row.request_id,
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    type: row.type,
    text: row.text || '',
    audioUrl: row.audio_url || '',
    duration: row.duration ?? null,
    createdAt: row.created_at,
  };
}

export async function createPrivateMessage({
  requestId,
  senderId,
  receiverId,
  type,
  text = '',
  audioUrl = '',
  duration = null,
}) {
  const sql = `
    INSERT INTO private_messages (request_id, sender_id, receiver_id, type, text, audio_url, duration)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;
  const { rows } = await pool.query(sql, [
    requestId,
    senderId,
    receiverId,
    type,
    text,
    audioUrl,
    duration,
  ]);
  return rows[0];
}

export async function listPrivateMessages(requestId, limit = 100) {
  const sql = `
    SELECT pm.*,
      sender.username AS sender_name, sender.avatar AS sender_avatar
    FROM private_messages pm
    JOIN users sender ON sender.id = pm.sender_id
    WHERE pm.request_id = $1
    ORDER BY pm.created_at DESC
    LIMIT $2;
  `;
  const { rows } = await pool.query(sql, [requestId, limit]);
  return rows;
}
