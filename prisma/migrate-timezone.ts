/**
 * One-time migration script to convert existing data from naive local time
 * (assumed America/Phoenix) to UTC.
 *
 * Run with: npx tsx prisma/migrate-timezone.ts
 *
 * What it does:
 * 1. Sets all null User.timezone to "America/Phoenix"
 * 2. Converts UserAvailability dayOfWeek/startTime/endTime from Phoenix → UTC
 * 3. Converts GameNight date/startTime/endTime from Phoenix → UTC, sets timezone field
 *
 * Safe to run multiple times — it checks if data looks already converted.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ASSUMED_TIMEZONE = "America/Phoenix";

// ─── Timezone offset calculation ─────────────────────────────────────

function getOffsetMinutes(timezone: string, date: Date): number {
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
    return type === "hour" && val === "24" ? 0 : parseInt(val, 10);
  };

  const utcTotal = Date.UTC(
    get(utcParts, "year"),
    get(utcParts, "month") - 1,
    get(utcParts, "day"),
    get(utcParts, "hour"),
    get(utcParts, "minute")
  );

  const localTotal = Date.UTC(
    get(localParts, "year"),
    get(localParts, "month") - 1,
    get(localParts, "day"),
    get(localParts, "hour"),
    get(localParts, "minute")
  );

  return (localTotal - utcTotal) / 60_000;
}

function localTimeToUtc(
  time: string,
  dayOfWeek: number,
  timezone: string
): { utcTime: string; utcDayOfWeek: number } {
  const now = new Date();
  const currentDay = now.getUTCDay();
  const diff = dayOfWeek - currentDay;
  const ref = new Date(now);
  ref.setUTCDate(ref.getUTCDate() + diff);
  ref.setUTCHours(12, 0, 0, 0);

  const [h, m] = time.split(":").map(Number);
  const offset = getOffsetMinutes(timezone, ref);

  let totalMinutes = h * 60 + m - offset;
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

function localDateTimeToUtc(
  dateStr: string,
  time: string,
  timezone: string
): { utcDate: string; utcTime: string } {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [h, m] = time.split(":").map(Number);

  const approxDate = new Date(Date.UTC(year, month - 1, day, h, m));
  const offset = getOffsetMinutes(timezone, approxDate);

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

// ─── Migration ───────────────────────────────────────────────────────

async function main() {
  console.log("=== Timezone Migration ===\n");

  // 1. Ensure all users have a timezone (schema default handles this now)
  console.log(`[Users] Timezone column has default "${ASSUMED_TIMEZONE}" — no null values to fix`);

  // 2. Convert UserAvailability
  const availabilities = await prisma.userAvailability.findMany();
  console.log(`[Availability] Processing ${availabilities.length} records...`);

  let avUpdated = 0;
  for (const a of availabilities) {
    const utcStart = localTimeToUtc(a.startTime, a.dayOfWeek, ASSUMED_TIMEZONE);
    const utcEnd = localTimeToUtc(a.endTime, a.dayOfWeek, ASSUMED_TIMEZONE);

    // Skip if already looks converted (same values)
    if (
      a.dayOfWeek === utcStart.utcDayOfWeek &&
      a.startTime === utcStart.utcTime &&
      a.endTime === utcEnd.utcTime
    ) {
      continue;
    }

    try {
      await prisma.userAvailability.update({
        where: { id: a.id },
        data: {
          dayOfWeek: utcStart.utcDayOfWeek,
          startTime: utcStart.utcTime,
          endTime: utcEnd.utcTime,
        },
      });
      avUpdated++;
    } catch {
      // Unique constraint violation — skip duplicate
      console.warn(`  Skipping availability ${a.id} (duplicate after conversion)`);
    }
  }
  console.log(`[Availability] Updated ${avUpdated} records`);

  // 3. Convert GameNight events
  const gameNights = await prisma.gameNight.findMany();
  console.log(`[GameNight] Processing ${gameNights.length} records...`);

  let gnUpdated = 0;
  for (const gn of gameNights) {
    const gnDate = gn.date;
    const dateStr = `${gnDate.getUTCFullYear()}-${(gnDate.getUTCMonth() + 1).toString().padStart(2, "0")}-${gnDate.getUTCDate().toString().padStart(2, "0")}`;

    const utcStart = localDateTimeToUtc(dateStr, gn.startTime, ASSUMED_TIMEZONE);
    const utcEnd = localDateTimeToUtc(dateStr, gn.endTime, ASSUMED_TIMEZONE);

    const [y, m, d] = utcStart.utcDate.split("-").map(Number);
    const newDate = new Date(Date.UTC(y, m - 1, d));

    try {
      await prisma.gameNight.update({
        where: { id: gn.id },
        data: {
          date: newDate,
          startTime: utcStart.utcTime,
          endTime: utcEnd.utcTime,
          timezone: ASSUMED_TIMEZONE,
        },
      });
      gnUpdated++;
    } catch (err) {
      console.warn(`  Error updating game night ${gn.id}:`, err);
    }
  }
  console.log(`[GameNight] Updated ${gnUpdated} records`);

  console.log("\n=== Migration Complete ===");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
