"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "@/components/ui/Button";
import { createSuggestion, deleteSuggestion } from "@/app/suggestions/actions";
import { SUGGESTION_STATUS_CONFIG, SUGGESTION_TYPE_CONFIG, SUGGESTION_LIMITS } from "@/lib/suggestion-constants";
import type { SuggestionStatus, SuggestionType } from "@/lib/suggestion-constants";

interface MySuggestion {
  id: string;
  type: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: string;
}

interface Props {
  mySuggestions: MySuggestion[];
  isMuted: boolean;
}

export default function FeedbackBox({ mySuggestions, isMuted }: Props) {
  const [suggestions, setSuggestions] = useState(mySuggestions);
  const [type, setType] = useState<SuggestionType>("suggestion");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setError("");
    setSuccess("");
    setLoading(true);

    const result = await createSuggestion(title.trim(), description.trim() || undefined, type);

    if (result.error) {
      setError(result.error);
    } else {
      const typeConfig = SUGGESTION_TYPE_CONFIG[type];
      setSuccess(`${typeConfig.label} submitted!`);
      setSuggestions((prev) => [
        {
          id: Date.now().toString(),
          type,
          title: title.trim(),
          description: description.trim() || null,
          status: "open",
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setTitle("");
      setDescription("");
      setTimeout(() => setSuccess(""), 3000);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const result = await deleteSuggestion(id);
    if (!result.error) {
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
    }
    setDeletingId(null);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-5">
      {isMuted ? (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          You are currently muted and cannot submit feedback.
        </div>
      ) : (
        <div className="space-y-3">
          {/* Type selector */}
          <div className="flex gap-2">
            {(["suggestion", "bug_report"] as const).map((t) => {
              const config = SUGGESTION_TYPE_CONFIG[t];
              const isActive = type === t;
              return (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "border-neon bg-neon/10 text-neon"
                      : "border-border bg-background text-foreground/50 hover:border-border-light hover:text-foreground/70"
                  }`}
                >
                  <span className="mr-1.5">{config.icon}</span>
                  {config.label}
                </button>
              );
            })}
          </div>

          <div>
            <input
              type="text"
              placeholder={type === "bug_report" ? "What's the bug?" : "Suggestion title..."}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={SUGGESTION_LIMITS.TITLE_MAX}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-foreground/30 outline-none transition focus:border-neon"
            />
          </div>
          <div>
            <textarea
              placeholder={type === "bug_report" ? "Steps to reproduce, what you expected..." : "Optional details..."}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={SUGGESTION_LIMITS.DESCRIPTION_MAX}
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-foreground/30 outline-none transition focus:border-neon resize-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              disabled={loading || title.trim().length < SUGGESTION_LIMITS.TITLE_MIN}
              onClick={handleSubmit}
            >
              {loading ? "Submitting..." : `Submit ${SUGGESTION_TYPE_CONFIG[type].label}`}
            </Button>
            <AnimatePresence>
              {error && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-danger"
                >
                  {error}
                </motion.span>
              )}
              {success && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-neon"
                >
                  {success}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Recent submissions list */}
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-foreground/40 uppercase tracking-wide">
            Your recent submissions
          </p>
          {suggestions.map((s) => {
            const statusConfig = SUGGESTION_STATUS_CONFIG[s.status as SuggestionStatus];
            const typeConfig = SUGGESTION_TYPE_CONFIG[(s.type || "suggestion") as SuggestionType];
            return (
              <div
                key={s.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background/50 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {typeConfig && (
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${typeConfig.color}`}
                      >
                        {typeConfig.icon} {typeConfig.label}
                      </span>
                    )}
                    <p className="text-sm font-medium text-foreground truncate">
                      {s.title}
                    </p>
                    {statusConfig && (
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusConfig.color}`}
                      >
                        {statusConfig.label}
                      </span>
                    )}
                  </div>
                  {s.description && (
                    <p className="mt-0.5 text-xs text-foreground/40 line-clamp-1">
                      {s.description}
                    </p>
                  )}
                  <p className="mt-0.5 text-[10px] text-foreground/30">
                    {timeAgo(s.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(s.id)}
                  disabled={deletingId === s.id}
                  className="shrink-0 text-xs text-foreground/30 transition hover:text-danger disabled:opacity-50"
                  title="Delete"
                >
                  {deletingId === s.id ? "..." : "×"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
