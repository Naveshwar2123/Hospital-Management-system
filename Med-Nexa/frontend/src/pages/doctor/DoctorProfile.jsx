import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import {
  User, Stethoscope, MapPin, DollarSign, Clock,
  Save, CheckCircle2, Shield, Award
} from 'lucide-react';
import toast from 'react-hot-toast';

const DoctorProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    specialization: 'General Medicine',
    qualification: 'MBBS, MD',
    experience: 8,
    consultationFee: 500,
    roomNumber: '102',
    bio: '',
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/doctors/profile');
      if (res.data?.data) {
        setProfile(prev => ({
          ...prev,
          ...res.data.data
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.put('/doctors/profile', profile);
      if (res.data.success) {
        toast.success('Doctor profile updated successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Doctor Profile & Settings</h1>
          <p className="page-subtitle">Configure your clinical specialty, OPD room, fees, and consultation details</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: 24 }}>
        {/* Doctor Summary Badge */}
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary-600), var(--primary-800))',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, fontWeight: 800, margin: '0 auto 16px'
          }}>
            {user?.name?.charAt(0) || 'D'}
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Dr. {user?.name}</h2>
          <span className="badge badge-primary" style={{ marginTop: 8 }}>
            {profile.specialization}
          </span>
          <p style={{ color: 'var(--gray-500)', fontSize: 13, marginTop: 12 }}>
            {profile.qualification} • {profile.experience} Years Experience
          </p>

          <div style={{ marginTop: 24, textAlign: 'left', background: 'var(--gray-50)', padding: 16, borderRadius: 'var(--radius-md)', fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--gray-500)' }}>OPD Room:</span>
              <strong>Room {profile.roomNumber}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--gray-500)' }}>Consultation Fee:</span>
              <strong style={{ color: 'var(--emerald-600)' }}>₹{profile.consultationFee}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--gray-500)' }}>Status:</span>
              <span className="badge badge-success">Active OPD</span>
            </div>
          </div>
        </div>

        {/* Profile Settings Form */}
        <div className="card" style={{ padding: 28 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Edit Professional Details</h3>

          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Specialization</label>
                <input
                  type="text"
                  className="form-input"
                  value={profile.specialization}
                  onChange={(e) => setProfile({ ...profile, specialization: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Qualifications</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="MBBS, MD, FRCS"
                  value={profile.qualification}
                  onChange={(e) => setProfile({ ...profile, qualification: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Experience (Years)</label>
                <input
                  type="number"
                  className="form-input"
                  value={profile.experience}
                  onChange={(e) => setProfile({ ...profile, experience: Number(e.target.value) })}
                  min="0"
                />
              </div>

              <div className="form-group">
                <label className="form-label">OPD Room Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={profile.roomNumber}
                  onChange={(e) => setProfile({ ...profile, roomNumber: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Consultation Fee (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  value={profile.consultationFee}
                  onChange={(e) => setProfile({ ...profile, consultationFee: Number(e.target.value) })}
                  min="0"
                  step="50"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Professional Bio & Clinical Focus</label>
              <textarea
                className="form-input"
                rows="4"
                placeholder="Brief description of your clinical expertise and background..."
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              ></textarea>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Save size={18} /> {saving ? 'Saving Changes...' : 'Save Profile Details'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
