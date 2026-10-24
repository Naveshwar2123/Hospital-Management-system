const { Pool } = require('pg');
require('dotenv').config();

// Create connection config using either Direct URL, Pooler URL, or individual credentials
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
    connectionTimeoutMillis: 10000
  };
}

const pool = new Pool(getSupabaseConfig());

async function setupTables() {
  console.log('Connecting to Supabase PostgreSQL...');
  const client = await pool.connect();
  console.log('✅ Connected to Supabase PostgreSQL!');

  try {
    console.log('Creating schema and tables in Supabase...');

    await client.query(`
      -- Enable UUID extension if not enabled
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      -- 1. Users Table
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'patient' CHECK (role IN ('patient', 'doctor')),
        refresh_token TEXT DEFAULT NULL,
        avatar TEXT DEFAULT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 2. Doctor Profiles Table
      CREATE TABLE IF NOT EXISTS doctor_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        specialization VARCHAR(100) NOT NULL,
        qualification VARCHAR(100) NOT NULL,
        experience INT DEFAULT 0,
        consultation_fee NUMERIC(10, 2) NOT NULL,
        average_consultation_minutes INT DEFAULT 15,
        working_hours JSONB DEFAULT '[]'::jsonb,
        is_available BOOLEAN DEFAULT TRUE,
        bio TEXT DEFAULT '',
        rating NUMERIC(3, 2) DEFAULT 4.5,
        total_patients INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 3. Appointments Table
      CREATE TABLE IF NOT EXISTS appointments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id VARCHAR(50) UNIQUE NOT NULL,
        patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
        doctor_id UUID REFERENCES doctor_profiles(id) ON DELETE CASCADE,
        appointment_date DATE NOT NULL,
        slot_time VARCHAR(20) NOT NULL,
        status VARCHAR(30) DEFAULT 'scheduled',
        fee_amount NUMERIC(10, 2) NOT NULL,
        payment_status VARCHAR(20) DEFAULT 'pending',
        cancellation_reason TEXT DEFAULT NULL,
        symptoms TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 4. Queues Table
      CREATE TABLE IF NOT EXISTS queues (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        doctor_id UUID REFERENCES doctor_profiles(id) ON DELETE CASCADE,
        date VARCHAR(20) NOT NULL,
        current_serving_token INT DEFAULT 0,
        total_tokens_issued INT DEFAULT 0,
        active_queue JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(doctor_id, date)
      );

      -- 5. Consultations Table
      CREATE TABLE IF NOT EXISTS consultations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
        patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
        doctor_id UUID REFERENCES doctor_profiles(id) ON DELETE CASCADE,
        diagnosis TEXT NOT NULL,
        symptoms TEXT DEFAULT '',
        prescriptions JSONB DEFAULT '[]'::jsonb,
        doctor_notes TEXT DEFAULT '',
        follow_up_date DATE DEFAULT NULL,
        vital_signs JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    console.log('✅ Supabase PostgreSQL tables verified/created successfully!');

    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('📋 Existing tables in Supabase public schema:');
    res.rows.forEach(r => console.log('   - ' + r.table_name));

  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  setupTables().catch(err => {
    console.error('❌ Supabase setup error:', err);
    process.exit(1);
  });
}

module.exports = { setupTables, getSupabaseConfig };
