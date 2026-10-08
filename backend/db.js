const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || 'Karthi@0207',
  database:           process.env.DB_NAME     || 'vitc_hospital',
  port:               process.env.DB_PORT     || 3306,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  decimalNumbers:     true,
});

pool.getConnection()
  .then(conn => {
    console.log('✅  MySQL connected — database: vitc_hospital');
    conn.release();
  })
  .catch(err => {
    console.error('❌  MySQL connection failed:', err.message);
  });

module.exports = pool;

