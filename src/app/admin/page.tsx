import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    redirect("/");
  }

  const [users, gameNights] = await Promise.all([
    prisma.user.findMany({
      include: {
        games: true,
        availability: true,
        attendances: true,
      },
    }),
    prisma.gameNight.findMany({
      include: {
        attendees: {
          include: {
            user: { select: { name: true, gamertag: true } },
          },
        },
      },
      orderBy: { date: "desc" },
    }),
  ]);

  // Summary stats — unique games across all user profiles
  const uniqueGameCount = await prisma.userGame.findMany({
    select: { gameName: true },
    distinct: ["gameName"],
  });
  const totalRSVPs = gameNights.reduce((sum, gn) => sum + gn.attendees.length, 0);

  const stats = {
    playerCount: users.length,
    uniqueGames: uniqueGameCount.length,
    gameNightCount: gameNights.length,
    totalRSVPs,
  };

  // Game popularity
  const gameMap: Record<string, { count: number; players: string[] }> = {};
  for (const user of users) {
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

  // Availability entries
  const availability = users.flatMap((user) =>
    user.availability.map((a) => ({
      dayOfWeek: a.dayOfWeek,
      startTime: a.startTime,
      endTime: a.endTime,
      userName: user.gamertag || user.name,
    }))
  );

  // Game nights serialized
  const serializedGameNights = gameNights.map((gn) => ({
    id: gn.id,
    title: gn.title,
    date: gn.date.toISOString(),
    startTime: gn.startTime,
    endTime: gn.endTime,
    game: gn.game,
    status: gn.status,
    attendees: gn.attendees.map((a) => ({
      status: a.status,
      userName: a.user.gamertag || a.user.name,
    })),
  }));

  // Player roster
  const players = users.map((u) => ({
    id: u.id,
    name: u.name,
    gamertag: u.gamertag,
    avatar: u.avatar,
    isAdmin: u.isAdmin,
    games: u.games.map((g) => {
      const modes = g.modes ? (JSON.parse(g.modes) as string[]) : undefined;
      return modes && modes.length > 0
        ? `${g.gameName} (${modes.join(", ")})`
        : g.gameName;
    }),
    availabilityDays: [...new Set(u.availability.map((a) => a.dayOfWeek))],
    willingToModerate: u.willingToModerate,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold text-foreground">Admin Panel</h1>
      <p className="mb-8 text-foreground/50">
        Player preferences and game night overview
      </p>
      <AdminDashboard
        stats={stats}
        gameStats={gameStats}
        availability={availability}
        gameNights={serializedGameNights}
        players={players}
        currentUserId={session.user.id}
      />
    </div>
  );
}
