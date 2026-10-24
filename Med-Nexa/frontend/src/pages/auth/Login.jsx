import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, User, Stethoscope, Sparkles, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Role tab: 'patient' or 'doctor'
  const initialRole = searchParams.get('role') === 'doctor' ? 'doctor' : 'patient';
  const [activeRole, setActiveRole] = useState(initialRole);
  const [formData, setFormData] = useState({
    email: initialRole === 'doctor' ? 'priya.sharma@mednexa.com' : 'patient@mednexa.com',
    password: initialRole === 'doctor' ? 'doctor123' : 'patient123'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'doctor' || roleParam === 'patient') {
      handleRoleChange(roleParam);
    }
  }, [searchParams]);

  const handleRoleChange = (role) => {
    setActiveRole(role);
    if (role === 'doctor') {
      setFormData({
        email: 'priya.sharma@mednexa.com',
        password: 'doctor123'
      });
    } else {
      setFormData({
        email: 'patient@mednexa.com',
        password: 'patient123'
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(formData.email, formData.password);
      if (data.success) {
        toast.success(`Welcome back, ${data.user.name}!`);
        if (data.user.role === 'doctor') {
          navigate('/doctor/dashboard');
        } else {
          navigate('/patient/dashboard');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (role) => {
    handleRoleChange(role);
    toast.success(`Loaded ${role === 'doctor' ? 'Doctor' : 'Patient'} demo account`);
  };

  return (
    <div className="auth-page">
      <div className="auth-sidebar">
        <h1>Welcome to<br /><span>Med-Nexa</span></h1>
        <p>Your intelligent healthcare partner. Real-time queue tracking, online appointment bookings, and secure digital health records.</p>
        
        {/* Instant Quick Access Card (Bento Style) */}
        <div style={{ marginTop: 28, padding: 22, background: 'rgba(255, 255, 255, 0.08)', borderRadius: '20px', backdropFilter: 'blur(12px)', border: '1px solid rgba(134, 239, 172, 0.25)', maxWidth: 400, width: '100%' }}>
          <h4 style={{ color: '#fff', fontSize: 15, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800 }}>
            <Sparkles size={18} color="#4ade80" /> 1-Click Instant Demo Login
          </h4>
          <p style={{ fontSize: 13, color: '#dcfce7', margin: '0 0 14px', lineHeight: 1.4 }}>
            Click below to instantly test as a patient or doctor with preloaded accounts:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button
              type="button"
              style={{
                background: 'linear-gradient(135deg, #16a34a, #15803d)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: 13,
                padding: '11px 12px',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.35)'
              }}
              onClick={() => handleDemoFill('patient')}
            >
              <User size={15} /> Demo Patient
            </button>
            <button
              type="button"
              style={{
                background: 'linear-gradient(135deg, #059669, #047857)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: 13,
                padding: '11px 12px',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.35)'
              }}
              onClick={() => handleDemoFill('doctor')}
            >
              <Stethoscope size={15} /> Demo Doctor
            </button>
          </div>
        </div>

        {/* Doctor Recruitment Callout */}
        <div style={{ marginTop: 18, padding: '14px 18px', background: 'rgba(22, 163, 74, 0.15)', borderRadius: '16px', border: '1px solid rgba(134, 239, 172, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 400, width: '100%' }}>
          <div>
            <strong style={{ color: '#86efac', fontSize: 13, fontWeight: 800 }}>Healthcare Specialist?</strong>
            <p style={{ color: '#e2e8f0', margin: '2px 0 0', fontSize: 12 }}>Join Med-Nexa and manage your OPD queue</p>
          </div>
          <Link
            to="/register?role=doctor"
            style={{
              background: '#16a34a',
              color: '#fff',
              fontSize: 12,
              fontWeight: 800,
              padding: '7px 14px',
              borderRadius: '10px',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(22, 163, 74, 0.3)'
            }}
          >
            Doctor Sign Up
          </Link>
        </div>
      </div>

      <div className="auth-form-container">
        <form className="auth-form" onSubmit={handleSubmit} style={{ maxWidth: 440 }}>
          {/* Role selector tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: 'var(--gray-100)', padding: 6, borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
            <button
              type="button"
              onClick={() => handleRoleChange('patient')}
              className={`btn btn-sm ${activeRole === 'patient' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 700 }}
            >
              <User size={16} /> Patient Portal
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('doctor')}
              className={`btn btn-sm ${activeRole === 'doctor' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 700 }}
            >
              <Stethoscope size={16} /> Doctor Portal
            </button>
          </div>

          <h2>{activeRole === 'doctor' ? 'Doctor Sign In' : 'Patient Sign In'}</h2>
          <p style={{ color: 'var(--gray-500)', fontSize: 13, marginBottom: 20 }}>
            {activeRole === 'doctor'
              ? 'Access your clinical dashboard, call next patient & manage queue'
              : 'Book appointments, check in & track your live wait token'}
          </p>

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

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? 'Signing In...' : `Sign In as ${activeRole === 'doctor' ? 'Doctor' : 'Patient'}`}
          </button>

          {/* Registration Options */}
          <div style={{ marginTop: 22, paddingTop: 16, borderTop: '1px solid var(--gray-200)', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, textAlign: 'center' }}>
            {activeRole === 'patient' ? (
              <>
                <div>
                  Don&apos;t have an account?{' '}
                  <Link to="/register?role=patient" style={{ fontWeight: 700, color: 'var(--primary-600)' }}>
                    Create Patient Account
                  </Link>
                </div>
                <div style={{ padding: '10px 14px', background: 'var(--gray-50)', borderRadius: '8px', border: '1px dashed var(--gray-300)' }}>
                  Are you a Doctor?{' '}
                  <Link to="/register?role=doctor" style={{ fontWeight: 700, color: '#0d9488' }}>
                    Register Doctor Account →
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div>
                  New Doctor?{' '}
                  <Link to="/register?role=doctor" style={{ fontWeight: 700, color: 'var(--primary-600)' }}>
                    Register Doctor Account
                  </Link>
                </div>
                <div style={{ padding: '10px 14px', background: 'var(--gray-50)', borderRadius: '8px', border: '1px dashed var(--gray-300)' }}>
                  Looking for Patient Portal?{' '}
                  <button
                    type="button"
                    onClick={() => handleRoleChange('patient')}
                    style={{ background: 'none', border: 'none', color: 'var(--primary-600)', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Switch to Patient Login →
                  </button>
                </div>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
