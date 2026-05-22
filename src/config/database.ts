import mysql from 'mysql2/promise';

// Create the connection pool using your phpMyAdmin credentials
const pool = mysql.createPool({
  host: '127.0.0.1',       // From your phpMyAdmin server address
  user: 'root',            // Default XAMPP/WAMP user (change if you have a custom user)
  password: '',            // Default XAMPP password is empty (change if you set one)
  database: 'pos_db',      // The database name from your second screenshot
  waitForConnections: true,
  connectionLimit: 10,     // Maximum number of concurrent connections
  queueLimit: 0
});

// Export the pool so you can import and use it in your controllers/models
export default pool;