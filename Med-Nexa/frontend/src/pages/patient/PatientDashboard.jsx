import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import {
  CalendarDays, Clock, FileText, Stethoscope, ArrowRight,
  AlertCircle, CheckCircle2, ChevronRight, Activity, MapPin, User
} from 'lucide-react';
import toast from 'react-hot-toast';

const PatientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [apptRes, docRes] = await Promise.all([
        api.get('/appointments/my'),
        api.get('/doctors?limit=4')
      ]);
      setAppointments(apptRes.data.data || []);
      setDoctors(docRes.data.data || []);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (appointmentId) => {
    try {
      const res = await api.post(`/appointments/${appointmentId}/checkin`);
      if (res.data.success) {
        toast.success(`Checked in! Your Token is #${res.data.data.tokenNumber}`);
        fetchDashboardData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    }
  };

  const activeAppt = appointments.find(a => 
    ['in-progress', 'in_consultation', 'checked-in', 'checked_in', 'confirmed', 'scheduled'].includes(a.status)
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {user?.name}</h1>
          <p className="page-subtitle">Manage your healthcare appointments, track live queue, and consult records</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/patient/doctors" className="btn btn-primary">
            <Stethoscope size={18} /> Book Appointment
          </Link>
          {activeAppt && (
            <Link to="/patient/queue" className="btn btn-secondary">
              <Clock size={18} /> Live Queue
            </Link>
          )}
        </div>
      </div>

      {/* Active Token Callout if Checked-in (Bento Box Style) */}
      {activeAppt && ['checked-in', 'checked_in', 'in-progress', 'in_consultation'].includes(activeAppt.status) && (
        <div className="bento-card highlight token-callout-live" style={{
          padding: '28px 32px',
          marginBottom: '28px',
          border: '1.5px solid #86efac',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div>
            <div className="bento-pill" style={{ marginBottom: 10 }}>
              <span className="live-radar-dot" style={{ marginRight: 4 }}></span>
              Live OPD Visit in Progress
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '4px 0', color: 'var(--gray-900)' }}>
              Your Token: <span className="token-number-pulse" style={{ color: 'var(--primary-600)' }}>#{activeAppt.tokenNumber}</span> with Dr. {activeAppt.doctorId?.userId?.name}
            </h3>
            <p style={{ color: 'var(--gray-600)', margin: '4px 0 0', fontSize: 14 }}>
              Slot: {activeAppt.timeSlot?.startTime} - {activeAppt.timeSlot?.endTime} • Room {activeAppt.doctorId?.roomNumber || '101'} • Status: Check-In Confirmed
            </p>
          </div>
          <Link to="/patient/queue" className="btn btn-primary btn-lg" style={{ boxShadow: '0 4px 16px rgba(22, 163, 74, 0.35)' }}>
            Track Live Queue <ChevronRight size={18} />
          </Link>
        </div>
      )}

      {/* Stats Bento Overview */}
      <div className="bento-grid">
        <div className="bento-card bento-col-4">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--gray-500)', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Active Appointments</p>
              <div className="bento-metric" style={{ color: 'var(--primary-700)' }}>
                {appointments.filter(a => ['confirmed', 'checked-in', 'in-progress'].includes(a.status)).length}
              </div>
            </div>
            <div className="bento-icon-box">
              <CalendarDays size={22} />
            </div>
          </div>
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--primary-700)', fontWeight: 600 }}>
            <span>Verified bookings</span>
          </div>
        </div>

        <div className="bento-card bento-col-4">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--gray-500)', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Completed Visits</p>
              <div className="bento-metric">
                {appointments.filter(a => a.status === 'completed').length}
              </div>
            </div>
            <div className="bento-icon-box" style={{ background: '#f0fdf4', color: '#16a34a' }}>
              <CheckCircle2 size={22} />
            </div>
          </div>
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
            <span>Digital Rx generated</span>
          </div>
        </div>

        <div className="bento-card bento-col-4">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--gray-500)', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Available Specialists</p>
              <div className="bento-metric">
                {doctors.length || 6}+
              </div>
            </div>
            <div className="bento-icon-box" style={{ background: '#ecfdf5', color: '#059669' }}>
              <Stethoscope size={22} />
            </div>
          </div>
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#059669', fontWeight: 600 }}>
            <span>Across 8+ specialties</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Recent Appointments */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>Upcoming & Recent Appointments</h3>
            <Link to="/patient/appointments" style={{ fontSize: 14, color: 'var(--primary-600)', fontWeight: 600 }}>
              View All
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner"></div></div>
          ) : appointments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--gray-500)' }}>
              <CalendarDays size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p>No appointments scheduled yet.</p>
              <Link to="/patient/doctors" className="btn btn-primary" style={{ marginTop: 12 }}>
                Book Your First Visit
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {appointments.slice(0, 5).map((appt) => (
                <div
                  key={appt._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--gray-200)',
                    background: 'var(--gray-50)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%', background: 'var(--primary-100)',
                      color: 'var(--primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700
                    }}>
                      #{appt.tokenNumber}
                    </div>
                    <div>
                      <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
                        Dr. {appt.doctorId?.userId?.name || 'Specialist'}
                      </h4>
                      <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--gray-600)' }}>
                        {appt.doctorId?.specialization} • {new Date(appt.date).toLocaleDateString()} ({appt.timeSlot?.startTime})
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className={`badge badge-${
                      appt.status === 'confirmed' ? 'info' :
                      appt.status === 'checked-in' ? 'primary' :
                      appt.status === 'in-progress' ? 'warning' :
                      appt.status === 'completed' ? 'success' : 'danger'
                    }`}>
                      {appt.status}
                    </span>

                    {appt.status === 'confirmed' && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleCheckIn(appt._id)}
                      >
                        Check-In
                      </button>
                    )}

                    {(appt.status === 'checked-in' || appt.status === 'in-progress') && (
                      <Link to="/patient/queue" className="btn btn-secondary btn-sm">
                        View Queue
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Featured Doctors */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>Featured Specialists</h3>
            <Link to="/patient/doctors" style={{ fontSize: 14, color: 'var(--primary-600)', fontWeight: 600 }}>
              Explore
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {doctors.map(doc => (
              <div key={doc._id} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, borderBottom: '1px solid var(--gray-100)' }}>
                <div style={{
                  width: 42, height: 42, borderRadius: '50%', background: 'var(--indigo-100)',
                  color: 'var(--indigo-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700
                }}>
                  {doc.userId?.name?.charAt(0) || 'D'}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Dr. {doc.userId?.name}</h4>
                  <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>{doc.specialization} • ₹{doc.consultationFee}</span>
                </div>
                <Link to={`/patient/doctors?selected=${doc._id}`} className="btn btn-ghost btn-sm">
                  Book
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
