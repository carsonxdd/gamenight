"use client";

import { useState } from "react";
import { addComment, deleteComment } from "@/app/polls/actions";
import { POLL_LIMITS } from "@/lib/constants";

interface Comment {
  id: string;
  text: string;
  userId: string;
  user: { id: string; name: string; gamertag: string | null; avatar: string | null };
  createdAt: string;
}

interface Props {
  pollId: string;
  comments: Comment[];
  userId?: string;
  isAdmin?: boolean;
}

export default function PollComments({ pollId, comments, userId, isAdmin }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const PREVIEW_COUNT = 3;
  const visibleComments = expanded ? comments : comments.slice(0, PREVIEW_COUNT);
  const hasMore = comments.length > PREVIEW_COUNT;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    setError("");
    const result = await addComment(pollId, text);
    setSubmitting(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setText("");
    }
  };

  const handleDelete = async (commentId: string) => {
    const result = await deleteComment(commentId);
    if (result?.error) setError(result.error);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
      " " +
      d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  return (
    <div className="mt-3 border-t border-border pt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="mb-2 text-xs font-medium text-foreground/50 transition hover:text-foreground"
      >
        {comments.length === 0
          ? "Comments"
          : `${comments.length} comment${comments.length === 1 ? "" : "s"}`}
        {hasMore && !expanded && ` (show all)`}
        {expanded && hasMore && ` (show less)`}
      </button>

      {visibleComments.length > 0 && (
        <div className="space-y-2 mb-2">
          {visibleComments.map((c) => (
            <div key={c.id} className="flex items-start gap-2 group">
              {c.user.avatar ? (
                <img
                  src={c.user.avatar}
                  alt=""
                  className="mt-0.5 h-5 w-5 rounded-full shrink-0"
                />
              ) : (
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-light text-[10px] font-bold text-foreground/50">
                  {(c.user.gamertag || c.user.name).charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">
                  <span className="font-medium text-foreground/80">
                    {c.user.gamertag || c.user.name}
                  </span>{" "}
                  {c.text}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-foreground/30">{formatTime(c.createdAt)}</span>
                  {(c.userId === userId || isAdmin) && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-[10px] text-foreground/30 opacity-0 transition group-hover:opacity-100 hover:text-danger"
                    >
                      delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mb-2 text-xs text-neon/70 hover:text-neon"
        >
          Show {comments.length - PREVIEW_COUNT} more...
        </button>
      )}

      {/* Add comment form */}
      {userId && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment..."
            maxLength={POLL_LIMITS.COMMENT_MAX}
            className="flex-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground placeholder:text-foreground/30 focus:border-neon focus:outline-none"
          />
          <button
            type="submit"
            disabled={submitting || !text.trim()}
            className="shrink-0 rounded-lg bg-neon/10 px-3 py-1.5 text-sm font-medium text-neon transition hover:bg-neon/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "..." : "Post"}
          </button>
        </form>
      )}

      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
