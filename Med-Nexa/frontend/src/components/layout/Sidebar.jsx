import { useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, CalendarDays, Users, Clock, FileText,
  UserCircle, LogOut, Menu, X, Activity, Stethoscope, ClipboardList,
  FileSpreadsheet, Database
} from 'lucide-react';
import DatabaseModal from '../common/DatabaseModal';
// ==============================================================================
// GOOGLE SHEETS MODAL (COMMENTED - PRESERVED FOR TEACHER EXPLANATION)
// import GoogleSheetsModal from '../common/GoogleSheetsModal';
// ==============================================================================

const Sidebar = () => {
  const { user, logout, isDoctor, isPatient } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showDbModal, setShowDbModal] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  };

  const patientLinks = [
    { to: '/patient/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/patient/doctors', label: 'Find Doctors', icon: Stethoscope },
    { to: '/patient/appointments', label: 'My Appointments', icon: CalendarDays },
    { to: '/patient/queue', label: 'Live Queue', icon: Clock },
    { to: '/patient/records', label: 'Medical Records', icon: FileText },
  ];

  const doctorLinks = [
    { to: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/doctor/appointments', label: 'Appointments', icon: CalendarDays },
    { to: '/doctor/queue', label: 'Queue Manager', icon: Users },
    { to: '/doctor/consultations', label: 'Consultations', icon: ClipboardList },
    { to: '/doctor/profile', label: 'My Profile', icon: UserCircle },
  ];

  const links = isDoctor ? doctorLinks : patientLinks;

  return (
    <>
      <button className="menu-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <Link to={isDoctor ? '/doctor/dashboard' : '/patient/dashboard'} className="sidebar-header" style={{ textDecoration: 'none' }}>
          <div className="sidebar-logo">
            <img src="/med-nexa-icon.png" alt="Med-Nexa" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          </div>
          <div className="sidebar-brand">
            <h1>Med-Nexa</h1>
            <p>{isDoctor ? 'Doctor Portal' : 'Patient Portal'}</p>
          </div>
        </Link>

        <nav className="sidebar-nav">
          <div className="sidebar-section-title">Navigation</div>
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              <link.icon className="nav-icon" size={20} />
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Active Database: Supabase PostgreSQL */}
        <div style={{ padding: '0 14px 12px' }}>
          <button
            id="supabase-db-btn"
            type="button"
            onClick={() => setShowDbModal(true)}
            className="btn btn-outline btn-sm btn-block"
            style={{
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              borderColor: 'rgba(16, 185, 129, 0.35)',
              background: '#ecfdf5',
              color: '#065f46',
              fontWeight: 700
            }}
          >
            <Database size={15} color="#059669" /> Supabase DB 🟢
          </button>
        </div>

        {/* ==============================================================================
            GOOGLE SHEETS LIVE DB ACTION (COMMENTED - PRESERVED FOR TEACHER EXPLANATION)
            Uncomment below to display standalone Google Sheets trigger:
            <div style={{ padding: '0 14px 12px' }}>
              <button
                type="button"
                onClick={() => setShowSheetsModal(true)}
                className="btn btn-outline btn-sm btn-block"
                style={{ fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderColor: 'rgba(0, 166, 81, 0.3)', background: '#f0fdf4', color: '#15803d', fontWeight: 700 }}
              >
                <FileSpreadsheet size={15} /> Google Sheets DB
              </button>
            </div>
            ============================================================================== */}

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{getInitials(user?.name)}</div>
            <div className="user-info">
              <h4>{user?.name}</h4>
              <span>{user?.role}</span>
            </div>
            <button className="btn btn-ghost btn-icon" onClick={handleLogout} title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      <DatabaseModal
        isOpen={showDbModal}
        onClose={() => setShowDbModal(false)}
      />
    </>
  );
};

export default Sidebar;
