/**
 * Timezone conversion utilities for UTC normalization.
 *
 * All times are stored in UTC internally. These functions convert
 * between a user's local timezone and UTC for both:
 * - Recurring weekly availability (dayOfWeek + HH:mm)
 * - Specific event date/times (date + HH:mm)
 *
 * Uses the built-in Intl.DateTimeFormat API — no external dependencies.
 * DST is handled automatically via IANA timezone names.
 */

/** Default timezone assumed for legacy data and users who haven't set one */
export const DEFAULT_TIMEZONE = "America/Phoenix";

/**
 * Get the UTC offset in minutes for a given IANA timezone at a specific point in time.
 * Positive = ahead of UTC, negative = behind UTC.
 * e.g. America/Phoenix → -420 (UTC-7)
 */
function getOffsetMinutes(timezone: string, date: Date): number {
  // Format the date in both UTC and the target timezone, then compute the difference
  const utcParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const localParts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (parts: Intl.DateTimeFormatPart[], type: string) => {
    const val = parts.find((p) => p.type === type)?.value ?? "0";
    // Intl can return "24" for midnight in some locales — treat as 0
    return type === "hour" && val === "24" ? 0 : parseInt(val, 10);
  };

  const utcTotal =
    Date.UTC(
      get(utcParts, "year"),
      get(utcParts, "month") - 1,
      get(utcParts, "day"),
      get(utcParts, "hour"),
      get(utcParts, "minute")
    );

  const localTotal =
    Date.UTC(
      get(localParts, "year"),
      get(localParts, "month") - 1,
      get(localParts, "day"),
      get(localParts, "hour"),
      get(localParts, "minute")
    );

  // offset = local - UTC (in minutes)
  return (localTotal - utcTotal) / 60_000;
}

/**
 * Convert a local HH:mm + dayOfWeek to UTC.
 * Used for recurring weekly availability.
 *
 * Uses a reference date for the given dayOfWeek to resolve DST offset.
 * The reference date defaults to the upcoming occurrence of that day.
 */
export function localTimeToUtc(
  time: string,
  dayOfWeek: number,
  timezone: string
): { utcTime: string; utcDayOfWeek: number } {
  // Find a reference date that falls on the given dayOfWeek
  const refDate = getReferenceDateForDay(dayOfWeek);
  const [h, m] = time.split(":").map(Number);

  // Create a Date in UTC that represents the local time
  // Then adjust by the timezone offset
  const offset = getOffsetMinutes(timezone, refDate);

  // Local time in total minutes from midnight
  let totalMinutes = h * 60 + m;
  // Subtract offset to get UTC (offset is local-UTC, so UTC = local - offset)
  totalMinutes -= offset;

  // Handle day wrapping
  let dayShift = 0;
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60;
    dayShift = -1;
  } else if (totalMinutes >= 24 * 60) {
    totalMinutes -= 24 * 60;
    dayShift = 1;
  }

  const utcH = Math.floor(totalMinutes / 60);
  const utcM = totalMinutes % 60;
  const utcDayOfWeek = ((dayOfWeek + dayShift) % 7 + 7) % 7;

  return {
    utcTime: `${utcH.toString().padStart(2, "0")}:${utcM.toString().padStart(2, "0")}`,
    utcDayOfWeek,
  };
}

/**
 * Convert a UTC HH:mm + dayOfWeek to local time in the given timezone.
 * Used for displaying recurring weekly availability.
 */
export function utcToLocalTime(
  utcTime: string,
  utcDayOfWeek: number,
  timezone: string
): { localTime: string; localDayOfWeek: number } {
  const refDate = getReferenceDateForDay(utcDayOfWeek);
  const [h, m] = utcTime.split(":").map(Number);

  const offset = getOffsetMinutes(timezone, refDate);

  // UTC time in total minutes + offset = local time
  let totalMinutes = h * 60 + m + offset;

  let dayShift = 0;
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60;
    dayShift = -1;
  } else if (totalMinutes >= 24 * 60) {
    totalMinutes -= 24 * 60;
    dayShift = 1;
  }

  const localH = Math.floor(totalMinutes / 60);
  const localM = totalMinutes % 60;
  const localDayOfWeek = ((utcDayOfWeek + dayShift) % 7 + 7) % 7;

  return {
    localTime: `${localH.toString().padStart(2, "0")}:${localM.toString().padStart(2, "0")}`,
    localDayOfWeek,
  };
}

/**
 * Convert a specific local date + time to UTC.
 * Used for GameNight events where the exact date pins the DST offset.
 */
export function localDateTimeToUtc(
  dateStr: string,
  time: string,
  timezone: string
): { utcDate: string; utcTime: string } {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [h, m] = time.split(":").map(Number);

  // Build a date object at this local time to determine the offset
  // We use a known UTC time and check what the offset is
  const approxDate = new Date(Date.UTC(year, month - 1, day, h, m));
  const offset = getOffsetMinutes(timezone, approxDate);

  // UTC = local - offset
  let totalMinutes = h * 60 + m - offset;
  const utcDay = new Date(Date.UTC(year, month - 1, day));

  if (totalMinutes < 0) {
    totalMinutes += 24 * 60;
    utcDay.setUTCDate(utcDay.getUTCDate() - 1);
  } else if (totalMinutes >= 24 * 60) {
    totalMinutes -= 24 * 60;
    utcDay.setUTCDate(utcDay.getUTCDate() + 1);
  }

  const utcH = Math.floor(totalMinutes / 60);
  const utcM = totalMinutes % 60;

  const utcDate = `${utcDay.getUTCFullYear()}-${(utcDay.getUTCMonth() + 1).toString().padStart(2, "0")}-${utcDay.getUTCDate().toString().padStart(2, "0")}`;
  const utcTime = `${utcH.toString().padStart(2, "0")}:${utcM.toString().padStart(2, "0")}`;

  return { utcDate, utcTime };
}

/**
 * Convert UTC date + time to local date + time in the given timezone.
 * Used for displaying events to viewers.
 */
export function utcToLocalDateTime(
  utcDateStr: string,
  utcTime: string,
  timezone: string
): { localDate: string; localTime: string } {
  const [year, month, day] = utcDateStr.split("-").map(Number);
  const [h, m] = utcTime.split(":").map(Number);

  const utcDate = new Date(Date.UTC(year, month - 1, day, h, m));
  const offset = getOffsetMinutes(timezone, utcDate);

  let totalMinutes = h * 60 + m + offset;
  const localDay = new Date(Date.UTC(year, month - 1, day));

  if (totalMinutes < 0) {
    totalMinutes += 24 * 60;
    localDay.setUTCDate(localDay.getUTCDate() - 1);
  } else if (totalMinutes >= 24 * 60) {
    totalMinutes -= 24 * 60;
    localDay.setUTCDate(localDay.getUTCDate() + 1);
  }

  const localH = Math.floor(totalMinutes / 60);
  const localM = totalMinutes % 60;

  const localDate = `${localDay.getUTCFullYear()}-${(localDay.getUTCMonth() + 1).toString().padStart(2, "0")}-${localDay.getUTCDate().toString().padStart(2, "0")}`;
  const localTime = `${localH.toString().padStart(2, "0")}:${localM.toString().padStart(2, "0")}`;

  return { localDate, localTime };
}

/**
 * Get the timezone abbreviation (e.g. "MST", "EST", "PDT") for a timezone at a given date.
 */
export function getTimezoneAbbreviation(
  timezone: string,
  date: Date = new Date()
): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    timeZoneName: "short",
  }).formatToParts(date);

  return parts.find((p) => p.type === "timeZoneName")?.value ?? timezone;
}

/**
 * Format a UTC time string for display in a given timezone.
 * Returns something like "7:00 PM MST".
 */
export function formatTimeInTimezone(
  utcTime: string,
  utcDateStr: string,
  timezone: string
): string {
  const { localTime } = utcToLocalDateTime(utcDateStr, utcTime, timezone);
  const [h, m] = localTime.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  const abbr = getTimezoneAbbreviation(
    timezone,
    parseDateStr(utcDateStr)
  );
  return `${hour12}:${m.toString().padStart(2, "0")} ${period} ${abbr}`;
}

/**
 * Format a UTC time for display in viewer's timezone, with optional "host timezone" context.
 * If the viewer and event are in different timezones, shows both.
 * e.g. "7:00 PM MST" or "4:00 PM PST (7:00 PM MST)"
 */
export function formatEventTimeForViewer(
  utcTime: string,
  utcDateStr: string,
  viewerTimezone: string,
  eventTimezone: string
): string {
  const viewerStr = formatTimeInTimezone(utcTime, utcDateStr, viewerTimezone);

  if (viewerTimezone === eventTimezone) {
    return viewerStr;
  }

  // Check if offsets are actually the same (e.g. Phoenix and LA in summer)
  const date = parseDateStr(utcDateStr);
  const viewerOffset = getOffsetMinutes(viewerTimezone, date);
  const eventOffset = getOffsetMinutes(eventTimezone, date);

  if (viewerOffset === eventOffset) {
    return viewerStr;
  }

  const eventStr = formatTimeInTimezone(utcTime, utcDateStr, eventTimezone);
  return `${viewerStr} (${eventStr})`;
}

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 * Get a reference date for a given dayOfWeek (0=Sun ... 6=Sat).
 * Returns a date in the current week that falls on that day.
 */
function getReferenceDateForDay(dayOfWeek: number): Date {
  const now = new Date();
  const currentDay = now.getUTCDay();
  const diff = dayOfWeek - currentDay;
  const ref = new Date(now);
  ref.setUTCDate(ref.getUTCDate() + diff);
  ref.setUTCHours(12, 0, 0, 0); // noon to avoid edge cases
  return ref;
}

/** Parse a YYYY-MM-DD string into a Date (UTC) */
function parseDateStr(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

/**
 * Convert a Date object to a YYYY-MM-DD string (UTC).
 */
export function dateToUtcString(date: Date): string {
  return `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1).toString().padStart(2, "0")}-${date.getUTCDate().toString().padStart(2, "0")}`;
}

/**
 * Compute the prime and extended time slot arrays for a viewer's timezone,
 * given anchor timezone settings (e.g., Phoenix 5PM-11PM prime, 2PM-1AM extended).
 *
 * Converts each anchor-timezone hour boundary to the viewer's local time
 * so the heatmap/grid can highlight the correct rows.
 */
export function computeTimeSlotsForViewer(
  viewerTimezone: string,
  anchorTimezone: string,
  primeStartHour: number,
  primeEndHour: number,
  extendedStartHour: number,
  extendedEndHour: number
): { primeSlots: string[]; extendedSlots: string[] } {
  // Convert anchor hours to viewer hours
  function anchorHourToViewer(anchorHour: number): number {
    const refDate = new Date();
    refDate.setUTCHours(12, 0, 0, 0);
    const anchorOffset = getOffsetMinutes(anchorTimezone, refDate);
    const viewerOffset = getOffsetMinutes(viewerTimezone, refDate);
    // anchor local hour → UTC → viewer local hour
    const utcMinutes = (anchorHour * 60) - anchorOffset;
    const viewerMinutes = utcMinutes + viewerOffset;
    let viewerHour = Math.floor(viewerMinutes / 60);
    // Normalize to 0-23 but allow >24 for "next day" slots
    if (viewerHour < 0) viewerHour += 24;
    return viewerHour;
  }

  // Normalize end hours so they're always > start (handle wrap past midnight)
  // e.g. extendedStart=17, extendedEnd=1 → treat as extendedEnd=25
  const normExtEnd = extendedEndHour <= extendedStartHour
    ? extendedEndHour + 24
    : extendedEndHour;
  const normPrimeEnd = primeEndHour <= primeStartHour
    ? primeEndHour + 24
    : primeEndHour;

  const primeSlots: string[] = [];
  const extendedSlots: string[] = [];

  // Generate all extended slots
  const totalExtHours = normExtEnd - extendedStartHour;
  for (let i = 0; i <= totalExtHours; i++) {
    const anchorH = extendedStartHour + i;
    const viewerH = anchorHourToViewer(anchorH % 24);
    const displayH = ((viewerH % 24) + 24) % 24;
    const slotFull = `${displayH.toString().padStart(2, "0")}:00`;
    extendedSlots.push(slotFull);
    extendedSlots.push(`${displayH.toString().padStart(2, "0")}:30`);

    // Check if this hour falls in prime range
    if (anchorH >= primeStartHour && anchorH <= normPrimeEnd) {
      primeSlots.push(slotFull);
      if (anchorH <= normPrimeEnd) {
        primeSlots.push(`${displayH.toString().padStart(2, "0")}:30`);
      }
    }
  }

  return { primeSlots, extendedSlots };
}

/**
 * Convert a Date object to a YYYY-MM-DD string in a given timezone.
 */
export function dateToLocalString(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "01";

  return `${get("year")}-${get("month")}-${get("day")}`;
}
