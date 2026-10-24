import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

// Public pages
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Patient pages
import PatientDashboard from './pages/patient/PatientDashboard';
import FindDoctors from './pages/patient/FindDoctors';
import MyAppointments from './pages/patient/MyAppointments';
import LiveQueue from './pages/patient/LiveQueue';
import MedicalRecords from './pages/patient/MedicalRecords';

// Doctor pages
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorAppointments from './pages/doctor/DoctorAppointments';
import ActiveQueueManager from './pages/doctor/ActiveQueueManager';
import DoctorConsultations from './pages/doctor/DoctorConsultations';
import DoctorProfile from './pages/doctor/DoctorProfile';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0f172a',
              color: '#fff',
              fontSize: '14px',
              borderRadius: '10px',
              padding: '12px 18px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
            }
          }}
        />

        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Patient Routes */}
          <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
            <Route path="/patient" element={<DashboardLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<PatientDashboard />} />
              <Route path="doctors" element={<FindDoctors />} />
              <Route path="appointments" element={<MyAppointments />} />
              <Route path="queue" element={<LiveQueue />} />
              <Route path="records" element={<MedicalRecords />} />
            </Route>
          </Route>

          {/* Doctor Routes */}
          <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
            <Route path="/doctor" element={<DashboardLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DoctorDashboard />} />
              <Route path="appointments" element={<DoctorAppointments />} />
              <Route path="queue" element={<ActiveQueueManager />} />
              <Route path="consultations" element={<DoctorConsultations />} />
              <Route path="profile" element={<DoctorProfile />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
