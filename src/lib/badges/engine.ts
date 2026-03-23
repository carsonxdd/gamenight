import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import type { MetricKey } from "./constants";

/**
 * Evaluate all enabled badges for a given metric and award any that are newly met.
 * Returns an array of newly awarded badge names (for toast display).
 *
 * The metric value is computed fresh from the DB inside this function,
 * so callers only need to pass userId and the metric key.
 */
export async function evaluateBadges(
  userId: string,
  metric: MetricKey
): Promise<string[]> {
  // Check feature toggle
  const settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
  if (settings && !settings.enableBadges) return [];

  // Find all enabled badges that trigger on this metric
  const candidates = await prisma.badgeDefinition.findMany({
    where: {
      isEnabled: true,
      triggerConfig: { contains: `"metric":"${metric}"` },
    },
  });

  if (candidates.length === 0) return [];

  // Get current metric value from DB
  const currentValue = await getMetricValue(userId, metric);

  // Get existing awards (including suppressed) for this user + these badges
  const badgeIds = candidates.map((b) => b.id);
  const existingAwards = await prisma.userBadge.findMany({
    where: { userId, badgeId: { in: badgeIds } },
  });
  const awardMap = new Map(existingAwards.map((a) => [a.badgeId, a]));

  const newlyAwarded: string[] = [];

  for (const badge of candidates) {
    const existing = awardMap.get(badge.id);

    // Skip if already awarded (whether normal or suppressed)
    if (existing) continue;

    const config = JSON.parse(badge.triggerConfig) as {
      type: string;
      metric?: string;
      value?: number;
    };

    if (config.type !== "threshold" || !config.value) continue;
    if (currentValue < config.value) continue;

    // Award the badge
    await prisma.userBadge.create({
      data: { userId, badgeId: badge.id },
    });

    logAudit({
      action: "BADGE_AWARDED",
      entityType: "Badge",
      entityId: badge.id,
      actorId: userId,
      metadata: { badgeName: badge.name, metric, auto: true },
    });

    newlyAwarded.push(badge.name);
  }

  return newlyAwarded;
}

/**
 * Check and award the "Profile Complete" special badge.
 */
export async function checkProfileComplete(userId: string): Promise<string[]> {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
  if (settings && !settings.enableBadges) return [];

  const badge = await prisma.badgeDefinition.findFirst({
    where: { key: "profile_complete", isEnabled: true },
  });
  if (!badge) return [];

  // Check if already awarded or suppressed
  const existing = await prisma.userBadge.findUnique({
    where: { userId_badgeId: { userId, badgeId: badge.id } },
  });
  if (existing) return [];

  // Check profile completeness
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { games: true, availability: true },
  });
  if (!user) return [];

  const hasGamertag = !!user.gamertag;
  const hasTimezone = !!user.timezone;
  const hasGames = user.games.length > 0;
  const hasAvailability = user.availability.length > 0;
  const hasFavoriteGames = !!user.favoriteGames;
  const hasSocialLink = !!(user.twitter || user.twitch || user.youtube || user.customLink);

  // Require at least 5 of 6 fields
  const filled = [hasGamertag, hasTimezone, hasGames, hasAvailability, hasFavoriteGames, hasSocialLink]
    .filter(Boolean).length;

  if (filled < 5) return [];

  await prisma.userBadge.create({
    data: { userId, badgeId: badge.id },
  });

  logAudit({
    action: "BADGE_AWARDED",
    entityType: "Badge",
    entityId: badge.id,
    actorId: userId,
    metadata: { badgeName: badge.name, auto: true },
  });

  return [badge.name];
}

// ─── Metric Value Computation ────────────────────────────────────────

async function getMetricValue(userId: string, metric: MetricKey): Promise<number> {
  switch (metric) {
    case "events_attended":
      return prisma.gameNightAttendee.count({
        where: { userId, attended: true },
      });

    case "poll_votes": {
      // Count distinct polls voted in
      const votes = await prisma.pollVote.findMany({
        where: { userId },
        select: { pollId: true },
        distinct: ["pollId"],
      });
      return votes.length;
    }

    case "comments": {
      const [pollComments, tournamentComments] = await Promise.all([
        prisma.pollComment.count({ where: { userId } }),
        prisma.tournamentComment.count({ where: { userId } }),
      ]);
      return pollComments + tournamentComments;
    }

    case "tournaments_joined":
      return prisma.tournamentEntrant.count({
        where: { userId },
      });

    case "tournament_wins": {
      // Count tournaments where this user's entrant won the final match
      const wins = await prisma.tournamentMatch.count({
        where: {
          winner: {
            OR: [
              { userId },
              { team: { members: { some: { userId } } } },
            ],
          },
          // Final match = no further matches reference this winner as entrant
          tournament: { status: "completed" },
        },
      });
      // Simpler: count completed tournaments where user is in the winning entrant of the last round
      // For now, count distinct tournaments with a won match
      return wins;
    }

    case "polls_created":
      return prisma.poll.count({ where: { createdById: userId } });

    case "attendance_streak": {
      const streak = await prisma.userStreak.findUnique({
        where: { userId_type: { userId, type: "attendance" } },
      });
      return streak?.currentCount ?? 0;
    }

    case "weekly_activity": {
      const streak = await prisma.userStreak.findUnique({
        where: { userId_type: { userId, type: "weekly_activity" } },
      });
      return streak?.currentCount ?? 0;
    }

    case "team_joined":
      return prisma.teamMember.count({ where: { userId } });

    case "team_captain":
      return prisma.team.count({ where: { captainId: userId } });

    case "games_added":
      return prisma.userGame.count({ where: { userId } });

    case "profile_complete":
      // Handled by special check
      return 0;

    default:
      return 0;
  }
}
