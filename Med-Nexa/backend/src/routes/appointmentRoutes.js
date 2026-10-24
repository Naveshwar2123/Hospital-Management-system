const express = require('express');
const router = express.Router();
const {
  createAppointment,
  getMyAppointments,
  getDoctorAppointments,
  cancelAppointment,
  checkInAppointment,
  getAppointmentById
} = require('../controllers/appointmentController');
const { authenticate, restrictTo } = require('../middleware/auth');
const { createAppointmentValidation } = require('../middleware/validators');

// Patient routes
router.post('/', authenticate, restrictTo('patient'), createAppointmentValidation, createAppointment);
router.get('/my', authenticate, restrictTo('patient'), getMyAppointments);
router.post('/:id/checkin', authenticate, restrictTo('patient'), checkInAppointment);

// Doctor routes
router.get('/doctor', authenticate, restrictTo('doctor'), getDoctorAppointments);

// Shared routes
router.get('/:id', authenticate, getAppointmentById);
router.patch('/:id/cancel', authenticate, cancelAppointment);

module.exports = router;
