const { query } = require('../config/supabase');
const User = require('./User');
const Appointment = require('./Appointment');

class Queue {
  constructor(row = {}) {
    this.id = String(row.id || row._id || '');
    this._id = this.id;
    this.doctorId = String(row.doctor_id || row.doctorId || '');
    this.date = row.date || new Date().toISOString().split('T')[0];
    this.currentServingToken = Number(row.current_serving_token !== undefined ? row.current_serving_token : (row.currentServingToken || 0));
    this.totalTokensIssued = Number(row.total_tokens_issued !== undefined ? row.total_tokens_issued : (row.totalTokensIssued || 0));

    let queueList = row.active_queue !== undefined ? row.active_queue : row.activeQueue;
    if (typeof queueList === 'string') {
      try { queueList = JSON.parse(queueList); } catch (e) { queueList = []; }
    }
    this.activeQueue = Array.isArray(queueList) ? queueList : [];

    this.createdAt = row.created_at || row.createdAt || new Date();
    this.updatedAt = row.updated_at || row.updatedAt || new Date();
  }

  static fromRow(row) {
    return row ? new Queue(row) : null;
  }

  toObject() {
    return {
      _id: this.id,
      id: this.id,
      doctorId: this.doctorId,
      date: this.date,
      currentServingToken: this.currentServingToken,
      totalTokensIssued: this.totalTokensIssued,
      activeQueue: JSON.parse(JSON.stringify(this.activeQueue)),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  async populate(pathOrObj, selectFields) {
    const path = typeof pathOrObj === 'object' ? pathOrObj.path : pathOrObj;

    if (path === 'activeQueue.patientId' || path === 'patientId') {
      for (const entry of this.activeQueue) {
        const pId = String(entry.patientId?._id || entry.patientId?.id || entry.patientId || '');
        if (pId) {
          const u = await User.findById(pId);
          if (u) {
            entry.patientId = {
              _id: u.id,
              id: u.id,
              name: u.name,
              phone: u.phone
            };
          }
        }
      }
    }

    if (path === 'activeQueue.appointmentId' || path === 'appointmentId') {
      for (const entry of this.activeQueue) {
        const aId = String(entry.appointmentId?._id || entry.appointmentId?.id || entry.appointmentId || '');
        if (aId) {
          const a = await Appointment.findById(aId);
          if (a) {
            entry.appointmentId = {
              _id: a.id,
              id: a.id,
              bookingId: a.bookingId,
              slotTime: a.slotTime
            };
          }
        }
      }
    }

    return this;
  }

  async save() {
    const res = await query(
      `UPDATE queues 
       SET current_serving_token = $1, total_tokens_issued = $2, active_queue = $3, updated_at = NOW() 
       WHERE id = $4 
       RETURNING *`,
      [
        this.currentServingToken,
        this.totalTokensIssued,
        JSON.stringify(this.activeQueue || []),
        this.id
      ]
    );
    if (res.rows[0]) {
      this.updatedAt = res.rows[0].updated_at;
    }
    return this;
  }

  static findOne(filter = {}) {
    const rawDocId = filter.doctorId?._id || filter.doctorId?.id || filter.doctorId;
    const doctorId = rawDocId ? String(rawDocId) : null;
    const date = filter.date || (doctorId ? new Date().toISOString().split('T')[0] : null);

    const populateTasks = [];

    const execute = async () => {
      let sql = 'SELECT * FROM queues';
      const params = [];
      const where = [];

      if (doctorId) {
        params.push(doctorId);
        where.push(`doctor_id = $${params.length}`);
      }
      if (date) {
        params.push(date);
        where.push(`date = $${params.length}`);
      }
      if (where.length > 0) {
        sql += ` WHERE ${where.join(' AND ')}`;
      }
      sql += ' ORDER BY updated_at DESC LIMIT 1';

      const res = await query(sql, params);
      const queue = Queue.fromRow(res.rows[0]);
      if (queue) {
        for (const task of populateTasks) {
          await queue.populate(task.path, task.select);
        }
      }
      return queue;
    };

    const queryObj = {
      populate(path, select) {
        populateTasks.push({ path, select });
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

  static async findOneAndUpdate(filter = {}, update = {}, options = {}) {
    const doctorId = String(filter.doctorId?._id || filter.doctorId?.id || filter.doctorId || '');
    const date = filter.date || new Date().toISOString().split('T')[0];

    // Find existing queue
    const findRes = await query('SELECT * FROM queues WHERE doctor_id = $1 AND date = $2 LIMIT 1', [doctorId, date]);
    let queue = Queue.fromRow(findRes.rows[0]);

    if (!queue && options.upsert) {
      const initialCurrentServing = update.$setOnInsert?.currentServingToken || 0;
      const initialTotal = update.$inc?.totalTokensIssued || update.$set?.totalTokensIssued || 0;
      const initialActiveQueue = update.$set?.activeQueue || [];

      const insertRes = await query(
        `INSERT INTO queues (id, doctor_id, date, current_serving_token, total_tokens_issued, active_queue, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
         ON CONFLICT (doctor_id, date) DO UPDATE SET updated_at = NOW()
         RETURNING *`,
        [doctorId, date, initialCurrentServing, initialTotal, JSON.stringify(initialActiveQueue)]
      );
      queue = Queue.fromRow(insertRes.rows[0]);
    } else if (queue) {
      if (update.$inc && update.$inc.totalTokensIssued) {
        queue.totalTokensIssued += update.$inc.totalTokensIssued;
      }
      if (update.$set) {
        if (update.$set.currentServingToken !== undefined) queue.currentServingToken = update.$set.currentServingToken;
        if (update.$set.totalTokensIssued !== undefined) queue.totalTokensIssued = update.$set.totalTokensIssued;
        if (update.$set.activeQueue !== undefined) queue.activeQueue = update.$set.activeQueue;
      }
      await queue.save();
    }

    return queue;
  }

  static async create(data = {}) {
    const doctorId = String(data.doctorId?._id || data.doctorId?.id || data.doctorId || '');
    const date = data.date || new Date().toISOString().split('T')[0];

    const sql = `
      INSERT INTO queues (id, doctor_id, date, current_serving_token, total_tokens_issued, active_queue, created_at, updated_at)
      VALUES (COALESCE($1, gen_random_uuid()), $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `;

    const res = await query(sql, [
      data.id || data._id || null,
      doctorId,
      date,
      data.currentServingToken || 0,
      data.totalTokensIssued || 0,
      JSON.stringify(data.activeQueue || [])
    ]);

    return Queue.fromRow(res.rows[0]);
  }

  static async aggregate(pipeline = []) {
    // Used in queueController.js to compute average consultation duration
    const match = pipeline.find(p => p.$match)?.$match || {};
    const doctorId = String(match.doctorId?._id || match.doctorId?.id || match.doctorId || '');

    if (!doctorId) return [];

    const res = await query(
      'SELECT active_queue FROM queues WHERE doctor_id = $1 ORDER BY updated_at DESC LIMIT 5',
      [doctorId]
    );

    const completedDurations = [];
    for (const row of res.rows) {
      let list = row.active_queue;
      if (typeof list === 'string') {
        try { list = JSON.parse(list); } catch (e) { list = []; }
      }
      if (Array.isArray(list)) {
        for (const entry of list) {
          if (entry.status === 'completed' && entry.calledTime && entry.completedTime) {
            const called = new Date(entry.calledTime).getTime();
            const completed = new Date(entry.completedTime).getTime();
            const diffMins = (completed - called) / 60000;
            if (diffMins > 0 && diffMins < 180) {
              completedDurations.push({ duration: diffMins });
            }
          }
        }
      }
    }

    return completedDurations.slice(0, 5);
  }
}

module.exports = Queue;
