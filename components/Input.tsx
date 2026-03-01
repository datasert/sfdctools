import { type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = "", ...props }: InputProps) {
  const inputClasses = "rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2.5 py-1.5 text-sm text-[var(--input-text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary-color)] focus:bg-[var(--input-background)] transition-colors";
  
  if (label) {
    return (
      <div className="flex flex-col gap-1">
        <label className="text-base font-medium text-[var(--text-primary)]">
          {label}
        </label>
        <input className={`${inputClasses} ${className}`} {...props} />
      </div>
    );
  }

  return <input className={`${inputClasses} ${className}`} {...props} />;
}
