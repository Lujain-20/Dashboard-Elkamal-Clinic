export type AppointmentStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';

export interface Appointment {
  id: string;
  doctorId: string;
  doctorName?: string;
  patientId: string;
  patientName: string;
  appointmentType?: string;
  scheduledAt: string;
  status: AppointmentStatus;
  patientPhoneNumber: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  bio?: string;
  profileImageUrl?: string;
}

export interface DoctorPhoto {
  id: string;
  doctorId: string;
  beforeImageUrl: string;
  afterImageUrl: string;
  description?: string;
  displayOrder: number;
}

export enum DayOfWeek {
  Sunday = 0, Monday = 1, Tuesday = 2, Wednesday = 3,
  Thursday = 4, Friday = 5, Saturday = 6,
}

export interface WeeklyAvailability {
  id: string;
  doctorId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

export interface AdminUser {
  name?: string;
  email: string;
}