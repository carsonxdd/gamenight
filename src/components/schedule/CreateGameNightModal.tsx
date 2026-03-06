"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { GAMES, TIME_SLOTS, formatTime, DAYS_OF_WEEK } from "@/lib/constants";
import { createGameNight } from "@/app/schedule/actions";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CreateGameNightModal({ open, onClose }: Props) {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("19:00");
  const [endTime, setEndTime] = useState("23:00");
  const [game, setGame] = useState<string>(GAMES[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurDay, setRecurDay] = useState(5); // Friday
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      setError("Date is required");
      return;
    }
    setLoading(true);
    setError("");
    const result = await createGameNight({
      date,
      startTime,
      endTime,
      game,
      isRecurring,
      recurDay: isRecurring ? recurDay : undefined,
    });
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      onClose();
      setDate("");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Game Night">
      <form onSubmit={handleSubmit} className="space-y-4">
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

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating..." : "Create Game Night"}
        </Button>
      </form>
    </Modal>
  );
}
