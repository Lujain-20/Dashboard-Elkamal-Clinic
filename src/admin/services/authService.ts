import apiClient from './apiClient';
import { AdminUser } from '../types/adminTypes';

export async function login(email: string, password: string, signal?: AbortSignal): Promise<AdminUser> {
  const { data } = await apiClient.post('/Auth/login', { email, password }, { signal });

  const admin: AdminUser = { name: data.name, email: data.email };
  localStorage.setItem('admin_token', data.token);
  localStorage.setItem('admin_user', JSON.stringify(admin));
  return admin;
}

export function logout() {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
}

export function getStoredAdmin(): AdminUser | null {
  const raw = localStorage.getItem('admin_user');
  return raw ? JSON.parse(raw) : null;
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('admin_token');
}