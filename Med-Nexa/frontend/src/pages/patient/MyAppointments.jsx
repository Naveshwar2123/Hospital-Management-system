import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Calendar, Clock, CheckCircle2, XCircle, AlertCircle,
  FileText, ArrowRight, UserCheck, Stethoscope
} from 'lucide-react';
import toast from 'react-hot-toast';

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/appointments/my');
      setAppointments(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (appointmentId) => {
    try {
      const res = await api.post(`/appointments/${appointmentId}/checkin`);
      if (res.data.success) {
        toast.success(`Checked-in! Assigned Token #${res.data.data.tokenNumber}`);
        fetchAppointments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    }
  };

  const handleCancel = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      const res = await api.patch(`/appointments/${appointmentId}/cancel`, {
        reason: 'Patient requested cancellation'
      });
      if (res.data.success) {
        toast.success('Appointment cancelled');
        fetchAppointments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancellation failed');
    }
  };

  const filteredAppointments = appointments.filter(appt => {
    if (activeTab === 'upcoming') {
      return ['confirmed', 'scheduled', 'checked-in', 'checked_in', 'in-progress', 'in_consultation'].includes(appt.status);
    }
    if (activeTab === 'completed') {
      return appt.status === 'completed';
    }
    if (activeTab === 'cancelled') {
      return ['cancelled', 'no-show', 'no_show'].includes(appt.status);
    }
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Appointments</h1>
          <p className="page-subtitle">Track, check-in, or manage all your scheduled healthcare consultations</p>
        </div>
        <Link to="/patient/doctors" className="btn btn-primary">
          <Stethoscope size={18} /> Book New Visit
        </Link>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid var(--gray-200)', marginBottom: 24, paddingBottom: 8 }}>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`btn btn-sm ${activeTab === 'upcoming' ? 'btn-primary' : 'btn-ghost'}`}
        >
          Upcoming ({appointments.filter(a => ['confirmed', 'scheduled', 'checked-in', 'checked_in', 'in-progress', 'in_consultation'].includes(a.status)).length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`btn btn-sm ${activeTab === 'completed' ? 'btn-primary' : 'btn-ghost'}`}
        >
          Completed ({appointments.filter(a => a.status === 'completed').length})
        </button>
        <button
          onClick={() => setActiveTab('cancelled')}
          className={`btn btn-sm ${activeTab === 'cancelled' ? 'btn-primary' : 'btn-ghost'}`}
        >
          Cancelled ({appointments.filter(a => ['cancelled', 'no-show'].includes(a.status)).length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner"></div></div>
      ) : filteredAppointments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <Calendar size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <h3>No {activeTab} appointments</h3>
          <p style={{ color: 'var(--gray-500)', marginBottom: 16 }}>
            {activeTab === 'upcoming' ? 'Schedule a new consultation with our doctors anytime.' : 'No appointment records under this tab.'}
          </p>
          {activeTab === 'upcoming' && (
            <Link to="/patient/doctors" className="btn btn-primary">
              Book Appointment
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filteredAppointments.map(appt => (
            <div key={appt._id} className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 'var(--radius-md)',
                    background: 'var(--primary-50)', color: 'var(--primary-700)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <span style={{ fontSize: 10, textTransform: 'uppercase', fontWeight: 700 }}>TOKEN</span>
                    <strong style={{ fontSize: 18 }}>#{appt.tokenNumber}</strong>
                  </div>

                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>
                      Dr. {appt.doctorId?.userId?.name || 'Specialist'}
                    </h3>
                    <p style={{ color: 'var(--gray-600)', margin: '0 0 8px', fontSize: 14 }}>
                      {appt.doctorId?.specialization} • Room {appt.doctorId?.roomNumber || '101'}
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13, color: 'var(--gray-600)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={16} /> {new Date(appt.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={16} /> {appt.timeSlot?.startTime} - {appt.timeSlot?.endTime}
                      </span>
                    </div>

                    {appt.symptoms && (
                      <p style={{ marginTop: 10, fontSize: 13, color: 'var(--gray-600)', fontStyle: 'italic' }}>
                        Symptoms: &ldquo;{appt.symptoms}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                  <span className={`badge badge-${
                    appt.status === 'confirmed' ? 'info' :
                    appt.status === 'checked-in' ? 'primary' :
                    appt.status === 'in-progress' ? 'warning' :
                    appt.status === 'completed' ? 'success' : 'danger'
                  }`} style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {appt.status}
                  </span>

                  <div style={{ display: 'flex', gap: 10 }}>
                    {['confirmed', 'scheduled'].includes(appt.status) && (
                      <>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleCancel(appt._id)}
                        >
                          Cancel
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleCheckIn(appt._id)}
                        >
                          Check In Now
                        </button>
                      </>
                    )}

                    {['checked-in', 'checked_in', 'in-progress', 'in_consultation'].includes(appt.status) && (
                      <Link to="/patient/queue" className="btn btn-primary btn-sm">
                        Live Token Tracker
                      </Link>
                    )}

                    {appt.status === 'completed' && (
                      <Link to="/patient/records" className="btn btn-outline btn-sm">
                        <FileText size={16} /> View Prescription
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyAppointments;
