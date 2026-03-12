import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import PollList from "@/components/polls/PollList";
import { getSiteSettings } from "@/app/admin/settings-actions";
import { checkAccessOrRedirect } from "@/lib/access-guard";

export default async function PollsPage() {
  const settings = await getSiteSettings();
  if (!settings.enablePolls) redirect("/");

  const session = await checkAccessOrRedirect();

  if (!session?.user?.id) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <h1 className="mb-4 text-3xl font-bold text-foreground">Polls</h1>
        <p className="mb-6 text-foreground/50">Sign in to view and vote on polls.</p>
        <a
          href="/signup"
          className="inline-block rounded bg-neon px-6 py-2.5 font-semibold text-background transition hover:bg-neon-dim"
        >
          Sign In
        </a>
      </div>
    );
  }

  const polls = await prisma.poll.findMany({
    include: {
      createdBy: { select: { name: true, gamertag: true, avatar: true } },
      options: {
        include: {
          votes: { select: { userId: true } },
        },
      },
      votes: { select: { userId: true, optionId: true } },
      comments: {
        include: {
          user: { select: { id: true, name: true, gamertag: true, avatar: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });

  const serialized = polls.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    game: p.game,
    multiSelect: p.multiSelect,
    status: p.status,
    pinned: p.pinned,
    createdById: p.createdById,
    createdBy: p.createdBy,
    createdAt: p.createdAt.toISOString(),
    closedAt: p.closedAt?.toISOString() || null,
    options: p.options.map((o) => ({
      id: o.id,
      label: o.label,
      voteCount: o.votes.length,
    })),
    totalVotes: new Set(p.votes.map((v) => v.userId)).size,
    userVotes: session?.user?.id
      ? p.votes.filter((v) => v.userId === session.user.id).map((v) => v.optionId)
      : [],
    comments: p.comments.map((c) => ({
      id: c.id,
      text: c.text,
      userId: c.userId,
      user: c.user,
      createdAt: c.createdAt.toISOString(),
    })),
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold text-foreground">Polls</h1>
      <p className="mb-6 text-foreground/50">
        Vote on what we should play and plan next
      </p>
      <PollList
        polls={serialized}
        userId={session?.user?.id}
        isAdmin={session?.user?.isAdmin || session?.user?.isModerator}
      />
    </div>
  );
}
