
import { NavLink } from 'react-router-dom';

const links = [
  { to: '/admin', label: 'نظرة عامة', end: true },
  { to: '/admin/appointments', label: 'الحجوزات' },
  { to: '/admin/doctors', label: 'الأطباء' },
  { to: '/admin/gallery', label: 'الجاليري' },
  { to: '/admin/schedule', label: 'المواعيد المتاحة' },
];

export default function Sidebar() {
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__logo">لوحة التحكم</div>
      <nav className="admin-sidebar__nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              'admin-sidebar__link' + (isActive ? ' admin-sidebar__link--active' : '')
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}