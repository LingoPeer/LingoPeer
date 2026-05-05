import pool from '../config/db.js';

export async function createNote({ userId, title, body }) {
  const sql = `
    INSERT INTO notes (user_id, title, body)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const { rows } = await pool.query(sql, [
    userId,
    title != null ? String(title).slice(0, 500) : null,
    String(body ?? ''),
  ]);
  return rows[0];
}

export async function listNotesForUser(userId) {
  const sql = `
    SELECT id, user_id, title, body, created_at, updated_at
    FROM notes
    WHERE user_id = $1
    ORDER BY updated_at DESC;
  `;
  const { rows } = await pool.query(sql, [userId]);
  return rows;
}

export async function getNoteForUser(noteId, userId) {
  const sql = `SELECT * FROM notes WHERE id = $1 AND user_id = $2 LIMIT 1`;
  const { rows } = await pool.query(sql, [noteId, userId]);
  return rows[0];
}

export async function updateNoteForUser(noteId, userId, patch) {
  const fields = [];
  const values = [noteId, userId];
  let i = 3;
  if (patch.title !== undefined) {
    fields.push(`title = $${i}`);
    values.push(patch.title == null ? null : String(patch.title).slice(0, 500));
    i += 1;
  }
  if (patch.body !== undefined) {
    fields.push(`body = $${i}`);
    values.push(String(patch.body ?? ''));
    i += 1;
  }
  if (!fields.length) {
    return getNoteForUser(noteId, userId);
  }
  fields.push('updated_at = NOW()');
  const sql = `
    UPDATE notes SET ${fields.join(', ')}
    WHERE id = $1 AND user_id = $2
    RETURNING *;
  `;
  const { rows } = await pool.query(sql, values);
  return rows[0];
}

export async function deleteNoteForUser(noteId, userId) {
  const sql = `DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING id`;
  const { rows } = await pool.query(sql, [noteId, userId]);
  return rows[0];
}

export async function countNotesForUser(userId) {
  const sql = `SELECT COUNT(*)::int AS c FROM notes WHERE user_id = $1`;
  const { rows } = await pool.query(sql, [userId]);
  return rows[0]?.c ?? 0;
}
