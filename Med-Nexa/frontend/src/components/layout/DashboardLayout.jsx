import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const DashboardLayout = () => {
  const location = useLocation();

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <div key={location.pathname} className="portal-page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;

