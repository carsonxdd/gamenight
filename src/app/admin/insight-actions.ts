"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DAYS_OF_WEEK, formatTime, generateTimeSlots } from "@/lib/constants";

// Insights query across all 24 hours since data is in UTC
const INSIGHT_SLOTS = generateTimeSlots(0, 23);

async function requireModOrAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin && !session?.user?.isModerator) {
    throw new Error("Unauthorized");
  }
  return session;
}

function slotCovered(slot: string, start: string, end: string): boolean {
  return slot >= start && slot < end;
}

// ── Best Time for Game ──────────────────────────────────────────────
export async function getBestTimesForGame(gameName: string) {
  await requireModOrAdmin();

  const users = await prisma.user.findMany({
    where: { games: { some: { gameName } } },
    select: { name: true, gamertag: true, availability: true },
  });

  const slotMap: Record<string, string[]> = {};
  for (const day of DAYS_OF_WEEK.keys()) {
    for (const slot of INSIGHT_SLOTS) {
      const key = `${day}-${slot}`;
      slotMap[key] = [];
      for (const user of users) {
        for (const a of user.availability) {
          if (a.dayOfWeek === day && slotCovered(slot, a.startTime, a.endTime)) {
            slotMap[key].push(user.gamertag || user.name);
            break;
          }
        }
      }
    }
  }

  return Object.entries(slotMap)
    .filter(([, players]) => players.length > 0)
    .map(([key, players]) => {
      const [day, slot] = key.split("-");
      return {
        day: DAYS_OF_WEEK[Number(day)],
        time: formatTime(slot),
        players,
        count: players.length,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

// ── Peak Availability ───────────────────────────────────────────────
export async function getPeakAvailability() {
  await requireModOrAdmin();

  const users = await prisma.user.findMany({
    where: { gamertag: { not: null } },
    select: { name: true, gamertag: true, availability: true },
  });

  const slotMap: Record<string, string[]> = {};
  for (const day of DAYS_OF_WEEK.keys()) {
    for (const slot of INSIGHT_SLOTS) {
      const key = `${day}-${slot}`;
      slotMap[key] = [];
      for (const user of users) {
        for (const a of user.availability) {
          if (a.dayOfWeek === day && slotCovered(slot, a.startTime, a.endTime)) {
            slotMap[key].push(user.gamertag || user.name);
            break;
          }
        }
      }
    }
  }

  return Object.entries(slotMap)
    .filter(([, players]) => players.length > 0)
    .map(([key, players]) => {
      const [day, slot] = key.split("-");
      return {
        day: DAYS_OF_WEEK[Number(day)],
        time: formatTime(slot),
        players,
        count: players.length,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

// ── Squad Finder ────────────────────────────────────────────────────
export async function findSquadTimes(gameName: string, minPlayers: number) {
  await requireModOrAdmin();

  const users = await prisma.user.findMany({
    where: { games: { some: { gameName } } },
    select: { name: true, gamertag: true, availability: true },
  });

  const results: { day: string; time: string; players: string[]; count: number }[] = [];

  for (const day of DAYS_OF_WEEK.keys()) {
    for (const slot of INSIGHT_SLOTS) {
      const players: string[] = [];
      for (const user of users) {
        for (const a of user.availability) {
          if (a.dayOfWeek === day && slotCovered(slot, a.startTime, a.endTime)) {
            players.push(user.gamertag || user.name);
            break;
          }
        }
      }
      if (players.length >= minPlayers) {
        results.push({
          day: DAYS_OF_WEEK[day],
          time: formatTime(slot),
          players,
          count: players.length,
        });
      }
    }
  }

  return results.sort((a, b) => b.count - a.count);
}

// ── Lonely Games ────────────────────────────────────────────────────
export async function getLonelyGames() {
  await requireModOrAdmin();

  const games = await prisma.userGame.findMany({
    include: { user: { select: { name: true, gamertag: true } } },
  });

  const gameMap: Record<string, string[]> = {};
  for (const g of games) {
    if (!gameMap[g.gameName]) gameMap[g.gameName] = [];
    gameMap[g.gameName].push(g.user.gamertag || g.user.name);
  }

  return Object.entries(gameMap)
    .filter(([, players]) => players.length === 1)
    .map(([gameName, players]) => ({ gameName, player: players[0] }))
    .sort((a, b) => a.gameName.localeCompare(b.gameName));
}

// ── Inactive Members ────────────────────────────────────────────────
export async function getInactiveMembers() {
  await requireModOrAdmin();

  const users = await prisma.user.findMany({
    where: { gamertag: { not: null } },
    select: {
      name: true,
      gamertag: true,
      createdAt: true,
      _count: { select: { attendances: true, games: true, availability: true } },
    },
  });

  return users
    .filter((u) => u._count.attendances === 0)
    .map((u) => ({
      name: u.gamertag || u.name,
      gamesCount: u._count.games,
      availabilitySlots: u._count.availability,
      joinedAt: u.createdAt.toISOString().split("T")[0],
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// ── Schedule Gaps ───────────────────────────────────────────────────
export async function getScheduleGaps() {
  await requireModOrAdmin();

  const now = new Date();
  const twoWeeksOut = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const [upcomingEvents, users] = await Promise.all([
    prisma.gameNight.findMany({
      where: { date: { gte: now, lte: twoWeeksOut }, status: "scheduled" },
      select: { date: true },
    }),
    prisma.user.findMany({
      where: { gamertag: { not: null } },
      select: { id: true, availability: true },
    }),
  ]);

  // Count events per day of week
  const eventDays = new Set(upcomingEvents.map((e) => e.date.getDay()));

  // Count available players per day
  const dayAvailability: Record<number, number> = {};
  for (const day of DAYS_OF_WEEK.keys()) {
    const uniqueUsers = new Set<string>();
    for (const user of users) {
      for (const a of user.availability) {
        if (a.dayOfWeek === day) {
          uniqueUsers.add(user.id);
          break;
        }
      }
    }
    dayAvailability[day] = uniqueUsers.size;
  }

  return DAYS_OF_WEEK.map((dayName, i) => ({
    day: dayName,
    availablePlayers: dayAvailability[i] || 0,
    hasUpcomingEvent: eventDays.has(i),
  }))
    .filter((d) => !d.hasUpcomingEvent && d.availablePlayers > 0)
    .sort((a, b) => b.availablePlayers - a.availablePlayers);
}

// ── RSVP Stats ──────────────────────────────────────────────────────
export async function getRsvpStats() {
  await requireModOrAdmin();

  const attendees = await prisma.gameNightAttendee.findMany({
    include: {
      user: { select: { name: true, gamertag: true } },
      gameNight: { select: { attendanceConfirmed: true } },
    },
  });

  const userMap: Record<string, {
    confirmed: number; maybe: number; declined: number;
    attended: number; noShow: number;
  }> = {};

  for (const a of attendees) {
    const name = a.user.gamertag || a.user.name;
    if (!userMap[name]) userMap[name] = { confirmed: 0, maybe: 0, declined: 0, attended: 0, noShow: 0 };
    if (a.status === "confirmed") userMap[name].confirmed++;
    else if (a.status === "maybe") userMap[name].maybe++;
    else if (a.status === "declined") userMap[name].declined++;

    // Track actual attendance for events that have been confirmed
    if (a.gameNight.attendanceConfirmed) {
      if (a.attended) userMap[name].attended++;
      else if (a.status === "confirmed") userMap[name].noShow++;
    }
  }

  return Object.entries(userMap)
    .map(([name, stats]) => ({
      name,
      ...stats,
      total: stats.confirmed + stats.maybe + stats.declined,
    }))
    .sort((a, b) => b.total - a.total);
}

// ── Game Night History ──────────────────────────────────────────────
export async function getGameNightHistory() {
  await requireModOrAdmin();

  const events = await prisma.gameNight.findMany({
    where: { status: { in: ["scheduled", "cancelled"] } },
    select: { game: true, status: true, _count: { select: { attendees: true } } },
  });

  const gameMap: Record<string, { scheduled: number; cancelled: number; totalRsvps: number }> = {};
  for (const e of events) {
    if (!gameMap[e.game]) gameMap[e.game] = { scheduled: 0, cancelled: 0, totalRsvps: 0 };
    if (e.status === "scheduled") gameMap[e.game].scheduled++;
    else if (e.status === "cancelled") gameMap[e.game].cancelled++;
    gameMap[e.game].totalRsvps += e._count.attendees;
  }

  return Object.entries(gameMap)
    .map(([game, stats]) => ({
      game,
      ...stats,
      totalEvents: stats.scheduled + stats.cancelled,
      avgAttendance: stats.scheduled > 0 ? Math.round(stats.totalRsvps / stats.scheduled * 10) / 10 : 0,
    }))
    .sort((a, b) => b.totalEvents - a.totalEvents);
}

// ── All unique game names (for dropdowns) ───────────────────────────
export async function getAllGameNames() {
  await requireModOrAdmin();

  const games = await prisma.userGame.findMany({
    select: { gameName: true },
    distinct: ["gameName"],
    orderBy: { gameName: "asc" },
  });

  return games.map((g) => g.gameName);
}
