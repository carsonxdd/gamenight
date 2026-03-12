"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeIn } from "@/lib/animations";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { getAllSuggestions, updateSuggestionStatus, deleteSuggestion } from "@/app/suggestions/actions";
import { SUGGESTION_STATUSES, SUGGESTION_STATUS_CONFIG } from "@/lib/suggestion-constants";
import type { SuggestionStatus } from "@/lib/suggestion-constants";

interface SuggestionItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  userId: string;
  user: { id: string; name: string; gamertag: string | null; avatar: string | null };
  createdAt: string;
}

type SortMode = "newest" | "status";

export default function AdminSuggestions() {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    getAllSuggestions().then((data) => {
      setSuggestions(data);
      setLoading(false);
    });
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    const result = await updateSuggestionStatus(id, newStatus);
    if (!result.error) {
      setSuggestions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
      );
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteSuggestion(id);
    if (!result.error) {
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
    }
    setConfirmDeleteId(null);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  const sorted = [...suggestions].sort((a, b) => {
    if (sortMode === "status") {
      const statusOrder = SUGGESTION_STATUSES.indexOf(a.status as SuggestionStatus) -
        SUGGESTION_STATUSES.indexOf(b.status as SuggestionStatus);
      if (statusOrder !== 0) return statusOrder;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const openCount = suggestions.filter((s) => s.status === "open").length;

  if (loading) {
    return (
      <div className="py-12 text-center text-foreground/40">
        Loading suggestions...
      </div>
    );
  }

  return (
    <motion.div {...fadeIn} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-foreground">
            Suggestions
          </h3>
          {openCount > 0 && (
            <span className="rounded-full bg-neon/15 px-2.5 py-0.5 text-xs font-semibold text-neon">
              {openCount} open
            </span>
          )}
        </div>
        <div className="flex rounded-lg border border-border bg-background p-0.5">
          <button
            onClick={() => setSortMode("newest")}
            className={`rounded-md px-3 py-1 text-xs transition ${
              sortMode === "newest"
                ? "bg-neon/10 text-neon"
                : "text-foreground/40 hover:text-foreground"
            }`}
          >
            Newest
          </button>
          <button
            onClick={() => setSortMode("status")}
            className={`rounded-md px-3 py-1 text-xs transition ${
              sortMode === "status"
                ? "bg-neon/10 text-neon"
                : "text-foreground/40 hover:text-foreground"
            }`}
          >
            By Status
          </button>
        </div>
      </div>

      {/* List */}
      {sorted.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-foreground/40">No suggestions yet</p>
        </Card>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {sorted.map((s) => {
              const statusConfig = SUGGESTION_STATUS_CONFIG[s.status as SuggestionStatus];
              return (
                <motion.div
                  key={s.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <Card className="p-0">
                    <div className="flex items-start gap-3 p-4">
                      {/* Avatar */}
                      {s.user.avatar ? (
                        <img
                          src={s.user.avatar}
                          alt=""
                          className="mt-0.5 h-8 w-8 shrink-0 rounded-full"
                        />
                      ) : (
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neon/10 text-xs font-bold text-neon">
                          {(s.user.gamertag || s.user.name).charAt(0).toUpperCase()}
                        </div>
                      )}

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-foreground">
                            {s.title}
                          </p>
                          {statusConfig && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusConfig.color}`}
                            >
                              {statusConfig.label}
                            </span>
                          )}
                        </div>
                        {s.description && (
                          <p className="mt-1 text-xs text-foreground/50">
                            {s.description}
                          </p>
                        )}
                        <p className="mt-1 text-[10px] text-foreground/30">
                          {s.user.gamertag || s.user.name} &middot; {timeAgo(s.createdAt)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 items-center gap-2">
                        <select
                          value={s.status}
                          onChange={(e) => handleStatusChange(s.id, e.target.value)}
                          className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground outline-none transition focus:border-neon"
                        >
                          {SUGGESTION_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {SUGGESTION_STATUS_CONFIG[st].label}
                            </option>
                          ))}
                        </select>

                        {confirmDeleteId === s.id ? (
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleDelete(s.id)}
                            >
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(s.id)}
                            className="rounded p-1 text-foreground/30 transition hover:bg-danger/10 hover:text-danger"
                            title="Delete"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
