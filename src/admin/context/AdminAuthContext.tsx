import  { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AdminUser } from '../types/adminTypes';
import * as authService from '../services/authService';

interface AdminAuthContextValue {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = authService.getStoredAdmin();
    if (stored && authService.isAuthenticated()) {
      setAdmin(stored);
    }
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const  admin  = await authService.login(email, password);
    setAdmin(admin);
  }

  function logout() {
    authService.logout();
    setAdmin(null);
  }

  return (
    <AdminAuthContext.Provider value={{ admin, isAuthenticated: !!admin, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside AdminAuthProvider');
  return ctx;
}