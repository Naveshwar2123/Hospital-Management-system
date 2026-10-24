const { query } = require('../config/supabase');
const User = require('./User');
const DoctorProfile = require('./DoctorProfile');
const Appointment = require('./Appointment');

class Consultation {
  constructor(row = {}) {
    this.id = String(row.id || row._id || '');
    this._id = this.id;
    this.appointmentId = row.appointmentId || (row.appointment_id ? String(row.appointment_id) : '');
    this.patientId = row.patientId || (row.patient_id ? String(row.patient_id) : '');
    this.doctorId = row.doctorId || (row.doctor_id ? String(row.doctor_id) : '');
    this.diagnosis = row.diagnosis || '';
    this.symptoms = row.symptoms || '';

    let pres = row.prescriptions;
    if (typeof pres === 'string') {
      try { pres = JSON.parse(pres); } catch (e) { pres = []; }
    }
    this.prescriptions = Array.isArray(pres) ? pres : [];

    this.doctorNotes = row.doctor_notes !== undefined ? row.doctor_notes : (row.doctorNotes || '');
    this.followUpDate = row.follow_up_date || row.followUpDate || null;

    let vitals = row.vital_signs !== undefined ? row.vital_signs : row.vitalSigns;
    if (typeof vitals === 'string') {
      try { vitals = JSON.parse(vitals); } catch (e) { vitals = {}; }
    }
    this.vitalSigns = vitals && typeof vitals === 'object' ? vitals : {};

    this.createdAt = row.created_at || row.createdAt || new Date();
    this.updatedAt = row.updated_at || row.updatedAt || new Date();
  }

  static fromRow(row) {
    if (!row) return null;
    const c = new Consultation(row);

    // If joined patient
    if (row.p_name || row.p_email) {
      c.patientId = {
        _id: String(row.patient_id),
        id: String(row.patient_id),
        name: row.p_name,
        email: row.p_email,
        phone: row.p_phone || ''
      };
    }

    // If joined doctor
    if (row.d_specialization || row.du_name) {
      c.doctorId = {
        _id: String(row.doctor_id),
        id: String(row.doctor_id),
        specialization: row.d_specialization || '',
        userId: {
          _id: String(row.du_id || ''),
          id: String(row.du_id || ''),
          name: row.du_name || 'Doctor'
        }
      };
    }

    // If joined appointment
    if (row.a_booking_id) {
      c.appointmentId = {
        _id: String(row.appointment_id),
        id: String(row.appointment_id),
        bookingId: row.a_booking_id,
        appointmentDate: row.a_appointment_date ? new Date(row.a_appointment_date) : null,
        slotTime: row.a_slot_time || '',
        feeAmount: Number(row.a_fee_amount || 0)
      };
    }

    return c;
  }

  async save() {
    const res = await query(
      `UPDATE consultations 
       SET diagnosis = $1, symptoms = $2, prescriptions = $3, doctor_notes = $4, 
           follow_up_date = $5, vital_signs = $6, updated_at = NOW() 
       WHERE id = $7 
       RETURNING *`,
      [
        this.diagnosis,
        this.symptoms,
        JSON.stringify(this.prescriptions || []),
        this.doctorNotes,
        this.followUpDate,
        JSON.stringify(this.vitalSigns || {}),
        this.id
      ]
    );
    if (res.rows[0]) {
      this.updatedAt = res.rows[0].updated_at;
    }
    return this;
  }

  static findOne(filter = {}) {
    let shouldPopulatePatient = false;
    let shouldPopulateDoctor = false;

    const execute = async () => {
      let sql = `
        SELECT c.*,
               p.name as p_name, p.email as p_email, p.phone as p_phone,
               dp.specialization as d_specialization,
               du.id as du_id, du.name as du_name
        FROM consultations c
        LEFT JOIN users p ON c.patient_id = p.id
        LEFT JOIN doctor_profiles dp ON c.doctor_id = dp.id
        LEFT JOIN users du ON dp.user_id = du.id
        WHERE 1=1
      `;
      const params = [];

      if (filter.appointmentId) {
        params.push(String(filter.appointmentId));
        sql += ` AND c.appointment_id = $${params.length}`;
      }
      if (filter.id || filter._id) {
        params.push(String(filter.id || filter._id));
        sql += ` AND c.id = $${params.length}`;
      }

      sql += ' LIMIT 1';
      const res = await query(sql, params);
      const c = Consultation.fromRow(res.rows[0]);
      if (c) {
        if (!shouldPopulatePatient && typeof c.patientId === 'object') {
          c.patientId = c.patientId.id;
        }
        if (!shouldPopulateDoctor && typeof c.doctorId === 'object') {
          c.doctorId = c.doctorId.id;
        }
      }
      return c;
    };

    const queryObj = {
      populate(path, select) {
        const p = typeof path === 'object' ? path.path : path;
        if (p === 'patientId') shouldPopulatePatient = true;
        if (p === 'doctorId') shouldPopulateDoctor = true;
        return queryObj;
      },
      then(resolve, reject) {
        return execute().then(resolve, reject);
      },
      catch(reject) {
        return execute().catch(reject);
      }
    };

    return queryObj;
  }

  static find(filter = {}) {
    let shouldPopulatePatient = false;
    let shouldPopulateDoctor = false;
    let shouldPopulateAppointment = false;
    let limitVal = null;
    let skipVal = null;
    let sortSql = 'c.created_at DESC';

    const execute = async () => {
      let sql = `
        SELECT c.*,
               p.name as p_name, p.email as p_email, p.phone as p_phone,
               dp.specialization as d_specialization,
               du.id as du_id, du.name as du_name,
               a.booking_id as a_booking_id, a.appointment_date as a_appointment_date, 
               a.slot_time as a_slot_time, a.fee_amount as a_fee_amount
        FROM consultations c
        LEFT JOIN users p ON c.patient_id = p.id
        LEFT JOIN doctor_profiles dp ON c.doctor_id = dp.id
        LEFT JOIN users du ON dp.user_id = du.id
        LEFT JOIN appointments a ON c.appointment_id = a.id
        WHERE 1=1
      `;
      const params = [];

      if (filter.patientId) {
        params.push(String(filter.patientId._id || filter.patientId.id || filter.patientId));
        sql += ` AND c.patient_id = $${params.length}`;
      }
      if (filter.doctorId) {
        params.push(String(filter.doctorId._id || filter.doctorId.id || filter.doctorId));
        sql += ` AND c.doctor_id = $${params.length}`;
      }

      if (sortSql) {
        sql += ` ORDER BY ${sortSql}`;
      }
      if (limitVal !== null) {
        sql += ` LIMIT ${parseInt(limitVal, 10)}`;
      }
      if (skipVal !== null) {
        sql += ` OFFSET ${parseInt(skipVal, 10)}`;
      }

      const res = await query(sql, params);
      return res.rows.map(r => {
        const c = Consultation.fromRow(r);
        if (!shouldPopulatePatient && typeof c.patientId === 'object') {
          c.patientId = c.patientId.id;
        }
        if (!shouldPopulateDoctor && typeof c.doctorId === 'object') {
          c.doctorId = c.doctorId.id;
        }
        if (!shouldPopulateAppointment && typeof c.appointmentId === 'object') {
          c.appointmentId = c.appointmentId.id;
        }
        return c;
      });
    };

    const queryObj = {
      populate(path, select) {
        const p = typeof path === 'object' ? path.path : path;
        if (p === 'patientId') shouldPopulatePatient = true;
        if (p === 'doctorId') shouldPopulateDoctor = true;
        if (p === 'appointmentId') shouldPopulateAppointment = true;
        return queryObj;
      },
      sort(sortOpt) {
        if (typeof sortOpt === 'object') {
          const parts = [];
          for (const [key, dir] of Object.entries(sortOpt)) {
            parts.push(`c.${key === 'createdAt' ? 'created_at' : key} ${dir === -1 ? 'DESC' : 'ASC'}`);
          }
          if (parts.length > 0) sortSql = parts.join(', ');
        }
        return queryObj;
      },
      skip(s) {
        skipVal = s;
        return queryObj;
      },
      limit(l) {
        limitVal = l;
        return queryObj;
      },
      lean() {
        return queryObj;
      },
      then(resolve, reject) {
        return execute().then(resolve, reject);
      },
      catch(reject) {
        return execute().catch(reject);
      }
    };

    return queryObj;
  }

  static async countDocuments(filter = {}) {
    let sql = 'SELECT COUNT(*) as count FROM consultations WHERE 1=1';
    const params = [];

    if (filter.patientId) {
      params.push(String(filter.patientId._id || filter.patientId.id || filter.patientId));
      sql += ` AND patient_id = $${params.length}`;
    }
    if (filter.doctorId) {
      params.push(String(filter.doctorId._id || filter.doctorId.id || filter.doctorId));
      sql += ` AND doctor_id = $${params.length}`;
    }

    const res = await query(sql, params);
    return parseInt(res.rows[0]?.count || 0, 10);
  }

  static async create(data = {}) {
    const sql = `
      INSERT INTO consultations (
        id, appointment_id, patient_id, doctor_id, diagnosis, 
        symptoms, prescriptions, doctor_notes, follow_up_date, vital_signs, 
        created_at, updated_at
      )
      VALUES (
        COALESCE($1, gen_random_uuid()), $2, $3, $4, $5, 
        $6, $7, $8, $9, $10, 
        NOW(), NOW()
      )
      RETURNING *
    `;

    const res = await query(sql, [
      data.id || data._id || null,
      String(data.appointmentId?._id || data.appointmentId?.id || data.appointmentId),
      String(data.patientId?._id || data.patientId?.id || data.patientId),
      String(data.doctorId?._id || data.doctorId?.id || data.doctorId),
      data.diagnosis || '',
      data.symptoms || '',
      JSON.stringify(data.prescriptions || []),
      data.doctorNotes || '',
      data.followUpDate || null,
      JSON.stringify(data.vitalSigns || {})
    ]);

    return Consultation.fromRow(res.rows[0]);
  }
}

module.exports = Consultation;
