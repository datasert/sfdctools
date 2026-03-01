"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { Button } from "@/components/Button";
import { SettingsBar } from "@/components/SettingsBar";
import { SettingsGroup } from "@/components/SettingsGroup";
import { SettingsLabel } from "@/components/SettingsLabel";
import {
  InputType,
  parseInputValue,
  getDateTimeFormats,
  parseTimeOffset,
  applyTimeOffset,
  getCommonTimezones,
  getBrowserTimezone,
  dateToDatetimeLocal,
} from "./datetime-utils";
import { DateTimeCard } from "./DateTimeCard";

interface EditableDateTimeCardProps {
  id: string;
  onRemove: (id: string) => void;
  onCopy?: (value: string) => void;
  initialInputType?: InputType;
  initialInputValue?: string;
  initialTimezone?: string;
  trackCurrentTime?: boolean;
  onChange?: (id: string, updates: { inputType?: InputType; inputValue?: string; timezone?: string }) => void;
}

export function EditableDateTimeCard({
  id,
  onRemove,
  onCopy,
  initialInputType = "current",
  initialInputValue = "",
  initialTimezone,
  trackCurrentTime = false,
  onChange,
}: EditableDateTimeCardProps) {
  const [inputType, setInputType] = useState<InputType>(initialInputType);
  const [inputValue, setInputValue] = useState(initialInputValue);
  const [timezone, setTimezone] = useState(initialTimezone || getBrowserTimezone());
  const [timeOffset, setTimeOffset] = useState("");
  const [formats, setFormats] = useState<ReturnType<typeof getDateTimeFormats> | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(trackCurrentTime ? null : new Date());
  const [relativeTimeUpdateTrigger, setRelativeTimeUpdateTrigger] = useState(0);

  // Update current time every second if tracking
  useEffect(() => {
    if (trackCurrentTime) {
      // Set initial time only on client to avoid hydration mismatch
      setCurrentTime(new Date());
      
      const interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
      return () => clearInterval(interval);
    } else if (!trackCurrentTime && currentTime) {
      // Clear currentTime when tracking is disabled
      setCurrentTime(null);
    }
  }, [trackCurrentTime]);

  // Update relative time every second for all cards (not just tracking ones)
  useEffect(() => {
    const interval = setInterval(() => {
      setRelativeTimeUpdateTrigger(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update formats whenever dependencies change
  useEffect(() => {
    let date: Date | null = null;

    if (inputType === "current" || trackCurrentTime) {
      // For tracking, wait until currentTime is set (client-side only)
      if (trackCurrentTime && !currentTime) {
        setFormats(null);
        return;
      }
      date = trackCurrentTime ? (currentTime || new Date()) : new Date();
    } else if (inputValue.trim()) {
      date = parseInputValue(inputValue, inputType, timezone);
    }

    if (!date) {
      setFormats(null);
      return;
    }

    // Apply time offset if provided
    // Note: When tracking, the offset is applied to the continuously updating current time
    if (timeOffset.trim()) {
      const offset = parseTimeOffset(timeOffset);
      if (offset) {
        date = applyTimeOffset(date, offset);
      }
    }

    // For tracking cards, use currentTime as reference to ensure relative time is calculated correctly
    // For non-tracking cards, use current time (new Date()) for relative time calculation
    const referenceTime = trackCurrentTime && currentTime ? currentTime : new Date();
    const newFormats = getDateTimeFormats(date, timezone, referenceTime);
    setFormats(newFormats);

    // Update datetime-local input value when timezone changes for datetime-user/datetime-utc
    // But don't update if we're tracking current time (would cause infinite loop)
    if ((inputType === "datetime-user" || inputType === "datetime-utc") && date && !trackCurrentTime) {
      const targetTimezone = inputType === "datetime-utc" ? "UTC" : timezone;
      const newDatetimeLocal = dateToDatetimeLocal(date, targetTimezone);
      if (newDatetimeLocal !== inputValue) {
        setInputValue(newDatetimeLocal);
        onChange?.(id, { inputValue: newDatetimeLocal });
      }
    }
  }, [inputType, inputValue, timezone, timeOffset, trackCurrentTime, currentTime, relativeTimeUpdateTrigger, id, onChange]);

  // Memoize timezone list to avoid recalculating on every render
  const commonTimezones = useMemo(() => getCommonTimezones(), []);

  return (
    <div className="rounded border border-[var(--content-border)] bg-[var(--content-color)] max-w-[800px]">
      <SettingsBar>
        <SettingsGroup>
          <SettingsLabel>Input Type:</SettingsLabel>
          <Select
            value={inputType}
            onChange={(e) => {
              const newType = e.target.value as InputType;
              setInputType(newType);
              if (newType === "current") {
                setInputValue("");
              }
              onChange?.(id, { inputType: newType, inputValue: newType === "current" ? "" : inputValue });
            }}
            className="w-48"
          >
            <option value="current">Current Time</option>
            <option value="unix-seconds">Unix Time Seconds</option>
            <option value="unix-milliseconds">Unix Time Milliseconds</option>
            <option value="iso-utc">ISO UTC</option>
            <option value="iso-user">ISO User Timezone</option>
            <option value="datetime-user">Input DateTime (User TZ)</option>
            <option value="datetime-utc">Input DateTime (UTC)</option>
          </Select>
        </SettingsGroup>

        {((inputType !== "current" && !trackCurrentTime) || inputType === "datetime-user" || inputType === "datetime-utc") && (
          <SettingsGroup>
            <SettingsLabel>Input Value:</SettingsLabel>
            {(inputType === "datetime-user" || inputType === "datetime-utc") ? (
              <input
                type="datetime-local"
                value={inputValue}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setInputValue(newValue);
                  onChange?.(id, { inputValue: newValue });
                }}
                className="rounded-[0.375em] border border-[var(--input-border)] bg-[var(--input-color)] px-2.5 py-1.5 text-sm text-[var(--input-text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary-color)] focus:bg-[var(--input-background)] transition-colors w-64"
              />
            ) : (
              <Input
                value={inputValue}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setInputValue(newValue);
                  onChange?.(id, { inputValue: newValue });
                }}
                placeholder="Enter value..."
                className="w-64"
              />
            )}
          </SettingsGroup>
        )}

        <SettingsGroup>
          <SettingsLabel>Timezone:</SettingsLabel>
          <Select
            value={timezone}
            onChange={(e) => {
              const newTimezone = e.target.value;
              setTimezone(newTimezone);
              onChange?.(id, { timezone: newTimezone });
              
              // Update datetime-local value when timezone changes for datetime-user/datetime-utc
              if ((inputType === "datetime-user" || inputType === "datetime-utc") && inputValue.trim()) {
                const currentDate = parseInputValue(inputValue, inputType, timezone);
                if (currentDate) {
                  const targetTimezone = inputType === "datetime-utc" ? "UTC" : newTimezone;
                  const newDatetimeLocal = dateToDatetimeLocal(currentDate, targetTimezone);
                  setInputValue(newDatetimeLocal);
                  onChange?.(id, { inputValue: newDatetimeLocal, timezone: newTimezone });
                }
              }
            }}
            className="w-64"
          >
            {commonTimezones.map((tz) => (
              <option key={tz.id} value={tz.id}>
                {tz.name} ({tz.offset}) ({tz.id})
              </option>
            ))}
          </Select>
        </SettingsGroup>

        <SettingsGroup>
          <SettingsLabel>Add Time:</SettingsLabel>
          <Input
            value={timeOffset}
            onChange={(e) => setTimeOffset(e.target.value)}
            placeholder="e.g., 5h, -5h, -5h 3m"
            className="w-32"
          />
        </SettingsGroup>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(id)}
          className="ml-auto"
        >
          Remove
        </Button>
      </SettingsBar>

      <div className="p-3">
        {formats ? (
          <DateTimeCard formats={formats} onCopy={onCopy} />
        ) : (
          <div className="text-sm text-[var(--text-tertiary)] text-center py-4">
            {inputType === "current"
              ? "Displaying current time..."
              : "Enter a value to see formatted output"}
          </div>
        )}
      </div>
    </div>
  );
}
