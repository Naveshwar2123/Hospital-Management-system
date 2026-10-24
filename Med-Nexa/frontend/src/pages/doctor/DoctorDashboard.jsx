import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import socketService from '../../services/socket';
import {
  Users, Calendar, Clock, CheckCircle2, AlertCircle,
  Play, SkipForward, FilePlus, ChevronRight, Stethoscope, DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todayTotal: 0,
    waitingCount: 0,
    completedCount: 0,
    currentToken: 0
  });
  const [appointments, setAppointments] = useState([]);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [doctorProfile, setDoctorProfile] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [apptsRes, statsRes, profRes] = await Promise.all([
        api.get('/appointments/doctor'),
        api.get('/doctors/dashboard/stats').catch(() => ({ data: { data: {} } })),
        api.get('/doctors/profile').catch(() => ({ data: { data: {} } }))
      ]);

      const appts = apptsRes.data.data || [];
      setAppointments(appts);
      setDoctorProfile(profRes.data?.data);

      const inProgress = appts.find(a => ['in-progress', 'in_consultation'].includes(a.status));
      setCurrentPatient(inProgress || null);

      const waiting = appts.filter(a => ['checked-in', 'checked_in'].includes(a.status)).length;
      const completed = appts.filter(a => a.status === 'completed').length;

      setStats({
        todayTotal: appts.length,
        waitingCount: waiting,
        completedCount: completed,
        currentToken: inProgress?.tokenNumber || (completed > 0 ? completed : 0)
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCallNext = async () => {
    try {
      const docId = doctorProfile?._id || user?._id;
      const res = await api.post(`/queue/${docId}/call-next`);
      if (res.data.success) {
        const tokenNum = res.data.data?.tokenNumber || res.data.calledPatient?.tokenNumber || '';
        toast.success(`Called Token #${tokenNum}!`);
        fetchDashboard();
      } else {
        toast.info(res.data.message || 'No patients waiting in queue');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'No patients waiting in queue');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Doctor Workspace</h1>
          <p className="page-subtitle">Welcome, Dr. {user?.name}. OPD Queue & Consultation Operations.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-primary" onClick={handleCallNext}>
            <Play size={18} /> Call Next Patient
          </button>
          <Link to="/doctor/queue" className="btn btn-secondary">
            <Users size={18} /> Queue Manager
          </Link>
        </div>
      </div>

      {/* Stats Bento Box Grid */}
      <div className="bento-grid">
        <div className="bento-card bento-col-3 highlight token-callout-live" style={{ border: '1.5px solid #86efac' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--primary-700)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6 }}>Currently Serving</p>
              <div className="bento-metric token-number-pulse" style={{ color: 'var(--primary-700)' }}>
                {stats.currentToken ? `#${stats.currentToken}` : '--'}
              </div>
            </div>
            <div className="bento-icon-box" style={{ background: '#dcfce7', color: '#15803d' }}>
              <Clock size={22} />
            </div>
          </div>
          <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--primary-100)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--primary-700)', fontWeight: 700 }}>
            <span>Live OPD Chamber</span>
          </div>
        </div>

        <div className="bento-card bento-col-3">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--gray-500)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6 }}>Waiting in OPD</p>
              <div className="bento-metric" style={{ color: stats.waitingCount > 0 ? '#d97706' : 'var(--gray-900)' }}>
                {stats.waitingCount}
              </div>
            </div>
            <div className="bento-icon-box" style={{ background: '#fffbeb', color: '#d97706', borderColor: '#fde68a' }}>
              <Users size={22} />
            </div>
          </div>
          <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#d97706', fontWeight: 700 }}>
            <span>Next patients in queue</span>
          </div>
        </div>

        <div className="bento-card bento-col-3">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--gray-500)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6 }}>Completed Today</p>
              <div className="bento-metric">
                {stats.completedCount}
              </div>
            </div>
            <div className="bento-icon-box">
              <CheckCircle2 size={22} />
            </div>
          </div>
          <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#16a34a', fontWeight: 700 }}>
            <span>Consultations finished</span>
          </div>
        </div>

        <div className="bento-card bento-col-3">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--gray-500)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6 }}>Total Scheduled</p>
              <div className="bento-metric">
                {stats.todayTotal}
              </div>
            </div>
            <div className="bento-icon-box" style={{ background: '#f8fafc', color: 'var(--gray-700)', borderColor: '#e2e8f0' }}>
              <Calendar size={22} />
            </div>
          </div>
          <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--gray-500)', fontWeight: 600 }}>
            <span>Full day roster</span>
          </div>
        </div>
      </div>

      {/* Active Consultation Bento Spotlight */}
      <div className={`bento-card ${currentPatient ? 'token-callout-live' : ''}`} style={{
        background: currentPatient ? 'linear-gradient(145deg, #f0fdf4 0%, #ffffff 100%)' : '#ffffff',
        border: currentPatient ? '1.5px solid #86efac' : '1px solid rgba(22, 163, 74, 0.15)',
        marginBottom: 28,
        padding: '28px 32px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className={`bento-pill`} style={{
                background: currentPatient ? '#dcfce7' : '#f1f5f9',
                color: currentPatient ? '#15803d' : '#475569',
                borderColor: currentPatient ? '#86efac' : '#cbd5e1'
              }}>
                <span className="live-radar-dot" style={{ marginRight: 4 }}></span>
                {currentPatient ? 'In-Room Active Consultation' : 'Chamber Open & Ready'}
              </span>
              {currentPatient && (
                <span className="badge badge-primary token-number-pulse">Token #{currentPatient.tokenNumber}</span>
              )}
            </div>

            {currentPatient ? (
              <div style={{ marginTop: 14 }}>
                <h2 style={{ fontSize: 24, fontWeight: 900, margin: 0, color: 'var(--gray-900)' }}>
                  {currentPatient.patientId?.userId?.name || currentPatient.patientId?.name || 'Patient'}
                </h2>
                <p style={{ color: 'var(--gray-600)', margin: '6px 0 0', fontSize: 14 }}>
                  Age: {currentPatient.patientId?.age || 28} • Gender: {currentPatient.patientId?.gender || 'N/A'} • Phone: {currentPatient.patientId?.phone || 'N/A'}
                </p>
                <div style={{ margin: '10px 0 0', padding: '10px 14px', background: '#ffffff', borderRadius: '12px', border: '1px solid #dcfce7', display: 'inline-block', fontSize: 13, color: 'var(--gray-800)' }}>
                  <strong style={{ color: 'var(--primary-700)' }}>Chief Complaint:</strong> &ldquo;{currentPatient.symptoms || 'General Checkup'}&rdquo;
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 10 }}>
                <h3 style={{ fontSize: 19, fontWeight: 800, margin: 0 }}>Chamber is ready for the next patient</h3>
                <p style={{ color: 'var(--gray-500)', fontSize: 13, margin: '4px 0 0' }}>
                  Click &ldquo;Call Next Patient&rdquo; below to call the next waiting patient into the consultation chamber.
                </p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            {currentPatient ? (
              <button
                className="btn btn-primary btn-lg"
                onClick={() => navigate(`/doctor/consultations?appointmentId=${currentPatient._id}`)}
                style={{ boxShadow: '0 4px 16px rgba(22, 163, 74, 0.35)' }}
              >
                <FilePlus size={18} /> Write Prescription & Complete
              </button>
            ) : (
              <button className="btn btn-primary btn-lg" onClick={handleCallNext} style={{ boxShadow: '0 4px 16px rgba(22, 163, 74, 0.35)' }}>
                <Play size={18} /> Call Next Patient
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Today's Queue List Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>Today&apos;s Patient Queue</h3>
          <Link to="/doctor/appointments" style={{ fontSize: 14, color: 'var(--primary-600)', fontWeight: 600 }}>
            Full Schedule
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner"></div></div>
        ) : appointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--gray-500)' }}>
            <Calendar size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p>No patients scheduled for today.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Patient</th>
                  <th>Time Slot</th>
                  <th>Symptoms</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(appt => (
                  <tr key={appt._id}>
                    <td>
                      <span style={{ fontWeight: 800, color: 'var(--primary-700)', fontSize: 15 }}>
                        #{appt.tokenNumber}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{appt.patientId?.userId?.name || appt.patientId?.name || 'Patient'}</div>
                      <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>{appt.patientId?.phone || 'Phone'}</span>
                    </td>
                    <td>{appt.timeSlot?.startTime} - {appt.timeSlot?.endTime}</td>
                    <td style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {appt.symptoms || 'General'}
                    </td>
                    <td>
                      <span className={`badge badge-${
                        appt.status === 'confirmed' ? 'info' :
                        appt.status === 'checked-in' ? 'primary' :
                        appt.status === 'in-progress' ? 'warning' :
                        appt.status === 'completed' ? 'success' : 'danger'
                      }`}>
                        {appt.status}
                      </span>
                    </td>
                    <td>
                      {['in-progress', 'in_consultation'].includes(appt.status) ? (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => navigate(`/doctor/consultations?appointmentId=${appt._id}`)}
                        >
                          Prescribe
                        </button>
                      ) : ['checked-in', 'checked_in'].includes(appt.status) ? (
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={async () => {
                            try {
                              const docId = doctorProfile?._id || user?._id;
                              const res = await api.post(`/queue/${docId}/call-next`);
                              if (res.data.success) {
                                toast.success(`Called token #${res.data.data?.tokenNumber || appt.tokenNumber || 1}`);
                                fetchDashboard();
                              } else {
                                toast.info(res.data.message || 'No patients waiting in queue');
                              }
                            } catch (e) {
                              toast.error(e.response?.data?.message || 'Error calling patient');
                            }
                          }}
                        >
                          Call
                        </button>
                      ) : (
                        <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>--</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
