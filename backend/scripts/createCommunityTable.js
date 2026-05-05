import 'dotenv/config';
import pool from '../src/config/db.js';

const SQL = `
  CREATE TABLE IF NOT EXISTS community_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sender_name VARCHAR(255),
    sender_avatar TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('text', 'voice')),
    text TEXT,
    audio_url TEXT,
    duration INTEGER,
    room VARCHAR(100) DEFAULT 'global',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_community_messages_room_created_at
  ON community_messages(room, created_at DESC);
`;

async function createCommunityTable() {
  try {
    await pool.query(SQL);
    console.log('✅ community_messages table and index created (or already exist)');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to create community_messages table:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createCommunityTable();
