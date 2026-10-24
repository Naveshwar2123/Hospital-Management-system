require('dotenv').config();
const { pool } = require('../config/supabase');

async function verifyDatabase() {
  console.log('Connecting to PostgreSQL / Supabase...');
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT NOW() as current_time, version() as version;');
    console.log('✅ Connected to PostgreSQL / Supabase at:', res.rows[0].current_time);
    
    const tables = ['users', 'doctor_profiles', 'appointments', 'queues', 'consultations'];
    for (const t of tables) {
      const countRes = await client.query(`SELECT COUNT(*) as count FROM ${t}`);
      console.log(`   - Table '${t}': ${countRes.rows[0].count} rows`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  verifyDatabase().catch(err => {
    console.error('❌ Verification error:', err.message);
    process.exit(1);
  });
}

module.exports = { verifyDatabase };
