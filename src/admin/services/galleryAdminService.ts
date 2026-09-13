import apiClient from './apiClient';
import { DoctorPhoto } from '../types/adminTypes';

export async function getDoctorPhotos(doctorId: string, signal?: AbortSignal): Promise<DoctorPhoto[]> {
  const { data } = await apiClient.get<DoctorPhoto[]>(`/Doctors/${doctorId}/photos`, { signal });
  return data;
}

export async function addDoctorPhoto(
  doctorId: string,
  photo: { beforeImageUrl: string; afterImageUrl: string; description?: string; displayOrder: number },
  signal?: AbortSignal
): Promise<DoctorPhoto> {
  const { data } = await apiClient.post<DoctorPhoto>(`/Doctors/${doctorId}/photos`, photo, { signal });
  return data;
}

export async function deleteDoctorPhoto(photoId: string, signal?: AbortSignal): Promise<void> {
  await apiClient.delete(`/Doctors/photos/${photoId}`, { signal });
}