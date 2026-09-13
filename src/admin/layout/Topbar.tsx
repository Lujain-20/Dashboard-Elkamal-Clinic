
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function Topbar() {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/admin/login', { replace: true });
  }

  return (
    <header className="admin-topbar">
      <div className="admin-topbar__spacer" />
      <div className="admin-topbar__user">
        <span className="admin-topbar__name">{admin?.name}</span>
        <button className="admin-btn admin-btn--ghost" onClick={handleLogout}>تسجيل الخروج</button>
      </div>
    </header>
  );
}