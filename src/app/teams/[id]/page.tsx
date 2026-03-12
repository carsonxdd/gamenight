import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import TeamDetail from "@/components/teams/TeamDetail";
import { getSiteSettings } from "@/app/admin/settings-actions";
import { checkAccessOrRedirect } from "@/lib/access-guard";

export const dynamic = "force-dynamic";

export default async function TeamDetailPage({ params }: { params: { id: string } }) {
  const settings = await getSiteSettings();
  if (!settings.enableTeams) redirect("/");

  const session = await checkAccessOrRedirect();

  if (!session?.user?.id) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <h1 className="mb-4 text-3xl font-bold text-foreground">Team</h1>
        <p className="mb-6 text-foreground/50">Sign in to view this team.</p>
        <a
          href="/signup"
          className="inline-block rounded bg-neon px-6 py-2.5 font-semibold text-background transition hover:bg-neon-dim"
        >
          Sign In
        </a>
      </div>
    );
  }

  const { id } = await params;

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      captain: { select: { id: true, name: true, gamertag: true, avatar: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, gamertag: true, avatar: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
      tournamentTeams: {
        include: {
          tournament: {
            select: { id: true, title: true, status: true },
          },
        },
      },
    },
  });

  if (!team) notFound();

  // Calculate win/loss from tournament matches where this persistent team played
  const tournamentTeamIds = team.tournamentTeams.map((tt) => tt.id);

  let wins = 0;
  let losses = 0;

  if (tournamentTeamIds.length > 0) {
    // Get entrant IDs for this persistent team's tournament teams
    const entrants = await prisma.tournamentEntrant.findMany({
      where: { teamId: { in: tournamentTeamIds } },
      select: { id: true },
    });
    const entrantIds = entrants.map((e) => e.id);

    if (entrantIds.length > 0) {
      wins = await prisma.tournamentMatch.count({
        where: {
          status: "completed",
          winnerEntrantId: { in: entrantIds },
        },
      });

      const totalMatches = await prisma.tournamentMatch.count({
        where: {
          status: "completed",
          OR: [
            { entrant1Id: { in: entrantIds } },
            { entrant2Id: { in: entrantIds } },
          ],
        },
      });

      losses = totalMatches - wins;
    }
  }

  const tournamentHistory = team.tournamentTeams.map((tt) => ({
    id: tt.tournament.id,
    title: tt.tournament.title,
    status: tt.tournament.status,
    placement: null as string | null,
  }));

  // Fetch all community members for invite modal
  const allMembers = await prisma.user.findMany({
    where: { gamertag: { not: null } },
    select: { id: true, name: true, gamertag: true, avatar: true },
    orderBy: { name: "asc" },
  });

  const serializedTeam = {
    id: team.id,
    name: team.name,
    tag: team.tag,
    game: team.game,
    bio: team.bio,
    avatarUrl: team.avatarUrl,
    isActive: team.isActive,
    minSize: team.minSize,
    maxSize: team.maxSize,
    captainId: team.captainId,
    captain: team.captain,
    members: team.members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
      user: m.user,
    })),
    tournamentHistory,
    wins,
    losses,
    createdAt: team.createdAt.toISOString(),
  };

  return (
    <TeamDetail
      team={serializedTeam}
      userId={session.user.id}
      isAdmin={session.user.isAdmin || session.user.isModerator || session.user.isOwner}
      allMembers={allMembers}
    />
  );
}
