const express = require('express');
const router = express.Router();
const {
  getAllDoctors,
  getDoctorById,
  getDoctorProfile,
  updateDoctorProfile,
  getDoctorSlots,
  getDoctorStats,
  getSpecializations
} = require('../controllers/doctorController');
const { authenticate, restrictTo } = require('../middleware/auth');

// Public routes
router.get('/specializations/list', getSpecializations);
router.get('/', getAllDoctors);

// Doctor-only routes (MUST come before /:id)
router.get('/profile', authenticate, restrictTo('doctor'), getDoctorProfile);
router.put('/profile', authenticate, restrictTo('doctor'), updateDoctorProfile);
router.get('/dashboard/stats', authenticate, restrictTo('doctor'), getDoctorStats);

// Parameterized routes
router.get('/:id', getDoctorById);
router.get('/:id/slots', getDoctorSlots);

module.exports = router;
