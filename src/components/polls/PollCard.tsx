"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { votePoll, closePoll, deletePoll, togglePin } from "@/app/polls/actions";
import PollComments from "./PollComments";
import type { PollData } from "./PollList";

interface Props {
  poll: PollData;
  userId?: string;
  isAdmin?: boolean;
}

export default function PollCard({ poll, userId, isAdmin }: Props) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(poll.userVotes);
  const [voting, setVoting] = useState(false);
  const [closing, setClosing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const isActive = poll.status === "active";
  const isCreator = userId === poll.createdById;
  const canManage = isCreator || isAdmin;
  const hasVoted = poll.userVotes.length > 0;
  const showResults = hasVoted || !isActive;

  // For percentage calculation: use total individual votes for the bar widths
  const maxVotes = Math.max(...poll.options.map((o) => o.voteCount), 1);

  const toggleOption = (optionId: string) => {
    if (!isActive || !userId) return;
    if (poll.multiSelect) {
      setSelectedOptions((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const handleVote = async () => {
    if (selectedOptions.length === 0) return;
    setVoting(true);
    setError("");
    const result = await votePoll(poll.id, selectedOptions);
    setVoting(false);
    if (result?.error) setError(result.error);
  };

  const handleClose = async () => {
    setClosing(true);
    const result = await closePoll(poll.id);
    setClosing(false);
    if (result?.error) setError(result.error);
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    const result = await deletePoll(poll.id);
    setDeleting(false);
    if (result?.error) setError(result.error);
  };

  const handlePin = async () => {
    const result = await togglePin(poll.id);
    if (result?.error) setError(result.error);
  };

  const createdDate = new Date(poll.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div
      className={`rounded-xl border bg-surface p-5 ${
        poll.pinned
          ? "border-neon/40 shadow-[0_0_12px_rgba(57,255,20,0.08)]"
          : "border-border"
      }`}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {poll.pinned && (
              <span className="shrink-0 rounded bg-neon/10 px-2 py-0.5 text-xs font-medium text-neon">
                Pinned
              </span>
            )}
            {poll.game && (
              <span className="shrink-0 rounded bg-surface-light px-2 py-0.5 text-xs text-foreground/60">
                {poll.game}
              </span>
            )}
            {poll.multiSelect && (
              <span className="shrink-0 rounded bg-surface-light px-2 py-0.5 text-xs text-foreground/40">
                Multi-select
              </span>
            )}
            {!isActive && (
              <span className="shrink-0 rounded bg-foreground/10 px-2 py-0.5 text-xs text-foreground/40">
                Closed
              </span>
            )}
          </div>
          <h3 className="mt-1 text-lg font-semibold text-foreground">{poll.title}</h3>
          {poll.description && (
            <p className="mt-1 text-sm text-foreground/60">{poll.description}</p>
          )}
          <p className="mt-1 text-xs text-foreground/40">
            by {poll.createdBy.gamertag || poll.createdBy.name} &middot; {createdDate} &middot; {poll.totalVotes} {poll.totalVotes === 1 ? "voter" : "voters"}
          </p>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {poll.options.map((option) => {
          const isSelected = selectedOptions.includes(option.id);
          const pct = poll.totalVotes > 0 ? Math.round((option.voteCount / poll.totalVotes) * 100) : 0;
          const barWidth = maxVotes > 0 ? (option.voteCount / maxVotes) * 100 : 0;

          return (
            <button
              key={option.id}
              type="button"
              disabled={!isActive || !userId}
              onClick={() => toggleOption(option.id)}
              className={`relative w-full overflow-hidden rounded-lg border px-4 py-2.5 text-left text-sm transition ${
                isSelected
                  ? "border-neon/50 bg-neon/5"
                  : "border-border bg-surface hover:border-foreground/20"
              } ${!isActive || !userId ? "cursor-default" : "cursor-pointer"}`}
            >
              {/* Result bar (shown after voting or when closed) */}
              {showResults && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${barWidth}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className={`absolute inset-y-0 left-0 ${
                    isSelected ? "bg-neon/10" : "bg-foreground/5"
                  }`}
                />
              )}
              <div className="relative flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {isActive && userId && (
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded${
                        poll.multiSelect ? "" : "-full"
                      } border ${
                        isSelected
                          ? "border-neon bg-neon text-background"
                          : "border-foreground/30"
                      }`}
                    >
                      {isSelected && (
                        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
                          <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                  )}
                  <span className="text-foreground break-words">{option.label}</span>
                </div>
                {showResults && (
                  <span className="shrink-0 text-xs text-foreground/50">
                    {option.voteCount} ({pct}%)
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Vote button */}
      {isActive && userId && (
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={handleVote}
            disabled={voting || selectedOptions.length === 0}
            className="rounded-lg bg-neon px-4 py-1.5 text-sm font-semibold text-background transition hover:bg-neon-dim disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {voting ? "Voting..." : hasVoted ? "Update Vote" : "Vote"}
          </button>
          {hasVoted && (
            <span className="text-xs text-foreground/40">You voted</span>
          )}
        </div>
      )}

      {/* Management buttons */}
      {canManage && (
        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
          {isActive && (
            <button
              onClick={handleClose}
              disabled={closing}
              className="rounded border border-border px-3 py-1 text-xs text-foreground/60 transition hover:border-warning hover:text-warning"
            >
              {closing ? "Closing..." : "Close Poll"}
            </button>
          )}
          {isAdmin && (
            <button
              onClick={handlePin}
              className="rounded border border-border px-3 py-1 text-xs text-foreground/60 transition hover:border-neon hover:text-neon"
            >
              {poll.pinned ? "Unpin" : "Pin"}
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`rounded border px-3 py-1 text-xs transition ${
              confirmDelete
                ? "border-danger bg-danger/10 text-danger"
                : "border-border text-foreground/60 hover:border-danger hover:text-danger"
            }`}
          >
            {deleting ? "Deleting..." : confirmDelete ? "Confirm Delete" : "Delete"}
          </button>
          {confirmDelete && (
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs text-foreground/40 hover:text-foreground"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      {/* Comments */}
      <PollComments
        pollId={poll.id}
        comments={poll.comments}
        userId={userId}
        isAdmin={isAdmin}
      />
    </div>
  );
}
