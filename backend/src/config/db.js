import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set. Add it to backend/.env or your environment.');
}

// Railway / hosted Postgres usually requires SSL; local dev often does not.
const isLocal =
  connectionString?.includes('localhost') ||
  connectionString?.includes('127.0.0.1');
const pool = new Pool({
  connectionString,
  ...(!isLocal
    ? { ssl: { rejectUnauthorized: false } }
    : {}),
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database!');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

export default pool;