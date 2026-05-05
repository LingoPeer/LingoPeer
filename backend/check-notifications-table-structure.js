import 'dotenv/config';
import pool from './src/config/db.js';

async function checkNotificationsTableStructure() {
  try {
    console.log('=== Checking Notifications Table Structure ===');
    
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      ORDER BY ordinal_position
    `);
    
    console.log('Notifications table columns:');
    result.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
  } catch (error) {
    console.error('Error checking notifications table structure:', error);
  } finally {
    await pool.end();
  }
}

checkNotificationsTableStructure();
