const { Pool } = require('pg');

/**
 * Med-Nexa Supabase PostgreSQL Database Client
 * Configured with connection pooling & IPv4 fallback for seamless connectivity.
 */
function getSupabaseConfig() {
  const host = process.env.SUPABASE_HOST || 'aws-0-ap-southeast-2.pooler.supabase.com';
  const port = parseInt(process.env.SUPABASE_PORT || '5432', 10);
  const user = process.env.SUPABASE_USER || 'postgres.uqmicnwvpnsvaskrrsqc';
  const password = process.env.SUPABASE_PASSWORD || '?c99GLNr5mSmQn/';
  const database = process.env.SUPABASE_DATABASE || 'postgres';

  return {
    host,
    port,
    user,
    password,
    database,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  };
}

const pool = new Pool(getSupabaseConfig());

pool.on('error', (err) => {
  console.error('Unexpected Supabase PostgreSQL idle client error:', err.message);
});

/**
 * Connect and verify Supabase PostgreSQL connection
 */
async function connectSupabase() {
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW() as connected_at, version() as version;');
    console.log(`✅ Supabase PostgreSQL Connected: ${res.rows[0].connected_at}`);
    console.log(`   Host: ${getSupabaseConfig().host}`);
    console.log(`   Database: ${getSupabaseConfig().database}`);
    client.release();
    return true;
  } catch (err) {
    console.error(`❌ Supabase Connection Warning: ${err.message}`);
    return false;
  }
}

/**
 * Execute a query on Supabase PostgreSQL
 */
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development') {
    // console.log('Supabase Query executed:', { text: text.substring(0, 50), duration, rows: res.rowCount });
  }
  return res;
}

module.exports = {
  pool,
  query,
  connectSupabase,
  getSupabaseConfig
};
