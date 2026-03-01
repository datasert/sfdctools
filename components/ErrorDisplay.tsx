import { ReactNode } from "react";

interface ErrorDisplayProps {
  error: string | ReactNode;
  className?: string;
}

export function ErrorDisplay({ error, className = "" }: ErrorDisplayProps) {
  return (
    <div className={`text-xs text-red-500 ${className}`}>
      {typeof error === "string" ? `Error: ${error}` : error}
    </div>
  );
}
