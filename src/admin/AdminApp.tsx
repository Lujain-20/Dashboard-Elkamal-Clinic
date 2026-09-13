import { Routes, Route } from 'react-router-dom';
import { AdminAuthProvider } from './context/AdminAuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminLayout from './layout/AdminLayout';
import Login from './pages/Login';
import Overview from './pages/Overview';
import AppointmentsManagement from './pages/AppointmentsMangement';
import DoctorsManagement from './pages/DoctorsManagement';
import GalleryManagement from './pages/GalleryMangement';
import ScheduleManagement from './pages/ScheduleManagement';
import './styles/admin.css';

export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Overview />} />
            <Route path="appointments" element={<AppointmentsManagement />} />
            <Route path="doctors" element={<DoctorsManagement />} />
            <Route path="gallery" element={<GalleryManagement />} />
            <Route path="schedule" element={<ScheduleManagement />} />
          </Route>
        </Route>
      </Routes>
    </AdminAuthProvider>
  );
}