import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import socketService from '../../services/socket';
import {
  Users, Play, SkipForward, CheckCircle2, Clock,
  Volume2, AlertCircle, RefreshCw, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

const ActiveQueueManager = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [apptsRes, docRes] = await Promise.all([
        api.get('/appointments/doctor'),
        api.get('/doctors/profile').catch(() => ({ data: { data: {} } }))
      ]);
      setAppointments(apptsRes.data.data || []);
      setDoctorProfile(docRes.data?.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load queue');
    } finally {
      setLoading(false);
    }
  };

  const doctorId = doctorProfile?._id || user?._id;

  // Socket setup
  useEffect(() => {
    if (!doctorId) return;
    socketService.joinQueue(doctorId);

    const handleQueueChange = () => {
      fetchData();
    };

    socketService.onQueueUpdate(handleQueueChange);
    socketService.onPatientCalled(handleQueueChange);

    return () => {
      socketService.leaveQueue(doctorId);
      socketService.off('queue_update', handleQueueChange);
      socketService.off('patient_called', handleQueueChange);
    };
  }, [doctorId]);

  const handleCallNext = async () => {
    try {
      const res = await api.post(`/queue/${doctorId}/call-next`);
      if (res.data.success) {
        const tokenNum = res.data.data?.tokenNumber || res.data.calledPatient?.tokenNumber || '';
        toast.success(`Patient Token #${tokenNum} Called!`);
        fetchData();
      } else {
        toast.info(res.data.message || 'No patients waiting in queue');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'No patients waiting to call');
    }
  };

  const handleSkip = async (tokenNumber) => {
    if (!tokenNumber) return;
    try {
      const res = await api.post(`/queue/${doctorId}/skip/${tokenNumber}`);
      if (res.data.success) {
        toast.warning(`Token #${tokenNumber} skipped.`);
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not skip patient');
    }
  };

  const inProgress = appointments.find(a => ['in-progress', 'in_consultation'].includes(a.status));
  const waitingPatients = appointments.filter(a => ['checked-in', 'checked_in'].includes(a.status));
  const completedPatients = appointments.filter(a => a.status === 'completed');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">OPD Active Queue Manager</h1>
          <p className="page-subtitle">Direct the patient flow, announce tokens, and transition consultations smoothly</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-outline" onClick={fetchData}>
            <RefreshCw size={16} /> Sync Queue
          </button>
          <button className="btn btn-primary" onClick={handleCallNext}>
            <Play size={18} /> Call Next Patient
          </button>
        </div>
      </div>

      {/* Main active patient station */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: 24, marginBottom: 28 }}>
        <div className="card" style={{ padding: 28, border: inProgress ? '2px solid var(--primary-500)' : '1px solid var(--gray-200)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <span className={`badge badge-${inProgress ? 'warning' : 'info'}`} style={{ fontSize: 13 }}>
              {inProgress ? '● Currently In Consultation Room' : '○ Room Waiting for Patient'}
            </span>
            {inProgress && (
              <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                Started: {inProgress.timeSlot?.startTime}
              </span>
            )}
          </div>

          {inProgress ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: 'var(--radius-lg)',
                  background: 'var(--primary-600)', color: '#fff',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}>
                  <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>TOKEN</span>
                  <strong style={{ fontSize: 26, fontWeight: 900 }}>#{inProgress.tokenNumber}</strong>
                </div>

                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>
                    {inProgress.patientId?.userId?.name || inProgress.patientId?.name || 'Patient'}
                  </h2>
                  <p style={{ margin: 0, color: 'var(--gray-600)', fontSize: 14 }}>
                    Age: {inProgress.patientId?.age || 30} • Gender: {inProgress.patientId?.gender || 'N/A'} • Contact: {inProgress.patientId?.phone || 'N/A'}
                  </p>
                </div>
              </div>

              <div style={{ padding: 16, background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', marginBottom: 24, fontSize: 13 }}>
                <strong style={{ color: 'var(--gray-700)' }}>Chief Symptoms:</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--gray-800)', fontSize: 14 }}>
                  {inProgress.symptoms || 'General OPD consultation'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  className="btn btn-outline"
                  onClick={() => handleSkip(inProgress.tokenNumber)}
                >
                  <SkipForward size={16} /> Skip Patient
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => navigate(`/doctor/consultations?appointmentId=${inProgress._id}`)}
                >
                  <FileText size={18} /> Write Prescription & Complete
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Clock size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
              <h3>Consultation Room Is Empty</h3>
              <p style={{ color: 'var(--gray-500)', marginBottom: 20 }}>
                {waitingPatients.length > 0
                  ? `${waitingPatients.length} patient(s) checked-in and waiting in the lobby.`
                  : 'No patients waiting in queue right now.'}
              </p>
              {waitingPatients.length > 0 && (
                <button className="btn btn-primary" onClick={handleCallNext}>
                  <Play size={18} /> Call Token #{waitingPatients[0].tokenNumber} ({waitingPatients[0].patientId?.userId?.name || 'Next'})
                </button>
              )}
            </div>
          )}
        </div>

        {/* Queue Metrics Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Queue Status at a Glance</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--gray-600)' }}>Waiting in Lobby:</span>
                <span className="badge badge-warning">{waitingPatients.length} Patients</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--gray-600)' }}>Completed Consultations:</span>
                <span className="badge badge-success">{completedPatients.length} Patients</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--gray-600)' }}>Avg Consultation Duration:</span>
                <strong>~12 mins</strong>
              </div>
            </div>
          </div>

          <div className="card" style={{ background: 'var(--primary-50)', border: '1px solid var(--primary-200)' }}>
            <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary-800)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Volume2 size={18} /> Public Announcement
            </h4>
            <p style={{ fontSize: 13, color: 'var(--primary-700)', margin: 0, lineHeight: 1.5 }}>
              Clicking &ldquo;Call Next Patient&rdquo; will automatically update the patient&apos;s mobile display and trigger a sound alert in the waiting lounge.
            </p>
          </div>
        </div>
      </div>

      {/* Waiting Lobby Patients List */}
      <div className="card">
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
          Waiting Lobby ({waitingPatients.length})
        </h3>

        {waitingPatients.length === 0 ? (
          <p style={{ color: 'var(--gray-500)', textAlign: 'center', padding: 24 }}>No checked-in patients waiting.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Token #</th>
                  <th>Patient Name</th>
                  <th>Check-In Time</th>
                  <th>Symptoms</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {waitingPatients.map((p, idx) => (
                  <tr key={p._id}>
                    <td>
                      <span style={{ fontWeight: 800, color: 'var(--primary-600)', fontSize: 16 }}>
                        #{p.tokenNumber}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {p.patientId?.userId?.name || p.patientId?.name || 'Patient'}
                    </td>
                    <td>{p.timeSlot?.startTime}</td>
                    <td style={{ maxWidth: 260 }}>{p.symptoms || 'General'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={async () => {
                            try {
                              await api.post(`/queue/${doctorId}/call-next`);
                              toast.success(`Called Token #${p.tokenNumber}`);
                              fetchData();
                            } catch (e) {
                              toast.error(e.response?.data?.message || 'Error');
                            }
                          }}
                        >
                          Call Now
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleSkip(p.tokenNumber)}
                        >
                          Skip
                        </button>
                      </div>
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

export default ActiveQueueManager;
