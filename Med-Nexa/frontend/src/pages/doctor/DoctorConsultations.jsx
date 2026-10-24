import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  FileText, Plus, Trash2, CheckCircle2, Calendar, User,
  Pill, AlertCircle, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

const DoctorConsultations = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(searchParams.get('appointmentId') || '');
  const [pastRecords, setPastRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [medicines, setMedicines] = useState([
    { medicineName: 'Paracetamol 650mg', dosage: '1 tablet', frequency: '1-0-1', duration: '3 days', instructions: 'After food' }
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [apptsRes, recordsRes] = await Promise.all([
        api.get('/appointments/doctor'),
        api.get('/consultations/doctor-records').catch(() => ({ data: { data: [] } }))
      ]);

      const appts = apptsRes.data.data || [];
      setAppointments(appts);
      setPastRecords(recordsRes.data.data || []);

      const paramId = searchParams.get('appointmentId');
      if (paramId) {
        setSelectedAppointmentId(paramId);
        const target = appts.find(a => a._id === paramId);
        if (target) {
          setSymptoms(target.symptoms || '');
        }
      } else if (appts.some(a => a.status === 'in-progress')) {
        const inProg = appts.find(a => a.status === 'in-progress');
        setSelectedAppointmentId(inProg._id);
        setSymptoms(inProg.symptoms || '');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load consultation workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicine = () => {
    setMedicines([
      ...medicines,
      { medicineName: '', dosage: '', frequency: '1-0-1', duration: '5 days', instructions: 'After meals' }
    ]);
  };

  const handleRemoveMedicine = (idx) => {
    setMedicines(medicines.filter((_, i) => i !== idx));
  };

  const handleMedicineChange = (idx, field, val) => {
    const updated = [...medicines];
    updated[idx][field] = val;
    setMedicines(updated);
  };

  const handleSelectAppointment = (id) => {
    setSelectedAppointmentId(id);
    const target = appointments.find(a => a._id === id);
    if (target) {
      setSymptoms(target.symptoms || '');
    }
  };

  const handleSubmitPrescription = async (e) => {
    e.preventDefault();
    if (!selectedAppointmentId) {
      toast.error('Please select an appointment to complete');
      return;
    }
    if (!diagnosis) {
      toast.error('Please specify a clinical diagnosis');
      return;
    }

    const selectedAppt = appointments.find(a => a._id === selectedAppointmentId);

    try {
      setSubmitting(true);
      const res = await api.post('/consultations', {
        appointmentId: selectedAppointmentId,
        patientId: selectedAppt?.patientId?._id || selectedAppt?.patientId,
        diagnosis,
        symptoms,
        notes,
        followUpDate: followUpDate || null,
        prescriptions: medicines.filter(m => m.medicineName.trim())
      });

      if (res.data.success) {
        toast.success('Consultation completed & digital prescription issued!');
        // Reset form
        setDiagnosis('');
        setNotes('');
        setSelectedAppointmentId('');
        fetchData();
        navigate('/doctor/queue');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error recording consultation');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingAppointments = appointments.filter(a => ['in-progress', 'checked-in'].includes(a.status));
  const currentSelected = appointments.find(a => a._id === selectedAppointmentId);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Digital Consultation & Prescription Desk</h1>
          <p className="page-subtitle">Attach clinical diagnosis, Rx medications, and finalize patient visits</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Prescription Writer Form */}
        <div className="card" style={{ padding: 28 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={20} color="var(--primary-600)" /> New Clinical Prescription
          </h3>

          <form onSubmit={handleSubmitPrescription}>
            {/* Appointment selection */}
            <div className="form-group">
              <label className="form-label">Select Active Patient Consultation</label>
              <select
                className="form-select"
                value={selectedAppointmentId}
                onChange={(e) => handleSelectAppointment(e.target.value)}
                required
              >
                <option value="">-- Choose Patient Appointment --</option>
                {pendingAppointments.map(a => (
                  <option key={a._id} value={a._id}>
                    Token #{a.tokenNumber} - {a.patientId?.userId?.name || a.patientId?.name || 'Patient'} ({a.status})
                  </option>
                ))}
              </select>
            </div>

            {currentSelected && (
              <div style={{ padding: 14, background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', marginBottom: 20, fontSize: 13 }}>
                <strong>Patient:</strong> {currentSelected.patientId?.userId?.name || 'Patient'} •{' '}
                <strong>Age:</strong> {currentSelected.patientId?.age || 30} •{' '}
                <strong>Token:</strong> #{currentSelected.tokenNumber}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Chief Symptoms</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. High fever, fatigue, sore throat"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Primary Diagnosis *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Viral Pharyngitis"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Medicines List */}
            <div style={{ marginTop: 12, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Pill size={16} /> Rx Medications
                </label>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleAddMedicine}
                >
                  <Plus size={14} /> Add Medicine
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {medicines.map((med, idx) => (
                  <div key={idx} style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                    gap: 8,
                    alignItems: 'center',
                    background: 'var(--gray-50)',
                    padding: 10,
                    borderRadius: 'var(--radius-md)'
                  }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Medicine name"
                      value={med.medicineName}
                      onChange={(e) => handleMedicineChange(idx, 'medicineName', e.target.value)}
                      required
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Dosage (500mg)"
                      value={med.dosage}
                      onChange={(e) => handleMedicineChange(idx, 'dosage', e.target.value)}
                    />
                    <select
                      className="form-select"
                      value={med.frequency}
                      onChange={(e) => handleMedicineChange(idx, 'frequency', e.target.value)}
                    >
                      <option value="1-0-0">1-0-0 (Morning)</option>
                      <option value="1-0-1">1-0-1 (Morn-Night)</option>
                      <option value="1-1-1">1-1-1 (Thrice)</option>
                      <option value="0-0-1">0-0-1 (Night)</option>
                      <option value="SOS">SOS (As needed)</option>
                    </select>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Duration"
                      value={med.duration}
                      onChange={(e) => handleMedicineChange(idx, 'duration', e.target.value)}
                    />
                    {medicines.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon"
                        style={{ color: 'var(--rose-600)' }}
                        onClick={() => handleRemoveMedicine(idx)}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Clinical Notes & Patient Advice</label>
              <textarea
                className="form-input"
                rows="3"
                placeholder="Dietary instructions, rest, hydration, warning signs..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>

            <div className="form-group">
              <label className="form-label">Next Follow-Up Date (Optional)</label>
              <input
                type="date"
                className="form-input"
                min={new Date().toISOString().split('T')[0]}
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={submitting}
            >
              {submitting ? 'Generating Prescription...' : 'Complete Consultation & Issue Rx'}
            </button>
          </form>
        </div>

        {/* Recent Consultations History sidebar */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
            Recent Consultation Records
          </h3>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 20 }}><div className="spinner"></div></div>
          ) : pastRecords.length === 0 ? (
            <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>No past consultations recorded today yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pastRecords.slice(0, 6).map(rec => (
                <div key={rec._id} style={{ padding: 12, background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                    <span>{rec.patientId?.userId?.name || 'Patient'}</span>
                    <span style={{ color: 'var(--emerald-600)' }}>Completed</span>
                  </div>
                  <p style={{ color: 'var(--gray-600)', margin: '4px 0 0', fontSize: 12 }}>
                    Diagnosis: {rec.diagnosis}
                  </p>
                  <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                    {new Date(rec.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorConsultations;
