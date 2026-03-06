import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ScheduleView from "@/components/schedule/ScheduleView";
import ProfileBanner from "@/components/ui/ProfileBanner";

export default async function SchedulePage() {
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

  const isAdminOrMod = session?.user?.isAdmin || session?.user?.isModerator;
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
    createdBy: gn.createdBy,
    createdAt: undefined,
    updatedAt: undefined,
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {showProfileBanner && <ProfileBanner />}
      <h1 className="mb-2 text-3xl font-bold text-foreground">Schedule</h1>
      <p className="mb-6 text-foreground/50">
        Upcoming game nights and events
      </p>

      {/* Info section */}
      <div className="mb-8 rounded-xl border border-border bg-surface p-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neon/10 text-neon">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-foreground">Want to create an event?</p>
            <p className="mt-1 text-sm text-foreground/60">
              {session?.user?.id
                ? <>Use the &quot;+ New Game Night&quot; button to submit a public event for moderator approval, or create an invite-only event for your friends. Reach out to a <span className="font-medium text-red-400">moderator</span> with questions.</>
                : <>Sign in to create your own event for approval, or reach out to a <span className="font-medium text-red-400">moderator</span> if you have questions about upcoming events.</>
              }
            </p>
          </div>
        </div>
      </div>
      <ScheduleView
        gameNights={serialized}
        userId={session?.user?.id}
        isAdmin={session?.user?.isAdmin || session?.user?.isModerator}
        members={members}
        groups={groups}
      />
    </div>
  );
}
