import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { getDoctors } from '../services/doctorAdminService';
import { getDoctorPhotos, addDoctorPhoto, deleteDoctorPhoto } from '../services/galleryAdminService';
import { uploadImage } from '../services/imageUploadService';
import type { Doctor, DoctorPhoto } from '../types/adminTypes';

export default function GalleryManagement() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [photos, setPhotos] = useState<DoctorPhoto[]>([]);
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState('');

  useEffect(() => {
    getDoctors().then((list) => {
      setDoctors(list);
      if (list.length) setSelectedDoctorId(list[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedDoctorId) return;
    getDoctorPhotos(selectedDoctorId).then(setPhotos);
  }, [selectedDoctorId]);

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    if (!beforeFile || !afterFile) {
      alert('يجب اختيار صورتي قبل وبعد');
      return;
    }
    setUploading(true);
    try {
      setUploadStep('جاري رفع صورة القبل...');
      const beforeImageUrl = await uploadImage(beforeFile);

      setUploadStep('جاري رفع صورة البعد...');
      const afterImageUrl = await uploadImage(afterFile);

      setUploadStep('جاري الحفظ...');
      const photo = await addDoctorPhoto(selectedDoctorId, {
        beforeImageUrl,
        afterImageUrl,
        description,
        displayOrder: photos.length,
      });

      setPhotos((prev) => [...prev, photo]);
      setBeforeFile(null);
      setAfterFile(null);
      setDescription('');
    } catch {
      alert('حدث خطأ أثناء رفع الصور');
    } finally {
      setUploading(false);
      setUploadStep('');
    }
  }

  async function handleDelete(photoId: string) {
    if (!confirm('حذف هذه الصورة؟')) return;
    await deleteDoctorPhoto(photoId);
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  }

  return (
    <div>
      <h2>إدارة الجاليري (قبل / بعد)</h2>

      <div className="admin-form-field" style={{ maxWidth: 320, marginBottom: 20 }}>
        <label>اختر الدكتور</label>
        <select className="admin-select" value={selectedDoctorId} onChange={(e) => setSelectedDoctorId(e.target.value)}>
          {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      <div className="admin-gallery-doctor">
        <form onSubmit={handleUpload} className="admin-form-grid" style={{ alignItems: 'flex-end' }}>
          <div className="admin-form-field">
            <label>صورة قبل</label>
            <input type="file" accept="image/*" onChange={(e) => setBeforeFile(e.target.files?.[0] || null)} />
          </div>
          <div className="admin-form-field">
            <label>صورة بعد</label>
            <input type="file" accept="image/*" onChange={(e) => setAfterFile(e.target.files?.[0] || null)} />
          </div>
          <div className="admin-form-field">
            <label>الوصف</label>
            <input className="admin-input" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <button className="admin-btn admin-btn--gold" type="submit" disabled={uploading}>
            {uploading ? (uploadStep || 'جاري الرفع...') : 'رفع الصور'}
          </button>
        </form>

        <div className="admin-gallery-grid">
          {photos.map((p) => (
            <div key={p.id} className="admin-photo-card">
              <div className="admin-photo-card__images">
                <img src={p.beforeImageUrl} alt="قبل" />
                <img src={p.afterImageUrl} alt="بعد" />
              </div>
              <div className="admin-photo-card__body">
                <div className="admin-photo-card__desc">{p.description}</div>
                <button className="admin-btn admin-btn--sm admin-btn--danger" onClick={() => handleDelete(p.id)}>حذف</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}