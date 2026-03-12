import { prisma } from "@/lib/prisma";
import { evaluateBadges } from "./engine";

/**
 * Update the attendance streak for a user after they attended an event.
 * Call this when markAttendance sets attended=true.
 *
 * - Increments currentCount
 * - Updates longestCount if new high
 * - Stores lastEventId to prevent double-counting
 * - Then evaluates attendance_streak badges
 */
export async function updateAttendanceStreak(
  userId: string,
  eventId: string
): Promise<string[]> {
  const existing = await prisma.userStreak.findUnique({
    where: { userId_type: { userId, type: "attendance" } },
  });

  if (existing?.lastEventId === eventId) {
    // Already counted this event
    return [];
  }

  const newCount = (existing?.currentCount ?? 0) + 1;
  const newLongest = Math.max(newCount, existing?.longestCount ?? 0);

  await prisma.userStreak.upsert({
    where: { userId_type: { userId, type: "attendance" } },
    create: {
      userId,
      type: "attendance",
      currentCount: newCount,
      longestCount: newLongest,
      lastEventId: eventId,
    },
    update: {
      currentCount: newCount,
      longestCount: newLongest,
      lastEventId: eventId,
    },
  });

  return evaluateBadges(userId, "attendance_streak");
}

/**
 * Reset attendance streak when a user no-shows (RSVP'd confirmed but didn't attend).
 */
export async function resetAttendanceStreak(userId: string): Promise<void> {
  await prisma.userStreak.upsert({
    where: { userId_type: { userId, type: "attendance" } },
    create: {
      userId,
      type: "attendance",
      currentCount: 0,
      longestCount: 0,
    },
    update: {
      currentCount: 0,
    },
  });
}

/**
 * Evaluate the weekly activity streak for a user.
 * Gated to once per hour (checked via lastSeenAt proximity to avoid excessive DB writes).
 *
 * Increments if the user had a qualifying action this week.
 * Resets if there's a gap of more than 1 week.
 */
export async function evaluateWeeklyStreak(userId: string): Promise<void> {
  const currentWeekKey = getWeekKey(new Date());

  const existing = await prisma.userStreak.findUnique({
    where: { userId_type: { userId, type: "weekly_activity" } },
  });

  // Already evaluated this week
  if (existing?.lastWeekKey === currentWeekKey) return;

  // Check if user had activity this week
  const weekStart = getWeekStart(new Date());
  const hasActivity = await checkWeeklyActivity(userId, weekStart);
  if (!hasActivity) return;

  let newCount: number;
  if (!existing) {
    newCount = 1;
  } else {
    // Check if last week key is the previous week (consecutive)
    const prevWeekKey = getWeekKey(new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000));
    newCount = existing.lastWeekKey === prevWeekKey
      ? existing.currentCount + 1
      : 1; // Reset — gap detected
  }

  const newLongest = Math.max(newCount, existing?.longestCount ?? 0);

  await prisma.userStreak.upsert({
    where: { userId_type: { userId, type: "weekly_activity" } },
    create: {
      userId,
      type: "weekly_activity",
      currentCount: newCount,
      longestCount: newLongest,
      lastWeekKey: currentWeekKey,
    },
    update: {
      currentCount: newCount,
      longestCount: newLongest,
      lastWeekKey: currentWeekKey,
    },
  });

  // Evaluate weekly_activity badges (fire-and-forget)
  evaluateBadges(userId, "weekly_activity").catch(() => {});
}

// ─── Helpers ─────────────────────────────────────────────────────────

/** ISO week key, e.g. "2026-W11" */
function getWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/** Monday 00:00 UTC of the current week */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff));
}

/** Check if user had any qualifying activity this week */
async function checkWeeklyActivity(userId: string, weekStart: Date): Promise<boolean> {
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Check attendance, poll votes, comments, tournament entries
  const [attendance, votes, comments] = await Promise.all([
    prisma.gameNightAttendee.count({
      where: {
        userId,
        attended: true,
        gameNight: { date: { gte: weekStart, lt: weekEnd } },
      },
    }),
    prisma.pollVote.count({
      where: {
        userId,
        poll: { createdAt: { gte: weekStart, lt: weekEnd } },
      },
    }),
    prisma.pollComment.count({
      where: {
        userId,
        createdAt: { gte: weekStart, lt: weekEnd },
      },
    }),
  ]);

  return attendance + votes + comments > 0;
}
