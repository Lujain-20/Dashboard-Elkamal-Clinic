import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { getDoctors } from '../services/doctorAdminService';
import { getDoctorPhotos, addDoctorPhoto, deleteDoctorPhoto } from '../services/galleryAdminService';
import type { Doctor, DoctorPhoto } from '../types/adminTypes';
import { useAbortController } from '../hooks/useAbortController';
import { useConfirm } from '../hooks/useConfirm';
import { getApiErrorMessage, isAbortError } from '../utils/apiError';

function isValidUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function GalleryManagement() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [photos, setPhotos] = useState<DoctorPhoto[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [beforeUrl, setBeforeUrl] = useState('');
  const [afterUrl, setAfterUrl] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getListSignal = useAbortController();
  const getActionSignal = useAbortController();
  const { confirm, ConfirmDialogElement } = useConfirm();

  useEffect(() => {
    getDoctors().then((list) => {
      setDoctors(list);
      if (list.length) setSelectedDoctorId(list[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedDoctorId) return;
    const signal = getListSignal();
    setPhotosLoading(true);
    setError(null);
    getDoctorPhotos(selectedDoctorId, signal)
      .then((data) => { if (!signal.aborted) setPhotos(data); })
      .catch((err) => {
        if (isAbortError(err)) return;
        setError(getApiErrorMessage(err, 'تعذر تحميل الصور'));
      })
      .finally(() => { if (!signal.aborted) setPhotosLoading(false); });
  }, [selectedDoctorId, getListSignal]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!beforeUrl.trim() || !afterUrl.trim()) {
      setError('لازم تحط رابط صورة قبل ورابط صورة بعد');
      return;
    }
    if (!isValidUrl(beforeUrl.trim()) || !isValidUrl(afterUrl.trim())) {
      setError('روابط الصور لازم تكون روابط صحيحة (تبدأ بـ http أو https)');
      return;
    }

    setSaving(true);
    const signal = getActionSignal();
    try {
      const nextOrder = photos.length
        ? Math.max(...photos.map((p) => p.displayOrder ?? 0)) + 1
        : 0;
      const photo = await addDoctorPhoto(
        selectedDoctorId,
        {
          beforeImageUrl: beforeUrl.trim(),
          afterImageUrl: afterUrl.trim(),
          description: description.trim(),
          displayOrder: nextOrder,
        },
        signal
      );
      setPhotos((prev) => [...prev, photo]);
      setBeforeUrl('');
      setAfterUrl('');
      setDescription('');
    } catch (err) {
      if (isAbortError(err)) return;
      setError(getApiErrorMessage(err, 'حدث خطأ أثناء الحفظ'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(photoId: string) {
    const ok = await confirm('هل تريد حذف هذه الصورة نهائيًا؟', {
      title: 'حذف صورة',
      confirmLabel: 'حذف',
      danger: true,
    });
    if (!ok) return;

    setDeletingId(photoId);
    setError(null);
    const signal = getActionSignal();
    try {
      await deleteDoctorPhoto(photoId, signal);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch (err) {
      if (isAbortError(err)) return;
      setError(getApiErrorMessage(err, 'تعذر حذف الصورة'));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <h2>إدارة الجاليري (قبل / بعد)</h2>

      {error && <div className="admin-alert admin-alert--error">{error}</div>}

      <div className="admin-form-field" style={{ maxWidth: 320, marginBottom: 20 }}>
        <label>اختر الدكتور</label>
        <select className="admin-select" value={selectedDoctorId} onChange={(e) => setSelectedDoctorId(e.target.value)}>
          {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      <div className="admin-gallery-doctor">
        <form onSubmit={handleAdd} className="admin-form-grid" style={{ alignItems: 'flex-end' }}>
          <div className="admin-form-field">
            <label>رابط صورة قبل</label>
            <input className="admin-input" value={beforeUrl} onChange={(e) => setBeforeUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="admin-form-field">
            <label>رابط صورة بعد</label>
            <input className="admin-input" value={afterUrl} onChange={(e) => setAfterUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="admin-form-field">
            <label>الوصف</label>
            <input className="admin-input" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <button className="admin-btn admin-btn--gold" type="submit" disabled={saving}>
            {saving ? 'جاري الحفظ...' : 'إضافة'}
          </button>
        </form>

        <div className="admin-gallery-grid">
          {photosLoading && <p>جاري تحميل الصور...</p>}
          {!photosLoading && photos.length === 0 && <p>لا توجد صور لهذا الدكتور</p>}
          {!photosLoading && photos.map((p) => (
            <div key={p.id} className="admin-photo-card">
              <div className="admin-photo-card__images">
                <img src={p.beforeImageUrl} alt="قبل" loading="lazy" />
                <img src={p.afterImageUrl} alt="بعد" loading="lazy" />
              </div>
              <div className="admin-photo-card__body">
                <div className="admin-photo-card__desc">{p.description}</div>
                <button
                  className="admin-btn admin-btn--sm admin-btn--danger"
                  disabled={deletingId === p.id}
                  onClick={() => handleDelete(p.id)}
                >
                  {deletingId === p.id ? '...' : 'حذف'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {ConfirmDialogElement}
    </div>
  );
}