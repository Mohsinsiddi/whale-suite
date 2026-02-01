'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const styles = {
  success: 'border-success/50 bg-success/10',
  error: 'border-error/50 bg-error/10',
  info: 'border-neon-cyan/50 bg-neon-cyan/10',
  warning: 'border-warning/50 bg-warning/10',
};

const iconStyles = {
  success: 'text-success',
  error: 'text-error',
  info: 'text-neon-cyan',
  warning: 'text-warning',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((type: ToastType, title: string, message?: string, duration = 5000) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, title, message, duration }]);

    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
  }, [dismiss]);

  const success = useCallback((title: string, message?: string) => toast('success', title, message), [toast]);
  const error = useCallback((title: string, message?: string) => toast('error', title, message, 7000), [toast]);
  const info = useCallback((title: string, message?: string) => toast('info', title, message), [toast]);
  const warning = useCallback((title: string, message?: string) => toast('warning', title, message, 6000), [toast]);

  return (
    <ToastContext.Provider value={{ toasts, toast, success, error, info, warning, dismiss }}>
      {children}

      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => {
            const Icon = icons[t.type];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.95 }}
                className={`
                  flex items-start gap-3 p-4 rounded-xl border backdrop-blur-sm
                  bg-bg-secondary shadow-lg ${styles[t.type]}
                `}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconStyles[t.type]}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-text-primary">{t.title}</p>
                  {t.message && (
                    <p className="text-xs text-text-muted mt-0.5">{t.message}</p>
                  )}
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  className="p-1 rounded hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-text-muted" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
