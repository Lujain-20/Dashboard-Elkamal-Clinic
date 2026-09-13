import { useEffect, useState } from 'react';
import { getAllAppointments } from '../services/appointmentAdminService';
import { getDoctors } from '../services/doctorAdminService';
import type { Appointment, AppointmentStatus } from '../types/adminTypes';
import { useAbortController } from '../hooks/useAbortController';
import { getApiErrorMessage, isAbortError } from '../utils/apiError';

export default function Overview() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorsCount, setDoctorsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getSignal = useAbortController();

  useEffect(() => {
    const signal = getSignal();
    setLoading(true);
    setError(null);
    Promise.all([getAllAppointments({}, signal), getDoctors(signal)])
      .then(([appts, doctors]) => {
        if (signal.aborted) return;
        setAppointments(appts);
        setDoctorsCount(doctors.length);
      })
      .catch((err) => {
        if (isAbortError(err)) return;
        setError(getApiErrorMessage(err, 'حدث خطأ أثناء تحميل الإحصائيات'));
      })
      .finally(() => { if (!signal.aborted) setLoading(false); });
  }, [getSignal]);

  if (loading) return <p>جاري تحميل الإحصائيات...</p>;
  if (error) return <div className="admin-alert admin-alert--error">{error}</div>;

  const today = new Date().toDateString();
  const pendingCount = appointments.filter((a) => a.status === 'Pending').length;
  const confirmedTodayCount = appointments.filter(
    (a) => a.status === 'Confirmed' && new Date(a.scheduledAt).toDateString() === today
  ).length;

  const recent = [...appointments]
    .sort((a, b) => {
      const aTime = new Date((a as any).createdAt ?? a.scheduledAt).getTime();
      const bTime = new Date((b as any).createdAt ?? b.scheduledAt).getTime();
      return bTime - aTime;
    })
    .slice(0, 5);

  return (
    <div>
      <div className="admin-cards-row">
        <div className="admin-card">
          <div className="admin-card__label">حجوزات قيد الانتظار</div>
          <div className="admin-card__value">{pendingCount}</div>
        </div>
        <div className="admin-card">
          <div className="admin-card__label">مؤكدة اليوم</div>
          <div className="admin-card__value">{confirmedTodayCount}</div>
        </div>
        <div className="admin-card">
          <div className="admin-card__label">عدد الأطباء</div>
          <div className="admin-card__value">{doctorsCount}</div>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>المريض</th><th>الدكتور</th><th>الموعد</th><th>الحالة</th></tr>
          </thead>
          <tbody>
            {recent.length === 0 && <tr><td colSpan={4}>لا توجد حجوزات</td></tr>}
            {recent.map((a) => (
              <tr key={a.id}>
                <td>{a.patientName}</td>
                <td>{a.doctorName || '-'}</td>
                <td>{new Date(a.scheduledAt).toLocaleString('ar-EG')}</td>
                <td><StatusBadge status={a.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const map: Record<AppointmentStatus, [string, string]> = {
    Pending: ['admin-badge--pending', 'قيد الانتظار'],
    Confirmed: ['admin-badge--confirmed', 'مؤكد'],
    Completed: ['admin-badge--completed', 'مكتمل'],
    Cancelled: ['admin-badge--cancelled', 'ملغي'],
  };
  const entry = map[status] || ['admin-badge--pending', status];
  const [cls, label] = entry;
  return <span className={'admin-badge ' + cls}>{label}</span>;
}