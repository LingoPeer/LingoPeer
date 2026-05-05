import pool from '../config/db.js';

export async function createPracticeRequest({ senderId, receiverId, message = '' }) {
  const sql = `
    INSERT INTO practice_requests (sender_id, receiver_id, message)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const { rows } = await pool.query(sql, [senderId, receiverId, message]);
  return rows[0];
}

export async function listPracticeRequestsForUser(userId) {
  const sql = `
    SELECT pr.*,
      sender.username AS sender_name, sender.avatar AS sender_avatar,
      receiver.username AS receiver_name, receiver.avatar AS receiver_avatar
    FROM practice_requests pr
    JOIN users sender ON sender.id = pr.sender_id
    JOIN users receiver ON receiver.id = pr.receiver_id
    WHERE pr.sender_id = $1 OR pr.receiver_id = $1
    ORDER BY pr.created_at DESC;
  `;
  const { rows } = await pool.query(sql, [userId]);
  return rows;
}

export async function listPendingPracticeRequestsForReceiver(receiverId) {
  const sql = `
    SELECT pr.*,
      sender.username AS sender_name, sender.avatar AS sender_avatar
    FROM practice_requests pr
    JOIN users sender ON sender.id = pr.sender_id
    WHERE pr.receiver_id = $1 AND pr.status = 'pending'
    ORDER BY pr.created_at DESC;
  `;
  const { rows } = await pool.query(sql, [receiverId]);
  return rows;
}

export async function findPracticeRequestById(id) {
  const sql = `
    SELECT pr.*,
      sender.username AS sender_name, sender.avatar AS sender_avatar,
      receiver.username AS receiver_name, receiver.avatar AS receiver_avatar
    FROM practice_requests pr
    JOIN users sender ON sender.id = pr.sender_id
    JOIN users receiver ON receiver.id = pr.receiver_id
    WHERE pr.id = $1
    LIMIT 1;
  `;
  const { rows } = await pool.query(sql, [id]);
  return rows[0] || null;
}

export async function updatePracticeRequestStatus(id, status) {
  const sql = `
    UPDATE practice_requests
    SET status = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING *;
  `;
  const { rows } = await pool.query(sql, [status, id]);
  return rows[0] || null;
}

export async function findExistingRequestBetweenUsers(userA, userB) {
  const sql = `
    SELECT * FROM practice_requests
    WHERE (sender_id = $1 AND receiver_id = $2)
       OR (sender_id = $2 AND receiver_id = $1)
    ORDER BY created_at DESC
    LIMIT 1;
  `;
  const { rows } = await pool.query(sql, [userA, userB]);
  return rows[0] || null;
}
