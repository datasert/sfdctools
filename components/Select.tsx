import { type SelectHTMLAttributes, type ReactNode } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: ReactNode;
}

export function Select({ label, className = "", children, ...props }: SelectProps) {
  const selectClasses = "rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2.5 py-1.5 text-sm text-[var(--input-text)] focus:outline-none focus:border-[var(--primary-color)] focus:bg-[var(--input-background)] transition-colors";
  
  if (label) {
    return (
      <div className="flex flex-col gap-1">
        <label className="text-base font-medium text-[var(--text-primary)]">
          {label}
        </label>
        <select className={`${selectClasses} ${className}`} {...props}>
          {children}
        </select>
      </div>
    );
  }

  return (
    <select className={`${selectClasses} ${className}`} {...props}>
      {children}
    </select>
  );
}
