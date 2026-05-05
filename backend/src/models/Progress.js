import pool from '../config/db.js';

export async function insertProgress({
  userId,
  lessonId,
  score,
  weakAreas,
  metadata,
}) {
  const sql = `
    INSERT INTO progress (user_id, lesson_id, score, weak_areas, metadata)
    VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)
    RETURNING *;
  `;
  const { rows } = await pool.query(sql, [
    userId,
    lessonId || null,
    score != null ? Number(score) : null,
    JSON.stringify(Array.isArray(weakAreas) ? weakAreas : []),
    JSON.stringify(metadata && typeof metadata === 'object' ? metadata : {}),
  ]);
  return rows[0];
}

export async function listProgressForUser(userId, { limit = 100 } = {}) {
  const sql = `
    SELECT p.*, l.title AS lesson_title
    FROM progress p
    LEFT JOIN lessons l ON l.id = p.lesson_id
    WHERE p.user_id = $1
    ORDER BY p.created_at DESC
    LIMIT $2;
  `;
  const { rows } = await pool.query(sql, [userId, limit]);
  return rows;
}

export async function aggregateProgressStats(userId) {
  const sql = `
    SELECT
      COUNT(*) FILTER (WHERE lesson_id IS NOT NULL)::int AS lessons_completed,
      AVG(score) FILTER (WHERE score IS NOT NULL) AS avg_score
    FROM progress
    WHERE user_id = $1;
  `;
  const { rows } = await pool.query(sql, [userId]);
  return rows[0];
}
