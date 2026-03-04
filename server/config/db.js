const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('DB connection error:', err);
});

pool.on('connect', () => {
  console.log('DB connected successfully');
});

module.exports = pool;