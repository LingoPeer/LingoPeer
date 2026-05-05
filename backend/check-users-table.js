import 'dotenv/config';
import pool from './src/config/db.js';

async function checkUsersTable() {
  try {
    console.log('Checking users table structure...');
    
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('Users table columns:');
    result.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
  } catch (error) {
    console.error('Error checking users table:', error);
  } finally {
    await pool.end();
  }
}

checkUsersTable();
