"use client";

import { type ReactNode } from "react";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClassName?: string;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidthClassName = "max-w-xl",
}: DialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-40 cursor-pointer bg-black/50" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={`flex max-h-[80vh] w-full flex-col rounded-[0.5em] bg-[var(--content-color)] shadow-lg ${maxWidthClassName}`}
          style={{ boxShadow: "0 0 0.625em var(--shadow-color)" }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-[var(--content-border)] px-4 py-3">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>

          {footer ? (
            <div className="flex justify-end gap-2 border-t border-[var(--content-border)] px-4 py-3">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
