import { prisma } from "@/lib/prisma";
import { GAME_RANK_TIERS } from "@/lib/constants";
import MembersGrid from "@/components/members/MembersGrid";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const dbUsers = await prisma.user.findMany({
    where: { gamertag: { not: null } },
    include: { games: true, ranks: true },
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
      twitter: user.twitter,
      twitch: user.twitch,
      youtube: user.youtube,
      customLink: user.customLink,
    };
  });

  return <MembersGrid members={members} />;
}
