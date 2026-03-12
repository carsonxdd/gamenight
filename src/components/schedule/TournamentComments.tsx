"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Button from "@/components/ui/Button";
import { addTournamentComment } from "@/app/schedule/tournament-actions";
import { TOURNAMENT_LIMITS } from "@/lib/tournament-constants";
import { isUserMuted } from "@/lib/mute-utils";

interface Comment {
  id: string;
  text: string;
  userId: string;
  user: { name: string; gamertag: string | null };
  createdAt: string;
}

interface Props {
  tournamentId: string;
  comments: Comment[];
  userId?: string;
  isMuted?: boolean;
}

export default function TournamentComments({
  tournamentId,
  comments,
  userId,
  isMuted: isMutedProp,
}: Props) {
  const { data: session } = useSession();
  const muted = isMutedProp ?? (session?.user ? isUserMuted({ isMuted: session.user.isMuted, mutedUntil: session.user.mutedUntil }) : false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setError("");
    const result = await addTournamentComment(tournamentId, text);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setText("");
    }
  };

  return (
    <div>
      {/* Comment list */}
      <div className="mb-4 max-h-60 space-y-2 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="py-4 text-center text-sm text-foreground/40">
            No comments yet. Start the discussion!
          </p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="rounded-lg border border-border bg-surface p-3">
              <div className="flex items-center gap-2 text-xs text-foreground/40">
                <span className="font-medium text-foreground/60">
                  {c.user.gamertag || c.user.name}
                </span>
                <span>
                  {new Date(c.createdAt).toLocaleDateString()} {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="mt-1 text-sm text-foreground/70">{c.text}</p>
            </div>
          ))
        )}
      </div>

      {/* Comment input */}
      {userId ? (
        muted ? (
          <p className="text-center text-sm text-foreground/40">
            You are currently muted.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a comment..."
              maxLength={TOURNAMENT_LIMITS.COMMENT_MAX}
              className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-neon focus:outline-none"
            />
            <Button type="submit" size="sm" disabled={loading || !text.trim()}>
              {loading ? "..." : "Send"}
            </Button>
          </form>
        )
      ) : (
        <p className="text-center text-sm text-foreground/40">
          Sign in to join the discussion.
        </p>
      )}
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}
