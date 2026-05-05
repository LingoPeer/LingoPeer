import pool from '../config/db.js';

function q(client) {
  return client ? client.query.bind(client) : pool.query.bind(pool);
}

export async function insertUserLevel(
  { userId, examId, level, weakAreas, aiSummary },
  client = null,
) {
  const sql = `
    INSERT INTO user_levels (user_id, exam_id, level, weak_areas, ai_summary)
    VALUES ($1, $2, $3, $4::jsonb, $5)
    RETURNING *;
  `;
  const { rows } = await q(client)(sql, [
    userId,
    examId,
    level,
    JSON.stringify(Array.isArray(weakAreas) ? weakAreas : []),
    aiSummary || null,
  ]);
  return rows[0];
}

export async function getLatestUserLevel(userId) {
  const sql = `
    SELECT * FROM user_levels
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 1;
  `;
  const { rows } = await pool.query(sql, [userId]);
  return rows[0];
}
