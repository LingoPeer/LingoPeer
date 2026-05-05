import 'dotenv/config';
import pool from './src/config/db.js';

async function checkNotifications() {
  try {
    console.log('=== Checking Notifications Table ===');
    
    // Check if table exists and get recent notifications
    const result = await pool.query(`
      SELECT n.*, u.username as sender_name 
      FROM notifications n 
      LEFT JOIN users u ON n.sender_id = u.id 
      ORDER BY n.created_at DESC 
      LIMIT 10
    `);
    
    console.log(`Total notifications found: ${result.rows.length}`);
    
    if (result.rows.length > 0) {
      console.log('\nRecent notifications:');
      result.rows.forEach((notif, index) => {
        console.log(`${index + 1}. ID: ${notif.id}, User: ${notif.user_id}, Type: ${notif.type}, Read: ${notif.is_read}, Created: ${notif.created_at}`);
        console.log(`   Title: ${notif.title}`);
        console.log(`   Message: ${notif.message}`);
        console.log(`   Sender: ${notif.sender_name || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('No notifications found in database');
    }
    
    // Check unread counts per user
    const unreadResult = await pool.query(`
      SELECT user_id, COUNT(*) as unread_count
      FROM notifications 
      WHERE is_read = FALSE 
      GROUP BY user_id
    `);
    
    console.log('\nUnread counts per user:');
    if (unreadResult.rows.length > 0) {
      unreadResult.rows.forEach(row => {
        console.log(`User ${row.user_id}: ${row.unread_count} unread`);
      });
    } else {
      console.log('No unread notifications');
    }
    
  } catch (error) {
    console.error('Error checking notifications:', error);
  } finally {
    await pool.end();
  }
}

checkNotifications();
