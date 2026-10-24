const express = require('express');
const router = express.Router();
const {
  createConsultation,
  getConsultationByAppointment,
  getMyConsultationHistory,
  getDoctorConsultationRecords
} = require('../controllers/consultationController');
const { authenticate, restrictTo } = require('../middleware/auth');
const { createConsultationValidation } = require('../middleware/validators');

// Doctor routes
router.post('/', authenticate, restrictTo('doctor'), createConsultationValidation, createConsultation);
router.get('/doctor-records', authenticate, restrictTo('doctor'), getDoctorConsultationRecords);

// Patient routes
router.get('/my-history', authenticate, restrictTo('patient'), getMyConsultationHistory);

// Shared
router.get('/appointment/:appointmentId', authenticate, getConsultationByAppointment);

module.exports = router;
