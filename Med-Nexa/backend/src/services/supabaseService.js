const { query, pool } = require('../config/supabase');

/**
 * Med-Nexa PostgreSQL / Supabase Database Service
 * Provides helper functions for inspecting and maintaining database records.
 */
class SupabaseService {
  /**
   * Check connection status and table statistics
   */
  async getStatus() {
    try {
      const dbCheck = await query('SELECT NOW() as current_time, version() as version;');
      
      const counts = {};
      const tables = ['users', 'doctor_profiles', 'appointments', 'queues', 'consultations'];
      
      for (const tbl of tables) {
        try {
          const res = await query(`SELECT COUNT(*) as count FROM ${tbl}`);
          counts[tbl] = parseInt(res.rows[0].count, 10);
        } catch (e) {
          counts[tbl] = 0;
        }
      }

      return {
        success: true,
        connected: true,
        timestamp: dbCheck.rows[0].current_time,
        version: dbCheck.rows[0].version,
        counts,
        host: process.env.SUPABASE_HOST || 'aws-0-ap-southeast-2.pooler.supabase.com',
        database: 'postgres'
      };
    } catch (err) {
      return {
        success: false,
        connected: false,
        error: err.message
      };
    }
  }

  /**
   * Save or sync user
   */
  async syncUser(user) {
    try {
      const sql = `
        INSERT INTO users (id, name, email, phone, password_hash, role, refresh_token, avatar, updated_at)
        VALUES (COALESCE($1, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8, NOW())
        ON CONFLICT (email) DO UPDATE SET
          name = EXCLUDED.name,
          phone = EXCLUDED.phone,
          password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role,
          updated_at = NOW()
        RETURNING id, email;
      `;
      const res = await query(sql, [
        user.id || user._id || null,
        user.name,
        user.email.toLowerCase(),
        user.phone || '',
        user.passwordHash || user.password || '',
        user.role || 'patient',
        user.refreshToken || null,
        user.avatar || null
      ]);
      return res.rows[0];
    } catch (err) {
      console.error('Supabase syncUser warning:', err.message);
      return null;
    }
  }

  /**
   * Save or sync appointment
   */
  async syncAppointment(appointment) {
    try {
      const patientId = String(appointment.patientId?._id || appointment.patientId?.id || appointment.patientId);
      const doctorId = String(appointment.doctorId?._id || appointment.doctorId?.id || appointment.doctorId);

      const dateStr = appointment.appointmentDate
        ? new Date(appointment.appointmentDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      const sql = `
        INSERT INTO appointments (
          id, booking_id, patient_id, doctor_id, appointment_date, 
          slot_time, status, fee_amount, payment_status, cancellation_reason, symptoms, updated_at
        )
        VALUES (COALESCE($1, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        ON CONFLICT (booking_id) DO UPDATE SET
          status = EXCLUDED.status,
          payment_status = EXCLUDED.payment_status,
          slot_time = EXCLUDED.slot_time,
          updated_at = NOW()
        RETURNING id, booking_id;
      `;

      const res = await query(sql, [
        appointment.id || appointment._id || null,
        appointment.bookingId,
        patientId,
        doctorId,
        dateStr,
        appointment.slotTime || '',
        appointment.status || 'scheduled',
        appointment.feeAmount || 500,
        appointment.paymentStatus || 'pending',
        appointment.cancellationReason || null,
        appointment.symptoms || ''
      ]);

      return res.rows[0];
    } catch (err) {
      console.error('Supabase syncAppointment warning:', err.message);
      return null;
    }
  }

  /**
   * Save or sync queue state
   */
  async syncQueue(queue) {
    try {
      const doctorId = String(queue.doctorId?._id || queue.doctorId?.id || queue.doctorId);
      if (!doctorId) return null;

      const sql = `
        INSERT INTO queues (id, doctor_id, date, current_serving_token, total_tokens_issued, active_queue, updated_at)
        VALUES (COALESCE($1, gen_random_uuid()), $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (doctor_id, date) DO UPDATE SET
          current_serving_token = EXCLUDED.current_serving_token,
          total_tokens_issued = EXCLUDED.total_tokens_issued,
          active_queue = EXCLUDED.active_queue,
          updated_at = NOW()
        RETURNING id;
      `;

      const res = await query(sql, [
        queue.id || queue._id || null,
        doctorId,
        queue.date,
        queue.currentServingToken || 0,
        queue.totalTokensIssued || 0,
        JSON.stringify(queue.activeQueue || [])
      ]);

      return res.rows[0];
    } catch (err) {
      console.error('Supabase syncQueue warning:', err.message);
      return null;
    }
  }
}

module.exports = new SupabaseService();
