"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { GAMES, TIME_SLOTS, formatTime, DAYS_OF_WEEK } from "@/lib/constants";
import { updateGameNight, deleteGameNight } from "@/app/schedule/actions";
import { GameNightWithAttendees } from "./ScheduleView";

interface Props {
  open: boolean;
  onClose: () => void;
  gameNight: GameNightWithAttendees;
}

export default function EditGameNightModal({ open, onClose, gameNight }: Props) {
  const gnDate = new Date(gameNight.date);
  const dateStr = `${gnDate.getFullYear()}-${String(gnDate.getMonth() + 1).padStart(2, "0")}-${String(gnDate.getDate()).padStart(2, "0")}`;

  const [title, setTitle] = useState(gameNight.title || "");
  const [date, setDate] = useState(dateStr);
  const [startTime, setStartTime] = useState(gameNight.startTime);
  const [endTime, setEndTime] = useState(gameNight.endTime);
  const [game, setGame] = useState(gameNight.game);
  const [status, setStatus] = useState(gameNight.status);
  const [isRecurring, setIsRecurring] = useState(gameNight.isRecurring);
  const [recurDay, setRecurDay] = useState(gnDate.getDay());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      setError("Date is required");
      return;
    }
    setLoading(true);
    setError("");
    const result = await updateGameNight(gameNight.id, {
      title: title.trim() || undefined,
      date,
      startTime,
      endTime,
      game,
      status,
      isRecurring,
      recurDay: isRecurring ? recurDay : undefined,
    });
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setLoading(true);
    const result = await deleteGameNight(gameNight.id);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Game Night">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-foreground/70">Title (optional)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Friday Night Valorant"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground placeholder:text-foreground/30 focus:border-neon focus:outline-none"
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

        <div>
          <label className="mb-1 block text-sm text-foreground/70">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-neon focus:outline-none"
          >
            <option value="scheduled">Scheduled</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

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
              value={recurDay}
              onChange={(e) => setRecurDay(Number(e.target.value))}
              className="rounded border border-border bg-surface px-2 py-1 text-sm text-foreground focus:border-neon focus:outline-none"
            >
              {DAYS_OF_WEEK.map((d, i) => (
                <option key={i} value={i}>{d}</option>
              ))}
            </select>
          )}
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? "Saving..." : "Save Changes"}
          </Button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              confirmDelete
                ? "bg-danger text-white hover:bg-danger/80"
                : "border border-danger/30 text-danger hover:bg-danger/10"
            }`}
          >
            {confirmDelete ? "Confirm Delete" : "Delete"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
