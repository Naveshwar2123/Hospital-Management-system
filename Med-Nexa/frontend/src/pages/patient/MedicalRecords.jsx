import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  FileText, Calendar, Clock, Stethoscope, Printer,
  ChevronDown, ChevronUp, Pill, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const MedicalRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await api.get('/consultations/my-history');
      setRecords(res.data.data || []);
      if (res.data.data?.length > 0) {
        setExpandedId(res.data.data[0]._id);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load medical records');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Medical Records & Prescriptions</h1>
          <p className="page-subtitle">Access your complete digital health records, diagnosis history, and prescriptions</p>
        </div>
        {records.length > 0 && (
          <button className="btn btn-outline" onClick={handlePrint}>
            <Printer size={18} /> Print Record
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner"></div></div>
      ) : records.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <FileText size={52} style={{ opacity: 0.3, marginBottom: 16 }} />
          <h3>No Consultation Records Found</h3>
          <p style={{ color: 'var(--gray-500)' }}>
            After you complete a consultation with our doctors, your digital prescription and medical notes will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {records.map(record => {
            const isExpanded = expandedId === record._id;
            const doctor = record.doctorId;
            const doctorName = doctor?.userId?.name || 'Physician';

            return (
              <div key={record._id} className="card" style={{ padding: 24, transition: 'all 0.2s ease' }}>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => setExpandedId(isExpanded ? null : record._id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 'var(--radius-md)',
                      background: 'var(--emerald-50)', color: 'var(--emerald-600)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <FileText size={24} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 4px' }}>
                        Diagnosis: {record.diagnosis || 'Clinical Consultation'}
                      </h3>
                      <p style={{ color: 'var(--gray-500)', fontSize: 13, margin: 0 }}>
                        Dr. {doctorName} ({doctor?.specialization || 'General'}) • {new Date(record.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="badge badge-success">Official Record</span>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--gray-200)' }}>
                    {/* Clinical summary */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
                      <div style={{ padding: 14, background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                        <strong style={{ fontSize: 12, color: 'var(--gray-500)', textTransform: 'uppercase' }}>Symptoms Presented</strong>
                        <p style={{ margin: '6px 0 0', fontSize: 14, fontWeight: 500 }}>
                          {record.symptoms || record.appointmentId?.symptoms || 'None specified'}
                        </p>
                      </div>

                      <div style={{ padding: 14, background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                        <strong style={{ fontSize: 12, color: 'var(--gray-500)', textTransform: 'uppercase' }}>Primary Diagnosis</strong>
                        <p style={{ margin: '6px 0 0', fontSize: 14, fontWeight: 600, color: 'var(--primary-700)' }}>
                          {record.diagnosis}
                        </p>
                      </div>

                      {record.followUpDate && (
                        <div style={{ padding: 14, background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                          <strong style={{ fontSize: 12, color: 'var(--gray-500)', textTransform: 'uppercase' }}>Recommended Follow-up</strong>
                          <p style={{ margin: '6px 0 0', fontSize: 14, fontWeight: 500 }}>
                            {new Date(record.followUpDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Prescribed Medications */}
                    {record.prescriptions && record.prescriptions.length > 0 && (
                      <div style={{ marginBottom: 20 }}>
                        <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Pill size={18} color="var(--primary-600)" /> Prescribed Medications
                        </h4>
                        <div style={{ overflowX: 'auto' }}>
                          <table className="table" style={{ fontSize: 13 }}>
                            <thead>
                              <tr>
                                <th>Medicine Name</th>
                                <th>Dosage</th>
                                <th>Frequency</th>
                                <th>Duration</th>
                                <th>Instructions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {record.prescriptions.map((med, idx) => (
                                <tr key={idx}>
                                  <td style={{ fontWeight: 600 }}>{med.medicineName || med.name}</td>
                                  <td>{med.dosage}</td>
                                  <td>{med.frequency}</td>
                                  <td>{med.duration || '5 days'}</td>
                                  <td>{med.instructions || 'After meals'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Doctor Advice / Notes */}
                    {record.notes && (
                      <div style={{ padding: 16, background: 'var(--primary-50)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--primary-600)' }}>
                        <strong style={{ fontSize: 13, color: 'var(--primary-800)' }}>Doctor&apos;s Advice & Notes:</strong>
                        <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--gray-700)', lineHeight: 1.5 }}>
                          {record.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MedicalRecords;
