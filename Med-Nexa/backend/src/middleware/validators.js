const { body, param, query, validationResult } = require('express-validator');

// Extract and format validation errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errArray = errors.array();
    return res.status(400).json({
      success: false,
      message: errArray[0]?.msg || 'Validation failed',
      errors: errArray.map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Auth validators
const registerValidation = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').customSanitizer(v => String(v || '').replace(/\D/g, '').slice(-10)).matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone number required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['patient', 'doctor']).withMessage('Role must be patient or doctor'),
  validate
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

// Appointment validators
const createAppointmentValidation = [
  body('doctorId').trim().notEmpty().withMessage('Valid doctor ID required'),
  body('appointmentDate').custom((val, { req }) => {
    const d = val || req.body.date;
    if (!d || isNaN(Date.parse(d))) {
      throw new Error('Valid appointment date is required');
    }
    return true;
  }),
  body('slotTime').custom((val, { req }) => {
    const slot = val || req.body.timeSlot;
    if (!slot) {
      throw new Error('Slot time is required');
    }
    return true;
  }),
  validate
];

// Consultation validators
const createConsultationValidation = [
  body('appointmentId').trim().notEmpty().withMessage('Valid appointment ID required'),
  body('diagnosis').trim().notEmpty().withMessage('Diagnosis is required'),
  body('prescriptions').optional().isArray().withMessage('Prescriptions must be an array'),
  body('prescriptions.*.medicineName').optional().trim().notEmpty().withMessage('Medicine name required'),
  body('prescriptions.*.dosage').optional().notEmpty().withMessage('Dosage required'),
  body('prescriptions.*.frequency').optional().notEmpty().withMessage('Frequency required'),
  body('prescriptions.*.durationDays').optional().isInt({ min: 1 }).withMessage('Duration must be at least 1 day'),
  validate
];

// Doctor profile validators
const doctorProfileValidation = [
  body('specialization').trim().notEmpty().withMessage('Specialization is required'),
  body('qualification').trim().notEmpty().withMessage('Qualification is required'),
  body('consultationFee').isFloat({ min: 0 }).withMessage('Valid consultation fee required'),
  validate
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  createAppointmentValidation,
  createConsultationValidation,
  doctorProfileValidation
};
