import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ScheduleView from "@/components/schedule/ScheduleView";
import ProfileBanner from "@/components/ui/ProfileBanner";
import InfoBubble from "@/components/schedule/InfoBubble";
import type { TeamTagMap } from "@/lib/team-utils";
import { DEFAULT_TIMEZONE } from "@/lib/timezone-utils";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ tournament?: string }>;
}) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);

  // Check if the user should see the "finish profile" banner
  let showProfileBanner = false;
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        dismissedProfileBanner: true,
        interestedInBuyIn: true,
        interestedInLAN: true,
        _count: { select: { ranks: true } },
      },
    });
    if (user && !user.dismissedProfileBanner) {
      const hasExtendedInfo =
        user.interestedInBuyIn ||
        user.interestedInLAN ||
        user._count.ranks > 0;
      showProfileBanner = !hasExtendedInfo;
    }
  }

  const isAdminOrMod = session?.user?.isAdmin || session?.user?.isModerator || session?.user?.isOwner;
  const dateFilter = { gte: new Date(new Date().setDate(new Date().getDate() - 7)) };

  let whereClause;
  if (isAdminOrMod) {
    // Admins/mods see everything
    whereClause = { date: dateFilter };
  } else if (session?.user?.id) {
    // Regular users: public scheduled/cancelled + own public pending/rejected + invite-only where creator or invited
    whereClause = {
      date: dateFilter,
      OR: [
        { visibility: "public", status: { in: ["scheduled", "cancelled"] } },
        { visibility: "public", status: { in: ["pending", "rejected"] }, createdById: session.user.id },
        {
          visibility: "invite_only",
          OR: [
            { createdById: session.user.id },
            { invites: { some: { userId: session.user.id } } },
          ],
        },
      ],
    };
  } else {
    // Unauthenticated: public scheduled/cancelled only
    whereClause = {
      date: dateFilter,
      visibility: "public",
      status: { in: ["scheduled", "cancelled"] },
    };
  }

  const gameNights = await prisma.gameNight.findMany({
    where: whereClause,
    include: {
      createdBy: { select: { name: true, gamertag: true } },
      host: { select: { name: true, gamertag: true } },
      attendees: {
        include: {
          user: { select: { name: true, gamertag: true } },
        },
      },
      invites: {
        include: {
          user: { select: { name: true, gamertag: true } },
        },
      },
    },
    orderBy: { date: "asc" },
  });

  const serialized = gameNights.map((gn) => ({
    ...gn,
    date: gn.date.toISOString(),
    timezone: gn.timezone || DEFAULT_TIMEZONE,
    createdBy: gn.createdBy,
    createdAt: undefined,
    updatedAt: undefined,
  }));

  // Fetch tournaments
  const tournaments = await prisma.tournament.findMany({
    include: {
      createdBy: { select: { name: true, gamertag: true } },
      entrants: {
        select: {
          id: true,
          type: true,
          userId: true,
          teamId: true,
          displayName: true,
          seed: true,
        },
      },
      teams: {
        include: {
          captain: { select: { name: true, gamertag: true } },
          members: {
            include: {
              user: { select: { name: true, gamertag: true } },
            },
          },
        },
      },
      matches: {
        include: {
          entrant1: { select: { id: true, displayName: true, seed: true } },
          entrant2: { select: { id: true, displayName: true, seed: true } },
          winner: { select: { id: true, displayName: true } },
        },
        orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
      },
      sessions: {
        orderBy: { orderIndex: "asc" },
      },
      predictions: {
        select: {
          id: true,
          matchId: true,
          userId: true,
          predictedWinnerId: true,
          correct: true,
        },
      },
      comments: {
        include: {
          user: { select: { name: true, gamertag: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serializedTournaments = tournaments.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: undefined as undefined,
    sessions: t.sessions.map((s) => ({
      ...s,
      date: s.date.toISOString(),
    })),
    matches: t.matches.map((m) => ({
      ...m,
      createdAt: undefined as undefined,
      updatedAt: undefined as undefined,
    })),
    comments: t.comments.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
    })),
  }));

  // Fetch members + groups for authenticated users (for invite picker)
  let members: { id: string; name: string; gamertag: string | null; avatar: string | null }[] = [];
  let groups: { id: string; name: string; memberIds: string[] }[] = [];

  if (session?.user?.id) {
    const [fetchedMembers, fetchedGroups] = await Promise.all([
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
    members = fetchedMembers;
    groups = fetchedGroups.map((g) => ({
      id: g.id,
      name: g.name,
      memberIds: g.members.map((m) => m.userId),
    }));
  }

  // Fetch team tags for displaying [TAG] next to player names
  const teamMembers = await prisma.teamMember.findMany({
    where: { team: { isActive: true } },
    select: {
      userId: true,
      team: { select: { id: true, tag: true, game: true, name: true } },
    },
  });

  const teamTagMap: TeamTagMap = {};
  for (const tm of teamMembers) {
    if (!teamTagMap[tm.userId]) teamTagMap[tm.userId] = [];
    teamTagMap[tm.userId].push({
      tag: tm.team.tag,
      game: tm.team.game,
      teamId: tm.team.id,
      teamName: tm.team.name,
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {showProfileBanner && <ProfileBanner />}
      <h1 className="mb-2 text-3xl font-bold text-foreground">Schedule</h1>
      <p className="mb-6 text-foreground/50">
        Upcoming game nights and events
      </p>

      {session?.user?.id && <InfoBubble />}

      <ScheduleView
        gameNights={serialized}
        tournaments={serializedTournaments}
        userId={session?.user?.id}
        isAdmin={session?.user?.isAdmin}
        isModerator={session?.user?.isModerator}
        isOwner={session?.user?.isOwner}
        members={members}
        groups={groups}
        initialTournamentId={params.tournament}
        teamTagMap={teamTagMap}
        userTimezone={session?.user?.timezone || DEFAULT_TIMEZONE}
      />
    </div>
  );
}
