"use client";

import { useEffect, useState } from "react";
import { getDateTimeFormats, getBrowserTimezone } from "./datetime-utils";
import { DateTimeCard } from "./DateTimeCard";

interface CurrentTimeCardProps {
  onCopy?: (value: string) => void;
}

export function CurrentTimeCard({ onCopy }: CurrentTimeCardProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const browserTimezone = getBrowserTimezone();

  useEffect(() => {
    // Set initial time only on client to avoid hydration mismatch
    setCurrentTime(new Date());
    
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Don't render until we have a time (client-side only)
  if (!currentTime) {
    return (
      <div className="mb-6 flex flex-col items-center">
        <h3 className="text-base font-semibold text-[var(--text-secondary)] mb-2">Current Time</h3>
        <div className="max-w-[800px] w-full">
          <div className="rounded border border-[var(--content-border)] bg-[var(--content-color)] p-3">
            <div className="text-sm text-[var(--text-tertiary)] text-center py-4">
              Loading...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Use currentTime as reference for relative time calculation
  const formats = getDateTimeFormats(currentTime, browserTimezone, currentTime);

  return (
    <div className="mb-6 flex flex-col items-center">
      <h3 className="text-base font-semibold text-[var(--text-secondary)] mb-2">Current Time</h3>
      <div className="max-w-[800px] w-full">
        <DateTimeCard formats={formats} onCopy={onCopy} />
      </div>
    </div>
  );
}
