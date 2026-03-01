import { ReactNode } from "react";

interface SettingsBarProps {
  children: ReactNode;
  className?: string;
}

export function SettingsBar({ children, className = "" }: SettingsBarProps) {
  return (
    <div className={`border-b border-[var(--content-border)] bg-[var(--content-color)] p-3 ${className}`}>
      <div className="flex flex-wrap items-center gap-3">
        {children}
      </div>
    </div>
  );
}
