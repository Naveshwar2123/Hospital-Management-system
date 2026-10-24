/**
 * ==============================================================================
 * MED-NEXA: GOOGLE SHEETS API ROUTE HANDLERS (TEACHER EXPLANATION REFERENCE)
 * ==============================================================================
 * Route endpoints that bridge frontend requests with googleSheetsService.js:
 * - GET  /api/sheets/status : Checks if Web App URL is set & pings the spreadsheet.
 * - POST /api/sheets/test   : Runs a test insert and read back from Google Sheets.
 * - POST /api/sheets/sync   : Synchronizes collections to Google Sheets.
 * (Preserved in codebase for grading demonstration; active DB is Supabase PostgreSQL).
 * ==============================================================================
 */
const express = require('express');
const router = express.Router();
const sheetsService = require('../services/googleSheetsService');

// @desc    Check Google Sheets connection status
// @route   GET /api/sheets/status
router.get('/status', async (req, res) => {
  try {
    const isReady = sheetsService.isConfigured();
    if (!isReady) {
      return res.json({
        success: true,
        configured: false,
        message: 'Google Sheets is not configured yet. Add GOOGLE_SHEET_WEBAPP_URL in backend/.env'
      });
    }

    const test = await sheetsService.testConnection();
    return res.json({
      success: true,
      configured: true,
      ...test
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// @desc    Test Google Sheets connection
// @route   POST /api/sheets/test
router.post('/test', async (req, res) => {
  try {
    const result = await sheetsService.testConnection();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Sync all existing data to Google Sheets
// @route   POST /api/sheets/sync
router.post('/sync', async (req, res) => {
  try {
    const result = await sheetsService.syncAllRecords();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
