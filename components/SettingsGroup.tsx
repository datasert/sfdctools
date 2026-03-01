import { ReactNode } from "react";

interface SettingsGroupProps {
  children: ReactNode;
  className?: string;
}

export function SettingsGroup({ children, className = "" }: SettingsGroupProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {children}
    </div>
  );
}
