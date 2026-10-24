const { query } = require('../config/supabase');
const User = require('./User');

class DoctorProfile {
  constructor(row = {}) {
    this.id = String(row.id || row._id || '');
    this._id = this.id;
    this.userId = row.userId || row.user_id ? (typeof row.userId === 'object' ? row.userId : String(row.user_id || row.userId)) : '';
    this.specialization = row.specialization || 'General Medicine';
    this.qualification = row.qualification || 'MBBS';
    this.experience = Number(row.experience || 0);
    this.consultationFee = Number(row.consultation_fee !== undefined ? row.consultation_fee : (row.consultationFee !== undefined ? row.consultationFee : 500));
    this.averageConsultationMinutes = Number(row.average_consultation_minutes !== undefined ? row.average_consultation_minutes : (row.averageConsultationMinutes || 15));
    
    let hours = row.working_hours !== undefined ? row.working_hours : row.workingHours;
    if (typeof hours === 'string') {
      try { hours = JSON.parse(hours); } catch (e) { hours = []; }
    }
    this.workingHours = Array.isArray(hours) ? hours : [];

    this.isAvailable = row.is_available !== undefined ? Boolean(row.is_available) : (row.isAvailable !== undefined ? Boolean(row.isAvailable) : true);
    this.bio = row.bio || '';
    this.rating = Number(row.rating || 4.5);
    this.totalPatients = Number(row.total_patients !== undefined ? row.total_patients : (row.totalPatients || 0));
    this.createdAt = row.created_at || row.createdAt || new Date();
    this.updatedAt = row.updated_at || row.updatedAt || new Date();
  }

  static fromRow(row) {
    if (!row) return null;
    const doc = new DoctorProfile(row);
    // If joined user columns exist
    if (row.u_name || row.u_email) {
      doc.userId = {
        _id: String(row.user_id),
        id: String(row.user_id),
        name: row.u_name,
        email: row.u_email,
        phone: row.u_phone || '',
        avatar: row.u_avatar || null
      };
    }
    return doc;
  }

  async populate(path, fields) {
    if ((path === 'userId' || path.path === 'userId') && typeof this.userId === 'string' && this.userId) {
      const user = await User.findById(this.userId);
      if (user) {
        this.userId = {
          _id: user.id,
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar
        };
      }
    }
    return this;
  }

  async save() {
    const res = await query(
      `UPDATE doctor_profiles 
       SET specialization = $1, qualification = $2, experience = $3, consultation_fee = $4, 
           average_consultation_minutes = $5, working_hours = $6, is_available = $7, 
           bio = $8, rating = $9, total_patients = $10, updated_at = NOW() 
       WHERE id = $11 
       RETURNING *`,
      [
        this.specialization,
        this.qualification,
        this.experience,
        this.consultationFee,
        this.averageConsultationMinutes,
        JSON.stringify(this.workingHours || []),
        this.isAvailable,
        this.bio,
        this.rating,
        this.totalPatients,
        this.id
      ]
    );
    if (res.rows[0]) {
      this.updatedAt = res.rows[0].updated_at;
    }
    return this;
  }

  static findById(id) {
    let shouldPopulateUser = false;
    const execute = async () => {
      if (!id) return null;
      let sql = `
        SELECT dp.*, u.name as u_name, u.email as u_email, u.phone as u_phone, u.avatar as u_avatar
        FROM doctor_profiles dp
        LEFT JOIN users u ON dp.user_id = u.id
        WHERE dp.id = $1
        LIMIT 1
      `;
      const res = await query(sql, [String(id)]);
      const doc = DoctorProfile.fromRow(res.rows[0]);
      if (doc && !shouldPopulateUser && typeof doc.userId === 'object') {
        doc.userId = doc.userId.id;
      }
      return doc;
    };

    const promise = Promise.resolve().then(execute);
    promise.populate = function (path, fields) {
      if (path === 'userId' || (typeof path === 'object' && path.path === 'userId')) {
        shouldPopulateUser = true;
      }
      return Promise.resolve().then(execute);
    };

    return promise;
  }

  static findOne(filter = {}) {
    let shouldPopulateUser = false;
    const execute = async () => {
      let sql = `
        SELECT dp.*, u.name as u_name, u.email as u_email, u.phone as u_phone, u.avatar as u_avatar
        FROM doctor_profiles dp
        LEFT JOIN users u ON dp.user_id = u.id
      `;
      const where = [];
      const params = [];

      if (filter.userId) {
        params.push(String(filter.userId._id || filter.userId.id || filter.userId));
        where.push(`dp.user_id = $${params.length}`);
      }
      if (filter.id || filter._id) {
        params.push(String(filter.id || filter._id));
        where.push(`dp.id = $${params.length}`);
      }

      if (where.length > 0) {
        sql += ` WHERE ${where.join(' AND ')}`;
      }
      sql += ' LIMIT 1';

      const res = await query(sql, params);
      const doc = DoctorProfile.fromRow(res.rows[0]);
      if (doc && !shouldPopulateUser && typeof doc.userId === 'object') {
        doc.userId = doc.userId.id;
      }
      return doc;
    };

    const promise = Promise.resolve().then(execute);
    promise.populate = function (path, fields) {
      if (path === 'userId' || (typeof path === 'object' && path.path === 'userId')) {
        shouldPopulateUser = true;
      }
      return Promise.resolve().then(execute);
    };

    return promise;
  }

  static find(filter = {}) {
    let shouldPopulateUser = false;
    let limitVal = null;
    let skipVal = null;
    let sortSql = 'dp.rating DESC, dp.total_patients DESC';

    const execute = async () => {
      let sql = `
        SELECT dp.*, u.name as u_name, u.email as u_email, u.phone as u_phone, u.avatar as u_avatar
        FROM doctor_profiles dp
        LEFT JOIN users u ON dp.user_id = u.id
      `;
      const where = [];
      const params = [];

      if (filter.specialization) {
        const specStr = filter.specialization instanceof RegExp ? filter.specialization.source : String(filter.specialization);
        params.push(`%${specStr}%`);
        where.push(`dp.specialization ILIKE $${params.length}`);
      }

      if (filter.isAvailable !== undefined) {
        params.push(Boolean(filter.isAvailable));
        where.push(`dp.is_available = $${params.length}`);
      }

      if (filter.$or && Array.isArray(filter.$or)) {
        const orClauses = [];
        for (const item of filter.$or) {
          if (item.userId && item.userId.$in) {
            const inIds = item.userId.$in.map(id => {
              params.push(String(id));
              return `$${params.length}`;
            });
            if (inIds.length > 0) {
              orClauses.push(`dp.user_id IN (${inIds.join(', ')})`);
            }
          }
          if (item.specialization) {
            const spec = item.specialization instanceof RegExp ? item.specialization.source : String(item.specialization);
            params.push(`%${spec}%`);
            orClauses.push(`dp.specialization ILIKE $${params.length}`);
          }
        }
        if (orClauses.length > 0) {
          where.push(`(${orClauses.join(' OR ')})`);
        }
      }

      if (where.length > 0) {
        sql += ` WHERE ${where.join(' AND ')}`;
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
        const doc = DoctorProfile.fromRow(r);
        if (doc && !shouldPopulateUser && typeof doc.userId === 'object') {
          doc.userId = doc.userId.id;
        }
        return doc;
      });
    };

    const queryObj = {
      populate(path, fields) {
        if (path === 'userId' || (typeof path === 'object' && path.path === 'userId')) {
          shouldPopulateUser = true;
        }
        return queryObj;
      },
      sort(sortOpt) {
        if (typeof sortOpt === 'object') {
          const parts = [];
          for (const [key, dir] of Object.entries(sortOpt)) {
            const col = key === 'rating' ? 'dp.rating' : (key === 'totalPatients' ? 'dp.total_patients' : key);
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
    let sql = `
      SELECT COUNT(*) as count 
      FROM doctor_profiles dp
      LEFT JOIN users u ON dp.user_id = u.id
    `;
    const where = [];
    const params = [];

    if (filter.specialization) {
      const specStr = filter.specialization instanceof RegExp ? filter.specialization.source : String(filter.specialization);
      params.push(`%${specStr}%`);
      where.push(`dp.specialization ILIKE $${params.length}`);
    }

    if (filter.isAvailable !== undefined) {
      params.push(Boolean(filter.isAvailable));
      where.push(`dp.is_available = $${params.length}`);
    }

    if (filter.$or && Array.isArray(filter.$or)) {
      const orClauses = [];
      for (const item of filter.$or) {
        if (item.userId && item.userId.$in) {
          const inIds = item.userId.$in.map(id => {
            params.push(String(id));
            return `$${params.length}`;
          });
          if (inIds.length > 0) {
            orClauses.push(`dp.user_id IN (${inIds.join(', ')})`);
          }
        }
        if (item.specialization) {
          const spec = item.specialization instanceof RegExp ? item.specialization.source : String(item.specialization);
          params.push(`%${spec}%`);
          orClauses.push(`dp.specialization ILIKE $${params.length}`);
        }
      }
      if (orClauses.length > 0) {
        where.push(`(${orClauses.join(' OR ')})`);
      }
    }

    if (where.length > 0) {
      sql += ` WHERE ${where.join(' AND ')}`;
    }

    const res = await query(sql, params);
    return parseInt(res.rows[0]?.count || 0, 10);
  }

  static async distinct(field) {
    if (field === 'specialization') {
      const res = await query('SELECT DISTINCT specialization FROM doctor_profiles WHERE specialization IS NOT NULL AND specialization != \'\' ORDER BY specialization ASC');
      return res.rows.map(r => r.specialization);
    }
    return [];
  }

  static async findByIdAndUpdate(id, updates = {}) {
    if (!id) return null;
    const sets = [];
    const params = [String(id)];

    if (updates.$inc && updates.$inc.totalPatients) {
      sets.push(`total_patients = COALESCE(total_patients, 0) + ${parseInt(updates.$inc.totalPatients, 10)}`);
    }

    sets.push('updated_at = NOW()');
    const sql = `UPDATE doctor_profiles SET ${sets.join(', ')} WHERE id = $1 RETURNING *`;
    const res = await query(sql, params);
    return DoctorProfile.fromRow(res.rows[0]);
  }

  static async create(data = {}) {
    const sql = `
      INSERT INTO doctor_profiles (
        id, user_id, specialization, qualification, experience, 
        consultation_fee, average_consultation_minutes, working_hours, 
        is_available, bio, rating, total_patients, created_at, updated_at
      )
      VALUES (
        COALESCE($1, gen_random_uuid()), $2, $3, $4, $5, 
        $6, $7, $8, 
        $9, $10, $11, $12, NOW(), NOW()
      )
      RETURNING *
    `;

    const res = await query(sql, [
      data.id || data._id || null,
      String(data.userId?._id || data.userId?.id || data.userId),
      data.specialization || 'General Medicine',
      data.qualification || 'MBBS',
      data.experience || 0,
      data.consultationFee || 500,
      data.averageConsultationMinutes || 15,
      JSON.stringify(data.workingHours || []),
      data.isAvailable !== false,
      data.bio || '',
      data.rating || 4.5,
      data.totalPatients || 0
    ]);

    return DoctorProfile.fromRow(res.rows[0]);
  }
}

module.exports = DoctorProfile;
