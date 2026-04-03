import { ReactNode } from "react";

interface EditorPaneProps {
  label: ReactNode;
  count?: number | string;
  children: ReactNode;
  className?: string;
  headerRight?: ReactNode;
}

export function EditorPane({
  label,
  count,
  children,
  className = "",
  headerRight,
}: EditorPaneProps) {
  return (
    <div className={`flex h-full min-h-0 flex-col ${className}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
            {label}
          </label>
          {headerRight}
        </div>
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
