const express = require('express');
const router = express.Router();
const {
  getQueueStatus,
  getMyQueuePosition,
  callNextPatient,
  skipPatient,
  completeCurrentConsultation
} = require('../controllers/queueController');
const { authenticate, restrictTo } = require('../middleware/auth');

// Patient routes
router.get('/my-position/:doctorId', authenticate, restrictTo('patient'), getMyQueuePosition);

// Doctor routes
router.post('/:doctorId/call-next', authenticate, restrictTo('doctor'), callNextPatient);
router.post('/:doctorId/skip/:tokenNumber', authenticate, restrictTo('doctor'), skipPatient);
router.post('/complete-current', authenticate, restrictTo('doctor'), completeCurrentConsultation);

// Shared
router.get('/:doctorId', authenticate, getQueueStatus);

module.exports = router;
