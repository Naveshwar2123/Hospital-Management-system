import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import socketService from '../../services/socket';
import {
  Clock, Users, AlertCircle, CheckCircle2, ChevronRight,
  Volume2, Stethoscope, MapPin, RefreshCw, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

const LiveQueue = () => {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    fetchActiveAppointments();
  }, []);

  const fetchActiveAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/appointments/my');
      const all = res.data.data || [];
      // Prioritize active or scheduled visits
      const active = all.filter(a => ['checked-in', 'checked_in', 'in-progress', 'in_consultation', 'confirmed', 'scheduled'].includes(a.status));
      setAppointments(active);
      if (active.length > 0) {
        setSelectedAppt(active[0]);
        fetchQueueStatus(active[0].doctorId._id);
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not load appointment details');
    } finally {
      setLoading(false);
    }
  };

  const fetchQueueStatus = async (doctorId) => {
    try {
      const res = await api.get(`/queue/${doctorId}`);
      if (res.data.success) {
        setQueueData(res.data.data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!selectedAppt?.doctorId?._id) return;
    const doctorId = selectedAppt.doctorId._id;

    // Join room
    socketService.joinQueue(doctorId);

    // Listen for real-time queue updates
    const handleQueueUpdate = (data) => {
      setQueueData(prev => ({ ...prev, ...data }));
      setLastUpdated(new Date());
    };

    const handlePatientCalled = (data) => {
      if (data.tokenNumber === selectedAppt.tokenNumber) {
        toast.success(`🔔 YOUR TOKEN #${data.tokenNumber} HAS BEEN CALLED! Please proceed to Room ${selectedAppt.doctorId.roomNumber || '101'}.`, {
          duration: 10000,
          icon: '📢'
        });
        // Audio beep if supported
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = ctx.createOscillator();
          osc.connect(ctx.destination);
          osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
          osc.start();
          osc.stop(ctx.currentTime + 0.5);
        } catch (e) {}
      }
      fetchQueueStatus(doctorId);
    };

    socketService.onQueueUpdate(handleQueueUpdate);
    socketService.onPatientCalled(handlePatientCalled);

    // Polling backup every 15s
    const interval = setInterval(() => {
      fetchQueueStatus(doctorId);
    }, 15000);

    return () => {
      socketService.leaveQueue(doctorId);
      socketService.off('queue_update', handleQueueUpdate);
      socketService.off('patient_called', handlePatientCalled);
      clearInterval(interval);
    };
  }, [selectedAppt]);

  const doctor = selectedAppt?.doctorId;
  const currentToken = queueData?.currentToken || 0;
  const myToken = selectedAppt?.tokenNumber || 0;
  const patientsAhead = Math.max(0, myToken - currentToken - 1);
  const avgWaitPerPatient = queueData?.averageConsultationMinutes || 12;
  const estimatedWaitMinutes = Math.max(0, (myToken - currentToken) * avgWaitPerPatient);
  const isMyTurn = currentToken === myToken && myToken > 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Live Queue & Token Tracker</h1>
          <p className="page-subtitle">Real-time outpatient (OPD) queue status and live token updates</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--emerald-500)', display: 'inline-block' }}></span>
            Live Updates Active
          </span>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => doctor && fetchQueueStatus(doctor._id)}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner"></div></div>
      ) : appointments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <Clock size={52} style={{ opacity: 0.3, marginBottom: 16 }} />
          <h3>No Active Queue Tokens</h3>
          <p style={{ color: 'var(--gray-500)', maxWidth: 460, margin: '8px auto 20px' }}>
            You do not currently have any checked-in visits. Book a consultation or check into an existing appointment to view live queue progress.
          </p>
          <Link to="/patient/doctors" className="btn btn-primary">
            Find Doctors & Book
          </Link>
        </div>
      ) : (
        <>
          {/* Multiple active appointment switcher if more than one */}
          {appointments.length > 1 && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              {appointments.map(a => (
                <button
                  key={a._id}
                  onClick={() => {
                    setSelectedAppt(a);
                    fetchQueueStatus(a.doctorId._id);
                  }}
                  className={`btn btn-sm ${selectedAppt?._id === a._id ? 'btn-primary' : 'btn-outline'}`}
                >
                  Token #{a.tokenNumber} - Dr. {a.doctorId?.userId?.name}
                </button>
              ))}
            </div>
          )}

          {/* Turn Alert Banner */}
          {isMyTurn && (
            <div className="bento-card highlight" style={{
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              color: '#fff',
              padding: '24px 28px',
              borderRadius: 'var(--radius-xl)',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 12px 30px rgba(22, 163, 74, 0.4)',
              border: 'none'
            }}>
              <div>
                <span style={{ background: 'rgba(255,255,255,0.25)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800 }}>
                  NOW SERVING IN ROOM
                </span>
                <h2 style={{ fontSize: 26, fontWeight: 900, margin: '8px 0 4px', color: '#fff' }}>
                  It&apos;s Your Turn! Token #{myToken}
                </h2>
                <p style={{ margin: 0, opacity: 0.95, fontSize: 14 }}>
                  Please proceed immediately to Room {doctor?.roomNumber || '101'} for Dr. {doctor?.userId?.name}.
                </p>
              </div>
              <div style={{ width: 56, height: 56, borderRadius: '16px', background: '#fff', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Volume2 size={28} />
              </div>
            </div>
          )}

          {/* Main Queue Bento Dashboard Display */}
          <div className="bento-grid">
            {/* Live Token Status Bento Box (Span 8) */}
            <div className="bento-card bento-col-8" style={{ padding: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 19, fontWeight: 800, margin: 0, color: 'var(--gray-900)' }}>OPD Queue Chamber</h3>
                  <p style={{ fontSize: 13, color: 'var(--gray-500)', margin: '4px 0 0' }}>
                    Dr. {doctor?.userId?.name} • Room {doctor?.roomNumber || '101'}
                  </p>
                </div>
                <span className="bento-pill">
                  {doctor?.specialization}
                </span>
              </div>

              {/* Big Tokens Comparison (Bento style inner boxes) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, margin: '20px 0' }}>
                <div style={{
                  padding: '24px 20px',
                  borderRadius: '20px',
                  background: '#f0fdf4',
                  border: '1.5px solid #86efac',
                  textAlign: 'center'
                }}>
                  <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 800, color: '#15803d', margin: '0 0 6px' }}>
                    Currently Serving
                  </p>
                  <div style={{ fontSize: 52, fontWeight: 900, color: '#16a34a', lineHeight: 1 }}>
                    #{currentToken || 1}
                  </div>
                  <p style={{ fontSize: 12, color: '#15803d', margin: '8px 0 0', fontWeight: 600 }}>
                    In Consultation Room
                  </p>
                </div>

                <div style={{
                  padding: '24px 20px',
                  borderRadius: '20px',
                  background: isMyTurn ? '#dcfce7' : '#ffffff',
                  border: isMyTurn ? '2px solid #22c55e' : '1.5px solid #e2e8f0',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                }}>
                  <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 800, color: isMyTurn ? '#15803d' : 'var(--gray-500)', margin: '0 0 6px' }}>
                    Your Assigned Token
                  </p>
                  <div style={{ fontSize: 52, fontWeight: 900, color: isMyTurn ? '#16a34a' : 'var(--gray-900)', lineHeight: 1 }}>
                    #{myToken}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--gray-500)', margin: '8px 0 0', fontWeight: 600 }}>
                    Status: {selectedAppt?.status}
                  </p>
                </div>
              </div>

              {/* Progress timeline */}
              <div style={{ marginTop: 24, textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8, fontWeight: 700 }}>
                  <span style={{ color: 'var(--gray-700)' }}>Queue Progression</span>
                  <span style={{ color: '#16a34a' }}>
                    {isMyTurn ? 'You are Next / In Room' : `${patientsAhead} patient${patientsAhead === 1 ? '' : 's'} ahead`}
                  </span>
                </div>
                <div style={{ height: 10, background: '#e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, Math.max(15, (currentToken / Math.max(myToken, 1)) * 100))}%`,
                      background: 'linear-gradient(90deg, #4ade80, #16a34a)',
                      borderRadius: 10,
                      transition: 'width 0.6s ease'
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Wait Time & Metrics (Span 4) */}
            <div className="bento-col-4" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="bento-card highlight">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div className="bento-icon-box" style={{ width: 40, height: 40, marginBottom: 0 }}>
                    <Clock size={20} />
                  </div>
                  <h4 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--gray-900)' }}>Estimated Wait Time</h4>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 44, fontWeight: 900, color: '#16a34a', letterSpacing: -1 }}>
                    {isMyTurn ? '0' : estimatedWaitMinutes}
                  </span>
                  <span style={{ fontSize: 16, color: 'var(--gray-500)', fontWeight: 700 }}>Minutes</span>
                </div>

                <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.5, margin: 0 }}>
                  {isMyTurn
                    ? 'Doctor is ready for you! Walk in to Room ' + (doctor?.roomNumber || '101') + '.'
                    : `Dynamic estimate based on ~${avgWaitPerPatient} mins per consultation.`}
                </p>
              </div>

              <div className="bento-card">
                <h4 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14, color: 'var(--gray-900)' }}>OPD Details</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--gray-100)' }}>
                    <span style={{ color: 'var(--gray-500)' }}>Doctor:</span>
                    <strong style={{ color: 'var(--gray-900)' }}>Dr. {doctor?.userId?.name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--gray-100)' }}>
                    <span style={{ color: 'var(--gray-500)' }}>Location:</span>
                    <strong>Room {doctor?.roomNumber || '101'}, 2nd Floor</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--gray-100)' }}>
                    <span style={{ color: 'var(--gray-500)' }}>Checked-In Tokens:</span>
                    <strong>{queueData?.totalTokens || 12} Patients</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gray-500)' }}>Sync Status:</span>
                    <span style={{ color: '#16a34a', fontWeight: 700 }}>Active ({lastUpdated.toLocaleTimeString()})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LiveQueue;
