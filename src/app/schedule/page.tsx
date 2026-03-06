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
      <p className="mb-8 text-foreground/50">
        Upcoming game nights and events
      </p>
      <ScheduleView
        gameNights={serialized}
        userId={session?.user?.id}
        isAdmin={session?.user?.isAdmin}
      />
    </div>
  );
}
