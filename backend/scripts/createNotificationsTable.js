import pool from '../src/config/db.js';

console.log('Starting notifications table creation...');

async function createNotificationsTable() {
  console.log('Connecting to database...');
  const client = await pool.connect();
  console.log('Connected to database');
  try {
    console.log('Starting transaction...');
    await client.query('BEGIN');
    console.log('Transaction started');

    // Create notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL, -- 'practice_request', 'practice_accepted', 'community_message', 'private_message'
        title VARCHAR(255) NOT NULL,
        message TEXT,
        related_id INTEGER, -- ID of related entity (practice_request_id, message_id, etc.)
        sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
    `);

    // Create updated_at trigger
    await client.query(`
      CREATE OR REPLACE FUNCTION update_notifications_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language plpgsql;
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_notifications_updated_at_trigger ON notifications;
      CREATE TRIGGER update_notifications_updated_at_trigger
        BEFORE UPDATE ON notifications
        FOR EACH ROW
        EXECUTE FUNCTION update_notifications_updated_at();
    `);

    await client.query('COMMIT');
    console.log('✅ Notifications table created successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating notifications table:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  createNotificationsTable()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { createNotificationsTable };
