import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TeamsPage from "@/components/teams/TeamsPage";
import { getSiteSettings } from "@/app/admin/settings-actions";
import { checkAccessOrRedirect } from "@/lib/access-guard";

export const dynamic = "force-dynamic";

export default async function TeamsRoute() {
  const settings = await getSiteSettings();
  if (!settings.enableTeams) redirect("/");

  const session = await checkAccessOrRedirect();

  if (!session?.user?.id) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <h1 className="mb-4 text-3xl font-bold text-foreground">Teams</h1>
        <p className="mb-6 text-foreground/50">Sign in to view teams.</p>
        <a
          href="/signup"
          className="inline-block rounded bg-neon px-6 py-2.5 font-semibold text-background transition hover:bg-neon-dim"
        >
          Sign In
        </a>
      </div>
    );
  }

  const teams = await prisma.team.findMany({
    where: { isActive: true },
    include: {
      captain: { select: { id: true, name: true, gamertag: true, avatar: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, gamertag: true, avatar: true } },
        },
      },
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const myTeams = await prisma.team.findMany({
    where: {
      isActive: true,
      members: { some: { userId: session.user.id } },
    },
    include: {
      captain: { select: { id: true, name: true, gamertag: true, avatar: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, gamertag: true, avatar: true } },
        },
      },
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const pendingInvites = await prisma.teamInvite.findMany({
    where: {
      invitedUserId: session.user.id,
      status: "pending",
    },
    include: {
      team: { select: { id: true, name: true, tag: true, game: true } },
      invitedBy: { select: { id: true, name: true, gamertag: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const activeInvites = pendingInvites.filter((inv) => {
    const expiry = new Date(inv.createdAt);
    expiry.setDate(expiry.getDate() + 7);
    return now <= expiry;
  });

  const serializedTeams = teams.map((t) => ({
    id: t.id,
    name: t.name,
    tag: t.tag,
    game: t.game,
    bio: t.bio,
    avatarUrl: t.avatarUrl,
    minSize: t.minSize,
    maxSize: t.maxSize,
    captainId: t.captainId,
    captain: t.captain,
    memberCount: t._count.members,
    members: t.members.map((m) => ({
      userId: m.userId,
      role: m.role,
      user: m.user,
    })),
    createdAt: t.createdAt.toISOString(),
  }));

  const serializedMyTeams = myTeams.map((t) => ({
    id: t.id,
    name: t.name,
    tag: t.tag,
    game: t.game,
    bio: t.bio,
    avatarUrl: t.avatarUrl,
    minSize: t.minSize,
    maxSize: t.maxSize,
    captainId: t.captainId,
    captain: t.captain,
    memberCount: t._count.members,
    members: t.members.map((m) => ({
      userId: m.userId,
      role: m.role,
      user: m.user,
    })),
    createdAt: t.createdAt.toISOString(),
  }));

  const serializedInvites = activeInvites.map((inv) => ({
    id: inv.id,
    team: inv.team,
    invitedBy: inv.invitedBy,
    createdAt: inv.createdAt.toISOString(),
  }));

  return (
    <TeamsPage
      teams={serializedTeams}
      myTeams={serializedMyTeams}
      pendingInvites={serializedInvites}
      userId={session.user.id}
      isAdmin={session.user.isAdmin || session.user.isModerator || session.user.isOwner}
    />
  );
}
