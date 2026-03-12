import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { utcToLocalTime, DEFAULT_TIMEZONE, computeTimeSlotsForViewer } from "@/lib/timezone-utils";
import { getSiteSettings } from "./settings-actions";
import { getOpenSuggestionCount, getAllSuggestions } from "@/app/suggestions/actions";
import { getAllBadges, getAllUsersForBadgeAdmin } from "@/app/badges/actions";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin && !session?.user?.isModerator) {
    redirect("/");
  }

  const [users, gameNights, settings, openSuggestionCount, allSuggestions] = await Promise.all([
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
    getSiteSettings(),
    getOpenSuggestionCount(),
    getAllSuggestions(),
  ]);

  // Summary stats — unique games across all user profiles
  const [uniqueGameCount, activeUsersCount, recentAuditLogs, badgeDefinitions, badgeUsers] = await Promise.all([
    prisma.userGame.findMany({
      select: { gameName: true },
      distinct: ["gameName"],
    }),
    prisma.user.count({
      where: { lastSeenAt: { gte: new Date(Date.now() - 15 * 60 * 1000) } },
    }),
    prisma.auditLog.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: { actor: { select: { id: true, name: true, gamertag: true, avatar: true } } },
    }),
    getAllBadges(),
    session.user.isAdmin ? getAllUsersForBadgeAdmin() : Promise.resolve([]),
  ]);
  const totalRSVPs = gameNights.reduce((sum, gn) => sum + gn.attendees.length, 0);

  const stats = {
    playerCount: users.length,
    uniqueGames: uniqueGameCount.length,
    gameNightCount: gameNights.length,
    totalRSVPs,
    activeUsersCount,
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

  // Availability entries — convert from UTC to the viewing admin's timezone
  const viewerTimezone = session.user.timezone || DEFAULT_TIMEZONE;
  const availability = users.flatMap((user) => {
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
            endTime: "23:30", // run to end of display range on start day
            userName: user.gamertag || user.name,
            games: userGames,
          },
          {
            dayOfWeek: localEnd.localDayOfWeek,
            startTime: "00:00", // start from midnight on end day
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

  // Compute prime/extended time slots for the viewer's timezone
  const { primeSlots, extendedSlots } = computeTimeSlotsForViewer(
    viewerTimezone,
    settings.anchorTimezone,
    settings.primeStartHour,
    settings.primeEndHour,
    settings.extendedStartHour,
    settings.extendedEndHour
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

  // Past events needing attendance confirmation
  const pendingAttendance = await prisma.gameNight.findMany({
    where: {
      status: "scheduled",
      attendanceConfirmed: false,
      date: { lt: new Date() },
      attendees: { some: {} },
    },
    select: {
      id: true,
      title: true,
      game: true,
      date: true,
      host: { select: { name: true, gamertag: true } },
      _count: { select: { attendees: true } },
    },
    orderBy: { date: "desc" },
    take: 10,
  });

  const pendingAttendanceEvents = pendingAttendance.map((e) => ({
    id: e.id,
    title: e.title,
    game: e.game,
    date: e.date.toISOString(),
    hostName: e.host?.gamertag || e.host?.name || null,
    attendeeCount: e._count.attendees,
  }));

  // Player roster
  const players = users.map((u) => ({
    id: u.id,
    name: u.name,
    gamertag: u.gamertag,
    avatar: u.avatar,
    isAdmin: u.isAdmin,
    isModerator: u.isModerator,
    isOwner: u.isOwner,
    isMuted: u.isMuted,
    mutedUntil: u.mutedUntil?.toISOString() ?? null,
    games: u.games.map((g) => {
      const modes = g.modes ? (JSON.parse(g.modes) as string[]) : undefined;
      return modes && modes.length > 0
        ? `${g.gameName} (${modes.join(", ")})`
        : g.gameName;
    }),
    availabilityDays: [...new Set(u.availability.map((a) => a.dayOfWeek))],
    willingToModerate: u.willingToModerate,
  }));

  // Serialize audit logs for client
  const serializedAuditLogs = recentAuditLogs.map((log) => ({
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    actorName: log.actor.gamertag || log.actor.name,
    actorAvatar: log.actor.avatar,
    metadata: log.metadata,
    createdAt: log.createdAt.toISOString(),
  }));

  // Site settings for the settings panel — settings already typed as SiteSettingsData
  const siteSettingsData = settings;

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
        isCurrentUserAdmin={session.user.isAdmin}
        pendingAttendance={pendingAttendanceEvents}
        siteSettings={siteSettingsData}
        primeSlots={primeSlots}
        extendedSlots={extendedSlots}
        anchorTimezone={settings.anchorTimezone}
        viewerTimezone={viewerTimezone}
        anchorPrimeStartHour={settings.primeStartHour}
        anchorPrimeEndHour={settings.primeEndHour}
        openSuggestionCount={openSuggestionCount}
        suggestions={allSuggestions}
        auditLogs={serializedAuditLogs}
        badgeDefinitions={badgeDefinitions}
        badgeUsers={badgeUsers}
      />
    </div>
  );
}
