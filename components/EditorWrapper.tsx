import { ReactNode } from "react";

interface EditorWrapperProps {
  children: ReactNode;
  className?: string;
}

export function EditorWrapper({ children, className = "" }: EditorWrapperProps) {
  return (
    <div
      className={`flex-1 rounded-[0.5em] overflow-hidden ${className}`}
      style={{
        boxShadow: '0 0 0.625em var(--shadow-color)',
      }}
    >
      {children}
    </div>
  );
}
