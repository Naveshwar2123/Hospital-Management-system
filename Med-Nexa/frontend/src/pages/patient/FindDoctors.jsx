import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  Search, Stethoscope, Star, Clock, Calendar, Shield,
  CheckCircle, ChevronRight, X, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const FindDoctors = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Booking Modal State
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [symptoms, setSymptoms] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [docRes, specRes] = await Promise.all([
        api.get('/doctors'),
        api.get('/doctors/specializations/list')
      ]);
      setDoctors(docRes.data.data || []);
      setSpecializations(['All', ...(specRes.data.data || [])]);

      // If URL has doctor query param
      const selectedId = searchParams.get('selected');
      if (selectedId && docRes.data.data) {
        const found = docRes.data.data.find(d => d._id === selectedId);
        if (found) handleOpenBooking(found);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBooking = async (doctor) => {
    setBookingDoctor(doctor);
    setSelectedSlot(null);
    fetchSlotsForDate(doctor._id, selectedDate);
  };

  const fetchSlotsForDate = async (doctorId, date) => {
    try {
      const res = await api.get(`/doctors/${doctorId}/slots?date=${date}`);
      const list = res.data.data || res.data.slots || [];
      if (list && list.length > 0) {
        setAvailableSlots(list);
      } else {
        setAvailableSlots([
          { startTime: '09:00', endTime: '09:30', isAvailable: true },
          { startTime: '09:30', endTime: '10:00', isAvailable: true },
          { startTime: '10:00', endTime: '10:30', isAvailable: true },
          { startTime: '10:30', endTime: '11:00', isAvailable: true },
          { startTime: '11:00', endTime: '11:30', isAvailable: true },
          { startTime: '14:00', endTime: '14:30', isAvailable: true },
          { startTime: '14:30', endTime: '15:00', isAvailable: true },
          { startTime: '15:00', endTime: '15:30', isAvailable: true }
        ]);
      }
    } catch (err) {
      console.error(err);
      setAvailableSlots([
        { startTime: '09:00', endTime: '09:30', isAvailable: true },
        { startTime: '09:30', endTime: '10:00', isAvailable: true },
        { startTime: '10:00', endTime: '10:30', isAvailable: true },
        { startTime: '10:30', endTime: '11:00', isAvailable: true },
        { startTime: '11:00', endTime: '11:30', isAvailable: true },
        { startTime: '14:00', endTime: '14:30', isAvailable: true },
        { startTime: '14:30', endTime: '15:00', isAvailable: true },
        { startTime: '15:00', endTime: '15:30', isAvailable: true }
      ]);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (bookingDoctor) {
      fetchSlotsForDate(bookingDoctor._id, date);
    }
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      toast.error('Please select an appointment time slot');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/appointments', {
        doctorId: bookingDoctor._id,
        date: selectedDate,
        timeSlot: selectedSlot,
        symptoms: symptoms || 'General Consultation'
      });

      if (res.data.success) {
        toast.success(`Booked successfully! Token #${res.data.data.tokenNumber}`);
        setBookingDoctor(null);
        navigate('/patient/appointments');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDoctors = doctors.filter(doc => {
    const matchSpec = selectedSpecialization === 'All' || doc.specialization === selectedSpecialization;
    const matchQuery = !searchQuery ||
      doc.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialization?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSpec && matchQuery;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Find & Book Top Doctors</h1>
          <p className="page-subtitle">Choose from verified specialists across multiple departments with live token tracking</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: 28, padding: 20 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 42 }}
              placeholder="Search by doctor name or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {specializations.map(spec => (
              <button
                key={spec}
                onClick={() => setSelectedSpecialization(spec)}
                className={`btn btn-sm ${selectedSpecialization === spec ? 'btn-primary' : 'btn-outline'}`}
                style={{ whiteSpace: 'nowrap' }}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Doctor Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner"></div></div>
      ) : filteredDoctors.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <Stethoscope size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <h3>No doctors found</h3>
          <p style={{ color: 'var(--gray-500)' }}>Try searching with a different specialty or keyword</p>
        </div>
      ) : (
        <div className="grid-3" style={{ gap: 24 }}>
          {filteredDoctors.map(doc => (
            <div key={doc._id} className="card doctor-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 'var(--radius-lg)',
                    background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, fontWeight: 800, flexShrink: 0
                  }}>
                    {doc.userId?.name?.replace(/^Dr\.\s*/i, '').charAt(0) || 'D'}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 4px' }}>
                      {doc.userId?.name?.startsWith('Dr.') ? doc.userId?.name : `Dr. ${doc.userId?.name}`}
                    </h3>
                    <span className="badge badge-primary" style={{ fontSize: 12 }}>
                      {doc.specialization}
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: 13, color: 'var(--gray-600)', minHeight: 40, lineHeight: 1.5 }}>
                  {doc.bio || `Senior Specialist with ${doc.experience || 8}+ years of clinical experience in advanced patient care.`}
                </p>

                <div style={{ margin: '16px 0', padding: '12px 16px', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: 'var(--gray-500)' }}>Experience:</span>
                    <strong>{doc.experience || 8} Years</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: 'var(--gray-500)' }}>Room / OPD:</span>
                    <strong>Room {doc.roomNumber || '102'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gray-500)' }}>Consultation Fee:</span>
                    <strong style={{ color: 'var(--emerald-600)' }}>₹{doc.consultationFee || 500}</strong>
                  </div>
                </div>
              </div>

              <button
                className="btn btn-primary btn-full"
                onClick={() => handleOpenBooking(doc)}
              >
                Book Appointment
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {bookingDoctor && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setBookingDoctor(null);
          }}
        >
          <div
            className="modal-content"
            style={{
              maxWidth: 540,
              background: '#ffffff',
              color: '#0f172a',
              borderRadius: '18px',
              padding: '28px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
              border: '1px solid #e2e8f0'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#0f172a' }}>Book Consultation</h2>
                <p style={{ margin: '4px 0 0', color: 'var(--gray-600)', fontSize: 13 }}>
                  With {bookingDoctor.userId?.name?.startsWith('Dr.') ? bookingDoctor.userId?.name : `Dr. ${bookingDoctor.userId?.name || 'Specialist'}`} ({bookingDoctor.specialization})
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={() => setBookingDoctor(null)}
                style={{ color: 'var(--gray-500)', background: 'var(--gray-100)', borderRadius: '50%', width: 36, height: 36 }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmBooking}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#1e293b' }}>Select Date</label>
                <input
                  type="date"
                  className="form-input"
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  style={{ background: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#1e293b' }}>Select Available Time Slot</label>
                {availableSlots.length === 0 ? (
                  <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>No available slots on this date.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, maxHeight: 180, overflowY: 'auto', padding: 2 }}>
                    {availableSlots.map((slot, idx) => {
                      const isSelected = selectedSlot?.startTime === slot.startTime || selectedSlot?.time === slot.time;
                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={!slot.isAvailable}
                          onClick={() => setSelectedSlot(slot)}
                          className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline'}`}
                          style={{
                            fontSize: 12,
                            padding: '8px 6px',
                            fontWeight: isSelected ? 700 : 500,
                            borderRadius: '8px',
                            opacity: slot.isAvailable ? 1 : 0.4,
                            cursor: slot.isAvailable ? 'pointer' : 'not-allowed',
                            background: isSelected ? 'var(--primary-600)' : '#ffffff',
                            color: isSelected ? '#ffffff' : '#0f172a',
                            borderColor: isSelected ? 'var(--primary-600)' : '#cbd5e1'
                          }}
                        >
                          {slot.startTime || slot.time} {slot.endTime ? `- ${slot.endTime}` : ''}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, color: '#1e293b' }}>Symptoms / Reason for Visit</label>
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="Describe what you are experiencing (e.g. fever for 3 days, headaches...)"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  style={{ background: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1' }}
                  required
                ></textarea>
              </div>

              <div style={{ padding: 14, background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', marginBottom: 20, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Consultation Fee:</span>
                  <strong>₹{bookingDoctor.consultationFee || 500}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--gray-500)' }}>
                  <span>Token Allocation:</span>
                  <span>Sequential upon check-in</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => setBookingDoctor(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                  disabled={isSubmitting || !selectedSlot}
                >
                  {isSubmitting ? 'Confirming...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindDoctors;
