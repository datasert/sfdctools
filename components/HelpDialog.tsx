"use client";

import { ReactNode } from "react";
import { Button } from "./Button";

interface HelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function HelpDialog({ isOpen, onClose, title, children }: HelpDialogProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 cursor-pointer"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-[var(--content-color)] rounded-[0.5em] shadow-lg max-w-2xl w-full max-h-[80vh] flex flex-col"
          style={{
            boxShadow: '0 0 0.625em var(--shadow-color)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--content-border)] px-4 py-3">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              {title} - Help
            </h2>
            <button
              onClick={onClose}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              aria-label="Close"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="prose max-w-none text-[15px] text-[var(--text-primary)] prose-headings:text-[var(--text-primary)] prose-p:text-[var(--text-secondary)] prose-li:text-[var(--text-secondary)]">
              {children}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-[var(--content-border)] px-4 py-3 flex justify-end">
            <Button onClick={onClose} variant="secondary" size="sm">
              Close
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
