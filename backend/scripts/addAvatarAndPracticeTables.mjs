import pg from 'pg';
import pool from '../src/config/db.js';

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Add avatar column to users if missing
    const usersCols = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'avatar'
    `);
    if (usersCols.rows.length === 0) {
      await client.query(`ALTER TABLE users ADD COLUMN avatar VARCHAR(800)`);
      console.log('Added avatar column to users');
    } else {
      console.log('avatar column already exists on users');
    }

    // Create practice_requests table
    await client.query(`
      CREATE TABLE IF NOT EXISTS practice_requests (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        receiver_id  UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        status       VARCHAR(16) NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'accepted', 'declined')),
        message      TEXT NOT NULL DEFAULT '',
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('practice_requests table ready');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_practice_requests_receiver_status
      ON practice_requests (receiver_id, status, created_at DESC);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_practice_requests_sender_status
      ON practice_requests (sender_id, status, created_at DESC);
    `);

    // Create private_messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS private_messages (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        request_id   UUID NOT NULL REFERENCES practice_requests (id) ON DELETE CASCADE,
        sender_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        receiver_id  UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        type         VARCHAR(16) NOT NULL DEFAULT 'text'
                     CHECK (type IN ('text', 'voice')),
        text         TEXT NOT NULL DEFAULT '',
        audio_url    VARCHAR(800),
        duration     INT CHECK (duration >= 0),
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('private_messages table ready');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_private_messages_request_created
      ON private_messages (request_id, created_at DESC);
    `);

    await client.query('COMMIT');
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
