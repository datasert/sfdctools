import {
  forwardRef,
  type ReactNode,
  type ButtonHTMLAttributes,
} from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "secondary",
    size = "md",
    className = "",
    children,
    ...props
  },
  ref,
) {
  const baseClasses =
    "rounded-[6px] border font-medium focus:outline-none transition-colors cursor-pointer disabled:cursor-not-allowed";

  const variantClasses = {
    primary:
      "border-[var(--primary-color)] bg-[var(--primary-color)] text-[var(--primary-text)] hover:opacity-90",
    secondary:
      "border-[var(--primary-color)] bg-[var(--input-color)] text-[var(--input-text)] hover:bg-[var(--hover-bg)]",
    ghost:
      "border-[var(--primary-color)] bg-[var(--content-color)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]",
  };

  const sizeClasses = {
    sm: "px-2.5 py-1.5 text-sm",
    md: "px-2.5 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  return (
    <button
      ref={ref}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});
