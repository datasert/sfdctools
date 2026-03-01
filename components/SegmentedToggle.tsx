interface SegmentedToggleOption<T extends string> {
  label: string;
  value: T;
}

interface SegmentedToggleProps<T extends string> {
  value: T;
  options: SegmentedToggleOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedToggle<T extends string>({
  value,
  options,
  onChange,
  className,
}: SegmentedToggleProps<T>) {
  return (
    <div
      className={`inline-flex overflow-hidden rounded-md border border-[var(--content-border)] ${className ?? ""}`}
      role="group"
      aria-label="Toggle options"
    >
      {options.map((option, index) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`px-3 py-1.5 text-sm transition-colors ${
              index > 0 ? "border-l border-[var(--content-border)]" : ""
            } ${
              isActive
                ? "bg-sky-600 text-white hover:bg-sky-700"
                : "bg-[var(--content-faded-color)] text-[var(--text-primary)] hover:bg-[var(--content-faded-hover)]"
            }`}
            aria-pressed={isActive}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
