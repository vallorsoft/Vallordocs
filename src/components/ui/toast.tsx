'use client';

import { CheckCircle2, Info, XCircle } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

/**
 * Toast notifications (PRD 4. fejezet – Értesítési rendszer: Toast értesítések,
 * sikeres/hibás műveletek). A minimal, dependency-free provider: it renders a
 * fixed, screen-reader-announced stack and auto-dismisses entries. All copy is
 * passed in already translated by the caller.
 */
type ToastVariant = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastVariant, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const ACCENT: Record<ToastVariant, string> = {
  success: 'text-emerald-500',
  error: 'text-destructive',
  info: 'text-sky-500',
};

const AUTO_DISMISS_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { id, message, variant }]);
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const Icon = ICONS[t.variant];
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => dismiss(t.id)}
              className="pointer-events-auto flex items-start gap-3 rounded-lg border border-border bg-card p-4 text-left text-sm text-card-foreground shadow-lg animate-in slide-in-from-bottom-2"
            >
              <Icon
                className={cn('mt-0.5 h-5 w-5 shrink-0', ACCENT[t.variant])}
              />
              <span>{t.message}</span>
            </button>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

/** Access the toast dispatcher. Throws outside {@link ToastProvider}. */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
