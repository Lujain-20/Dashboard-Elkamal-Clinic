import React, { useEffect, useState } from 'react';
import { getDoctors, createDoctor, updateDoctor, deleteDoctor } from '../services/doctorAdminService';
import { Doctor } from '../types/adminTypes';
import { useAbortController } from '../hooks/useAbortController';
import { useConfirm } from '../hooks/useConfirm';
import { getApiErrorMessage, isAbortError } from '../utils/apiError';

const emptyForm = { name: '', specialty: '', bio: '', profileImageUrl: '' };

export default function DoctorsManagement() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getListSignal = useAbortController();
  const getActionSignal = useAbortController();
  const { confirm, ConfirmDialogElement } = useConfirm();

  function load() {
    const signal = getListSignal();
    setLoading(true);
    setError(null);
    getDoctors(signal)
      .then((data) => { if (!signal.aborted) setDoctors(data); })
      .catch((err) => {
        if (isAbortError(err)) return;
        setError(getApiErrorMessage(err, 'تعذر تحميل قائمة الأطباء'));
      })
      .finally(() => { if (!signal.aborted) setLoading(false); });
  }
  useEffect(() => { load(); }, []);

  function startEdit(doctor: Doctor) {
    setEditingId(doctor.id);
    setForm({
      name: doctor.name,
      specialty: doctor.specialty,
      bio: doctor.bio || '',
      profileImageUrl: (doctor as any).profileImageUrl || '',
    });
    setError(null);
  }
  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = {
      name: form.name.trim(),
      specialty: form.specialty.trim(),
      bio: form.bio.trim(),
      profileImageUrl: form.profileImageUrl.trim(),
    };
    if (!trimmed.name || !trimmed.specialty) {
      setError('الاسم والتخصص مطلوبين');
      return;
    }

    setSaving(true);
    const signal = getActionSignal();
    try {
      if (editingId) {
        const updated = await updateDoctor(editingId, trimmed, signal);
        setDoctors((prev) => prev.map((d) => (d.id === editingId ? updated : d)));
      } else {
        const created = await createDoctor(trimmed, signal);
        setDoctors((prev) => [...prev, created]);
      }
      resetForm();
    } catch (err) {
      if (isAbortError(err)) return;
      setError(getApiErrorMessage(err, 'حدث خطأ أثناء الحفظ'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const ok = await confirm('هل أنت متأكد من حذف هذا الدكتور؟ سيتم حذف بياناته نهائيًا.', {
      title: 'حذف دكتور',
      confirmLabel: 'حذف',
      danger: true,
    });
    if (!ok) return;

    setDeletingId(id);
    setError(null);
    const signal = getActionSignal();
    try {
      await deleteDoctor(id, signal);
      setDoctors((prev) => prev.filter((d) => d.id !== id));
      if (editingId === id) resetForm();
    } catch (err) {
      if (isAbortError(err)) return;
      setError(getApiErrorMessage(err, 'تعذر حذف الدكتور'));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <h2>إدارة الأطباء</h2>

      {error && <div className="admin-alert admin-alert--error">{error}</div>}

      <form onSubmit={handleSubmit} className="admin-table-wrap" style={{ padding: 20, marginBottom: 24 }}>
        <h3 style={{ marginTop: 0 }}>{editingId ? 'تعديل بيانات دكتور' : 'إضافة دكتور جديد'}</h3>
        <div className="admin-form-grid">
          <div className="admin-form-field">
            <label>الاسم</label>
            <input className="admin-input" value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="admin-form-field">
            <label>التخصص</label>
            <input className="admin-input" value={form.specialty}
              onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))} required />
          </div>
          <div className="admin-form-field">
            <label>رابط الصورة</label>
            <input className="admin-input" value={form.profileImageUrl}
              onChange={(e) => setForm((f) => ({ ...f, profileImageUrl: e.target.value }))} />
          </div>
          <div className="admin-form-field" style={{ gridColumn: '1 / -1' }}>
            <label>نبذة</label>
            <textarea className="admin-textarea" rows={3} value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
          </div>
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button className="admin-btn admin-btn--gold" type="submit" disabled={saving}>
            {saving ? 'جاري الحفظ...' : editingId ? 'حفظ التعديلات' : 'إضافة الدكتور'}
          </button>
          {editingId && <button className="admin-btn admin-btn--ghost" type="button" onClick={resetForm}>إلغاء</button>}
        </div>
      </form>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>الاسم</th><th>التخصص</th><th>نبذة</th><th>إجراءات</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={4}>جاري التحميل...</td></tr>}
            {!loading && doctors.length === 0 && <tr><td colSpan={4}>لا يوجد أطباء</td></tr>}
            {!loading && doctors.map((d) => (
              <tr key={d.id}>
                <td>{d.name}</td>
                <td>{d.specialty}</td>
                <td>{d.bio}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="admin-btn admin-btn--sm admin-btn--ghost" onClick={() => startEdit(d)}>تعديل</button>
                    <button
                      className="admin-btn admin-btn--sm admin-btn--danger"
                      disabled={deletingId === d.id}
                      onClick={() => handleDelete(d.id)}
                    >
                      {deletingId === d.id ? '...' : 'حذف'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {ConfirmDialogElement}
    </div>
  );
}