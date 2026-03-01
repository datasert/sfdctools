"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, duration = 2000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div 
      className="fixed bottom-4 right-4 z-50 rounded-[0.5em] bg-[var(--content-color)] px-3 py-2 text-xs text-[var(--content-text)]"
      style={{
        boxShadow: '0 0 0.625em var(--shadow-color)',
      }}
    >
      {message}
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState<{ message: string } | null>(null);

  const showToast = (message: string) => {
    setToast({ message });
  };

  const ToastComponent = toast ? (
    <Toast message={toast.message} onClose={() => setToast(null)} />
  ) : null;

  return { showToast, ToastComponent };
}
