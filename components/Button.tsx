import { type ReactNode, type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

export function Button({
  variant = "secondary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const baseClasses = "rounded-[0.25em] font-medium focus:outline-none transition-colors cursor-pointer disabled:cursor-not-allowed";
  
  const variantClasses = {
    primary: "bg-[var(--primary-color)] text-[var(--primary-text)] hover:bg-[var(--primary-color)] hover:opacity-90",
    secondary: "border border-[var(--input-border)] bg-[var(--input-color)] text-[var(--input-text)] hover:bg-[var(--hover-bg)]",
    ghost: "text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]",
  };
  
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-2.5 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
