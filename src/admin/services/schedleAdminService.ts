import apiClient from './apiClient';
import { WeeklyAvailability, Doctor, DayOfWeek } from '../types/adminTypes';

// ملاحظة: لا يوجد endpoint مخصص لجلب مواعيد دكتور معين،
// فبنجيبها من بيانات الدكتور نفسه.
export async function getDoctorSlots(doctorId: string, signal?: AbortSignal): Promise<WeeklyAvailability[]> {
  const { data } = await apiClient.get<Doctor & { weeklyAvailabilities?: WeeklyAvailability[] }>(
    `/Doctors/${doctorId}`,
    { signal }
  );
  return data.weeklyAvailabilities || [];
}

export async function createSlot(
  doctorId: string,
  slot: { dayOfWeek: DayOfWeek; startTime: string; endTime: string },
  signal?: AbortSignal
): Promise<WeeklyAvailability> {
  const { data } = await apiClient.post<WeeklyAvailability>(`/Doctors/${doctorId}/weekly-availability`, slot, { signal });
  return data;
}

export async function updateSlot(
  slotId: string,
  slot: { dayOfWeek: DayOfWeek; startTime: string; endTime: string },
  signal?: AbortSignal
): Promise<WeeklyAvailability> {
  const { data } = await apiClient.put<WeeklyAvailability>(`/Doctors/weekly-availability/${slotId}`, slot, { signal });
  return data;
}

export async function deleteSlot(slotId: string, signal?: AbortSignal): Promise<void> {
  await apiClient.delete(`/Doctors/weekly-availability/${slotId}`, { signal });
}