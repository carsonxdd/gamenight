import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PollList from "@/components/polls/PollList";

export default async function PollsPage() {
  const session = await getServerSession(authOptions);

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
