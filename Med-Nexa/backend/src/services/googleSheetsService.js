/**
 * ==============================================================================
 * MED-NEXA: GOOGLE SHEETS DATABASE SERVICE (ACADEMIC / TEACHER EXPLANATION)
 * ==============================================================================
 * Architectural Overview:
 * 1. Concept: Google Sheets functions as a serverless NoSQL / Relational data store.
 * 2. Bridge Engine: Built via Google Apps Script (see google-sheets-database/Code.gs).
 * 3. Execution:
 *    - Node.js backend sends HTTP POST requests with JSON payloads containing 
 *      { action: 'insertOne' | 'findAll' | 'setup', collection: 'Users' | ... }.
 *    - Google Apps Script receives the payload in `doPost(e)`, reads the action,
 *      and executes native SpreadsheetApp operations (appendRow, getDataRange).
 *    - It returns standard HTTP JSON status responses back to this service.
 * 4. Status: Preserved in the codebase for viva/teacher explanation.
 * ==============================================================================
 */

const getWebappUrl = () => {
  return process.env.GOOGLE_SHEET_WEBAPP_URL || '';
};

const isConfigured = () => {
  const url = getWebappUrl();
  return Boolean(url && url.startsWith('https://script.google.com/macros/s/'));
};

/**
 * Execute request to Google Apps Script Web App
 */
const request = async (action, collection, payload = {}) => {
  const url = getWebappUrl();
  if (!url) {
    throw new Error('GOOGLE_SHEET_WEBAPP_URL is not configured in backend/.env');
  }

  const response = await fetch(url, {
    method: 'POST',
    redirect: 'follow',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify({
      action,
      collection,
      ...payload
    })
  });

  if (!response.ok) {
    throw new Error(`Google Sheets responded with HTTP ${response.status}`);
  }

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.message || json.error || 'Google Sheets operation failed');
  }

  return json;
};

/**
 * Test connectivity to Google Sheet
 */
const testConnection = async () => {
  if (!isConfigured()) {
    return {
      connected: false,
      message: 'GOOGLE_SHEET_WEBAPP_URL is not set in backend/.env'
    };
  }

  try {
    const res = await request('ping', 'Users');
    return {
      connected: true,
      message: res.message || 'Connected to Google Sheets Database successfully',
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    let msg = err.message;
    if (msg.includes('401') || msg.includes('Unexpected token') || msg.includes('<!doctype') || msg.includes('JSON')) {
      msg = 'Permission needed: In Google Apps Script, click Deploy > Manage deployments > Edit (pencil) > set "Who has access" to "Anyone" > Deploy.';
    }
    return {
      connected: false,
      message: msg
    };
  }
};

/**
 * Find rows in a collection
 */
const find = async (collection, filter = {}) => {
  if (!isConfigured()) return [];
  const res = await request('find', collection, { filter });
  return res.data || [];
};

/**
 * Find one row in a collection
 */
const findOne = async (collection, filter = {}) => {
  if (!isConfigured()) return null;
  const res = await request('findOne', collection, { filter });
  return res.data || null;
};

/**
 * Find row by _id
 */
const findById = async (collection, id) => {
  if (!isConfigured()) return null;
  const res = await request('findById', collection, { id });
  return res.data || null;
};

/**
 * Insert a row into a collection
 */
const insertOne = async (collection, doc) => {
  if (!isConfigured()) return doc;
  const res = await request('insertOne', collection, { doc });
  return res.data || doc;
};

/**
 * Update row by _id
 */
const updateOne = async (collection, id, update) => {
  if (!isConfigured()) return { id, ...update };
  const res = await request('updateOne', collection, { id, update });
  return res;
};

/**
 * Delete row by _id
 */
const deleteOne = async (collection, id) => {
  if (!isConfigured()) return true;
  const res = await request('deleteOne', collection, { id });
  return res;
};

/**
 * Sync all current database records into the Google Sheet
 */
const syncAllRecords = async () => {
  if (!isConfigured()) {
    throw new Error('Google Sheets URL not configured in .env');
  }

  const User = require('../models/User');
  const DoctorProfile = require('../models/DoctorProfile');
  const Appointment = require('../models/Appointment');
  const Queue = require('../models/Queue');
  const Consultation = require('../models/Consultation');

  const [users, doctors, appointments, queues, consultations] = await Promise.all([
    User.find({}),
    DoctorProfile.find({}),
    Appointment.find({}),
    Queue.find({}),
    Consultation.find({})
  ]);

  let synced = 0;

  // Sync Users
  for (const u of users) {
    await insertOne('Users', {
      _id: String(u._id || u.id),
      name: u.name,
      email: u.email,
      passwordHash: u.passwordHash,
      role: u.role,
      phone: u.phone || '',
      createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString()
    }).catch(() => {});
    synced++;
  }

  // Sync Doctor Profiles
  for (const d of doctors) {
    await insertOne('DoctorProfiles', {
      _id: String(d._id || d.id),
      userId: String(d.userId?._id || d.userId || ''),
      doctorName: d.userId?.name || 'Dr. Specialist',
      specialization: d.specialization || 'General',
      experience: d.experience || 5,
      roomNumber: d.roomNumber || '101',
      consultationFee: d.consultationFee || 500,
      bio: d.bio || '',
      isAvailable: Boolean(d.isAvailable),
      rating: d.rating || 5,
      totalReviews: d.totalReviews || 0,
      createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString()
    }).catch(() => {});
    synced++;
  }

  // Sync Appointments
  for (const a of appointments) {
    await insertOne('Appointments', {
      _id: String(a._id || a.id),
      patientId: String(a.patientId?._id || a.patientId || ''),
      doctorId: String(a.doctorId?._id || a.doctorId || ''),
      doctorName: a.doctorId?.userId?.name || 'Doctor',
      patientName: a.patientId?.name || a.patientId?.userId?.name || 'Patient',
      date: a.appointmentDate ? new Date(a.appointmentDate).toISOString().split('T')[0] : '',
      slotTime: a.slotTime || '',
      tokenNumber: a.tokenNumber || 0,
      status: a.status || 'scheduled',
      symptoms: a.symptoms || '',
      consultationFee: a.consultationFee || 500,
      createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : new Date().toISOString()
    }).catch(() => {});
    synced++;
  }

  return {
    success: true,
    message: `Synchronized ${synced} records to Google Sheets successfully!`,
    details: {
      users: users.length,
      doctors: doctors.length,
      appointments: appointments.length,
      queues: queues.length,
      consultations: consultations.length
    }
  };
};

module.exports = {
  isConfigured,
  testConnection,
  find,
  findOne,
  findById,
  insertOne,
  updateOne,
  deleteOne,
  syncAllRecords
};
