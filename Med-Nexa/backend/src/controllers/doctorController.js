const DoctorProfile = require('../models/DoctorProfile');
const Appointment = require('../models/Appointment');
const Queue = require('../models/Queue');
const Consultation = require('../models/Consultation');

// @desc    Get all doctors (for patients to browse)
// @route   GET /api/doctors
const getAllDoctors = async (req, res) => {
  try {
    const { specialization, available, search, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (specialization) filter.specialization = new RegExp(specialization, 'i');
    if (available !== undefined) filter.isAvailable = available === 'true';
    
    let query = DoctorProfile.find(filter)
      .populate('userId', 'name email phone avatar')
      .sort({ rating: -1, totalPatients: -1 });

    if (search) {
      const users = await require('../models/User').find({
        name: new RegExp(search, 'i'),
        role: 'doctor'
      }).select('_id');
      const userIds = users.map(u => u._id);
      filter.$or = [
        { userId: { $in: userIds } },
        { specialization: new RegExp(search, 'i') }
      ];
      query = DoctorProfile.find(filter)
        .populate('userId', 'name email phone avatar')
        .sort({ rating: -1 });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const doctors = await query.skip(skip).limit(parseInt(limit));
    const total = await DoctorProfile.countDocuments(filter);

    res.json({
      success: true,
      data: doctors,
      doctors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch doctors' });
  }
};

// @desc    Get single doctor profile
// @route   GET /api/doctors/:id
const getDoctorById = async (req, res) => {
  try {
    const doctor = await DoctorProfile.findById(req.params.id)
      .populate('userId', 'name email phone avatar');

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    res.json({ success: true, doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch doctor profile' });
  }
};

// @desc    Get current doctor's profile
// @route   GET /api/doctors/profile
const getDoctorProfile = async (req, res) => {
  try {
    const doctor = await DoctorProfile.findOne({ userId: req.user._id })
      .populate('userId', 'name email phone avatar');
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    res.json({
      success: true,
      data: doctor,
      doctor
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch doctor profile' });
  }
};

// @desc    Update doctor profile (by doctor only)
// @route   PUT /api/doctors/profile
const updateDoctorProfile = async (req, res) => {
  try {
    const doctor = await DoctorProfile.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    const allowedUpdates = [
      'specialization', 'qualification', 'consultationFee', 'experience',
      'averageConsultationMinutes', 'workingHours', 'isAvailable', 'bio'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        doctor[field] = req.body[field];
      }
    });

    await doctor.save();
    await doctor.populate('userId', 'name email phone avatar');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: doctor,
      doctor
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

// @desc    Get doctor's available slots for a date
// @route   GET /api/doctors/:id/slots?date=YYYY-MM-DD
const getDoctorSlots = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, message: 'Date parameter required' });
    }

    const doctor = await DoctorProfile.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.getDay();
    
    // Find working hours for that day
    let schedule = doctor.workingHours?.find(wh => wh.dayOfWeek === dayOfWeek && wh.isActive);
    if (!schedule) {
      schedule = { startTime: '09:00', endTime: '16:00', isActive: true };
    }

    // Generate time slots
    const slots = [];
    const [startHour, startMin] = (schedule.startTime || '09:00').split(':').map(Number);
    const [endHour, endMin] = (schedule.endTime || '16:00').split(':').map(Number);
    const slotDuration = doctor.averageConsultationMinutes || 30;

    let currentMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    while (currentMinutes + slotDuration <= endMinutes) {
      const hours = Math.floor(currentMinutes / 60);
      const mins = currentMinutes % 60;
      slots.push(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`);
      currentMinutes += slotDuration;
    }

    // Get booked slots for this date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookedAppointments = await Appointment.find({
      doctorId: doctor._id,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ['cancelled'] }
    }).select('slotTime');

    const bookedSlotTimes = bookedAppointments.map(a => a.slotTime);

    const availableSlots = slots.map(slot => {
      const isBooked = bookedSlotTimes.includes(slot);
      const [h, m] = slot.split(':').map(Number);
      const endMin = m + slotDuration;
      const endH = h + Math.floor(endMin / 60);
      const endM = endMin % 60;
      const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
      return {
        time: slot,
        startTime: slot,
        endTime,
        isAvailable: !isBooked,
        isBooked
      };
    });

    res.json({
      success: true,
      data: availableSlots,
      slots: availableSlots,
      schedule
    });
  } catch (error) {
    console.error('Get slots error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch slots' });
  }
};

// @desc    Get doctor's dashboard stats
// @route   GET /api/doctors/dashboard/stats
const getDoctorStats = async (req, res) => {
  try {
    const doctor = await DoctorProfile.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's appointments
    const todayAppointments = await Appointment.countDocuments({
      doctorId: doctor._id,
      appointmentDate: { $gte: today, $lt: tomorrow },
      status: { $ne: 'cancelled' }
    });

    // Completed today
    const completedToday = await Appointment.countDocuments({
      doctorId: doctor._id,
      appointmentDate: { $gte: today, $lt: tomorrow },
      status: 'completed'
    });

    // Total patients
    const totalPatients = await Appointment.distinct('patientId', {
      doctorId: doctor._id,
      status: 'completed'
    });

    // Today's revenue
    const todayRevenue = await Appointment.aggregate([
      {
        $match: {
          doctorId: doctor._id,
          appointmentDate: { $gte: today, $lt: tomorrow },
          status: 'completed',
          paymentStatus: 'paid'
        }
      },
      { $group: { _id: null, total: { $sum: '$feeAmount' } } }
    ]);

    // Monthly revenue
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyRevenue = await Appointment.aggregate([
      {
        $match: {
          doctorId: doctor._id,
          appointmentDate: { $gte: startOfMonth, $lt: tomorrow },
          status: 'completed',
          paymentStatus: 'paid'
        }
      },
      { $group: { _id: null, total: { $sum: '$feeAmount' } } }
    ]);

    // Queue status
    const dateStr = today.toISOString().split('T')[0];
    const queue = await Queue.findOne({ doctorId: doctor._id, date: dateStr });

    const statsData = {
      todayAppointments,
      completedToday,
      totalPatients: totalPatients.length,
      todayRevenue: todayRevenue[0]?.total || 0,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
      queueLength: queue ? queue.activeQueue.filter(q => q.status === 'waiting').length : 0,
      currentToken: queue?.currentServingToken || 0
    };

    res.json({
      success: true,
      data: statsData,
      stats: statsData
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
};

// @desc    Get specializations list
// @route   GET /api/doctors/specializations/list
const getSpecializations = async (req, res) => {
  try {
    const specializations = await DoctorProfile.distinct('specialization');
    res.json({ success: true, data: specializations, specializations });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch specializations' });
  }
};

module.exports = {
  getAllDoctors,
  getDoctorById,
  getDoctorProfile,
  updateDoctorProfile,
  getDoctorSlots,
  getDoctorStats,
  getSpecializations
};
