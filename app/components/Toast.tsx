"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";

type ToastType = "success" | "error" | "warning";
type Toast = { id: number; message: string; type: ToastType };

const ToastContext = createContext<{
  success: (msg: string) => void;
  error: (msg: string) => void;
  warning: (msg: string) => void;
}>({
  success: () => {},
  error: () => {},
  warning: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = ++idRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const success = useCallback((msg: string) => addToast(msg, "success"), [addToast]);
  const error = useCallback((msg: string) => addToast(msg, "error"), [addToast]);
  const warning = useCallback((msg: string) => addToast(msg, "warning"), [addToast]);

  const colors: Record<ToastType, { bg: string; border: string; text: string; icon: string }> = {
    success: { bg: "#0a1f0f", border: "#1a4d2e", text: "#4ade80", icon: "✓" },
    error: { bg: "#1f0a0a", border: "#4d1a1a", text: "#f87171", icon: "✕" },
    warning: { bg: "#1f1a0a", border: "#4d3d1a", text: "#fbbf24", icon: "⚠" },
  };

  return (
    <ToastContext.Provider value={{ success, error, warning }}>
      {children}
      <div style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        display: "flex",
        flexDirection: "column-reverse",
        gap: 8,
        zIndex: 99999,
        pointerEvents: "none",
      }}>
        {toasts.map((t, i) => {
          const c = colors[t.type];
          return (
            <div key={t.id} style={{
              background: c.bg,
              border: `1px solid ${c.border}`,
              borderRadius: 10,
              padding: "12px 18px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              minWidth: 280,
              maxWidth: 420,
              pointerEvents: "auto",
              animation: "toastIn 0.3s ease-out",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            }}>
              <span style={{ fontSize: 16, color: c.text, flexShrink: 0 }}>{c.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: c.text, lineHeight: 1.4 }}>{t.message}</span>
              <button
                onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                style={{
                  marginLeft: "auto",
                  background: "none",
                  border: "none",
                  color: c.text,
                  opacity: 0.5,
                  cursor: "pointer",
                  fontSize: 14,
                  padding: "0 4px",
                  flexShrink: 0,
                }}
              >✕</button>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(12px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
