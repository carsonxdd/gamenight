import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GAME_RANK_TIERS } from "@/lib/constants";
import MembersTabs from "@/components/members/MembersTabs";
import { utcToLocalTime, DEFAULT_TIMEZONE, computeTimeSlotsForViewer } from "@/lib/timezone-utils";
import { getSiteSettings } from "@/app/admin/settings-actions";
import { getCommunityStats } from "./stats-actions";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const session = await getServerSession(authOptions);
  const settings = await getSiteSettings();

  if (!session?.user?.id) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <h1 className="mb-4 text-3xl font-bold text-foreground">Members</h1>
        <p className="mb-6 text-foreground/50">Sign in to view the community members.</p>
        <a
          href="/signup"
          className="inline-block rounded bg-neon px-6 py-2.5 font-semibold text-background transition hover:bg-neon-dim"
        >
          Sign In
        </a>
      </div>
    );
  }
  // Fetch team memberships for tag display
  const allTeamMembers = await prisma.teamMember.findMany({
    where: { team: { isActive: true } },
    select: {
      userId: true,
      team: { select: { id: true, tag: true, game: true } },
    },
  });
  const userTeamTags: Record<string, { tag: string; game: string; teamId: string }[]> = {};
  for (const tm of allTeamMembers) {
    if (!userTeamTags[tm.userId]) userTeamTags[tm.userId] = [];
    userTeamTags[tm.userId].push({ tag: tm.team.tag, game: tm.team.game, teamId: tm.team.id });
  }

  const dbUsers = await prisma.user.findMany({
    where: { gamertag: { not: null } },
    select: {
      id: true, name: true, gamertag: true, avatar: true, favoriteGames: true,
      twitter: true, twitch: true, youtube: true, customLink: true,
      isModerator: true, isOwner: true, createdAt: true,
      games: true, ranks: true, availability: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const members = dbUsers.map((user) => {
    const ranks: { gameName: string; rank: string; color: string }[] = [];
    for (const userRank of user.ranks) {
      const tiers = GAME_RANK_TIERS[userRank.gameName];
      if (!tiers) continue;
      const tier = tiers.find((t) => t.ranks.includes(userRank.rank));
      if (tier) {
        ranks.push({
          gameName: userRank.gameName,
          rank: userRank.rank,
          color: tier.color,
        });
      }
    }

    const favoriteGames: string[] = user.favoriteGames
      ? JSON.parse(user.favoriteGames)
      : [];
    const allGames = user.games.map((g) => g.gameName);
    const displayGames =
      favoriteGames.length > 0 ? favoriteGames : allGames.slice(0, 3);

    return {
      id: user.id,
      name: user.gamertag || user.name,
      discordUsername: user.name,
      avatar: user.avatar,
      games: allGames,
      displayGames,
      ranks,
      teamTags: userTeamTags[user.id] || [],
      twitter: user.twitter,
      twitch: user.twitch,
      youtube: user.youtube,
      customLink: user.customLink,
      isModerator: user.isModerator,
      isOwner: user.isOwner,
    };
  });

  // Game popularity
  const gameMap: Record<string, { count: number; players: string[] }> = {};
  for (const user of dbUsers) {
    for (const game of user.games) {
      if (!gameMap[game.gameName]) {
        gameMap[game.gameName] = { count: 0, players: [] };
      }
      gameMap[game.gameName].count++;
      gameMap[game.gameName].players.push(user.gamertag || user.name);
    }
  }
  const gameStats = Object.entries(gameMap)
    .map(([gameName, data]) => ({ gameName, ...data }))
    .sort((a, b) => b.count - a.count);

  // Availability entries — convert from UTC to the viewing user's timezone
  const viewerTimezone = session.user.timezone || DEFAULT_TIMEZONE;
  const availability = dbUsers.flatMap((user) => {
    const userGames = user.games.map((g) => g.gameName);
    return user.availability.flatMap((a) => {
      const localStart = utcToLocalTime(a.startTime, a.dayOfWeek, viewerTimezone);
      const localEnd = utcToLocalTime(a.endTime, a.dayOfWeek, viewerTimezone);

      // If the conversion shifted start and end to different days, split into two entries
      if (localStart.localDayOfWeek !== localEnd.localDayOfWeek) {
        return [
          {
            dayOfWeek: localStart.localDayOfWeek,
            startTime: localStart.localTime,
            endTime: "23:30",
            userName: user.gamertag || user.name,
            games: userGames,
          },
          {
            dayOfWeek: localEnd.localDayOfWeek,
            startTime: "00:00",
            endTime: localEnd.localTime,
            userName: user.gamertag || user.name,
            games: userGames,
          },
        ];
      }

      return [{
        dayOfWeek: localStart.localDayOfWeek,
        startTime: localStart.localTime,
        endTime: localEnd.localTime,
        userName: user.gamertag || user.name,
        games: userGames,
      }];
    });
  });

  // Compute prime/extended time slots and community stats
  const communityStats = await getCommunityStats();
  const { primeSlots, extendedSlots } = computeTimeSlotsForViewer(
    viewerTimezone,
    settings.anchorTimezone,
    settings.primeStartHour,
    settings.primeEndHour,
    settings.extendedStartHour,
    settings.extendedEndHour
  );

  return (
    <MembersTabs
      members={members}
      gameStats={gameStats}
      availability={availability}
      primeSlots={primeSlots}
      extendedSlots={extendedSlots}
      anchorTimezone={settings.anchorTimezone}
      viewerTimezone={viewerTimezone}
      anchorPrimeStartHour={settings.primeStartHour}
      anchorPrimeEndHour={settings.primeEndHour}
      communityStats={communityStats}
    />
  );
}
