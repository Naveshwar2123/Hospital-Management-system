import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, User, Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [role, setRole] = useState(searchParams.get('role') === 'doctor' ? 'doctor' : 'patient');

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'doctor' || roleParam === 'patient') {
      setRole(roleParam);
    }
  }, [searchParams]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    gender: 'male',
    age: '28',
    bloodGroup: 'O+',
    specialization: 'General Medicine',
    qualification: 'MBBS, MD',
    consultationFee: 500,
    experience: 5
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        role,
        phone: cleanPhone.slice(-10)
      };
      const data = await register(payload);
      if (data.success) {
        toast.success(`Account created successfully! Welcome, ${data.user?.name}.`);
        if (role === 'doctor') {
          navigate('/doctor/dashboard');
        } else {
          navigate('/patient/dashboard');
        }
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || error.response?.data?.errors?.[0]?.message || 'Registration failed';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-sidebar">
        <h1>Join<br /><span>Med-Nexa</span></h1>
        <p>Get instant access to top specialists, live OPD token queues, and digital medical history management.</p>
      </div>

      <div className="auth-form-container">
        <form className="auth-form" onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
          {/* Role selector */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: 'var(--gray-100)', padding: 6, borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
            <button
              type="button"
              onClick={() => setRole('patient')}
              className={`btn btn-sm ${role === 'patient' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <User size={16} /> Patient Account
            </button>
            <button
              type="button"
              onClick={() => setRole('doctor')}
              className={`btn btn-sm ${role === 'doctor' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <Stethoscope size={16} /> Doctor Account
            </button>
          </div>

          <h2>{role === 'doctor' ? 'Register Doctor Account' : 'Register Patient Account'}</h2>
          <p>{role === 'doctor' ? 'Join our medical team and manage patient queues' : 'Book consultations and receive live queue tokens'}</p>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder={role === 'doctor' ? 'e.g. Dr. Aryan Saxena' : 'e.g. Snehal Kushwah'}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Phone Number (10 Digits)</label>
              <input
                type="tel"
                className="form-input"
                placeholder="9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Min 6 chars"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {role === 'patient' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Age</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  min="1"
                  max="120"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select
                  className="form-select"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Blood Group</label>
                <select
                  className="form-select"
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                >
                  {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Specialization</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Cardiology"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Consultation Fee (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.consultationFee}
                  onChange={(e) => setFormData({ ...formData, consultationFee: Number(e.target.value) })}
                  min="100"
                  step="50"
                  required
                />
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: 12 }}>
            {loading ? 'Registering...' : `Create ${role === 'doctor' ? 'Doctor' : 'Patient'} Account`}
          </button>

          <div className="auth-link">
            Already have an account? <Link to={`/login?role=${role}`}>Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
