import pool from '../config/db.js';

export function serializeCommunityMessage(row) {
  return {
    id: row.id,
    sender: row.sender_id,
    senderName: row.sender_name,
    senderAvatar: row.sender_avatar || null,
    type: row.type,
    text: row.text || '',
    audioUrl: row.audio_url || '',
    duration: row.duration ?? null,
    room: row.room,
    createdAt: row.created_at,
  };
}

export async function createCommunityMessage({
  senderId,
  senderName,
  senderAvatar = null,
  type,
  text = '',
  audioUrl = '',
  duration = null,
  room = 'global',
}, client = null) {
  const query = client ? client.query.bind(client) : pool.query.bind(pool);
  const sql = `
    INSERT INTO community_messages (
      sender_id,
      sender_name,
      sender_avatar,
      type,
      text,
      audio_url,
      duration,
      room
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;
  const { rows } = await query(sql, [
    senderId,
    senderName,
    senderAvatar,
    type,
    text,
    audioUrl,
    duration,
    room,
  ]);
  return rows[0];
}

export async function listCommunityMessages(room = 'global', limit = 50) {
  const sql = `
    SELECT *
    FROM community_messages
    WHERE room = $1
    ORDER BY created_at DESC
    LIMIT $2;
  `;
  const { rows } = await pool.query(sql, [room, limit]);
  return rows;
}
