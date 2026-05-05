import 'dotenv/config';
import pool from './src/config/db.js';

async function fixNotificationsRelatedId() {
  try {
    console.log('=== Fixing notifications related_id column type ===');
    
    // Drop the table if it exists and recreate with correct types
    await pool.query('DROP TABLE IF EXISTS notifications CASCADE');
    console.log('Dropped old notifications table');
    
    // Recreate with UUID for related_id
    await pool.query(`
      CREATE TABLE notifications (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        related_id UUID, -- Changed from INTEGER to UUID
        sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('Created notifications table with UUID related_id');
    
    // Recreate indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read)
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC)
    `);
    
    console.log('✅ Notifications table fixed successfully');
    
  } catch (error) {
    console.error('❌ Error fixing notifications table:', error);
  } finally {
    await pool.end();
  }
}

fixNotificationsRelatedId();
