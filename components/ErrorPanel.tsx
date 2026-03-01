import { ReactNode } from "react";

interface ErrorPanelProps {
  title?: string;
  errors: Array<{ line?: number; id?: string; error: string } | string>;
  className?: string;
}

export function ErrorPanel({ title = "Errors:", errors, className = "" }: ErrorPanelProps) {
  if (errors.length === 0) return null;

  return (
    <div className={`border-t border-[var(--content-border)] bg-[var(--content-color)] p-3 max-h-32 overflow-y-auto ${className}`}>
      <div className="text-xs font-semibold text-red-500 mb-2">{title}</div>
      <div className="space-y-1">
        {errors.map((error, idx) => {
          if (typeof error === "string") {
            return (
              <div key={idx} className="text-xs text-[var(--text-secondary)]">
                {error}
              </div>
            );
          }
          return (
            <div key={idx} className="text-xs text-[var(--text-secondary)]">
              {error.line !== undefined && `Line ${error.line}: `}
              {error.id && <code className="text-red-400">{error.id}</code>}
              {error.id && " - "}
              {error.error}
            </div>
          );
        })}
      </div>
    </div>
  );
}
