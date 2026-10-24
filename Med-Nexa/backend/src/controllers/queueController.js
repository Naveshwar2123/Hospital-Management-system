const Queue = require('../models/Queue');
const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const Consultation = require('../models/Consultation');
const supabaseService = require('../services/supabaseService');

// @desc    Get queue status for a doctor
// @route   GET /api/queue/:doctorId
const getQueueStatus = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const dateStr = req.query.date || new Date().toISOString().split('T')[0];

    const queue = await Queue.findOne({ doctorId, date: dateStr })
      .populate({
        path: 'activeQueue.patientId',
        select: 'name phone'
      })
      .populate({
        path: 'activeQueue.appointmentId',
        select: 'bookingId slotTime'
      });

    if (!queue) {
      const emptyQueue = {
        doctorId,
        date: dateStr,
        currentToken: 0,
        currentServingToken: 0,
        totalTokens: 0,
        totalTokensIssued: 0,
        activeQueue: []
      };
      return res.json({
        success: true,
        data: emptyQueue,
        queue: emptyQueue
      });
    }

    // Calculate estimated wait times
    const doctor = await DoctorProfile.findById(doctorId);
    const avgMinutes = doctor?.averageConsultationMinutes || 15;

    // Calculate dynamic average from recent consultations
    const recentConsultations = await Queue.aggregate([
      { $match: { doctorId: queue.doctorId } },
      { $unwind: '$activeQueue' },
      {
        $match: {
          'activeQueue.status': 'completed',
          'activeQueue.completedTime': { $ne: null },
          'activeQueue.calledTime': { $ne: null }
        }
      },
      { $sort: { 'activeQueue.completedTime': -1 } },
      { $limit: 5 },
      {
        $project: {
          duration: {
            $divide: [
              { $subtract: ['$activeQueue.completedTime', '$activeQueue.calledTime'] },
              60000
            ]
          }
        }
      }
    ]);

    const dynamicAvg = recentConsultations.length > 0
      ? Math.round(recentConsultations.reduce((sum, c) => sum + c.duration, 0) / recentConsultations.length)
      : avgMinutes;

    const queueData = queue.toObject();
    let waitingPosition = 0;
    queueData.activeQueue = queueData.activeQueue.map(entry => {
      if (entry.status === 'waiting') {
        waitingPosition++;
        entry.estimatedWaitMinutes = waitingPosition * dynamicAvg;
        entry.position = waitingPosition;
      }
      return entry;
    });

    res.json({
      success: true,
      data: {
        ...queueData,
        currentToken: queue.currentServingToken || 0,
        averageConsultationMinutes: dynamicAvg
      },
      queue: queueData,
      averageConsultationMinutes: dynamicAvg
    });
  } catch (error) {
    console.error('Get queue error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch queue status' });
  }
};

// @desc    Get patient's queue position
// @route   GET /api/queue/my-position/:doctorId
const getMyQueuePosition = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const dateStr = req.query.date || new Date().toISOString().split('T')[0];

    const queue = await Queue.findOne({ doctorId, date: dateStr });
    if (!queue) {
      return res.json({ success: true, position: null, message: 'No active queue' });
    }

    const myEntry = queue.activeQueue.find(
      e => e.patientId.toString() === req.user._id.toString()
    );

    if (!myEntry) {
      return res.json({ success: true, position: null, message: 'You are not in the queue' });
    }

    const waitingAhead = queue.activeQueue.filter(
      e => e.status === 'waiting' && e.tokenNumber < myEntry.tokenNumber
    ).length;

    const doctor = await DoctorProfile.findById(doctorId);
    const avgMinutes = doctor?.averageConsultationMinutes || 15;

    res.json({
      success: true,
      token: myEntry.tokenNumber,
      status: myEntry.status,
      position: myEntry.status === 'waiting' ? waitingAhead + 1 : 0,
      patientsAhead: waitingAhead,
      estimatedWaitMinutes: waitingAhead * avgMinutes,
      currentServingToken: queue.currentServingToken
    });
  } catch (error) {
    console.error('Get position error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch queue position' });
  }
};

// @desc    Call next patient (Doctor)
// @route   POST /api/queue/:doctorId/call-next
const callNextPatient = async (req, res) => {
  try {
    let doctor = await DoctorProfile.findOne({ userId: req.user._id });
    if (!doctor && req.params.doctorId) {
      doctor = await DoctorProfile.findById(req.params.doctorId);
    }
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const queue = await Queue.findOne({ doctorId: doctor._id, date: dateStr });

    if (!queue || !queue.activeQueue || queue.activeQueue.length === 0) {
      return res.json({ success: false, message: 'No patients currently in queue today' });
    }

    // Complete current patient if any
    const currentPatient = queue.activeQueue.find(e => e.status === 'in_consultation');
    if (currentPatient) {
      currentPatient.status = 'completed';
      currentPatient.completedTime = new Date();

      // Update appointment status
      await Appointment.findByIdAndUpdate(currentPatient.appointmentId, {
        status: 'completed'
      });
    }

    // Find next waiting patient
    const nextPatient = queue.activeQueue.find(e => e.status === 'waiting');
    if (!nextPatient) {
      await queue.save();
      const io = req.app.get('io');
      if (io) {
        io.to(`queue_${doctor._id}_${dateStr}`).emit('queue_updated', {
          doctorId: doctor._id,
          date: dateStr,
          queue: queue.activeQueue,
          totalTokens: queue.totalTokensIssued,
          currentServing: queue.currentServingToken,
          message: 'No more patients in queue'
        });
      }
      return res.json({ success: false, message: 'No more waiting patients in queue', queue });
    }

    // Call next patient
    nextPatient.status = 'in_consultation';
    nextPatient.calledTime = new Date();
    queue.currentServingToken = nextPatient.tokenNumber;

    // Update appointment status
    await Appointment.findByIdAndUpdate(nextPatient.appointmentId, {
      status: 'in_consultation'
    });

    await queue.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`queue_${doctor._id}_${dateStr}`).emit('queue_updated', {
        doctorId: doctor._id,
        date: dateStr,
        queue: queue.activeQueue,
        totalTokens: queue.totalTokensIssued,
        currentServing: queue.currentServingToken,
        calledPatient: nextPatient
      });

      // Notify the specific patient
      io.to(`patient_${nextPatient.patientId}`).emit('your_turn', {
        tokenNumber: nextPatient.tokenNumber,
        message: 'It\'s your turn! Please proceed to the doctor\'s cabin.'
      });
    }

    await queue.populate('activeQueue.patientId', 'name phone');

    res.json({
      success: true,
      message: `Token #${nextPatient.tokenNumber} called`,
      data: {
        tokenNumber: nextPatient.tokenNumber,
        calledPatient: nextPatient,
        currentServing: queue.currentServingToken
      },
      calledPatient: nextPatient,
      queue
    });
  } catch (error) {
    console.error('Call next error:', error);
    res.status(500).json({ success: false, message: 'Failed to call next patient' });
  }
};

// @desc    Skip patient (Doctor)
// @route   POST /api/queue/:doctorId/skip/:tokenNumber
const skipPatient = async (req, res) => {
  try {
    const doctor = await DoctorProfile.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const queue = await Queue.findOne({ doctorId: doctor._id, date: dateStr });

    if (!queue) {
      return res.status(404).json({ success: false, message: 'No active queue' });
    }

    const tokenNumber = parseInt(req.params.tokenNumber);
    const entry = queue.activeQueue.find(e => e.tokenNumber === tokenNumber);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Token not found in queue' });
    }

    entry.status = 'skipped';
    entry.completedTime = new Date();

    await Appointment.findByIdAndUpdate(entry.appointmentId, { status: 'no_show' });
    await queue.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`queue_${doctor._id}_${dateStr}`).emit('queue_updated', {
        doctorId: doctor._id,
        date: dateStr,
        queue: queue.activeQueue,
        totalTokens: queue.totalTokensIssued,
        currentServing: queue.currentServingToken
      });
    }

    res.json({ success: true, message: `Token #${tokenNumber} marked as skipped`, queue });
  } catch (error) {
    console.error('Skip patient error:', error);
    res.status(500).json({ success: false, message: 'Failed to skip patient' });
  }
};

// @desc    Complete current consultation (Doctor)
// @route   POST /api/queue/complete-current
const completeCurrentConsultation = async (req, res) => {
  try {
    const doctor = await DoctorProfile.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const queue = await Queue.findOne({ doctorId: doctor._id, date: dateStr });

    if (!queue) {
      return res.status(404).json({ success: false, message: 'No active queue' });
    }

    const currentPatient = queue.activeQueue.find(e => e.status === 'in_consultation');
    if (!currentPatient) {
      return res.status(400).json({ success: false, message: 'No patient currently in consultation' });
    }

    currentPatient.status = 'completed';
    currentPatient.completedTime = new Date();

    await Appointment.findByIdAndUpdate(currentPatient.appointmentId, {
      status: 'completed'
    });

    // Increment total patients
    await DoctorProfile.findByIdAndUpdate(doctor._id, { $inc: { totalPatients: 1 } });

    await queue.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`queue_${doctor._id}_${dateStr}`).emit('queue_updated', {
        doctorId: doctor._id,
        date: dateStr,
        queue: queue.activeQueue,
        totalTokens: queue.totalTokensIssued,
        currentServing: queue.currentServingToken
      });
    }

    res.json({ success: true, message: 'Consultation completed', queue });
  } catch (error) {
    console.error('Complete consultation error:', error);
    res.status(500).json({ success: false, message: 'Failed to complete consultation' });
  }
};

module.exports = {
  getQueueStatus,
  getMyQueuePosition,
  callNextPatient,
  skipPatient,
  completeCurrentConsultation
};
