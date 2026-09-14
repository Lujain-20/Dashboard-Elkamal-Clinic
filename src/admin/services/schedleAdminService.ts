import apiClient from './apiClient';
import type { WeeklyAvailability, DayOfWeek } from '../types/adminTypes';

export async function getDoctorSlots(doctorId: string): Promise<WeeklyAvailability[]> {
  const { data } = await apiClient.get<WeeklyAvailability[]>(
    `/Doctors/${doctorId}/weekly-availability`
  );
  return data;
}

export async function createSlot(
  doctorId: string,
  slot: { dayOfWeek: DayOfWeek; startTime: string; endTime: string }
): Promise<WeeklyAvailability> {
  const { data } = await apiClient.post<WeeklyAvailability>(
    `/Doctors/${doctorId}/weekly-availability`,
    slot
  );
  return data;
}

export async function updateSlot(
  slotId: string,
  slot: { dayOfWeek: DayOfWeek; startTime: string; endTime: string }
): Promise<WeeklyAvailability> {
  const { data } = await apiClient.put<WeeklyAvailability>(
    `/Doctors/weekly-availability/${slotId}`,
    slot
  );
  return data;
}

export async function deleteSlot(slotId: string): Promise<void> {
  await apiClient.delete(`/Doctors/weekly-availability/${slotId}`);
}