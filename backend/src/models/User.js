import pool from '../config/db.js';

function q(client) {
  return client ? client.query.bind(client) : pool.query.bind(pool);
}

export async function createUser({ username, email, password }, client = null) {
  const safeUsername = String(username ?? '').trim();
  const safeEmail = String(email ?? '').trim().toLowerCase();
  const safePassword = String(password ?? '').trim();

  const query = `
    INSERT INTO users (username, email, password)
    VALUES ($1, $2, $3)
    RETURNING id, username, email, created_at;
  `;
  const { rows } = await q(client)(query, [safeUsername, safeEmail, safePassword]);
  return rows[0];
}

export async function findUserByIdentifier(identifier) {
  const id = String(identifier ?? '').trim().toLowerCase();
  const query = `
    SELECT *
    FROM users
    WHERE LOWER(email) = $1 OR LOWER(username) = $1
    LIMIT 1;
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0];
}

export async function findUserById(id) {
  const query = `
    SELECT id, username, email, avatar, created_at
    FROM users
    WHERE id = $1;
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0];
}

export async function updateUserAvatar(userId, avatarUrl) {
  const sql = `
    UPDATE users
    SET avatar = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING id, username, email, avatar, created_at;
  `;
  const { rows } = await pool.query(sql, [avatarUrl, userId]);
  return rows[0];
}

export async function findUserByEmail(email) {
  const e = String(email ?? '').trim().toLowerCase();
  const query = `SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1`;
  const { rows } = await pool.query(query, [e]);
  return rows[0];
}
