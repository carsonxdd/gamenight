"use client";

import { useState } from "react";
import PollCard from "./PollCard";
import CreatePollModal from "./CreatePollModal";
import Button from "@/components/ui/Button";

export interface PollData {
  id: string;
  title: string;
  description: string | null;
  game: string | null;
  multiSelect: boolean;
  status: string;
  pinned: boolean;
  createdById: string;
  createdBy: { name: string; gamertag: string | null; avatar: string | null };
  createdAt: string;
  closedAt: string | null;
  options: { id: string; label: string; voteCount: number }[];
  totalVotes: number;
  userVotes: string[];
  comments: {
    id: string;
    text: string;
    userId: string;
    user: { id: string; name: string; gamertag: string | null; avatar: string | null };
    createdAt: string;
  }[];
}

interface Props {
  polls: PollData[];
  userId?: string;
  isAdmin?: boolean;
}

export default function PollList({ polls, userId, isAdmin }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "closed">("all");

  const filtered = polls.filter((p) => {
    if (filter === "active") return p.status === "active";
    if (filter === "closed") return p.status === "closed";
    return true;
  });

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-lg border border-border bg-surface p-1">
          {(["all", "active", "closed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-4 py-1.5 text-sm capitalize transition ${
                filter === f
                  ? "bg-neon/10 text-neon"
                  : "text-foreground/50 hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {userId && (
          <Button onClick={() => setShowCreate(true)} size="sm">
            + New Poll
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center text-foreground/50">
          {filter === "all"
            ? "No polls yet. Be the first to create one!"
            : `No ${filter} polls.`}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              userId={userId}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      {userId && (
        <CreatePollModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
