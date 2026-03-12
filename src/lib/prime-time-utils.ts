/**
 * Shared prime-time display utilities.
 *
 * Both AvailabilityGrid and AvailabilityHeatmap use these helpers
 * so that legend text and row highlighting come from the same source.
 */

/** Human-readable labels for common US timezones */
export const TIMEZONE_LABELS: Record<string, string> = {
  "America/Phoenix": "Arizona",
  "America/New_York": "Eastern",
  "America/Chicago": "Central",
  "America/Denver": "Mountain",
  "America/Los_Angeles": "Pacific",
  "America/Anchorage": "Alaska",
  "Pacific/Honolulu": "Hawaii",
};

/** Format a 24-hour slot string (e.g. "17:00") to 12-hour display (e.g. "5 PM") */
export function formatSlotTo12Hr(slot: string): string {
  const [hStr, mStr] = slot.split(":");
  let h = parseInt(hStr, 10);
  const suffix = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return mStr === "00" ? `${h} ${suffix}` : `${h}:${mStr} ${suffix}`;
}

/** Format a 24-hour number (e.g. 17) to 12-hour display (e.g. "5 PM") */
export function formatHourTo12Hr(h: number): string {
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12} ${h >= 12 ? "PM" : "AM"}`;
}

/** Get a friendly label for a timezone IANA name */
export function getTimezoneLabel(tz: string): string {
  return (
    TIMEZONE_LABELS[tz] ||
    tz.split("/").pop()?.replace(/_/g, " ") ||
    tz
  );
}

export interface PrimeTimeLegendInfo {
  /** Whether the viewer is in the same timezone as the anchor */
  isLocal: boolean;
  /** Formatted prime start in viewer's local time (e.g. "5 PM") */
  primeStartFormatted: string;
  /** Formatted prime end in viewer's local time (e.g. "11 PM") */
  primeEndFormatted: string;
  /** Formatted anchor prime start (e.g. "5 PM") */
  anchorPrimeStartFormatted: string;
  /** Formatted anchor prime end (e.g. "11 PM") */
  anchorPrimeEndFormatted: string;
  /** Human-readable anchor timezone label (e.g. "Arizona") */
  anchorLabel: string;
}

/**
 * Compute legend info from prime-time settings and computed slots.
 * Returns structured data so both Grid and Heatmap can render consistent legends.
 */
export function getPrimeTimeLegendInfo(opts: {
  primeSlots: string[];
  anchorTimezone: string;
  viewerTimezone: string;
  anchorPrimeStartHour: number;
  anchorPrimeEndHour: number;
}): PrimeTimeLegendInfo {
  const { primeSlots, anchorTimezone, viewerTimezone, anchorPrimeStartHour, anchorPrimeEndHour } = opts;

  const isLocal = viewerTimezone === anchorTimezone;
  const anchorLabel = getTimezoneLabel(anchorTimezone);

  // Viewer-local prime range from the computed slots
  const primeStartFormatted =
    primeSlots.length > 0 ? formatSlotTo12Hr(primeSlots[0]) : formatHourTo12Hr(anchorPrimeStartHour);
  const primeEndFormatted =
    primeSlots.length > 0 ? formatSlotTo12Hr(primeSlots[primeSlots.length - 1]) : formatHourTo12Hr(anchorPrimeEndHour);

  return {
    isLocal,
    primeStartFormatted,
    primeEndFormatted,
    anchorPrimeStartFormatted: formatHourTo12Hr(anchorPrimeStartHour),
    anchorPrimeEndFormatted: formatHourTo12Hr(anchorPrimeEndHour),
    anchorLabel,
  };
}
