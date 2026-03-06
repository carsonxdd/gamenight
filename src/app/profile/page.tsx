import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfilePageClient from "@/components/signup/ProfilePageClient";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/signup");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      games: true,
      ranks: true,
      availability: true,
    },
  });

  if (!user?.gamertag) {
    redirect("/signup");
  }

  const games = user.games.map((g) => ({
    name: g.gameName,
    modes: g.modes ? (JSON.parse(g.modes) as string[]) : undefined,
  }));

  const slots = user.availability.map(
    (a) => `${a.dayOfWeek}-${a.startTime}`
  );

  const ranks = user.ranks.map((r) => ({
    gameName: r.gameName,
    rank: r.rank,
  }));

  return (
    <ProfilePageClient
      defaultName={user.gamertag}
      initialGames={games}
      initialSlots={slots}
      initialModerate={user.willingToModerate}
      initialTimezone={user.timezone || undefined}
      initialRanks={ranks}
      initialBuyIn={user.interestedInBuyIn}
      initialLAN={user.interestedInLAN}
    />
  );
}
