import apiClient from './apiClient';
import { Appointment, AppointmentStatus } from '../types/adminTypes';

export interface AppointmentFilters {
  status?: AppointmentStatus;
  doctorId?: string;
  date?: string;
}

export async function getAllAppointments(
  filters: AppointmentFilters = {},
  signal?: AbortSignal
): Promise<Appointment[]> {
  const { data } = await apiClient.get<Appointment[]>('/Appointments/all', { params: filters, signal });
  return data;
}

export async function confirmAppointment(id: string, signal?: AbortSignal): Promise<void> {
  await apiClient.patch(`/Appointments/${id}/confirm`, undefined, { signal });
}

export async function cancelAppointment(id: string, signal?: AbortSignal): Promise<void> {
  await apiClient.patch(`/Appointments/${id}/cancel`, undefined, { signal });
}

export async function completeAppointment(id: string, signal?: AbortSignal): Promise<void> {
  await apiClient.patch(`/Appointments/${id}/complete`, undefined, { signal });
}