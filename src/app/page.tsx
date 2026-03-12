import { prisma } from "@/lib/prisma";
import { GAME_RANK_TIERS, GAMES } from "@/lib/constants";
import HeroSection from "@/components/home/HeroSection";
import Introduction from "@/components/home/Introduction";
import SocialProof from "@/components/home/SocialProof";
import MembersCarousel from "@/components/home/MembersCarousel";
import HighlightCards from "@/components/home/HighlightCards";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [dbUsers, memberCount, eventsHosted, attendanceStreaks] = await Promise.all([
    prisma.user.findMany({
      where: { games: { some: {} } },
      select: {
        id: true, name: true, gamertag: true, avatar: true, favoriteGames: true,
        isModerator: true, isOwner: true,
        games: true, ranks: true,
      },
      take: 20,
    }),
    prisma.user.count(),
    prisma.gameNight.count(),
    prisma.userStreak.findMany({
      where: { type: "attendance", currentCount: { gt: 0 } },
      select: { userId: true, currentCount: true },
    }),
  ]);
  const streakMap: Record<string, number> = {};
  for (const s of attendanceStreaks) streakMap[s.userId] = s.currentCount;

  const members = dbUsers.map((user) => {
    let topRank: { gameName: string; rank: string; color: string } | null = null;
    let topTierIndex = -1;

    for (const userRank of user.ranks) {
      const tiers = GAME_RANK_TIERS[userRank.gameName];
      if (!tiers) continue;

      for (let i = 0; i < tiers.length; i++) {
        if (tiers[i].ranks.includes(userRank.rank) && i > topTierIndex) {
          topTierIndex = i;
          topRank = {
            gameName: userRank.gameName,
            rank: userRank.rank,
            color: tiers[i].color,
          };
        }
      }
    }

    const favoriteGames: string[] = user.favoriteGames
      ? JSON.parse(user.favoriteGames)
      : [];
    const displayGames = favoriteGames.length > 0
      ? favoriteGames
      : user.games.map((g) => g.gameName).slice(0, 3);

    return {
      name: user.gamertag || user.name,
      avatar: user.avatar,
      games: displayGames,
      topRank,
      isModerator: user.isModerator,
      isOwner: user.isOwner,
      streakCount: streakMap[user.id] || 0,
    };
  });

  return (
    <>
      <HeroSection />
      <Introduction />
      <SocialProof
        memberCount={memberCount}
        eventsHosted={eventsHosted}
        gamesAvailable={GAMES.length}
      />
      <MembersCarousel members={members} />
      <HighlightCards />
    </>
  );
}
