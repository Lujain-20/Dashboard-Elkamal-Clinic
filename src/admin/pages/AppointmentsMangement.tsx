import { useEffect, useState, useCallback } from 'react';
import { getAllAppointments, confirmAppointment, cancelAppointment, completeAppointment } from '../services/appointmentAdminService';
import type { AppointmentFilters } from '../services/appointmentAdminService';
import { getDoctors } from '../services/doctorAdminService';
import type { Appointment, Doctor, AppointmentStatus } from '../types/adminTypes';
import { StatusBadge } from './Overview';
import { useAbortController } from '../hooks/useAbortController';
import { useConfirm } from '../hooks/useConfirm';
import { getApiErrorMessage, isAbortError } from '../utils/apiError';

export default function AppointmentsManagement() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filters, setFilters] = useState<AppointmentFilters>({});
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getListSignal = useAbortController();
  const getActionSignal = useAbortController();
  const { confirm, ConfirmDialogElement } = useConfirm();

  const loadAppointments = useCallback(() => {
    const signal = getListSignal();
    setLoading(true);
    setError(null);
    getAllAppointments(filters, signal)
      .then((data) => { if (!signal.aborted) setAppointments(data); })
      .catch((err) => {
        if (isAbortError(err)) return;
        setError(getApiErrorMessage(err, 'حدث خطأ أثناء تحميل الحجوزات'));
      })
      .finally(() => { if (!signal.aborted) setLoading(false); });
  }, [filters, getListSignal]);

  useEffect(() => { loadAppointments(); }, [loadAppointments]);
  useEffect(() => { getDoctors().then(setDoctors).catch(() => {}); }, []);

  async function runAction(id: string, action: (signal: AbortSignal) => Promise<unknown>, errorFallback: string) {
    setActingId(id);
    setError(null);
    const signal = getActionSignal();
    try {
      await action(signal);
      loadAppointments();
    } catch (err) {
      if (isAbortError(err)) return;
      setError(getApiErrorMessage(err, errorFallback));
    } finally {
      setActingId(null);
    }
  }

  const handleConfirm = (id: string) =>
    runAction(id, (signal) => confirmAppointment(id, signal), 'تعذر تأكيد الحجز');

  const handleComplete = (id: string) =>
    runAction(id, (signal) => completeAppointment(id, signal), 'تعذر إتمام الحجز');

  async function handleCancel(id: string) {
    const ok = await confirm('هل أنت متأكد من رفض هذا الحجز؟ لن يمكن التراجع عن ذلك.', {
      title: 'رفض الحجز',
      confirmLabel: 'رفض الحجز',
      danger: true,
    });
    if (!ok) return;
    await runAction(id, (signal) => cancelAppointment(id, signal), 'تعذر رفض الحجز');
  }

  return (
    <div>
      <h2>إدارة الحجوزات</h2>

      {error && <div className="admin-alert admin-alert--error">{error}</div>}

      <div className="admin-filters">
        <select
          className="admin-select"
          value={filters.status ?? ''}
          onChange={(e) =>
            setFilters((f) => ({ ...f, status: (e.target.value || undefined) as AppointmentStatus | undefined }))
          }
        >
          <option value="">كل الحالات</option>
          <option value="Pending">قيد الانتظار</option>
          <option value="Confirmed">مؤكد</option>
          <option value="Completed">مكتمل</option>
          <option value="Cancelled">ملغي</option>
        </select>

        <select
          className="admin-select"
          value={filters.doctorId || ''}
          onChange={(e) => setFilters((f) => ({ ...f, doctorId: e.target.value || undefined }))}
        >
          <option value="">كل الأطباء</option>
          {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>

        <input
          className="admin-input"
          type="date"
          value={filters.date || ''}
          onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value || undefined }))}
        />
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>المريض</th><th>الدكتور</th><th>الموعد</th><th>نوع الحجز</th><th>الحالة</th><th>إجراءات</th></tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6}>جاري التحميل...</td></tr>}
            {!loading && appointments.length === 0 && <tr><td colSpan={6}>لا توجد حجوزات مطابقة</td></tr>}
            {!loading && appointments.map((a) => {
              const isActing = actingId === a.id;
              return (
                <tr key={a.id}>
                  <td>{a.patientName}</td>
                  <td>{a.doctorName || '-'}</td>
                  <td>{new Date(a.scheduledAt).toLocaleString('ar-EG')}</td>
                  <td>{a.appointmentType || '-'}</td>
                  <td><StatusBadge status={a.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="admin-btn admin-btn--sm admin-btn--success"
                        disabled={isActing || a.status === 'Confirmed'}
                        onClick={() => handleConfirm(a.id)}
                      >
                        {isActing ? '...' : 'تأكيد'}
                      </button>
                      <button
                        className="admin-btn admin-btn--sm admin-btn--danger"
                        disabled={isActing || a.status === 'Cancelled'}
                        onClick={() => handleCancel(a.id)}
                      >
                        {isActing ? '...' : 'رفض'}
                      </button>
                      <button
                        className="admin-btn admin-btn--sm admin-btn--primary"
                        disabled={isActing || a.status === 'Completed'}
                        onClick={() => handleComplete(a.id)}
                      >
                        {isActing ? '...' : 'إتمام'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {ConfirmDialogElement}
    </div>
  );
}