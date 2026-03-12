import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfilePageClient from "@/components/signup/ProfilePageClient";
import { utcToLocalTime, DEFAULT_TIMEZONE } from "@/lib/timezone-utils";
import { getSiteSettings } from "@/app/admin/settings-actions";
import { getMyRecentSuggestions } from "@/app/suggestions/actions";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/signup");
  }

  const [user, allMembers, userGroups] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        games: true,
        ranks: true,
        availability: true,
      },
    }),
    prisma.user.findMany({
      where: {
        gamertag: { not: null },
        id: { not: session.user.id },
      },
      select: { id: true, name: true, gamertag: true, avatar: true },
      orderBy: { gamertag: "asc" },
    }),
    prisma.inviteGroup.findMany({
      where: { ownerId: session.user.id },
      include: { members: { select: { userId: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!user?.gamertag) {
    redirect("/signup");
  }

  const games = user.games.map((g) => ({
    name: g.gameName,
    modes: g.modes ? (JSON.parse(g.modes) as string[]) : undefined,
  }));

  // Convert UTC availability back to user's local timezone for editing
  const userTz = user.timezone || DEFAULT_TIMEZONE;
  const slots = user.availability.map((a) => {
    const local = utcToLocalTime(a.startTime, a.dayOfWeek, userTz);
    return `${local.localDayOfWeek}-${local.localTime}`;
  });

  const ranks = user.ranks.map((r) => ({
    gameName: r.gameName,
    rank: r.rank,
  }));

  const favoriteGames: string[] = user.favoriteGames
    ? JSON.parse(user.favoriteGames)
    : [];

  const groups = userGroups.map((g) => ({
    id: g.id,
    name: g.name,
    memberIds: g.members.map((m) => m.userId),
  }));

  const [settings, mySuggestions] = await Promise.all([
    getSiteSettings(),
    getMyRecentSuggestions(),
  ]);

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
      initialFavoriteGames={favoriteGames}
      initialTwitter={user.twitter || undefined}
      initialTwitch={user.twitch || undefined}
      initialYoutube={user.youtube || undefined}
      initialCustomLink={user.customLink || undefined}
      groups={groups}
      members={allMembers}
      primeStartHour={settings.primeStartHour}
      primeEndHour={settings.primeEndHour}
      extendedStartHour={settings.extendedStartHour}
      extendedEndHour={settings.extendedEndHour}
      anchorTimezone={settings.anchorTimezone}
      mySuggestions={mySuggestions}
      isMuted={session.user.isMuted}
    />
  );
}
