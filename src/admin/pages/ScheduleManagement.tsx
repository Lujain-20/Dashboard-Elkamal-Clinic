import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { getDoctors } from '../services/doctorAdminService';
import { getDoctorSlots, createSlot, deleteSlot } from '../services/schedleAdminService';
import type { WeeklyAvailability, Doctor } from '../types/adminTypes';
import { DayOfWeek } from '../types/adminTypes';
import { useAbortController } from '../hooks/useAbortController';
import { useConfirm } from '../hooks/useConfirm';
import { getApiErrorMessage, isAbortError } from '../utils/apiError';

const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export default function ScheduleManagement() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [slots, setSlots] = useState<WeeklyAvailability[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ dayOfWeek: DayOfWeek.Sunday, startTime: '09:00', endTime: '10:00' });

  const getListSignal = useAbortController();
  const getActionSignal = useAbortController();
  const { confirm, ConfirmDialogElement } = useConfirm();

  useEffect(() => {
    getDoctors().then((list) => {
      setDoctors(list);
      if (list.length) setSelectedDoctorId(list[0].id);
    }).catch(() => {});
  }, []);

  const loadSlots = useCallback(() => {
    if (!selectedDoctorId) return;
    const signal = getListSignal();
    setSlotsLoading(true);
    setError(null);
    getDoctorSlots(selectedDoctorId, signal)
      .then((data) => { if (!signal.aborted) setSlots(data); })
      .catch((err) => {
        if (isAbortError(err)) return;
        setError(getApiErrorMessage(err, 'تعذر تحميل المواعيد'));
      })
      .finally(() => { if (!signal.aborted) setSlotsLoading(false); });
  }, [selectedDoctorId, getListSignal]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  async function handleAddSlot(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const startMinutes = timeToMinutes(form.startTime);
    const endMinutes = timeToMinutes(form.endTime);

    if (endMinutes <= startMinutes) {
      setError('وقت النهاية لازم يكون بعد وقت البداية');
      return;
    }

    const hasOverlap = slots.some((s) => {
      if (s.dayOfWeek !== form.dayOfWeek) return false;
      const sStart = timeToMinutes(s.startTime.slice(0, 5));
      const sEnd = timeToMinutes(s.endTime.slice(0, 5));
      return startMinutes < sEnd && endMinutes > sStart;
    });

    if (hasOverlap) {
      setError('في تعارض مع موعد متاح بالفعل في نفس اليوم');
      return;
    }

    setSaving(true);
    const signal = getActionSignal();
    try {
      await createSlot(
        selectedDoctorId,
        {
          dayOfWeek: form.dayOfWeek,
          startTime: form.startTime + ':00',
          endTime: form.endTime + ':00',
        },
        signal
      );
      loadSlots();
      setForm({ dayOfWeek: form.dayOfWeek, startTime: '09:00', endTime: '10:00' });
    } catch (err) {
      if (isAbortError(err)) return;
      setError(getApiErrorMessage(err, 'حدث خطأ أثناء إضافة الموعد'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const ok = await confirm('هل تريد حذف هذا الموعد المتاح؟', {
      title: 'حذف موعد',
      confirmLabel: 'حذف',
      danger: true,
    });
    if (!ok) return;

    setDeletingId(id);
    setError(null);
    const signal = getActionSignal();
    try {
      await deleteSlot(id, signal);
      loadSlots();
    } catch (err) {
      if (isAbortError(err)) return;
      setError(getApiErrorMessage(err, 'تعذر حذف الموعد'));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <h2>إدارة المواعيد المتاحة</h2>

      {error && <div className="admin-alert admin-alert--error">{error}</div>}

      <div className="admin-form-field" style={{ maxWidth: 320, marginBottom: 20 }}>
        <label>اختر الدكتور</label>
        <select
          className="admin-select"
          value={selectedDoctorId}
          onChange={(e) => setSelectedDoctorId(e.target.value)}
        >
          {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      <form onSubmit={handleAddSlot} className="admin-table-wrap" style={{ padding: 20, marginBottom: 20 }}>
        <div className="admin-form-grid">
          <div className="admin-form-field">
            <label>اليوم</label>
            <select
              className="admin-select"
              value={form.dayOfWeek}
              onChange={(e) => setForm((f) => ({ ...f, dayOfWeek: Number(e.target.value) }))}
            >
              {days.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
          <div className="admin-form-field">
            <label>من الساعة</label>
            <input
              className="admin-input"
              type="time"
              value={form.startTime}
              onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
            />
          </div>
          <div className="admin-form-field">
            <label>إلى الساعة</label>
            <input
              className="admin-input"
              type="time"
              value={form.endTime}
              onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
            />
          </div>
        </div>
        <button className="admin-btn admin-btn--gold" type="submit" disabled={saving} style={{ marginTop: 16 }}>
          {saving ? 'جاري الإضافة...' : 'إضافة موعد'}
        </button>
      </form>

      <div className="admin-slots-list">
        {slotsLoading && <p>جاري التحميل...</p>}
        {!slotsLoading && slots.length === 0 && <p>لا توجد مواعيد متاحة لهذا الدكتور</p>}
        {!slotsLoading && slots.map((s) => (
          <div key={s.id} className="admin-slot-row">
            <strong style={{ width: 90 }}>{days[s.dayOfWeek]}</strong>
            <span>{s.startTime.slice(0, 5)} - {s.endTime.slice(0, 5)}</span>
            <span style={{ flex: 1 }} />
            <button
              className="admin-btn admin-btn--sm admin-btn--danger"
              disabled={deletingId === s.id}
              onClick={() => handleDelete(s.id)}
            >
              {deletingId === s.id ? '...' : 'حذف'}
            </button>
          </div>
        ))}
      </div>

      {ConfirmDialogElement}
    </div>
  );
}