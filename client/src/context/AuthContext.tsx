'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { IUser, UserRole } from '../types';
import { api, formatApiError } from '../lib/api';

interface AuthContextType {
  user: IUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => void;
  quickLoginAs: (role: UserRole) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PRESET_CREDENTIALS: Record<UserRole, { email: string; pass: string }> = {
  [UserRole.ADMIN]: { email: 'admin@lms.local', pass: 'Admin@1234' },
  [UserRole.SALES]: { email: 'sales@lms.local', pass: 'Sales@1234' },
  [UserRole.SANCTION]: { email: 'sanction@lms.local', pass: 'Sanction@1234' },
  [UserRole.DISBURSEMENT]: { email: 'disburse@lms.local', pass: 'Disburse@1234' },
  [UserRole.COLLECTION]: { email: 'collection@lms.local', pass: 'Collection@1234' },
  [UserRole.BORROWER]: { email: 'borrower@lms.local', pass: 'Borrower@1234' },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    try {
      const activeToken = localStorage.getItem('lms_token');
      if (!activeToken) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const response = await api.get('/auth/me');
      if (response.data?.success) {
        setUser(response.data.data);
      }
    } catch {
      localStorage.removeItem('lms_token');
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('lms_token');
    if (storedToken) {
      setToken(storedToken);
      refreshUser();
    } else {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password: pass });
      if (res.data?.success) {
        const { token: receivedToken, user: receivedUser } = res.data.data;
        localStorage.setItem('lms_token', receivedToken);
        setToken(receivedToken);
        setUser(receivedUser);
      }
    } catch (err) {
      throw new Error(formatApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, pass: string, phone?: string) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/register', { name, email, password: pass, phone });
      if (res.data?.success) {
        const { token: receivedToken, user: receivedUser } = res.data.data;
        localStorage.setItem('lms_token', receivedToken);
        setToken(receivedToken);
        setUser(receivedUser);
      }
    } catch (err) {
      throw new Error(formatApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('lms_token');
    setToken(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const quickLoginAs = async (role: UserRole) => {
    const cred = PRESET_CREDENTIALS[role];
    if (!cred) return;
    await login(cred.email, cred.pass);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        quickLoginAs,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
