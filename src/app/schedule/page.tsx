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

  const gameNights = await prisma.gameNight.findMany({
    where: {
      date: { gte: new Date(new Date().setDate(new Date().getDate() - 7)) },
    },
    include: {
      attendees: {
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
    createdAt: undefined,
    updatedAt: undefined,
  }));

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
            <p className="font-semibold text-foreground">Want to suggest an event?</p>
            <p className="mt-1 text-sm text-foreground/60">
              Reach out to a <span className="font-medium text-red-400">moderator</span> if you have questions about upcoming events or want to suggest a new game night. Mods can create and manage events for the community.
            </p>
          </div>
        </div>
      </div>
      <ScheduleView
        gameNights={serialized}
        userId={session?.user?.id}
        isAdmin={session?.user?.isAdmin || session?.user?.isModerator}
      />
    </div>
  );
}
