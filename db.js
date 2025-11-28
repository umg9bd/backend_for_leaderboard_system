const mysql = require('mysql2/promise');

// --- THIS IS THE FIX ---
// Only run require('dotenv').config() if we are NOT in a CI environment.
// GitHub Actions and other CI providers set 'CI=true' by default.
if (!process.env.CI) {
  require('dotenv').config();
  console.log('Running locally, injecting .env file');
}
// --- END OF FIX ---

// Create a connection pool using settings from environment variables
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, // This will now correctly be 'password' in CI
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the connection
pool.getConnection()
  .then(connection => {
    console.log('✅ Database connected successfully!');
    connection.release();
  })
  .catch(err => {
    // This error will no longer be "Access Denied"
    console.error('❌ Database connection failed:', err.message);
  });

// Export the pool
module.exports = pool;
