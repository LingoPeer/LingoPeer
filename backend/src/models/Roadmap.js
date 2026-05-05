import pool from '../config/db.js';

function q(client) {
  return client ? client.query.bind(client) : pool.query.bind(pool);
}

export async function insertRoadmap({ userId, level, content }, client = null) {
  const sql = `
    INSERT INTO roadmaps (user_id, level, content)
    VALUES ($1, $2, $3::jsonb)
    RETURNING *;
  `;
  const { rows } = await q(client)(sql, [userId, level, JSON.stringify(content)]);
  return rows[0];
}

export async function getLatestRoadmap(userId) {
  const sql = `
    SELECT * FROM roadmaps
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 1;
  `;
  const { rows } = await pool.query(sql, [userId]);
  return rows[0];
}
