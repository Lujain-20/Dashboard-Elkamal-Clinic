import React, { useEffect, useState } from 'react';
import {
  getDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} from '../services/doctorAdminService';

import { uploadImage } from '../services/imageUploadService';

import { Doctor } from '../types/adminTypes';
import { useAbortController } from '../hooks/useAbortController';
import { useConfirm } from '../hooks/useConfirm';
import { getApiErrorMessage, isAbortError } from '../utils/apiError';

const emptyForm = {
  name: '',
  specialty: '',
  bio: '',
  profileImageUrl: '',
};

export default function DoctorsManagement() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState(emptyForm);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  // الصورة المختارة من الجهاز
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  // Preview للصورة
  const [imagePreview, setImagePreview] = useState<string>('');

  const getListSignal = useAbortController();
  const getActionSignal = useAbortController();

  const { confirm, ConfirmDialogElement } = useConfirm();

  function load() {
    const signal = getListSignal();

    setLoading(true);
    setError(null);

    getDoctors(signal)
      .then((data) => {
        if (!signal.aborted) {
          setDoctors(data);
        }
      })
      .catch((err) => {
        if (isAbortError(err)) return;

        setError(
          getApiErrorMessage(err, 'تعذر تحميل قائمة الأطباء')
        );
      })
      .finally(() => {
        if (!signal.aborted) {
          setLoading(false);
        }
      });
  }

  useEffect(() => {
    load();
  }, []);

  // =========================================
  // اختيار صورة من الجهاز
  // =========================================
  function handleImageChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    // التأكد أن الملف صورة
    if (!file.type.startsWith('image/')) {
      setError('من فضلك اختاري ملف صورة فقط');
      return;
    }

    // حجم الصورة الأقصى 5MB
    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setError('حجم الصورة يجب ألا يتجاوز 5 ميجابايت');
      return;
    }

    setError(null);

    setSelectedImage(file);

    // إنشاء Preview
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  }

  // =========================================
  // تعديل دكتور
  // =========================================
  function startEdit(doctor: Doctor) {
    const existingImage =
      (doctor as any).profileImageUrl || '';

    setEditingId(doctor.id);

    setForm({
      name: doctor.name,
      specialty: doctor.specialty,
      bio: doctor.bio || '',
      profileImageUrl: existingImage,
    });

    // لو الدكتور عنده صورة موجودة نعرضها
    setImagePreview(existingImage);

    // مفيش صورة جديدة مختارة لسه
    setSelectedImage(null);

    setError(null);
  }

  // =========================================
  // Reset
  // =========================================
  function resetForm() {
    setEditingId(null);

    setForm(emptyForm);

    setSelectedImage(null);

    setImagePreview('');

    setError(null);
  }

  // =========================================
  // Submit
  // =========================================
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError(null);

    const trimmedName = form.name.trim();
    const trimmedSpecialty = form.specialty.trim();
    const trimmedBio = form.bio.trim();

    if (!trimmedName || !trimmedSpecialty) {
      setError('الاسم والتخصص مطلوبين');
      return;
    }

    setSaving(true);

    const signal = getActionSignal();

    try {
      let profileImageUrl = form.profileImageUrl.trim();

      // =========================================
      // لو المستخدم اختار صورة جديدة
      // نرفعها الأول
      // =========================================
      if (selectedImage) {
        profileImageUrl = await uploadImage(selectedImage);
      }

      const doctorData = {
        name: trimmedName,
        specialty: trimmedSpecialty,
        bio: trimmedBio,
        profileImageUrl,
      };

      // =========================================
      // تعديل دكتور موجود
      // =========================================
      if (editingId) {
        const updated = await updateDoctor(
          editingId,
          doctorData,
          signal
        );

        setDoctors((prev) =>
          prev.map((d) =>
            d.id === editingId ? updated : d
          )
        );
      }

      // =========================================
      // إضافة دكتور جديد
      // =========================================
      else {
        const created = await createDoctor(
          doctorData,
          signal
        );

        setDoctors((prev) => [
          ...prev,
          created,
        ]);
      }

      resetForm();
    } catch (err) {
      if (isAbortError(err)) return;

      setError(
        getApiErrorMessage(
          err,
          'حدث خطأ أثناء حفظ بيانات الدكتور'
        )
      );
    } finally {
      setSaving(false);
    }
  }

  // =========================================
  // حذف دكتور
  // =========================================
  async function handleDelete(id: string) {
    const ok = await confirm(
      'هل أنت متأكد من حذف هذا الدكتور؟ سيتم حذف بياناته نهائيًا.',
      {
        title: 'حذف دكتور',
        confirmLabel: 'حذف',
        danger: true,
      }
    );

    if (!ok) return;

    setDeletingId(id);
    setError(null);

    const signal = getActionSignal();

    try {
      await deleteDoctor(id, signal);

      setDoctors((prev) =>
        prev.filter((d) => d.id !== id)
      );

      if (editingId === id) {
        resetForm();
      }
    } catch (err) {
      if (isAbortError(err)) return;

      setError(
        getApiErrorMessage(
          err,
          'تعذر حذف الدكتور'
        )
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <h2>إدارة الأطباء</h2>

      {error && (
        <div className="admin-alert admin-alert--error">
          {error}
        </div>
      )}

      {/* =========================================
          FORM
      ========================================= */}
      <form
        onSubmit={handleSubmit}
        className="admin-table-wrap"
        style={{
          padding: 20,
          marginBottom: 24,
        }}
      >
        <h3 style={{ marginTop: 0 }}>
          {editingId
            ? 'تعديل بيانات دكتور'
            : 'إضافة دكتور جديد'}
        </h3>

        <div className="admin-form-grid">

          {/* الاسم */}
          <div className="admin-form-field">
            <label>الاسم</label>

            <input
              className="admin-input"
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  name: e.target.value,
                }))
              }
              required
            />
          </div>

          {/* التخصص */}
          <div className="admin-form-field">
            <label>التخصص</label>

            <input
              className="admin-input"
              value={form.specialty}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  specialty: e.target.value,
                }))
              }
              required
            />
          </div>

          {/* =========================================
              اختيار صورة الدكتور
          ========================================= */}
          <div className="admin-form-field">
            <label>صورة الدكتور</label>

            <input
              id="doctor-image"
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleImageChange}
              style={{ marginBottom: 10 }}
            />

            <small
              style={{
                display: 'block',
                color: '#777',
                marginBottom: 10,
              }}
            >
              JPG, PNG أو WEBP - بحد أقصى 5MB
            </small>

            {/* Preview */}
            {imagePreview && (
              <div
                style={{
                  marginTop: 10,
                  position: 'relative',
                  width: 130,
                  height: 130,
                }}
              >
                <img
                  src={imagePreview}
                  alt="Doctor preview"
                  style={{
                    width: '130px',
                    height: '130px',
                    objectFit: 'cover',
                    borderRadius: '12px',
                    border: '1px solid #ddd',
                    display: 'block',
                  }}
                />
              </div>
            )}
          </div>

          {/* النبذة */}
          <div
            className="admin-form-field"
            style={{ gridColumn: '1 / -1' }}
          >
            <label>نبذة</label>

            <textarea
              className="admin-textarea"
              rows={3}
              value={form.bio}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  bio: e.target.value,
                }))
              }
            />
          </div>
        </div>

        {/* Buttons */}
        <div
          style={{
            marginTop: 16,
            display: 'flex',
            gap: 8,
          }}
        >
          <button
            className="admin-btn admin-btn--gold"
            type="submit"
            disabled={saving}
          >
            {saving
              ? selectedImage
                ? 'جاري رفع الصورة والحفظ...'
                : 'جاري الحفظ...'
              : editingId
                ? 'حفظ التعديلات'
                : 'إضافة الدكتور'}
          </button>

          {editingId && (
            <button
              className="admin-btn admin-btn--ghost"
              type="button"
              onClick={resetForm}
              disabled={saving}
            >
              إلغاء
            </button>
          )}
        </div>
      </form>

      {/* =========================================
          DOCTORS TABLE
      ========================================= */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>الصورة</th>
              <th>الاسم</th>
              <th>التخصص</th>
              <th>نبذة</th>
              <th>إجراءات</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={5}>
                  جاري التحميل...
                </td>
              </tr>
            )}

            {!loading && doctors.length === 0 && (
              <tr>
                <td colSpan={5}>
                  لا يوجد أطباء
                </td>
              </tr>
            )}

            {!loading &&
              doctors.map((d) => {
                const imageUrl =
                  (d as any).profileImageUrl || '';

                return (
                  <tr key={d.id}>

                    {/* صورة الدكتور */}
                    <td>
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={d.name}
                          style={{
                            width: 55,
                            height: 55,
                            objectFit: 'cover',
                            borderRadius: '50%',
                            border: '1px solid #ddd',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 55,
                            height: 55,
                            borderRadius: '50%',
                            background: '#f1f1f1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#999',
                            fontSize: 12,
                          }}
                        >
                          بدون صورة
                        </div>
                      )}
                    </td>

                    {/* الاسم */}
                    <td>{d.name}</td>

                    {/* التخصص */}
                    <td>{d.specialty}</td>

                    {/* النبذة */}
                    <td>{d.bio}</td>

                    {/* الإجراءات */}
                    <td>
                      <div
                        style={{
                          display: 'flex',
                          gap: 6,
                        }}
                      >
                        <button
                          className="admin-btn admin-btn--sm admin-btn--ghost"
                          onClick={() =>
                            startEdit(d)
                          }
                        >
                          تعديل
                        </button>

                        <button
                          className="admin-btn admin-btn--sm admin-btn--danger"
                          disabled={
                            deletingId === d.id
                          }
                          onClick={() =>
                            handleDelete(d.id)
                          }
                        >
                          {deletingId === d.id
                            ? '...'
                            : 'حذف'}
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