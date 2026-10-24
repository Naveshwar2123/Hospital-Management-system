import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  Calendar, Clock, User, Phone, CheckCircle2,
  AlertCircle, Search, Filter, Play, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

const DoctorAppointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/appointments/doctor');
      setAppointments(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const filtered = appointments.filter(a => {
    const matchStatus = selectedStatus === 'all' || a.status === selectedStatus;
    const name = a.patientId?.userId?.name || a.patientId?.name || '';
    const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Appointment Schedule</h1>
          <p className="page-subtitle">Manage all booked consultations, patient details, and visit progress</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24, padding: 20 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 42 }}
              placeholder="Search by patient name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {['all', 'confirmed', 'checked-in', 'in-progress', 'completed', 'cancelled'].map(st => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`btn btn-sm ${selectedStatus === st ? 'btn-primary' : 'btn-outline'}`}
                style={{ textTransform: 'capitalize' }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner"></div></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--gray-500)' }}>
            <Calendar size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p>No appointments match the criteria.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Patient Name</th>
                  <th>Time Slot</th>
                  <th>Contact</th>
                  <th>Symptoms</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(appt => (
                  <tr key={appt._id}>
                    <td>
                      <span style={{ fontWeight: 800, color: 'var(--primary-700)', fontSize: 16 }}>
                        #{appt.tokenNumber}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{appt.patientId?.userId?.name || appt.patientId?.name || 'Patient'}</div>
                      <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>Age: {appt.patientId?.age || 28}</span>
                    </td>
                    <td>{appt.timeSlot?.startTime} - {appt.timeSlot?.endTime}</td>
                    <td>{appt.patientId?.phone || 'N/A'}</td>
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
                      {appt.status === 'in-progress' ? (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => navigate(`/doctor/consultations?appointmentId=${appt._id}`)}
                        >
                          <FileText size={14} /> Prescribe
                        </button>
                      ) : appt.status === 'checked-in' ? (
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => navigate('/doctor/queue')}
                        >
                          <Play size={14} /> Queue
                        </button>
                      ) : (
                        <span style={{ color: 'var(--gray-400)', fontSize: 13 }}>--</span>
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

export default DoctorAppointments;
