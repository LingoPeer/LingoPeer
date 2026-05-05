import pool from '../config/db.js';

function q(client) {
  return client ? client.query.bind(client) : pool.query.bind(pool);
}

export async function createExam({ userId, title, questions }, client = null) {
  const sql = `
    INSERT INTO exams (user_id, title, questions, status)
    VALUES ($1, $2, $3::jsonb, 'pending')
    RETURNING id, user_id, title, questions, status, created_at;
  `;
  const { rows } = await q(client)(sql, [
    userId,
    title || 'AI Placement Exam',
    JSON.stringify(questions),
  ]);
  return rows[0];
}

export async function findExamByIdForUser(examId, userId) {
  const sql = `
    SELECT * FROM exams WHERE id = $1 AND user_id = $2 LIMIT 1;
  `;
  const { rows } = await pool.query(sql, [examId, userId]);
  return rows[0];
}

export async function findPendingExamForUser(userId) {
  const sql = `
    SELECT * FROM exams
    WHERE user_id = $1 AND status = 'pending'
    ORDER BY created_at DESC
    LIMIT 1;
  `;
  const { rows } = await pool.query(sql, [userId]);
  return rows[0];
}

export async function markExamCompleted(examId, client = null) {
  const sql = `
    UPDATE exams
    SET status = 'completed', completed_at = NOW()
    WHERE id = $1
    RETURNING *;
  `;
  const { rows } = await q(client)(sql, [examId]);
  return rows[0];
}
