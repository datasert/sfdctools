import { InputHTMLAttributes, ReactNode } from "react";

interface InputCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className"> {
  label: ReactNode;
  className?: string;
  labelClassName?: string;
  wrapperClassName?: string;
}

export function InputCheckbox({
  label,
  className = "",
  labelClassName = "",
  wrapperClassName = "",
  ...props
}: InputCheckboxProps) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-2 text-sm font-medium text-[var(--text-primary)] ${wrapperClassName}`.trim()}
    >
      <input
        type="checkbox"
        className={`h-4 w-4 rounded border-[var(--input-border)] text-[var(--primary-color)] focus:ring-[var(--primary-color)] ${className}`.trim()}
        {...props}
      />
      <span className={labelClassName}>{label}</span>
    </label>
  );
}
