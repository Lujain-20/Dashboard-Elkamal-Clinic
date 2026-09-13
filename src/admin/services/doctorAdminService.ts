import apiClient from './apiClient';
import { Doctor } from '../types/adminTypes';

export interface DoctorInput {
  name: string;
  specialty: string;
  bio?: string;
  profileImageUrl?: string;
}

export async function getDoctors(signal?: AbortSignal): Promise<Doctor[]> {
  const { data } = await apiClient.get<Doctor[]>('/Doctors', { signal });
  return data;
}

export async function createDoctor(doctor: DoctorInput, signal?: AbortSignal): Promise<Doctor> {
  const { data } = await apiClient.post<Doctor>('/Doctors', doctor, { signal });
  return data;
}

export async function updateDoctor(id: string, doctor: DoctorInput, signal?: AbortSignal): Promise<Doctor> {
  const { data } = await apiClient.put<Doctor>(`/Doctors/${id}`, doctor, { signal });
  return data;
}

export async function deleteDoctor(id: string, signal?: AbortSignal): Promise<void> {
  await apiClient.delete(`/Doctors/${id}`, { signal });
}