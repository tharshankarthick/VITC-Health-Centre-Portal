const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function seed() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    const statements = sql
      .split(/;\s*$/m)
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    const conn = await pool.getConnection();
    console.log('🔄 Seeding database vitc_hospital...');

    for (const stmt of statements) {
      if (stmt) {
        await conn.query(stmt);
      }
    }

    conn.release();
    console.log('✅ Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
}

seed();
