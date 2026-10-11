'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toast: {
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
  };
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, title?: string, duration = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastItem = { id, type, message, title, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [dismiss]
  );

  const toastMethods = {
    success: (message: string, title = 'Success') => addToast('success', message, title),
    error: (message: string, title = 'Attention') => addToast('error', message, title),
    info: (message: string, title = 'Information') => addToast('info', message, title),
    warning: (message: string, title = 'Warning') => addToast('warning', message, title),
  };

  return (
    <ToastContext.Provider value={{ toast: toastMethods, dismiss }}>
      {children}

      {/* Floating Toasts Viewport */}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((item) => {
          const typeConfig = {
            success: {
              icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
              border: 'border-emerald-500/40',
              badge: 'bg-emerald-500/20 text-emerald-300',
              progress: 'bg-emerald-500',
            },
            error: {
              icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
              border: 'border-rose-500/40',
              badge: 'bg-rose-500/20 text-rose-300',
              progress: 'bg-rose-500',
            },
            info: {
              icon: <Info className="w-5 h-5 text-indigo-400 shrink-0" />,
              border: 'border-indigo-500/40',
              badge: 'bg-indigo-500/20 text-indigo-300',
              progress: 'bg-indigo-500',
            },
            warning: {
              icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
              border: 'border-amber-500/40',
              badge: 'bg-amber-500/20 text-amber-300',
              progress: 'bg-amber-500',
            },
          }[item.type];

          return (
            <div
              key={item.id}
              role="alert"
              className={`pointer-events-auto relative overflow-hidden bg-slate-900/95 backdrop-blur-md border ${typeConfig.border} text-white p-3.5 rounded-2xl shadow-2xl shadow-black/40 flex items-start space-x-3 transition-all animate-in slide-in-from-top-3 fade-in duration-200 hover:shadow-indigo-500/10`}
            >
              <div className="pt-0.5">{typeConfig.icon}</div>

              <div className="flex-1 min-w-0 pr-4">
                {item.title && (
                  <h5 className="text-xs font-bold text-slate-100 tracking-wide mb-0.5">
                    {item.title}
                  </h5>
                )}
                <p className="text-[12px] text-slate-300 leading-snug break-words">
                  {item.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
                aria-label="Dismiss toast"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Progress bar animation */}
              <div
                className={`absolute bottom-0 left-0 right-0 h-0.5 ${typeConfig.progress} opacity-40 animate-pulse`}
              />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
