'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import styles from './HwToast.module.css';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  message: string;
  title?: string;
  variant: ToastVariant;
}

interface ToastContext {
  toast: (message: string, variant?: ToastVariant, title?: string) => void;
}

const ToastContext = createContext<ToastContext | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within HwToastProvider');
  return ctx;
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div className={[styles.toast, styles[toast.variant]].join(' ')}>
      <div className={styles.content}>
        {toast.title && <p className={styles.title}>{toast.title}</p>}
        <p className={styles.body}>{toast.message}</p>
      </div>
      <button
        type="button"
        className={styles.close}
        onClick={() => onDismiss(toast.id)}
      >
        ×
      </button>
    </div>
  );
}

export default function HwToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, variant: ToastVariant = 'info', title?: string) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, message, variant, title }]);
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className={styles.container}>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
