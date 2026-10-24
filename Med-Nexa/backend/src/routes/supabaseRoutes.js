const express = require('express');
const router = express.Router();
const supabaseService = require('../services/supabaseService');
const { query } = require('../config/supabase');

// @desc    Check Supabase PostgreSQL status and table statistics
// @route   GET /api/supabase/status
router.get('/status', async (req, res) => {
  try {
    const status = await supabaseService.getStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// @desc    Get preview of records from Supabase
// @route   GET /api/supabase/preview/:table
router.get('/preview/:table', async (req, res) => {
  const allowed = ['users', 'doctor_profiles', 'appointments', 'queues', 'consultations'];
  const table = req.params.table;

  if (!allowed.includes(table)) {
    return res.status(400).json({ success: false, message: 'Invalid table name' });
  }

  try {
    const records = await query(`SELECT * FROM ${table} ORDER BY created_at DESC LIMIT 20`);
    res.json({
      success: true,
      table,
      count: records.rowCount,
      rows: records.rows
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
