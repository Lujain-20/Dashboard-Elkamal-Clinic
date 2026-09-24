import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AdminLayout() {
  const { pathname } = useLocation();

  // بنحفظ الصفحة اللي اتفتحت فيها القائمة، فأول ما تتغير الصفحة القائمة تتقفل لوحدها
  const [openAt, setOpenAt] = useState<string | null>(null);
  const menuOpen = openAt === pathname;

  return (
    <div className={`admin-shell${menuOpen ? ' admin-shell--menu-open' : ''}`}>
      <Sidebar />

      <div
        className={`admin-sidebar-overlay${menuOpen ? ' admin-sidebar-overlay--visible' : ''}`}
        onClick={() => setOpenAt(null)}
      />

      <button
        type="button"
        className="admin-menu-toggle"
        aria-label="فتح القائمة"
        aria-expanded={menuOpen}
        onClick={() => setOpenAt(menuOpen ? null : pathname)}
      >
        ☰
      </button>

      <div className="admin-shell__main">
        <Topbar />
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}