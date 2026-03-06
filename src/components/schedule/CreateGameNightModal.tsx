"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { GAMES, TIME_SLOTS, formatTime, INVITE_LIMITS } from "@/lib/constants";
import { createGameNight } from "@/app/schedule/actions";
import MemberPicker from "./MemberPicker";
import { InvitableMember, InviteGroupData } from "./ScheduleView";

interface Props {
  open: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  userId: string;
  members?: InvitableMember[];
  groups?: InviteGroupData[];
}

export default function CreateGameNightModal({ open, onClose, isAdmin, userId, members = [], groups = [] }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("19:00");
  const [endTime, setEndTime] = useState("23:00");
  const [game, setGame] = useState<string>(GAMES[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurWeeks, setRecurWeeks] = useState(4);
  const [visibility, setVisibility] = useState<"public" | "invite_only">("public");
  const [inviteeIds, setInviteeIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isInviteOnly = visibility === "invite_only";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      setError("Date is required");
      return;
    }

    // Client-side validation
    const selectedDate = new Date(date + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!isAdmin && selectedDate < today) {
      setError("Cannot create events in the past");
      return;
    }

    if (isInviteOnly && inviteeIds.length === 0) {
      setError("Select at least one person to invite");
      return;
    }

    setLoading(true);
    setError("");
    const recurDay = selectedDate.getDay();
    const result = await createGameNight({
      title: title.trim() || undefined,
      description: description.trim() || undefined,
      date,
      startTime,
      endTime,
      game,
      isRecurring: isInviteOnly ? false : isRecurring,
      recurDay: isRecurring && !isInviteOnly ? recurDay : undefined,
      recurWeeks: isRecurring && !isInviteOnly ? recurWeeks : undefined,
      visibility,
      inviteeIds: isInviteOnly ? inviteeIds : undefined,
    });
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      onClose();
      setTitle("");
      setDescription("");
      setDate("");
      setVisibility("public");
      setInviteeIds([]);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Game Night">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Visibility toggle */}
        <div className="flex rounded-lg border border-border bg-surface p-1">
          <button
            type="button"
            onClick={() => setVisibility("public")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              !isInviteOnly
                ? "bg-neon/10 text-neon"
                : "text-foreground/50 hover:text-foreground"
            }`}
          >
            Public
          </button>
          <button
            type="button"
            onClick={() => setVisibility("invite_only")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              isInviteOnly
                ? "bg-neon/10 text-neon"
                : "text-foreground/50 hover:text-foreground"
            }`}
          >
            Invite-Only
          </button>
        </div>

        <div>
          <label className="mb-1 block text-sm text-foreground/70">Title (optional)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Friday Night Valorant"
            maxLength={isAdmin ? undefined : INVITE_LIMITS.TITLE_MAX}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground placeholder:text-foreground/30 focus:border-neon focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-foreground/70">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's planned for this event?"
            rows={2}
            maxLength={isAdmin ? undefined : INVITE_LIMITS.DESCRIPTION_MAX}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground placeholder:text-foreground/30 focus:border-neon focus:outline-none resize-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-foreground/70">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-neon focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm text-foreground/70">Start</label>
            <select
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-neon focus:outline-none"
            >
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>{formatTime(t)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-foreground/70">End</label>
            <select
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-neon focus:outline-none"
            >
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>{formatTime(t)}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-foreground/70">Game</label>
          <select
            value={game}
            onChange={(e) => setGame(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-neon focus:outline-none"
          >
            {GAMES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {isAdmin && !isInviteOnly && (
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-foreground/70">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="rounded accent-neon"
              />
              Recurring weekly
            </label>
            {isRecurring && (
              <select
                value={recurWeeks}
                onChange={(e) => setRecurWeeks(Number(e.target.value))}
                className="rounded border border-border bg-surface px-2 py-1 text-sm text-foreground focus:border-neon focus:outline-none"
              >
                {Array.from({ length: 11 }, (_, i) => i + 2).map((n) => (
                  <option key={n} value={n}>{n} weeks</option>
                ))}
              </select>
            )}
          </div>
        )}

        {isInviteOnly && (
          <MemberPicker
            members={members}
            selected={inviteeIds}
            onChange={setInviteeIds}
            groups={groups}
          />
        )}

        {!isAdmin && !isInviteOnly && (
          <p className="text-sm text-foreground/50 rounded-lg bg-warning/10 border border-warning/20 px-3 py-2">
            Your event will need to be approved by a moderator before it goes live. Hang tight after submitting!
          </p>
        )}

        {isInviteOnly && (
          <p className="text-sm text-foreground/50 rounded-lg bg-neon/5 border border-neon/20 px-3 py-2">
            Invite-only events are auto-approved and only visible to you and your invitees.
          </p>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading
            ? "Submitting..."
            : isInviteOnly
              ? "Create Invite-Only Event"
              : isAdmin
                ? "Create Game Night"
                : "Submit for Approval"}
        </Button>
      </form>
    </Modal>
  );
}
