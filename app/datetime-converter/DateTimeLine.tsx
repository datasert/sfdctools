"use client";

interface DateTimeLineProps {
  label: string;
  value: string | number;
  onCopy?: (value: string) => void;
  className?: string;
}

export function DateTimeLine({ label, value, onCopy, className = "" }: DateTimeLineProps) {
  const handleClick = () => {
    if (onCopy) {
      onCopy(String(value));
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-center justify-between gap-2 rounded px-2 py-1.5 hover:bg-[var(--hover-bg)] transition-colors ${onCopy ? "cursor-pointer" : ""} ${className}`}
    >
      <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
      <span className="text-sm text-[var(--text-primary)] font-mono flex-1 text-right">{String(value)}</span>
    </div>
  );
}
