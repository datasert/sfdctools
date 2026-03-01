import { ReactNode } from "react";

interface SettingsLabelProps {
  children: ReactNode;
  className?: string;
}

export function SettingsLabel({ children, className = "" }: SettingsLabelProps) {
  return (
    <span className={`text-sm font-medium text-[var(--text-primary)] ${className}`}>
      {children}
    </span>
  );
}
