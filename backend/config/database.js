const { Pool } = require('pg');

// Database configuration - easily changeable for deployment
const dbConfig = {
  user: process.env.DB_USER || 'footballusr',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'football',
  password: process.env.DB_PASSWORD || 'password', // Update this to your actual password
  port: process.env.DB_PORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// Create connection pool
const pool = new Pool(dbConfig);

// Test connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('PostgreSQL connection error:', err);
  process.exit(-1);
});

module.exports = pool;
