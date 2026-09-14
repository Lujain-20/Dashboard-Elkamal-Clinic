import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { getDoctors } from '../services/doctorAdminService';
import { getDoctorSlots, createSlot, deleteSlot } from '../services/schedleAdminService';
import type { WeeklyAvailability, Doctor } from '../types/adminTypes';
import { DayOfWeek } from '../types/adminTypes';

const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export default function ScheduleManagement() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [slots, setSlots] = useState<WeeklyAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ dayOfWeek: DayOfWeek.Sunday, startTime: '09:00', endTime: '10:00' });

  function loadSlots(doctorId: string) {
    setLoading(true);
    getDoctorSlots(doctorId)
      .then(setSlots)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    getDoctors().then((list) => {
      setDoctors(list);
      if (list.length) setSelectedDoctorId(list[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedDoctorId) return;
    loadSlots(selectedDoctorId);
  }, [selectedDoctorId]);

  async function handleAddSlot(e: FormEvent) {
    e.preventDefault();

    const newStart = form.startTime + ':00';
    const newEnd = form.endTime + ':00';

    if (newStart >= newEnd) {
      alert('وقت البداية لازم يكون قبل وقت النهاية.');
      return;
    }

    // بيتحقق من أي تداخل مع مواعيد موجودة في نفس اليوم
    // (مش بس التطابق الكامل، أي جزء متداخل بيتحسب تعارض)
    const hasOverlap = slots.some((s) => {
      if (s.dayOfWeek !== form.dayOfWeek) return false;
      return newStart < s.endTime && s.startTime < newEnd;
    });

    if (hasOverlap) {
      alert('الموعد ده بيتعارض مع موعد موجود بالفعل في نفس اليوم. راجعي المواعيد الحالية تحت.');
      return;
    }

    setAdding(true);
    try {
      await createSlot(selectedDoctorId, {
        dayOfWeek: form.dayOfWeek,
        startTime: newStart,
        endTime: newEnd,
      });
      loadSlots(selectedDoctorId);
    } catch {
      alert('حدث خطأ أثناء إضافة الموعد');
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('حذف هذا الموعد؟')) return;
    await deleteSlot(id);
    setSlots((prev) => prev.filter((s) => s.id !== id));
  }

  const sortedSlots = [...slots].sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
    return a.startTime.localeCompare(b.startTime);
  });

  return (
    <div>
      <h2>إدارة المواعيد المتاحة</h2>

      <div className="admin-form-field" style={{ maxWidth: 320, marginBottom: 20 }}>
        <label>اختر الدكتور</label>
        <select className="admin-select" value={selectedDoctorId} onChange={(e) => setSelectedDoctorId(e.target.value)}>
          {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      <form onSubmit={handleAddSlot} className="admin-table-wrap" style={{ padding: 20, marginBottom: 20 }}>
        <div className="admin-form-grid">
          <div className="admin-form-field">
            <label>اليوم</label>
            <select className="admin-select" value={form.dayOfWeek}
              onChange={(e) => setForm((f) => ({ ...f, dayOfWeek: Number(e.target.value) }))}>
              {days.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
          <div className="admin-form-field">
            <label>من الساعة</label>
            <input className="admin-input" type="time" value={form.startTime}
              onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} />
          </div>
          <div className="admin-form-field">
            <label>إلى الساعة</label>
            <input className="admin-input" type="time" value={form.endTime}
              onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} />
          </div>
        </div>
        <button className="admin-btn admin-btn--gold" type="submit" disabled={adding} style={{ marginTop: 16 }}>
          {adding ? 'جاري الإضافة...' : 'إضافة موعد'}
        </button>
      </form>

      {loading && <p>جاري تحميل المواعيد...</p>}

      {!loading && sortedSlots.length === 0 && (
        <p style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>
          مفيش مواعيد أسبوعية مسجلة لهذا الدكتور لسه.
        </p>
      )}

      {!loading && sortedSlots.length > 0 && (
        <div className="admin-slots-list">
          {sortedSlots.map((s) => (
            <div key={s.id} className="admin-slot-row">
              <strong style={{ width: 90 }}>{days[s.dayOfWeek]}</strong>
              <span>{s.startTime.slice(0, 5)} - {s.endTime.slice(0, 5)}</span>
              <span style={{ flex: 1 }} />
              <button className="admin-btn admin-btn--sm admin-btn--danger" onClick={() => handleDelete(s.id)}>حذف</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}