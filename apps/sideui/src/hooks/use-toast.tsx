import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ToastVariant = "default" | "success" | "error" | "info";

export interface ToastMessage {
  id: number;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastMessage[];
  push(message: Omit<ToastMessage, "id">): number;
  dismiss(id: number): void;
  clear(): void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    return () => {
      setToasts([]);
    };
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const clear = useCallback(() => {
    setToasts([]);
  }, []);

  const push = useCallback<ToastContextValue["push"]>((message) => {
    const id = Date.now() + Math.round(Math.random() * 1000);
    const toast: ToastMessage = {
      id,
      duration: 4000,
      variant: "default",
      ...message,
    };
    setToasts((current) => [...current, toast]);
    if (toast.duration && toast.duration > 0) {
      window.setTimeout(() => dismiss(id), toast.duration);
    }
    return id;
  }, [dismiss]);

  const value = useMemo<ToastContextValue>(
    () => ({ toasts, push, dismiss, clear }),
    [toasts, push, dismiss, clear]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.variant ?? "default"}`}>
            <strong>{toast.title}</strong>
            {toast.description ? <p>{toast.description}</p> : null}
            <button type="button" onClick={() => dismiss(toast.id)} aria-label="Dismiss notification">
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
