import { fromZonedTime, formatInTimeZone } from "date-fns-tz";

/**
 * Converts a "wall clock" datetime-local value (e.g. "2026-09-25T20:00", no
 * offset — what the event actually happens at, in the venue's timezone)
 * into the correct UTC instant to store. Without this, a server running in
 * a different timezone than the organizer would silently shift every event
 * time it parses.
 */
export function zonedWallTimeToUtc(wallTime: string, timezone: string): Date {
  return fromZonedTime(wallTime, timezone);
}

/** Formats a stored UTC instant in the event's own timezone, not the viewer's or server's. */
export function formatInEventTimezone(date: Date, timezone: string, pattern: string): string {
  return formatInTimeZone(date, timezone, pattern);
}

/** Wall-clock value (for a datetime-local input) representing `date` in `timezone`. */
export function toZonedInputValue(date: Date, timezone: string): string {
  return formatInTimeZone(date, timezone, "yyyy-MM-dd'T'HH:mm");
}

/** Best-effort browser IANA timezone (e.g. "America/Chicago"); falls back to UTC server-side. */
export function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

// Small safety net for environments without Intl.supportedValuesOf (older browsers).
const FALLBACK_TIMEZONES = [
  "UTC",
  "America/Anchorage",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Sao_Paulo",
  "Atlantic/Reykjavik",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Athens",
  "Europe/Moscow",
  "Africa/Johannesburg",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
  "Pacific/Honolulu",
];

export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

export interface TimezoneOption {
  value: string;
  label: string;
}

/**
 * All IANA timezones the current runtime knows about, each labeled with its
 * current abbreviation and UTC offset (e.g. "America/Chicago — CDT, UTC-05:00")
 * so picking the right one doesn't require knowing tz database naming.
 */
export function getTimezoneOptions(): TimezoneOption[] {
  let zones: string[];
  try {
    zones = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : FALLBACK_TIMEZONES;
  } catch {
    zones = FALLBACK_TIMEZONES;
  }

  const now = new Date();
  return zones
    .map((tz) => {
      let suffix = "";
      try {
        // Numeric UTC offset only (not the "CDT"-style abbreviation) — the
        // abbreviation depends on the runtime's ICU/CLDR data and can
        // render inconsistently (e.g. "GMT-5" instead of "CDT") across
        // browsers, while the offset itself is just arithmetic and always
        // matches what actually gets stored.
        suffix = ` (UTC${formatInTimeZone(now, tz, "xxx")})`;
      } catch {
        // some legacy/alias zone identifiers can't be formatted; keep the plain name
      }
      return { value: tz, label: `${tz.replace(/_/g, " ")}${suffix}` };
    })
    .sort((a, b) => a.value.localeCompare(b.value));
}
