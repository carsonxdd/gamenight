import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Backfilling badges for all users...\n");

  const users = await prisma.user.findMany({
    select: { id: true, name: true, gamertag: true, createdAt: true },
  });

  const badges = await prisma.badgeDefinition.findMany({
    where: { isEnabled: true },
  });

  let totalAwarded = 0;
  let usersAffected = 0;

  for (const user of users) {
    let awarded = 0;

    // Get existing awards (including suppressed) to skip
    const existing = await prisma.userBadge.findMany({
      where: { userId: user.id },
      select: { badgeId: true, suppressAutoAward: true },
    });
    const existingMap = new Map(existing.map((e) => [e.badgeId, e]));

    // Compute all metrics for this user
    const [
      eventsAttended,
      pollVotesDistinct,
      pollComments,
      tournamentComments,
      tournamentsJoined,
      pollsCreated,
      teamMemberships,
      teamsCaptained,
      gamesAdded,
    ] = await Promise.all([
      prisma.gameNightAttendee.count({ where: { userId: user.id, attended: true } }),
      prisma.pollVote.findMany({
        where: { userId: user.id },
        select: { pollId: true },
        distinct: ["pollId"],
      }),
      prisma.pollComment.count({ where: { userId: user.id } }),
      prisma.tournamentComment.count({ where: { userId: user.id } }),
      prisma.tournamentEntrant.count({ where: { userId: user.id } }),
      prisma.poll.count({ where: { createdById: user.id } }),
      prisma.teamMember.count({ where: { userId: user.id } }),
      prisma.team.count({ where: { captainId: user.id } }),
      prisma.userGame.count({ where: { userId: user.id } }),
    ]);

    const metrics: Record<string, number> = {
      events_attended: eventsAttended,
      poll_votes: pollVotesDistinct.length,
      comments: pollComments + tournamentComments,
      tournaments_joined: tournamentsJoined,
      tournament_wins: 0, // complex to backfill, skip for now
      polls_created: pollsCreated,
      team_joined: teamMemberships,
      team_captain: teamsCaptained,
      games_added: gamesAdded,
    };

    // Compute attendance streak by walking events chronologically
    const attendedEvents = await prisma.gameNightAttendee.findMany({
      where: { userId: user.id, attended: true },
      include: { gameNight: { select: { date: true, attendanceConfirmed: true } } },
      orderBy: { gameNight: { date: "asc" } },
    });

    // Also get no-show events (confirmed RSVP, attendance confirmed, but not attended)
    const noShowEvents = await prisma.gameNightAttendee.findMany({
      where: {
        userId: user.id,
        attended: false,
        status: "confirmed",
        gameNight: { attendanceConfirmed: true },
      },
      include: { gameNight: { select: { date: true } } },
      orderBy: { gameNight: { date: "asc" } },
    });

    // Merge and sort all confirmed events
    const allEvents = [
      ...attendedEvents.map((e) => ({ date: e.gameNight.date, attended: true, id: e.gameNightId })),
      ...noShowEvents.map((e) => ({ date: e.gameNight.date, attended: false, id: e.gameNightId })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    let currentStreak = 0;
    let longestStreak = 0;
    let lastEventId: string | null = null;

    for (const event of allEvents) {
      if (event.attended) {
        currentStreak++;
        lastEventId = event.id;
        if (currentStreak > longestStreak) longestStreak = currentStreak;
      } else {
        currentStreak = 0;
      }
    }

    // Upsert attendance streak
    if (longestStreak > 0 || currentStreak > 0) {
      await prisma.userStreak.upsert({
        where: { userId_type: { userId: user.id, type: "attendance" } },
        create: {
          userId: user.id,
          type: "attendance",
          currentCount: currentStreak,
          longestCount: longestStreak,
          lastEventId,
        },
        update: {
          currentCount: currentStreak,
          longestCount: longestStreak,
          lastEventId,
        },
      });
    }

    // Also set streak metrics for badge evaluation
    metrics.attendance_streak = currentStreak;

    // Check threshold badges
    for (const badge of badges) {
      const existingAward = existingMap.get(badge.id);
      // Skip if already awarded or suppressed
      if (existingAward) continue;

      let config: { type: string; metric?: string; value?: number; check?: string };
      try {
        config = JSON.parse(badge.triggerConfig);
      } catch {
        continue;
      }

      if (config.type === "threshold" && config.metric && config.value) {
        const value = metrics[config.metric] ?? 0;
        if (value >= config.value) {
          await prisma.userBadge.create({
            data: { userId: user.id, badgeId: badge.id },
          });
          awarded++;
        }
      }

      // Profile complete check
      if (config.type === "special" && config.check === "checkProfileComplete") {
        const fullUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: { games: true, availability: true },
        });
        if (fullUser) {
          const filled = [
            !!fullUser.gamertag,
            fullUser.timezone !== "America/Phoenix",
            fullUser.games.length > 0,
            fullUser.availability.length > 0,
            !!fullUser.favoriteGames,
            !!(fullUser.twitter || fullUser.twitch || fullUser.youtube || fullUser.customLink),
          ].filter(Boolean).length;

          if (filled >= 5) {
            await prisma.userBadge.create({
              data: { userId: user.id, badgeId: badge.id },
            });
            awarded++;
          }
        }
      }
    }

    if (awarded > 0) {
      usersAffected++;
      totalAwarded += awarded;
      console.log(`  ${user.gamertag || user.name}: +${awarded} badges`);
    }
  }

  // Auto-showcase up to 3 highest-tier badges per user
  console.log("\nAuto-showcasing top badges for each user...");
  const tierOrder = ["diamond", "gold", "silver", "bronze", "binary"];
  const allUserBadges = await prisma.userBadge.findMany({
    where: { suppressAutoAward: false },
    include: { badge: { select: { tier: true } } },
    orderBy: { awardedAt: "asc" },
  });

  const byUser: Record<string, typeof allUserBadges> = {};
  for (const ub of allUserBadges) {
    if (!byUser[ub.userId]) byUser[ub.userId] = [];
    byUser[ub.userId].push(ub);
  }

  let showcased = 0;
  for (const [, userBadges] of Object.entries(byUser)) {
    // Sort by tier (best first), take top 3
    const sorted = userBadges.sort((a, b) => {
      return tierOrder.indexOf(a.badge.tier) - tierOrder.indexOf(b.badge.tier);
    });
    const toShowcase = sorted.slice(0, 3);
    for (const ub of toShowcase) {
      if (!ub.showcased) {
        await prisma.userBadge.update({
          where: { id: ub.id },
          data: { showcased: true },
        });
        showcased++;
      }
    }
  }
  console.log(`Showcased ${showcased} badges.`);

  console.log(`\nDone! Awarded ${totalAwarded} badges to ${usersAffected} users.`);
}

main()
  .catch((e) => {
    console.error("Backfill failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
