"use client";

import { useEffect, useState } from "react";

export type ToastVariant = "info" | "warn" | "success" | "error";

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onClose: () => void;
}

const TOAST_VARIANT_CLASSES: Record<ToastVariant, string> = {
  info:
    "border-[var(--primary-color)]/50 bg-[var(--primary-color)]/10 text-[var(--primary-color)] dark:border-[var(--primary-color)]/40 dark:bg-[var(--primary-color)]/20 dark:text-[var(--primary-color)]",
  warn: "border-amber-500/50 bg-amber-50 text-amber-950 dark:border-amber-400/40 dark:bg-amber-950/90 dark:text-amber-100",
  success:
    "border-emerald-500/50 bg-emerald-50 text-emerald-950 dark:border-emerald-400/40 dark:bg-emerald-950/90 dark:text-emerald-100",
  error: "border-rose-500/50 bg-rose-50 text-rose-950 dark:border-rose-400/40 dark:bg-rose-950/90 dark:text-rose-100",
};

export function Toast({
  message,
  variant = "info",
  duration = 2000,
  onClose,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`fixed left-1/2 top-4 z-50 min-w-[16rem] max-w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 rounded-md border px-3 py-2 text-sm font-medium ${TOAST_VARIANT_CLASSES[variant]}`}
      style={{
        boxShadow: "0 0 0.625em var(--shadow-color)",
      }}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState<{
    message: string;
    variant: ToastVariant;
  } | null>(null);

  const showToast = (message: string, variant: ToastVariant = "info") => {
    setToast({ message, variant });
  };

  const ToastComponent = toast ? (
    <Toast
      message={toast.message}
      variant={toast.variant}
      onClose={() => setToast(null)}
    />
  ) : null;

  return { showToast, ToastComponent };
}
