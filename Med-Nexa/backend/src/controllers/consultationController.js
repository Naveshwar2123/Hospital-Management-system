const Consultation = require('../models/Consultation');
const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');

// @desc    Create consultation record (Doctor)
// @route   POST /api/consultations
const createConsultation = async (req, res) => {
  try {
    const doctor = await DoctorProfile.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    const { appointmentId, diagnosis, symptoms, prescriptions, doctorNotes, followUpDate, vitalSigns } = req.body;

    // Verify appointment belongs to this doctor
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctorId: doctor._id
    });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found or not yours' });
    }

    // Check if consultation already exists
    const existing = await Consultation.findOne({ appointmentId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Consultation record already exists for this appointment' });
    }

    const consultation = await Consultation.create({
      appointmentId,
      patientId: appointment.patientId,
      doctorId: doctor._id,
      diagnosis,
      symptoms: symptoms || '',
      prescriptions: prescriptions || [],
      doctorNotes: doctorNotes || '',
      followUpDate: followUpDate || null,
      vitalSigns: vitalSigns || {}
    });

    res.status(201).json({
      success: true,
      message: 'Consultation record created',
      consultation
    });
  } catch (error) {
    console.error('Create consultation error:', error);
    res.status(500).json({ success: false, message: 'Failed to create consultation' });
  }
};

// @desc    Get consultation by appointment ID
// @route   GET /api/consultations/appointment/:appointmentId
const getConsultationByAppointment = async (req, res) => {
  try {
    const consultation = await Consultation.findOne({
      appointmentId: req.params.appointmentId
    })
      .populate('patientId', 'name email phone')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } });

    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Consultation not found' });
    }

    res.json({ success: true, consultation });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch consultation' });
  }
};

// @desc    Get patient's consultation history
// @route   GET /api/consultations/my-history
const getMyConsultationHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const consultations = await Consultation.find({ patientId: req.user._id })
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
      .populate('appointmentId', 'bookingId appointmentDate slotTime feeAmount')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Consultation.countDocuments({ patientId: req.user._id });

    res.json({
      success: true,
      consultations,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch consultation history' });
  }
};

// @desc    Get doctor's consultation records
// @route   GET /api/consultations/doctor-records
const getDoctorConsultationRecords = async (req, res) => {
  try {
    const doctor = await DoctorProfile.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    const { page = 1, limit = 20 } = req.query;

    const consultations = await Consultation.find({ doctorId: doctor._id })
      .populate('patientId', 'name email phone')
      .populate('appointmentId', 'bookingId appointmentDate slotTime feeAmount')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Consultation.countDocuments({ doctorId: doctor._id });

    res.json({
      success: true,
      consultations,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch records' });
  }
};

module.exports = {
  createConsultation,
  getConsultationByAppointment,
  getMyConsultationHistory,
  getDoctorConsultationRecords
};
