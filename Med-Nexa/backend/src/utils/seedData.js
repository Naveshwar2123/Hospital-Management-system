const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');

const seedDoctors = async () => {
  try {
    const doctorCount = await User.countDocuments({ role: 'doctor' });
    if (doctorCount === 0) {
      console.log('🌱 Seeding demo doctors...');

    const doctors = [
      {
        name: 'Dr. Priya Sharma',
        email: 'priya.sharma@navihospital.com',
        phone: '9876543210',
        specialization: 'Cardiology',
        qualification: 'MD, DM (Cardiology)',
        experience: 12,
        consultationFee: 800,
        bio: 'Senior cardiologist with 12+ years of experience in interventional cardiology and cardiac rehabilitation.',
        rating: 4.8
      },
      {
        name: 'Dr. Rajesh Kumar',
        email: 'rajesh.kumar@navihospital.com',
        phone: '9876543211',
        specialization: 'Orthopedics',
        qualification: 'MS (Ortho), Fellowship in Sports Medicine',
        experience: 15,
        consultationFee: 700,
        bio: 'Expert in joint replacement surgery, sports injuries, and spine disorders.',
        rating: 4.7
      },
      {
        name: 'Dr. Anjali Mehta',
        email: 'anjali.mehta@navihospital.com',
        phone: '9876543212',
        specialization: 'Dermatology',
        qualification: 'MD (Dermatology)',
        experience: 8,
        consultationFee: 600,
        bio: 'Specialist in cosmetic dermatology, skin allergies, and laser treatments.',
        rating: 4.9
      },
      {
        name: 'Dr. Vikram Singh',
        email: 'vikram.singh@navihospital.com',
        phone: '9876543213',
        specialization: 'Pediatrics',
        qualification: 'MD (Pediatrics), DCH',
        experience: 10,
        consultationFee: 500,
        bio: 'Compassionate pediatrician specializing in newborn care, vaccinations, and child development.',
        rating: 4.6
      },
      {
        name: 'Dr. Sneha Patel',
        email: 'sneha.patel@navihospital.com',
        phone: '9876543214',
        specialization: 'Neurology',
        qualification: 'DM (Neurology)',
        experience: 14,
        consultationFee: 900,
        bio: 'Neurologist specializing in epilepsy, stroke rehabilitation, and neurodegenerative disorders.',
        rating: 4.8
      },
      {
        name: 'Dr. Arjun Reddy',
        email: 'arjun.reddy@navihospital.com',
        phone: '9876543215',
        specialization: 'General Medicine',
        qualification: 'MBBS, MD (Internal Medicine)',
        experience: 6,
        consultationFee: 400,
        bio: 'Internal medicine physician with expertise in diabetes management and preventive healthcare.',
        rating: 4.5
      },
      {
        name: 'Dr. Kavita Desai',
        email: 'kavita.desai@navihospital.com',
        phone: '9876543216',
        specialization: 'Gynecology',
        qualification: 'MS (OBG), Fellowship in Reproductive Medicine',
        experience: 11,
        consultationFee: 750,
        bio: 'Experienced gynecologist specializing in high-risk pregnancies and minimally invasive surgery.',
        rating: 4.7
      },
      {
        name: 'Dr. Manish Gupta',
        email: 'manish.gupta@navihospital.com',
        phone: '9876543217',
        specialization: 'ENT',
        qualification: 'MS (ENT)',
        experience: 9,
        consultationFee: 550,
        bio: 'ENT specialist with expertise in sinus surgery, hearing disorders, and sleep apnea treatment.',
        rating: 4.6
      }
    ];

    for (const doc of doctors) {
      const user = await User.create({
        name: doc.name,
        email: doc.email,
        phone: doc.phone,
        passwordHash: 'doctor123',
        role: 'doctor'
      });

      await DoctorProfile.create({
        userId: user._id,
        specialization: doc.specialization,
        qualification: doc.qualification,
        experience: doc.experience,
        consultationFee: doc.consultationFee,
        bio: doc.bio,
        rating: doc.rating,
        averageConsultationMinutes: 15,
        workingHours: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '13:00', maxSlots: 16, isActive: true },
          { dayOfWeek: 1, startTime: '14:00', endTime: '17:00', maxSlots: 12, isActive: true },
          { dayOfWeek: 2, startTime: '09:00', endTime: '13:00', maxSlots: 16, isActive: true },
          { dayOfWeek: 2, startTime: '14:00', endTime: '17:00', maxSlots: 12, isActive: true },
          { dayOfWeek: 3, startTime: '09:00', endTime: '13:00', maxSlots: 16, isActive: true },
          { dayOfWeek: 3, startTime: '14:00', endTime: '17:00', maxSlots: 12, isActive: true },
          { dayOfWeek: 4, startTime: '09:00', endTime: '13:00', maxSlots: 16, isActive: true },
          { dayOfWeek: 4, startTime: '14:00', endTime: '17:00', maxSlots: 12, isActive: true },
          { dayOfWeek: 5, startTime: '09:00', endTime: '13:00', maxSlots: 16, isActive: true },
          { dayOfWeek: 5, startTime: '14:00', endTime: '17:00', maxSlots: 12, isActive: true },
          { dayOfWeek: 6, startTime: '09:00', endTime: '13:00', maxSlots: 16, isActive: true },
        ],
        isAvailable: true
      });
    }

    console.log(`✅ ${doctors.length} demo doctors seeded successfully`);
    } else {
      console.log(`ℹ️  ${doctorCount} doctors already exist.`);
    }
  } catch (error) {
    console.error('❌ Seed error:', error.message);
  }

  try {
    const Appointment = require('../models/Appointment');
    const Queue = require('../models/Queue');

    // Ensure Demo Patient exists (support both mednexa.com and navihospital.com)
    let patient = await User.findOne({ email: { $in: ['patient@mednexa.com', 'patient@navihospital.com'] } });
    if (!patient) {
      patient = await User.create({
        name: 'Rahul Verma',
        email: 'patient@mednexa.com',
        phone: '9876543299',
        passwordHash: 'patient123',
        role: 'patient'
      });
      console.log('✅ Demo patient seeded: patient@mednexa.com / patient123');
    }

    // Ensure Demo Appointment & Queue for Dr. Priya Sharma today
    const priyaUser = await User.findOne({ email: { $in: ['priya.sharma@mednexa.com', 'priya.sharma@navihospital.com'] } });
    if (priyaUser) {
      const priyaDoc = await DoctorProfile.findOne({ userId: priyaUser._id });
      if (priyaDoc && patient) {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        let queue = await Queue.findOne({ doctorId: priyaDoc._id, date: dateStr });
        if (!queue || queue.activeQueue.length === 0) {
          const appt1 = await Appointment.create({
            patientId: patient._id,
            doctorId: priyaDoc._id,
            appointmentDate: today,
            slotTime: '10:00',
            status: 'checked_in',
            feeAmount: 800,
            paymentStatus: 'paid'
          });

          await Queue.findOneAndUpdate(
            { doctorId: priyaDoc._id, date: dateStr },
            {
              $set: {
                currentServingToken: 0,
                totalTokensIssued: 1,
                activeQueue: [
                  {
                    tokenNumber: 1,
                    appointmentId: appt1._id,
                    patientId: patient._id,
                    checkInTime: new Date(),
                    status: 'waiting'
                  }
                ]
              }
            },
            { upsert: true }
          );
          console.log('✅ Demo patient added to Dr. Priya Sharma OPD queue (Token #1)');
        }
      }
    }
  } catch (e) {
    console.error('Demo patient/queue seed notice:', e.message);
  }
};

module.exports = seedDoctors;
