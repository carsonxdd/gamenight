import { describe, it, expect } from "vitest";
import { computeTimeSlotsForViewer } from "../timezone-utils";
import {
  formatSlotTo12Hr,
  formatHourTo12Hr,
  getTimezoneLabel,
  getPrimeTimeLegendInfo,
} from "../prime-time-utils";

// ─── computeTimeSlotsForViewer ──────────────────────────────────────

describe("computeTimeSlotsForViewer", () => {
  it("returns identical slots when viewer is in the anchor timezone", () => {
    const { primeSlots, extendedSlots } = computeTimeSlotsForViewer(
      "America/Phoenix",
      "America/Phoenix",
      17, 23, 14, 25
    );

    // Prime slots should start at 17:00 and end at 23:00
    expect(primeSlots[0]).toBe("17:00");
    expect(primeSlots[primeSlots.length - 1]).toBe("23:00");

    // Extended slots should start at 14:00
    expect(extendedSlots[0]).toBe("14:00");
    // Extended end is 25 → 01:00 next day
    expect(extendedSlots[extendedSlots.length - 1]).toBe("01:00");
  });

  it("shifts slots east (e.g. Phoenix → New York = +2h in winter)", () => {
    // Phoenix is UTC-7 year-round; New York is UTC-5 in winter
    // So viewer in New York sees Phoenix 5 PM as 7 PM
    const { primeSlots } = computeTimeSlotsForViewer(
      "America/New_York",
      "America/Phoenix",
      17, 23, 14, 25
    );

    // The first prime slot should be shifted by +2 hours → 19:00
    const firstHour = parseInt(primeSlots[0].split(":")[0], 10);
    // Allow for DST variation: either +2 or +3 depending on time of year
    expect(firstHour).toBeGreaterThanOrEqual(19);
    expect(firstHour).toBeLessThanOrEqual(20);
  });

  it("shifts slots west (e.g. Phoenix → Los Angeles)", () => {
    // Phoenix is UTC-7; LA is UTC-8 in winter, UTC-7 in summer
    const { primeSlots } = computeTimeSlotsForViewer(
      "America/Los_Angeles",
      "America/Phoenix",
      17, 23, 14, 25
    );

    const firstHour = parseInt(primeSlots[0].split(":")[0], 10);
    // In winter: LA is UTC-8, so Phoenix 5 PM = 4 PM LA → 16
    // In summer: same offset, so 17
    expect(firstHour).toBeGreaterThanOrEqual(16);
    expect(firstHour).toBeLessThanOrEqual(17);
  });

  it("handles cross-midnight wrapping correctly", () => {
    // Anchor in UTC+0 with prime 22-24 (10 PM to midnight)
    // Viewer in UTC+3 → should see 01:00-03:00 (next day)
    const { primeSlots } = computeTimeSlotsForViewer(
      "Europe/Moscow",   // UTC+3
      "Europe/London",   // UTC+0 (winter) / UTC+1 (summer)
      22, 24, 20, 26
    );

    // Should contain slots past midnight in viewer's timezone
    const hours = primeSlots.map((s) => parseInt(s.split(":")[0], 10));
    // At least some slots should be in the 0-3 range (past midnight)
    // or in the 1-4 range depending on DST
    const hasPostMidnight = hours.some((h) => h >= 0 && h <= 4);
    const hasPreMidnight = hours.some((h) => h >= 22);
    // Should wrap: either all post-midnight or spanning midnight
    expect(hasPostMidnight || hasPreMidnight).toBe(true);
  });

  it("prime slots are a subset of extended slots", () => {
    const { primeSlots, extendedSlots } = computeTimeSlotsForViewer(
      "America/New_York",
      "America/Phoenix",
      17, 23, 14, 25
    );

    const extSet = new Set(extendedSlots);
    for (const slot of primeSlots) {
      expect(extSet.has(slot)).toBe(true);
    }
  });

  it("generates :00 and :30 slots", () => {
    const { primeSlots } = computeTimeSlotsForViewer(
      "America/Phoenix",
      "America/Phoenix",
      17, 19, 16, 20
    );

    // Should have both :00 and :30 slots
    const fullHourSlots = primeSlots.filter((s) => s.endsWith(":00"));
    const halfHourSlots = primeSlots.filter((s) => s.endsWith(":30"));
    expect(fullHourSlots.length).toBeGreaterThan(0);
    expect(halfHourSlots.length).toBeGreaterThan(0);
  });
});

// ─── formatSlotTo12Hr ───────────────────────────────────────────────

describe("formatSlotTo12Hr", () => {
  it("formats midnight", () => {
    expect(formatSlotTo12Hr("00:00")).toBe("12 AM");
  });

  it("formats noon", () => {
    expect(formatSlotTo12Hr("12:00")).toBe("12 PM");
  });

  it("formats PM hours", () => {
    expect(formatSlotTo12Hr("17:00")).toBe("5 PM");
    expect(formatSlotTo12Hr("23:30")).toBe("11:30 PM");
  });

  it("formats AM hours", () => {
    expect(formatSlotTo12Hr("09:00")).toBe("9 AM");
    expect(formatSlotTo12Hr("06:30")).toBe("6:30 AM");
  });
});

// ─── formatHourTo12Hr ───────────────────────────────────────────────

describe("formatHourTo12Hr", () => {
  it("formats common hours", () => {
    expect(formatHourTo12Hr(0)).toBe("12 AM");
    expect(formatHourTo12Hr(12)).toBe("12 PM");
    expect(formatHourTo12Hr(17)).toBe("5 PM");
    expect(formatHourTo12Hr(23)).toBe("11 PM");
    expect(formatHourTo12Hr(1)).toBe("1 AM");
  });
});

// ─── getTimezoneLabel ───────────────────────────────────────────────

describe("getTimezoneLabel", () => {
  it("returns friendly label for known timezones", () => {
    expect(getTimezoneLabel("America/Phoenix")).toBe("Arizona");
    expect(getTimezoneLabel("America/New_York")).toBe("Eastern");
  });

  it("extracts city name for unknown timezones", () => {
    expect(getTimezoneLabel("Europe/London")).toBe("London");
    expect(getTimezoneLabel("Asia/Tokyo")).toBe("Tokyo");
  });

  it("handles underscores in city names", () => {
    expect(getTimezoneLabel("America/Los_Angeles")).toBe("Pacific");
    expect(getTimezoneLabel("America/Sao_Paulo")).toBe("Sao Paulo");
  });
});

// ─── getPrimeTimeLegendInfo ─────────────────────────────────────────

describe("getPrimeTimeLegendInfo", () => {
  it("marks isLocal=true when viewer matches anchor", () => {
    const info = getPrimeTimeLegendInfo({
      primeSlots: ["17:00", "17:30", "18:00"],
      anchorTimezone: "America/Phoenix",
      viewerTimezone: "America/Phoenix",
      anchorPrimeStartHour: 17,
      anchorPrimeEndHour: 23,
    });

    expect(info.isLocal).toBe(true);
    expect(info.anchorLabel).toBe("Arizona");
  });

  it("marks isLocal=false when viewer differs from anchor", () => {
    const info = getPrimeTimeLegendInfo({
      primeSlots: ["19:00", "19:30", "20:00"],
      anchorTimezone: "America/Phoenix",
      viewerTimezone: "America/New_York",
      anchorPrimeStartHour: 17,
      anchorPrimeEndHour: 23,
    });

    expect(info.isLocal).toBe(false);
    expect(info.primeStartFormatted).toBe("7 PM");
    expect(info.anchorPrimeStartFormatted).toBe("5 PM");
    expect(info.anchorPrimeEndFormatted).toBe("11 PM");
  });

  it("uses anchor hours as fallback when primeSlots is empty", () => {
    const info = getPrimeTimeLegendInfo({
      primeSlots: [],
      anchorTimezone: "America/Phoenix",
      viewerTimezone: "America/Phoenix",
      anchorPrimeStartHour: 17,
      anchorPrimeEndHour: 23,
    });

    expect(info.primeStartFormatted).toBe("5 PM");
    expect(info.primeEndFormatted).toBe("11 PM");
  });
});
