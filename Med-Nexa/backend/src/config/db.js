const { pool, query, connectSupabase } = require('./supabase');

/**
 * Primary Database Connection (PostgreSQL / Supabase)
 */
const connectDB = async () => {
  const isConnected = await connectSupabase();
  if (!isConnected) {
    console.error('❌ Database Connection Error: Unable to connect to PostgreSQL');
    process.exit(1);
  }
};

module.exports = connectDB;
module.exports.connectDB = connectDB;
module.exports.pool = pool;
module.exports.query = query;
