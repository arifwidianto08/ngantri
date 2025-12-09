"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

type ToastOptionsObject = {
  title?: string;
  description?: string;
  variant?: ToastType | "destructive";
  duration?: number;
};

type ToastParam = string | ToastOptionsObject;

interface ToastContextType {
  toasts: Toast[];
  /**
   * Old style: showToast("message", "success", 3000)
   * New style: toast({ title: "OK", description: "Saved", variant: "success" })
   */
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  toast: (param: ToastParam) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Internal helper to normalize variant values and object -> Toast
  const normalizeAndPush = useCallback(
    (message: string, type: ToastType = "info", duration = 3000) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newToast: Toast = { id, message, type, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  // showToast keeps the old signature (string, type, duration)
  const showToast = useCallback(
    (message: string, type: ToastType = "info", duration = 3000) => {
      normalizeAndPush(message, type, duration);
    },
    [normalizeAndPush]
  );

  // toast accepts either a string OR an object { title, description, variant, duration }
  const toast = useCallback(
    (param: ToastParam) => {
      if (typeof param === "string") {
        normalizeAndPush(param, "info", 3000);
        return;
      }

      // object path
      const { title, description, variant, duration } = param;
      // prefer description, if not present use title, fall back to empty string
      const messageSource = description ?? title ?? "";
      // map "destructive" to "error" to match your ToastType
      const normalizedVariant: ToastType =
        variant === "destructive" ? "error" : variant ?? "info";

      // If there's no text at all, make a generic fallback
      const message =
        messageSource.trim() !== "" ? messageSource : title ?? "Notification";

      normalizeAndPush(
        message,
        normalizedVariant as ToastType,
        duration ?? 3000
      );
    },
    [normalizeAndPush]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast, toast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  const iconMap = {
    success: <CheckCircle className="w-5 h-5 text-green-600" />,
    error: <AlertCircle className="w-5 h-5 text-red-600" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-600" />,
    info: <Info className="w-5 h-5 text-blue-600" />,
  };

  const bgColorMap = {
    success: "bg-green-50 border-green-200",
    error: "bg-red-50 border-red-200",
    warning: "bg-yellow-50 border-yellow-200",
    info: "bg-blue-50 border-blue-200",
  };

  const textColorMap = {
    success: "text-green-800",
    error: "text-red-800",
    warning: "text-yellow-800",
    info: "text-blue-800",
  };

  return (
    <div className="fixed bottom-0 right-0 p-4 space-y-3 pointer-events-none z-50">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 rounded-lg border shadow-lg p-4 pointer-events-auto animate-in slide-in-from-right-full duration-300 ${
            bgColorMap[toast.type]
          }`}
        >
          {iconMap[toast.type]}
          <span className={`text-sm font-medium ${textColorMap[toast.type]}`}>
            {toast.message}
          </span>
          <button
            type="button"
            onClick={() => onRemove(toast.id)}
            className="ml-auto text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
