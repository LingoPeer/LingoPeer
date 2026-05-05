import 'dotenv/config';
import pool from './src/config/db.js';

async function checkMessageIdTypes() {
  try {
    console.log('=== Checking Message ID Types ===');
    
    // Check private_messages table
    const privateResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'private_messages' AND column_name = 'id'
    `);
    
    console.log('Private messages ID type:');
    privateResult.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}`);
    });
    
    // Check practice_requests table
    const practiceResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'practice_requests' AND column_name = 'id'
    `);
    
    console.log('Practice requests ID type:');
    practiceResult.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}`);
    });
    
    // Check community_messages table
    const communityResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'community_messages' AND column_name = 'id'
    `);
    
    console.log('Community messages ID type:');
    communityResult.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}`);
    });
    
  } catch (error) {
    console.error('Error checking message ID types:', error);
  } finally {
    await pool.end();
  }
}

checkMessageIdTypes();
