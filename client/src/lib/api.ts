import axios, { AxiosError } from 'axios';
import { IApiResponse } from '../types';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
export const SERVER_STATIC_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5001';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('lms_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

/**
 * Builds an authenticated URL for streaming a borrower salary slip.
 * The document route is RBAC-protected on the server, so the JWT is passed as a
 * query param — <iframe>/<img>/download anchors cannot attach an Authorization header.
 */
export const buildSalarySlipUrl = (documentPath: string): string => {
  if (documentPath.startsWith('http')) return documentPath;
  const filename = documentPath.split('/').pop() || '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('lms_token') : null;
  const base = `${API_BASE_URL}/files/salary-slip/${encodeURIComponent(filename)}`;
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
};

export const formatApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError<IApiResponse>;
    if (axiosErr.response?.data?.message) {
      const msgs = axiosErr.response.data.errors;
      if (Array.isArray(msgs) && msgs.length > 0) {
        return `${axiosErr.response.data.message}: ${msgs.join(', ')}`;
      }
      return axiosErr.response.data.message;
    }
    return axiosErr.message || 'Network request failed';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};
