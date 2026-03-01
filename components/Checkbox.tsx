import { InputHTMLAttributes, ReactNode } from "react";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
}

export function Checkbox({ label, className = "", ...props }: CheckboxProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        className={`rounded border-[var(--input-border)] text-[var(--primary-color)] focus:ring-[var(--primary-color)] ${className}`}
        {...props}
      />
      <span className="text-xs text-[var(--text-secondary)]">{label}</span>
    </label>
  );
}
