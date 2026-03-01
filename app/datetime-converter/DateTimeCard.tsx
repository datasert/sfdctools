"use client";

import { DateTimeFormats } from "./datetime-utils";
import { DateTimeLine } from "./DateTimeLine";

interface DateTimeCardProps {
  formats: DateTimeFormats;
  onCopy?: (value: string) => void;
  className?: string;
}

export function DateTimeCard({ formats, onCopy, className = "" }: DateTimeCardProps) {
  return (
    <div className={`rounded border border-[var(--content-border)] bg-[var(--content-color)] p-3 ${className}`}>
      <div className="space-y-0">
        <DateTimeLine
          label="Formatted (User TZ)"
          value={formats.formattedUser}
          onCopy={onCopy}
        />
        <hr className="border-[var(--content-border)] opacity-30 my-1" />
        <DateTimeLine
          label="Formatted (UTC)"
          value={formats.formattedUtc}
          onCopy={onCopy}
        />
        <hr className="border-[var(--content-border)] opacity-30 my-1" />
        <DateTimeLine
          label="ISO (User TZ)"
          value={formats.isoUser}
          onCopy={onCopy}
        />
        <hr className="border-[var(--content-border)] opacity-30 my-1" />
        <DateTimeLine
          label="ISO (UTC)"
          value={formats.isoUtc}
          onCopy={onCopy}
        />
        <hr className="border-[var(--content-border)] opacity-30 my-1" />
        <DateTimeLine
          label="Unix Seconds"
          value={formats.unixSeconds}
          onCopy={onCopy}
        />
        <hr className="border-[var(--content-border)] opacity-30 my-1" />
        <DateTimeLine
          label="Unix Milliseconds"
          value={formats.unixMilliseconds}
          onCopy={onCopy}
        />
        <hr className="border-[var(--content-border)] opacity-30 my-1" />
        <DateTimeLine
          label="Relative Time"
          value={formats.relativeTime}
          onCopy={onCopy}
        />
      </div>
    </div>
  );
}
