export type InputType = "current" | "unix-seconds" | "unix-milliseconds" | "iso-utc" | "iso-user" | "datetime-user" | "datetime-utc";

export interface DateTimeFormats {
  formattedUser: string;
  formattedUtc: string;
  isoUser: string;
  isoUtc: string;
  unixSeconds: number;
  unixMilliseconds: number;
  relativeTime: string;
}

export interface TimeOffset {
  years?: number;
  quarters?: number;
  months?: number;
  weeks?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
}

/**
 * Parse a casual time offset string like "5h", "-5h", "-5h 3m"
 * Supports units: y (years), q (quarters), M (months), w (weeks), d (days), h (hours), m (minutes), s (seconds)
 */
export function parseTimeOffset(offsetStr: string): TimeOffset | null {
  if (!offsetStr.trim()) return null;

  const offset: TimeOffset = {};
  const regex = /([+-]?\d+)([yqMwdhms])/g;
  let match;
  let hasMatch = false;

  while ((match = regex.exec(offsetStr)) !== null) {
    hasMatch = true;
    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case "y":
        offset.years = (offset.years || 0) + value;
        break;
      case "q":
        offset.quarters = (offset.quarters || 0) + value;
        break;
      case "M":
        offset.months = (offset.months || 0) + value;
        break;
      case "w":
        offset.weeks = (offset.weeks || 0) + value;
        break;
      case "d":
        offset.days = (offset.days || 0) + value;
        break;
      case "h":
        offset.hours = (offset.hours || 0) + value;
        break;
      case "m":
        offset.minutes = (offset.minutes || 0) + value;
        break;
      case "s":
        offset.seconds = (offset.seconds || 0) + value;
        break;
    }
  }

  return hasMatch ? offset : null;
}

/**
 * Apply time offset to a date
 */
export function applyTimeOffset(date: Date, offset: TimeOffset): Date {
  const result = new Date(date);

  if (offset.years) {
    result.setFullYear(result.getFullYear() + offset.years);
  }
  if (offset.quarters) {
    result.setMonth(result.getMonth() + offset.quarters * 3);
  }
  if (offset.months) {
    result.setMonth(result.getMonth() + offset.months);
  }
  if (offset.weeks) {
    result.setDate(result.getDate() + offset.weeks * 7);
  }
  if (offset.days) {
    result.setDate(result.getDate() + offset.days);
  }
  if (offset.hours) {
    result.setHours(result.getHours() + offset.hours);
  }
  if (offset.minutes) {
    result.setMinutes(result.getMinutes() + offset.minutes);
  }
  if (offset.seconds) {
    result.setSeconds(result.getSeconds() + offset.seconds);
  }

  return result;
}

/**
 * Format date in "Fri Jan 16, 2026, 5:48:59 PM (America/Los_Angeles)" format
 */
export function formatDateTimeWithTimezone(date: Date, timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZone: timezone,
    });

    return `${formatter.format(date)} (${timezone})`;
  } catch (error) {
    // Fallback if timezone is invalid
    return date.toLocaleString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  }
}

/**
 * Get browser timezone
 */
export function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

/**
 * Convert Date to datetime-local format string (YYYY-MM-DDTHH:mm)
 */
export function dateToDatetimeLocal(date: Date, timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: timezone,
    });

    const parts = formatter.formatToParts(date);
    const year = parts.find((p) => p.type === "year")?.value || "";
    const month = parts.find((p) => p.type === "month")?.value || "";
    const day = parts.find((p) => p.type === "day")?.value || "";
    const hour = parts.find((p) => p.type === "hour")?.value || "";
    const minute = parts.find((p) => p.type === "minute")?.value || "";

    return `${year}-${month}-${day}T${hour}:${minute}`;
  } catch {
    // Fallback: use local time
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hour}:${minute}`;
  }
}

/**
 * Parse formatted datetime string (handles datetime-local format and other formats)
 */
function parseFormattedDateTime(value: string, timezone: string): Date | null {
  if (!value.trim()) return null;

  // datetime-local format: YYYY-MM-DDTHH:mm
  const datetimeLocalMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (datetimeLocalMatch) {
    const year = parseInt(datetimeLocalMatch[1], 10);
    const month = parseInt(datetimeLocalMatch[2], 10) - 1; // JS months are 0-indexed
    const day = parseInt(datetimeLocalMatch[3], 10);
    const hour = parseInt(datetimeLocalMatch[4], 10);
    const minute = parseInt(datetimeLocalMatch[5], 10);

    // Create a date string in the target timezone
    // We need to create a date that represents this time in the specified timezone
    if (timezone === "UTC") {
      return new Date(Date.UTC(year, month, day, hour, minute));
    } else {
      // For other timezones, we need to convert the local time to UTC
      // Create a date assuming the input is in the target timezone
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
      
      // Use Intl to create a date in the target timezone
      // We'll create a date string and parse it considering the timezone
      const tempDate = new Date(`${dateStr}Z`); // Create as UTC first
      const tzOffset = getTimezoneOffset(timezone, tempDate);
      return new Date(tempDate.getTime() - tzOffset);
    }
  }

  // First, try native Date parsing (handles most ISO formats)
  const nativeDate = new Date(value);
  if (!isNaN(nativeDate.getTime()) && nativeDate.toString() !== "Invalid Date") {
    // If the date was parsed successfully, we need to interpret it in the target timezone
    // For datetime-user, we assume the input represents a time in that timezone
    // For datetime-utc, we assume the input represents a time in UTC
    return nativeDate;
  }

  // Try parsing common formats manually
  // Format: "Fri Jan 16, 2026, 5:48:59 PM" or similar
  // Try to extract date components from formatted strings
  const dateMatch = value.match(/(\w{3})\s+(\w{3})\s+(\d{1,2}),\s+(\d{4}),\s+(\d{1,2}):(\d{2}):(\d{2})\s+(AM|PM)/i);
  if (dateMatch) {
    const months: Record<string, number> = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    };
    const month = months[dateMatch[2]];
    const day = parseInt(dateMatch[3], 10);
    const year = parseInt(dateMatch[4], 10);
    let hour = parseInt(dateMatch[5], 10);
    const minute = parseInt(dateMatch[6], 10);
    const second = parseInt(dateMatch[7], 10);
    const ampm = dateMatch[8].toUpperCase();
    
    if (ampm === "PM" && hour !== 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;
    
    // Create date string and parse it
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
    
    // For datetime-user, interpret as local time in the specified timezone
    // For datetime-utc, interpret as UTC
    if (timezone === "UTC") {
      return new Date(dateStr + "Z");
    } else {
      // Create a date assuming the input is in the target timezone
      // We'll use a workaround: create the date in UTC first, then adjust
      const utcDate = new Date(dateStr + "Z");
      const tzOffset = getTimezoneOffset(timezone, utcDate);
      return new Date(utcDate.getTime() - tzOffset);
    }
  }

  // Try other common formats (MM/DD/YYYY, YYYY-MM-DD, etc.)
  // For simplicity, let Date constructor handle it
  const fallbackDate = new Date(value);
  return isNaN(fallbackDate.getTime()) ? null : fallbackDate;
}

/**
 * Get timezone offset in milliseconds for a given timezone and date
 */
function getTimezoneOffset(timezone: string, date: Date): number {
  try {
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    return tzDate.getTime() - utcDate.getTime();
  } catch {
    return 0;
  }
}

/**
 * Parse input value based on input type
 */
export function parseInputValue(
  value: string,
  inputType: InputType,
  userTimezone: string
): Date | null {
  if (!value.trim()) return null;

  try {
    switch (inputType) {
      case "current":
        return new Date();

      case "unix-seconds": {
        const seconds = parseInt(value, 10);
        if (isNaN(seconds)) return null;
        return new Date(seconds * 1000);
      }

      case "unix-milliseconds": {
        const milliseconds = parseInt(value, 10);
        if (isNaN(milliseconds)) return null;
        return new Date(milliseconds);
      }

      case "iso-utc":
        return new Date(value);

      case "iso-user": {
        // Parse as if it's in the user's timezone
        // This is tricky - ISO strings are always UTC, so we need to interpret the input differently
        // For simplicity, we'll try to parse it and adjust for timezone offset
        const date = new Date(value);
        if (isNaN(date.getTime())) return null;
        return date;
      }

      case "datetime-user": {
        // Parse formatted datetime string in user's timezone
        // Try multiple common formats
        return parseFormattedDateTime(value, userTimezone);
      }

      case "datetime-utc": {
        // Parse formatted datetime string as UTC
        return parseFormattedDateTime(value, "UTC");
      }

      default:
        return null;
    }
  } catch {
    return null;
  }
}

/**
 * Format relative time (e.g., "4h 5m 2s ago" or "in 4h 5m 2s")
 * @param date The date to calculate relative time for
 * @param referenceTime Optional reference time (defaults to current time). Use this for tracking cards to ensure consistency.
 */
function formatRelativeTime(date: Date, referenceTime?: Date): string {
  const now = referenceTime || new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSeconds = Math.floor(Math.abs(diffMs) / 1000);
  const isPast = diffMs < 0;

  if (diffSeconds === 0) {
    return "now";
  }

  const years = Math.floor(diffSeconds / (365 * 24 * 60 * 60));
  const months = Math.floor((diffSeconds % (365 * 24 * 60 * 60)) / (30 * 24 * 60 * 60));
  const days = Math.floor((diffSeconds % (30 * 24 * 60 * 60)) / (24 * 60 * 60));
  const hours = Math.floor((diffSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((diffSeconds % (60 * 60)) / 60);
  const seconds = diffSeconds % 60;

  const parts: string[] = [];
  
  if (years > 0) parts.push(`${years}y`);
  if (months > 0) parts.push(`${months}M`);
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  const relativeStr = parts.join(" ");
  return isPast ? `${relativeStr} ago` : `in ${relativeStr}`;
}

/**
 * Convert date to all formats
 * @param date The date to format
 * @param timezone The timezone to use for formatting
 * @param referenceTime Optional reference time for relative time calculation (for tracking cards)
 */
export function getDateTimeFormats(date: Date, timezone: string, referenceTime?: Date): DateTimeFormats {
  const formattedUser = formatDateTimeWithTimezone(date, timezone);
  const formattedUtc = formatDateTimeWithTimezone(date, "UTC");

  // ISO formats
  const isoUtc = date.toISOString();
  
  // ISO in user timezone - we need to format it manually
  const isoUser = formatISOInTimezone(date, timezone);

  // Unix timestamps
  const unixMilliseconds = date.getTime();
  const unixSeconds = Math.floor(unixMilliseconds / 1000);

  // Relative time - use referenceTime if provided (for tracking cards)
  const relativeTime = formatRelativeTime(date, referenceTime);

  return {
    formattedUser,
    formattedUtc,
    isoUser,
    isoUtc,
    unixSeconds,
    unixMilliseconds,
    relativeTime,
  };
}

/**
 * Format date as ISO string in a specific timezone
 */
function formatISOInTimezone(date: Date, timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: timezone,
    });

    const parts = formatter.formatToParts(date);
    const year = parts.find((p) => p.type === "year")?.value || "";
    const month = parts.find((p) => p.type === "month")?.value || "";
    const day = parts.find((p) => p.type === "day")?.value || "";
    const hour = parts.find((p) => p.type === "hour")?.value || "";
    const minute = parts.find((p) => p.type === "minute")?.value || "";
    const second = parts.find((p) => p.type === "second")?.value || "";

    // Get timezone offset
    const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
    const tzDate = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
    const offsetMs = tzDate.getTime() - utcDate.getTime();
    const offsetHours = Math.floor(Math.abs(offsetMs) / (1000 * 60 * 60));
    const offsetMinutes = Math.floor((Math.abs(offsetMs) % (1000 * 60 * 60)) / (1000 * 60));
    const offsetSign = offsetMs >= 0 ? "+" : "-";
    const offsetStr = `${offsetSign}${String(offsetHours).padStart(2, "0")}:${String(offsetMinutes).padStart(2, "0")}`;

    return `${year}-${month}-${day}T${hour}:${minute}:${second}${offsetStr}`;
  } catch {
    // Fallback to ISO string
    return date.toISOString();
  }
}

export interface TimezoneInfo {
  id: string;
  name: string;
  offset: string;
  offsetMinutes: number;
}

/**
 * Get timezone offset string (e.g., "UTC-8", "UTC+5:30")
 */
function getTimezoneOffsetString(timezone: string): { offset: string; offsetMinutes: number } {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en", {
      timeZone: timezone,
      timeZoneName: "longOffset",
    });
    
    // Get the offset by comparing UTC and timezone times
    const utcDate = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
    const tzDate = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
    const offsetMs = tzDate.getTime() - utcDate.getTime();
    const offsetMinutes = Math.round(offsetMs / (1000 * 60));
    const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
    const offsetMins = Math.abs(offsetMinutes) % 60;
    const sign = offsetMinutes >= 0 ? "+" : "-";
    
    let offsetStr = `UTC${sign}${offsetHours}`;
    if (offsetMins > 0) {
      offsetStr += `:${String(offsetMins).padStart(2, "0")}`;
    }
    
    return { offset: offsetStr, offsetMinutes };
  } catch {
    return { offset: "UTC+0", offsetMinutes: 0 };
  }
}

/**
 * Get timezone display name (e.g., "Pacific Time", "Eastern Time")
 */
function getTimezoneDisplayName(timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat("en", {
      timeZone: timezone,
      timeZoneName: "long",
    });
    const parts = formatter.formatToParts(new Date());
    const timeZoneName = parts.find((p) => p.type === "timeZoneName")?.value || timezone;
    return timeZoneName;
  } catch {
    return timezone;
  }
}

// Cache for timezone list to avoid recalculating
let timezoneListCache: TimezoneInfo[] | null = null;

/**
 * Get list of all available timezones with display info
 * Results are cached to avoid expensive recalculations
 */
export function getCommonTimezones(): TimezoneInfo[] {
  // Return cached result if available
  if (timezoneListCache !== null) {
    return timezoneListCache;
  }

  try {
    // Use Intl.supportedValuesOf if available (modern browsers)
    if (typeof Intl !== "undefined" && "supportedValuesOf" in Intl) {
      const allTimezones = Intl.supportedValuesOf("timeZone");
      const timezoneInfos: TimezoneInfo[] = [];
      
      // Add UTC first
      timezoneInfos.push({
        id: "UTC",
        name: "Coordinated Universal Time",
        offset: "UTC+0",
        offsetMinutes: 0,
      });
      
      // Process all other timezones
      for (const tz of allTimezones) {
        if (tz !== "UTC") {
          const { offset, offsetMinutes } = getTimezoneOffsetString(tz);
          const name = getTimezoneDisplayName(tz);
          timezoneInfos.push({
            id: tz,
            name,
            offset,
            offsetMinutes,
          });
        }
      }
      
      // Sort by offset (UTC first, then by offset minutes)
      timezoneInfos.sort((a, b) => {
        if (a.id === "UTC") return -1;
        if (b.id === "UTC") return 1;
        return a.offsetMinutes - b.offsetMinutes;
      });
      
      // Cache the result
      timezoneListCache = timezoneInfos;
      return timezoneInfos;
    }
    
    // Fallback to common timezones if Intl.supportedValuesOf is not available
    const commonTzIds = [
      "UTC",
      "America/Los_Angeles",
      "America/Denver",
      "America/Chicago",
      "America/New_York",
      "America/Toronto",
      "Europe/London",
      "Europe/Paris",
      "Europe/Berlin",
      "Asia/Tokyo",
      "Asia/Shanghai",
      "Asia/Kolkata",
      "Australia/Sydney",
      "Pacific/Auckland",
    ];
    
    const result = commonTzIds.map((tz) => {
      const { offset, offsetMinutes } = getTimezoneOffsetString(tz);
      const name = getTimezoneDisplayName(tz);
      return { id: tz, name, offset, offsetMinutes };
    }).sort((a, b) => {
      if (a.id === "UTC") return -1;
      if (b.id === "UTC") return 1;
      return a.offsetMinutes - b.offsetMinutes;
    });
    
    // Cache the result
    timezoneListCache = result;
    return result;
  } catch {
    // Fallback to common timezones on error
    const commonTzIds = [
      "UTC",
      "America/Los_Angeles",
      "America/Denver",
      "America/Chicago",
      "America/New_York",
      "America/Toronto",
      "Europe/London",
      "Europe/Paris",
      "Europe/Berlin",
      "Asia/Tokyo",
      "Asia/Shanghai",
      "Asia/Kolkata",
      "Australia/Sydney",
      "Pacific/Auckland",
    ];
    
    const result = commonTzIds.map((tz) => {
      const { offset, offsetMinutes } = getTimezoneOffsetString(tz);
      const name = getTimezoneDisplayName(tz);
      return { id: tz, name, offset, offsetMinutes };
    });
    
    // Cache the result even on error
    timezoneListCache = result;
    return result;
  }
}
