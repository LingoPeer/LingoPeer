import pool from '../config/db.js';

function q(client) {
  return client ? client.query.bind(client) : pool.query.bind(pool);
}

export async function insertExamAnswer({ examId, userId, answers, rawScore }, client = null) {
  const sql = `
    INSERT INTO exam_answers (exam_id, user_id, answers, raw_score)
    VALUES ($1, $2, $3::jsonb, $4)
    ON CONFLICT (exam_id) DO UPDATE SET
      answers = EXCLUDED.answers,
      raw_score = EXCLUDED.raw_score
    RETURNING *;
  `;
  const { rows } = await q(client)(sql, [
    examId,
    userId,
    JSON.stringify(answers),
    rawScore,
  ]);
  return rows[0];
}
