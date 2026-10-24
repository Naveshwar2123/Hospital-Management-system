const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const Queue = require('../models/Queue');
// ==============================================================================
// GOOGLE SHEETS INTEGRATION (COMMENTED - PRESERVED FOR TEACHER EXPLANATION)
// ------------------------------------------------------------------------------
// Architectural Concept:
// Google Apps Script deployed as a Web App (doPost/doGet) serves as a serverless 
// bridge that exposes a RESTful JSON endpoint. Med-Nexa uses this service to insert 
// and update rows directly in Google Sheets tabs ('Users', 'DoctorProfiles', 'Appointments').
// Kept in codebase for academic grading and presentation purposes.
// const sheetsService = require('../services/googleSheetsService');
// ==============================================================================

// Supabase PostgreSQL Real-Time Service
const supabaseService = require('../services/supabaseService');

// @desc    Create appointment (Patient)
// @route   POST /api/appointments
const createAppointment = async (req, res) => {
  try {
    const { doctorId } = req.body;
    const appointmentDate = req.body.appointmentDate || req.body.date;
    const slotTime = req.body.slotTime || (typeof req.body.timeSlot === 'object' ? req.body.timeSlot?.startTime : req.body.timeSlot);
    const symptoms = req.body.symptoms || 'General Consultation';

    const doctor = await DoctorProfile.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    if (!doctor.isAvailable) {
      return res.status(400).json({ success: false, message: 'Doctor is currently unavailable' });
    }

    // Check if slot is already booked
    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointment = await Appointment.findOne({
      doctorId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      slotTime,
      status: { $nin: ['cancelled'] }
    });

    if (existingAppointment) {
      return res.status(400).json({ success: false, message: 'This slot is already booked' });
    }

    // Check if patient has another appointment at same time
    const patientConflict = await Appointment.findOne({
      patientId: req.user._id,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      slotTime,
      status: { $nin: ['cancelled'] }
    });

    if (patientConflict) {
      return res.status(400).json({ success: false, message: 'You already have an appointment at this time' });
    }

    const appointment = await Appointment.create({
      patientId: req.user._id,
      doctorId,
      appointmentDate: new Date(appointmentDate),
      slotTime,
      feeAmount: doctor.consultationFee,
      paymentStatus: 'pending'
    });

    await appointment.populate([
      { path: 'doctorId', populate: { path: 'userId', select: 'name email' } },
      { path: 'patientId', select: 'name email phone' }
    ]);

    // ==============================================================================
    // GOOGLE SHEETS LIVE SYNC (COMMENTED - PRESERVED FOR TEACHER EXPLANATION)
    // ------------------------------------------------------------------------------
    // The code below dispatches the new appointment payload asynchronously to the 
    // deployed Google Apps Script doPost endpoint, appending a row to the 'Appointments' tab.
    /*
    if (sheetsService.isConfigured()) {
      sheetsService.insertOne('Appointments', {
        _id: String(appointment._id),
        patientId: String(appointment.patientId?._id || appointment.patientId),
        doctorId: String(appointment.doctorId?._id || appointment.doctorId),
        doctorName: appointment.doctorId?.userId?.name || 'Doctor',
        patientName: appointment.patientId?.name || 'Patient',
        date: new Date(appointment.appointmentDate).toISOString().split('T')[0],
        slotTime: appointment.slotTime || '',
        tokenNumber: appointment.tokenNumber || 0,
        status: appointment.status || 'scheduled',
        symptoms: appointment.symptoms || '',
        consultationFee: appointment.feeAmount || 500,
        createdAt: new Date().toISOString()
      }).catch(err => console.error('Google Sheets Appointment sync warning:', err.message));
    }
    */
    // ==============================================================================

    // Active Database: Supabase PostgreSQL Real-Time Sync
    supabaseService.syncAppointment(appointment).catch(err => {
      console.warn('Supabase Appointment sync notice:', err.message);
    });

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: appointment,
      appointment
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ success: false, message: 'Failed to book appointment' });
  }
};

// @desc    Get patient appointments
// @route   GET /api/appointments/my
const getMyAppointments = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { patientId: req.user._id };
    if (status) filter.status = status;

    const appointments = await Appointment.find(filter)
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email phone avatar' } })
      .sort({ appointmentDate: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(filter);

    res.json({
      success: true,
      data: appointments,
      appointments,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch appointments' });
  }
};

// @desc    Get doctor's appointments
// @route   GET /api/appointments/doctor
const getDoctorAppointments = async (req, res) => {
  try {
    const doctor = await DoctorProfile.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    const { date, status, page = 1, limit = 20 } = req.query;
    const filter = { doctorId: doctor._id };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
    }
    if (status) filter.status = status;

    const appointments = await Appointment.find(filter)
      .populate('patientId', 'name email phone avatar')
      .sort({ slotTime: 1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(filter);

    res.json({
      success: true,
      data: appointments,
      appointments,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    console.error('Get doctor appointments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch appointments' });
  }
};

// @desc    Cancel appointment
// @route   PATCH /api/appointments/:id/cancel
const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Verify ownership
    if (appointment.patientId.toString() !== req.user._id.toString()) {
      // Check if doctor
      const doctor = await DoctorProfile.findOne({ userId: req.user._id });
      if (!doctor || appointment.doctorId.toString() !== doctor._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to cancel this appointment' });
      }
    }

    if (['completed', 'cancelled', 'in_consultation'].includes(appointment.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel appointment with status: ${appointment.status}` });
    }

    appointment.status = 'cancelled';
    appointment.cancellationReason = req.body.reason || 'Cancelled by user';
    await appointment.save();

    res.json({ success: true, message: 'Appointment cancelled', appointment });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel appointment' });
  }
};

// @desc    Check in for appointment (generates queue token)
// @route   POST /api/appointments/:id/checkin
const checkInAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (appointment.status !== 'scheduled') {
      return res.status(400).json({ success: false, message: `Cannot check in. Current status: ${appointment.status}` });
    }

    // Update appointment status
    appointment.status = 'checked_in';
    appointment.paymentStatus = 'paid';
    await appointment.save();

    // Add to queue with atomic token generation
    const dateStr = new Date().toISOString().split('T')[0];
    const queue = await Queue.findOneAndUpdate(
      { doctorId: appointment.doctorId, date: dateStr },
      {
        $inc: { totalTokensIssued: 1 },
        $setOnInsert: { currentServingToken: 0 }
      },
      { upsert: true, new: true }
    );

    const tokenNumber = queue.totalTokensIssued;

    // Add patient to active queue
    queue.activeQueue.push({
      tokenNumber,
      appointmentId: appointment._id,
      patientId: appointment.patientId,
      checkInTime: new Date(),
      status: 'waiting'
    });
    await queue.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`queue_${appointment.doctorId}_${dateStr}`).emit('queue_updated', {
        doctorId: appointment.doctorId,
        date: dateStr,
        queue: queue.activeQueue,
        totalTokens: queue.totalTokensIssued,
        currentServing: queue.currentServingToken
      });
    }

    res.json({
      success: true,
      message: 'Check-in successful',
      tokenNumber,
      queuePosition: queue.activeQueue.filter(q => q.status === 'waiting').length,
      data: { tokenNumber, appointment },
      appointment
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ success: false, message: 'Failed to check in' });
  }
};

// @desc    Get appointment by ID
// @route   GET /api/appointments/:id
const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email phone avatar' } })
      .populate('patientId', 'name email phone avatar');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch appointment' });
  }
};

module.exports = {
  createAppointment,
  getMyAppointments,
  getDoctorAppointments,
  cancelAppointment,
  checkInAppointment,
  getAppointmentById
};
