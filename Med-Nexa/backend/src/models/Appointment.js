const { query } = require('../config/supabase');
const User = require('./User');
const DoctorProfile = require('./DoctorProfile');

class Appointment {
  constructor(row = {}) {
    this.id = String(row.id || row._id || '');
    this._id = this.id;
    this.bookingId = row.booking_id || row.bookingId || '';
    this.patientId = row.patientId || (row.patient_id ? String(row.patient_id) : '');
    this.doctorId = row.doctorId || (row.doctor_id ? String(row.doctor_id) : '');
    this.appointmentDate = row.appointment_date ? new Date(row.appointment_date) : (row.appointmentDate ? new Date(row.appointmentDate) : new Date());
    this.slotTime = row.slot_time || row.slotTime || '';
    this.status = row.status || 'scheduled';
    this.feeAmount = Number(row.fee_amount !== undefined ? row.fee_amount : (row.feeAmount !== undefined ? row.feeAmount : 0));
    this.paymentStatus = row.payment_status || row.paymentStatus || 'pending';
    this.cancellationReason = row.cancellation_reason !== undefined ? row.cancellation_reason : (row.cancellationReason || null);
    this.symptoms = row.symptoms || '';
    this.createdAt = row.created_at || row.createdAt || new Date();
    this.updatedAt = row.updated_at || row.updatedAt || new Date();
  }

  static fromRow(row) {
    if (!row) return null;
    const appt = new Appointment(row);

    // If patient joined
    if (row.p_name || row.p_email) {
      appt.patientId = {
        _id: String(row.patient_id),
        id: String(row.patient_id),
        name: row.p_name,
        email: row.p_email,
        phone: row.p_phone || '',
        avatar: row.p_avatar || null
      };
    }

    // If doctor joined
    if (row.d_specialization || row.d_user_id) {
      appt.doctorId = {
        _id: String(row.doctor_id),
        id: String(row.doctor_id),
        specialization: row.d_specialization || '',
        qualification: row.d_qualification || '',
        consultationFee: Number(row.d_consultation_fee || 500),
        rating: Number(row.d_rating || 4.5),
        userId: {
          _id: String(row.du_id || row.d_user_id || ''),
          id: String(row.du_id || row.d_user_id || ''),
          name: row.du_name || 'Doctor',
          email: row.du_email || '',
          phone: row.du_phone || '',
          avatar: row.du_avatar || null
        }
      };
    }

    return appt;
  }

  async populate(paths) {
    const list = Array.isArray(paths) ? paths : [paths];
    for (const item of list) {
      const path = typeof item === 'string' ? item : item?.path;
      if (path === 'patientId' && typeof this.patientId === 'string' && this.patientId) {
        const u = await User.findById(this.patientId);
        if (u) {
          this.patientId = {
            _id: u.id,
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            avatar: u.avatar
          };
        }
      }
      if (path === 'doctorId' && typeof this.doctorId === 'string' && this.doctorId) {
        const d = await DoctorProfile.findById(this.doctorId).populate('userId');
        if (d) {
          this.doctorId = d;
        }
      }
    }
    return this;
  }

  async save() {
    const res = await query(
      `UPDATE appointments 
       SET status = $1, payment_status = $2, cancellation_reason = $3, 
           slot_time = $4, fee_amount = $5, symptoms = $6, updated_at = NOW() 
       WHERE id = $7 
       RETURNING *`,
      [
        this.status,
        this.paymentStatus,
        this.cancellationReason,
        this.slotTime,
        this.feeAmount,
        this.symptoms,
        this.id
      ]
    );
    if (res.rows[0]) {
      this.updatedAt = res.rows[0].updated_at;
    }
    return this;
  }

  static findById(id) {
    let shouldPopulateDoctor = false;
    let shouldPopulatePatient = false;

    const execute = async () => {
      if (!id) return null;
      const sql = `
        SELECT a.*, 
               p.name as p_name, p.email as p_email, p.phone as p_phone, p.avatar as p_avatar,
               dp.specialization as d_specialization, dp.qualification as d_qualification, dp.consultation_fee as d_consultation_fee, dp.rating as d_rating, dp.user_id as d_user_id,
               du.id as du_id, du.name as du_name, du.email as du_email, du.phone as du_phone, du.avatar as du_avatar
        FROM appointments a
        LEFT JOIN users p ON a.patient_id = p.id
        LEFT JOIN doctor_profiles dp ON a.doctor_id = dp.id
        LEFT JOIN users du ON dp.user_id = du.id
        WHERE a.id = $1
        LIMIT 1
      `;
      const res = await query(sql, [String(id)]);
      const appt = Appointment.fromRow(res.rows[0]);
      if (appt) {
        if (!shouldPopulatePatient && typeof appt.patientId === 'object') {
          appt.patientId = appt.patientId.id;
        }
        if (!shouldPopulateDoctor && typeof appt.doctorId === 'object') {
          appt.doctorId = appt.doctorId.id;
        }
      }
      return appt;
    };

    const queryObj = {
      populate(paths) {
        const list = Array.isArray(paths) ? paths : [paths];
        for (const item of list) {
          const path = typeof item === 'string' ? item : item?.path;
          if (path === 'patientId') shouldPopulatePatient = true;
          if (path === 'doctorId') shouldPopulateDoctor = true;
        }
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

  static async findOne(filter = {}) {
    let sql = 'SELECT * FROM appointments WHERE 1=1';
    const params = [];

    if (filter._id || filter.id) {
      params.push(String(filter._id || filter.id));
      sql += ` AND id = $${params.length}`;
    }
    if (filter.bookingId) {
      params.push(filter.bookingId);
      sql += ` AND booking_id = $${params.length}`;
    }
    if (filter.doctorId) {
      params.push(String(filter.doctorId._id || filter.doctorId.id || filter.doctorId));
      sql += ` AND doctor_id = $${params.length}`;
    }
    if (filter.patientId) {
      params.push(String(filter.patientId._id || filter.patientId.id || filter.patientId));
      sql += ` AND patient_id = $${params.length}`;
    }
    if (filter.slotTime) {
      params.push(filter.slotTime);
      sql += ` AND slot_time = $${params.length}`;
    }
    if (filter.status) {
      if (typeof filter.status === 'object' && filter.status.$nin) {
        const ninVals = filter.status.$nin.map(v => {
          params.push(v);
          return `$${params.length}`;
        });
        sql += ` AND status NOT IN (${ninVals.join(', ')})`;
      } else {
        params.push(filter.status);
        sql += ` AND status = $${params.length}`;
      }
    }
    if (filter.appointmentDate) {
      if (typeof filter.appointmentDate === 'object') {
        if (filter.appointmentDate.$gte) {
          const dStr = new Date(filter.appointmentDate.$gte).toISOString().split('T')[0];
          params.push(dStr);
          sql += ` AND appointment_date >= $${params.length}::date`;
        }
        if (filter.appointmentDate.$lte) {
          const dStr = new Date(filter.appointmentDate.$lte).toISOString().split('T')[0];
          params.push(dStr);
          sql += ` AND appointment_date <= $${params.length}::date`;
        }
      } else {
        const dStr = new Date(filter.appointmentDate).toISOString().split('T')[0];
        params.push(dStr);
        sql += ` AND appointment_date = $${params.length}::date`;
      }
    }

    sql += ' LIMIT 1';
    const res = await query(sql, params);
    return Appointment.fromRow(res.rows[0]);
  }

  static find(filter = {}) {
    let shouldPopulateDoctor = false;
    let shouldPopulatePatient = false;
    let limitVal = null;
    let skipVal = null;
    let sortSql = 'a.appointment_date DESC, a.slot_time ASC';
    let selectFields = null;

    const execute = async () => {
      let sql = `
        SELECT a.*, 
               p.name as p_name, p.email as p_email, p.phone as p_phone, p.avatar as p_avatar,
               dp.specialization as d_specialization, dp.qualification as d_qualification, dp.consultation_fee as d_consultation_fee, dp.rating as d_rating, dp.user_id as d_user_id,
               du.id as du_id, du.name as du_name, du.email as du_email, du.phone as du_phone, du.avatar as du_avatar
        FROM appointments a
        LEFT JOIN users p ON a.patient_id = p.id
        LEFT JOIN doctor_profiles dp ON a.doctor_id = dp.id
        LEFT JOIN users du ON dp.user_id = du.id
        WHERE 1=1
      `;
      const params = [];

      if (filter.doctorId) {
        params.push(String(filter.doctorId._id || filter.doctorId.id || filter.doctorId));
        sql += ` AND a.doctor_id = $${params.length}`;
      }
      if (filter.patientId) {
        params.push(String(filter.patientId._id || filter.patientId.id || filter.patientId));
        sql += ` AND a.patient_id = $${params.length}`;
      }
      if (filter.status) {
        if (typeof filter.status === 'object' && filter.status.$nin) {
          const ninVals = filter.status.$nin.map(v => {
            params.push(v);
            return `$${params.length}`;
          });
          sql += ` AND a.status NOT IN (${ninVals.join(', ')})`;
        } else if (typeof filter.status === 'object' && filter.status.$ne) {
          params.push(filter.status.$ne);
          sql += ` AND a.status != $${params.length}`;
        } else {
          params.push(filter.status);
          sql += ` AND a.status = $${params.length}`;
        }
      }
      if (filter.appointmentDate) {
        if (typeof filter.appointmentDate === 'object') {
          if (filter.appointmentDate.$gte) {
            const dStr = new Date(filter.appointmentDate.$gte).toISOString().split('T')[0];
            params.push(dStr);
            sql += ` AND a.appointment_date >= $${params.length}::date`;
          }
          if (filter.appointmentDate.$lte) {
            const dStr = new Date(filter.appointmentDate.$lte).toISOString().split('T')[0];
            params.push(dStr);
            sql += ` AND a.appointment_date <= $${params.length}::date`;
          }
          if (filter.appointmentDate.$lt) {
            const dStr = new Date(filter.appointmentDate.$lt).toISOString().split('T')[0];
            params.push(dStr);
            sql += ` AND a.appointment_date < $${params.length}::date`;
          }
        } else {
          const dStr = new Date(filter.appointmentDate).toISOString().split('T')[0];
          params.push(dStr);
          sql += ` AND a.appointment_date = $${params.length}::date`;
        }
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
        const appt = Appointment.fromRow(r);
        if (!shouldPopulatePatient && typeof appt.patientId === 'object') {
          appt.patientId = appt.patientId.id;
        }
        if (!shouldPopulateDoctor && typeof appt.doctorId === 'object') {
          appt.doctorId = appt.doctorId.id;
        }
        return appt;
      });
    };

    const queryObj = {
      populate(paths) {
        const list = Array.isArray(paths) ? paths : [paths];
        for (const item of list) {
          const path = typeof item === 'string' ? item : item?.path;
          if (path === 'patientId') shouldPopulatePatient = true;
          if (path === 'doctorId') shouldPopulateDoctor = true;
        }
        return queryObj;
      },
      sort(sortOpt) {
        if (typeof sortOpt === 'object') {
          const parts = [];
          for (const [key, dir] of Object.entries(sortOpt)) {
            const col = key === 'appointmentDate' ? 'a.appointment_date' : (key === 'slotTime' ? 'a.slot_time' : `a.${key}`);
            parts.push(`${col} ${dir === -1 ? 'DESC' : 'ASC'}`);
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
      select(f) {
        selectFields = f;
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
    let sql = 'SELECT COUNT(*) as count FROM appointments WHERE 1=1';
    const params = [];

    if (filter.doctorId) {
      params.push(String(filter.doctorId._id || filter.doctorId.id || filter.doctorId));
      sql += ` AND doctor_id = $${params.length}`;
    }
    if (filter.patientId) {
      params.push(String(filter.patientId._id || filter.patientId.id || filter.patientId));
      sql += ` AND patient_id = $${params.length}`;
    }
    if (filter.status) {
      if (typeof filter.status === 'object' && filter.status.$ne) {
        params.push(filter.status.$ne);
        sql += ` AND status != $${params.length}`;
      } else {
        params.push(filter.status);
        sql += ` AND status = $${params.length}`;
      }
    }
    if (filter.appointmentDate) {
      if (typeof filter.appointmentDate === 'object') {
        if (filter.appointmentDate.$gte) {
          const dStr = new Date(filter.appointmentDate.$gte).toISOString().split('T')[0];
          params.push(dStr);
          sql += ` AND appointment_date >= $${params.length}::date`;
        }
        if (filter.appointmentDate.$lt) {
          const dStr = new Date(filter.appointmentDate.$lt).toISOString().split('T')[0];
          params.push(dStr);
          sql += ` AND appointment_date < $${params.length}::date`;
        }
      }
    }

    const res = await query(sql, params);
    return parseInt(res.rows[0]?.count || 0, 10);
  }

  static async distinct(field, filter = {}) {
    if (field === 'patientId') {
      let sql = 'SELECT DISTINCT patient_id FROM appointments WHERE 1=1';
      const params = [];
      if (filter.doctorId) {
        params.push(String(filter.doctorId._id || filter.doctorId.id || filter.doctorId));
        sql += ` AND doctor_id = $${params.length}`;
      }
      if (filter.status) {
        params.push(filter.status);
        sql += ` AND status = $${params.length}`;
      }
      const res = await query(sql, params);
      return res.rows.map(r => r.patient_id);
    }
    return [];
  }

  static async aggregate(pipeline = []) {
    // Used for doctor dashboard revenue calculations
    const matchStage = pipeline.find(p => p.$match)?.$match || {};
    let sql = 'SELECT COALESCE(SUM(fee_amount), 0) as total FROM appointments WHERE 1=1';
    const params = [];

    if (matchStage.doctorId) {
      params.push(String(matchStage.doctorId._id || matchStage.doctorId.id || matchStage.doctorId));
      sql += ` AND doctor_id = $${params.length}`;
    }
    if (matchStage.status) {
      params.push(matchStage.status);
      sql += ` AND status = $${params.length}`;
    }
    if (matchStage.paymentStatus) {
      params.push(matchStage.paymentStatus);
      sql += ` AND payment_status = $${params.length}`;
    }
    if (matchStage.appointmentDate) {
      if (matchStage.appointmentDate.$gte) {
        const dStr = new Date(matchStage.appointmentDate.$gte).toISOString().split('T')[0];
        params.push(dStr);
        sql += ` AND appointment_date >= $${params.length}::date`;
      }
      if (matchStage.appointmentDate.$lt) {
        const dStr = new Date(matchStage.appointmentDate.$lt).toISOString().split('T')[0];
        params.push(dStr);
        sql += ` AND appointment_date < $${params.length}::date`;
      }
    }

    const res = await query(sql, params);
    const total = parseFloat(res.rows[0]?.total || 0);
    return [{ _id: null, total }];
  }

  static async findByIdAndUpdate(id, updates = {}) {
    if (!id) return null;
    const sets = [];
    const params = [String(id)];

    if (updates.status !== undefined) {
      params.push(updates.status);
      sets.push(`status = $${params.length}`);
    }
    if (updates.paymentStatus !== undefined) {
      params.push(updates.paymentStatus);
      sets.push(`payment_status = $${params.length}`);
    }
    if (updates.cancellationReason !== undefined) {
      params.push(updates.cancellationReason);
      sets.push(`cancellation_reason = $${params.length}`);
    }

    sets.push('updated_at = NOW()');
    const sql = `UPDATE appointments SET ${sets.join(', ')} WHERE id = $1 RETURNING *`;
    const res = await query(sql, params);
    return Appointment.fromRow(res.rows[0]);
  }

  static async create(data = {}) {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const bookingId = data.bookingId || `NVH-${dateStr}-${random}`;

    const apptDateStr = data.appointmentDate
      ? (data.appointmentDate instanceof Date ? data.appointmentDate.toISOString().split('T')[0] : String(data.appointmentDate).split('T')[0])
      : new Date().toISOString().split('T')[0];

    const sql = `
      INSERT INTO appointments (
        id, booking_id, patient_id, doctor_id, appointment_date, 
        slot_time, status, fee_amount, payment_status, cancellation_reason, symptoms, created_at, updated_at
      )
      VALUES (
        COALESCE($1, gen_random_uuid()), $2, $3, $4, $5, 
        $6, $7, $8, $9, $10, $11, NOW(), NOW()
      )
      RETURNING *
    `;

    const res = await query(sql, [
      data.id || data._id || null,
      bookingId,
      String(data.patientId?._id || data.patientId?.id || data.patientId),
      String(data.doctorId?._id || data.doctorId?.id || data.doctorId),
      apptDateStr,
      data.slotTime || '',
      data.status || 'scheduled',
      data.feeAmount || 500,
      data.paymentStatus || 'pending',
      data.cancellationReason || null,
      data.symptoms || ''
    ]);

    return Appointment.fromRow(res.rows[0]);
  }
}

module.exports = Appointment;
