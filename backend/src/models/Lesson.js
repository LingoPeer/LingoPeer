import pool from '../config/db.js';

function q(client) {
  return client ? client.query.bind(client) : pool.query.bind(pool);
}

export async function insertLesson({
  userId,
  roadmapId,
  weekIndex,
  sortIndex,
  title,
  content,
}, client = null) {
  const sql = `
    INSERT INTO lessons (user_id, roadmap_id, week_index, sort_index, title, content)
    VALUES ($1, $2, $3, $4, $5, $6::jsonb)
    RETURNING *;
  `;
  const { rows } = await q(client)(sql, [
    userId,
    roadmapId,
    weekIndex,
    sortIndex,
    title,
    JSON.stringify(content),
  ]);
  return rows[0];
}

export async function listLessonsForUser(userId, { limit = 50, offset = 0 } = {}) {
  const sql = `
    SELECT id, user_id, roadmap_id, week_index, sort_index, title, content, created_at
    FROM lessons
    WHERE user_id = $1
    ORDER BY week_index ASC, sort_index ASC, created_at ASC
    LIMIT $2 OFFSET $3;
  `;
  const { rows } = await pool.query(sql, [userId, limit, offset]);
  return rows;
}

export async function getLessonForUser(lessonId, userId) {
  const sql = `
    SELECT * FROM lessons WHERE id = $1 AND user_id = $2 LIMIT 1;
  `;
  const { rows } = await pool.query(sql, [lessonId, userId]);
  return rows[0];
}

export async function countLessonsForUserWeek(userId, weekIndex) {
  const sql = `
    SELECT COUNT(*)::int AS c FROM lessons
    WHERE user_id = $1 AND week_index = $2;
  `;
  const { rows } = await pool.query(sql, [userId, weekIndex]);
  return rows[0]?.c ?? 0;
}

export async function listLessonTitlesForUser(userId, limit = 30) {
  const sql = `
    SELECT title FROM lessons WHERE user_id = $1
    ORDER BY created_at DESC LIMIT $2;
  `;
  const { rows } = await pool.query(sql, [userId, limit]);
  return rows.map((r) => r.title);
}
