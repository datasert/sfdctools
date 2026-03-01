import { ReactNode } from "react";

interface EditorPaneProps {
  label: ReactNode;
  count?: number | string;
  children: ReactNode;
  className?: string;
}

export function EditorPane({ label, count, children, className = "" }: EditorPaneProps) {
  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
          {label}
        </label>
        {count !== undefined && (
          <span className="text-xs text-[var(--text-tertiary)]">
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
