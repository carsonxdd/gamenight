"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface CommunityStats {
  gameNightCount: number;
  totalRSVPs: number;
  /** Games ranked by number of events held, with avg attendance */
  mostPlayed: { game: string; eventCount: number; avgAttendees: number }[];
  /** Day of week (0=Sun) with the most events */
  mostActiveDay: number | null;
  /** Max attendees on a single event */
  biggestNight: { game: string; date: string; count: number } | null;
  /** Most recently joined member */
  newestMember: string | null;
  /** Active persistent teams */
  teamCount: number;
  /** Completed tournaments */
  tournamentCount: number;
}

export async function getCommunityStats(): Promise<CommunityStats> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return {
      gameNightCount: 0,
      totalRSVPs: 0,
      mostPlayed: [],
      mostActiveDay: null,
      biggestNight: null,
      newestMember: null,
      teamCount: 0,
      tournamentCount: 0,
    };
  }

  const [gameNights, totalRSVPs, teamCount, tournamentCount, newestUser] =
    await Promise.all([
      prisma.gameNight.findMany({
        where: { status: "scheduled" },
        select: {
          game: true,
          date: true,
          _count: { select: { attendees: true } },
        },
      }),
      prisma.gameNightAttendee.count(),
      prisma.team.count({ where: { isActive: true } }),
      prisma.tournament.count({ where: { status: "completed" } }),
      prisma.user.findFirst({
        where: { gamertag: { not: null } },
        orderBy: { createdAt: "desc" },
        select: { gamertag: true, name: true },
      }),
    ]);

  // Most played games (by event count)
  const gameEventMap: Record<string, { count: number; totalAttendees: number }> = {};
  const dayCount: Record<number, number> = {};
  let biggestNight: CommunityStats["biggestNight"] = null;

  for (const gn of gameNights) {
    const game = gn.game;
    if (!gameEventMap[game]) gameEventMap[game] = { count: 0, totalAttendees: 0 };
    gameEventMap[game].count++;
    gameEventMap[game].totalAttendees += gn._count.attendees;

    const day = gn.date.getUTCDay();
    dayCount[day] = (dayCount[day] || 0) + 1;

    if (!biggestNight || gn._count.attendees > biggestNight.count) {
      biggestNight = {
        game,
        date: gn.date.toISOString().split("T")[0],
        count: gn._count.attendees,
      };
    }
  }

  const mostPlayed = Object.entries(gameEventMap)
    .map(([game, data]) => ({
      game,
      eventCount: data.count,
      avgAttendees: Math.round((data.totalAttendees / data.count) * 10) / 10,
    }))
    .sort((a, b) => b.eventCount - a.eventCount)
    .slice(0, 5);

  const mostActiveDay =
    Object.entries(dayCount).length > 0
      ? Number(
          Object.entries(dayCount).sort(([, a], [, b]) => b - a)[0][0]
        )
      : null;

  return {
    gameNightCount: gameNights.length,
    totalRSVPs,
    mostPlayed,
    mostActiveDay,
    biggestNight: biggestNight && biggestNight.count > 0 ? biggestNight : null,
    newestMember: newestUser?.gamertag || newestUser?.name || null,
    teamCount,
    tournamentCount,
  };
}
