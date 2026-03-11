"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { markAttendance } from "@/app/schedule/actions";
import { GameNightWithAttendees } from "./ScheduleView";
import { formatWithTag, type TeamTagMap } from "@/lib/team-utils";

interface Props {
  open: boolean;
  onClose: () => void;
  gameNight: GameNightWithAttendees;
  teamTagMap?: TeamTagMap;
}

export default function AttendanceModal({ open, onClose, gameNight, teamTagMap = {} }: Props) {
  const rsvps = gameNight.attendees.filter(
    (a) => a.status === "confirmed" || a.status === "maybe"
  );

  const [attendedIds, setAttendedIds] = useState<Set<string>>(() => {
    // Pre-check users already marked as attended, or all confirmed if first time
    if (gameNight.attendanceConfirmed) {
      return new Set(gameNight.attendees.filter((a) => a.attended).map((a) => a.userId));
    }
    return new Set(gameNight.attendees.filter((a) => a.status === "confirmed").map((a) => a.userId));
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggle(userId: string) {
    setAttendedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");
    const result = await markAttendance(gameNight.id, [...attendedIds]);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Mark Attendance">
      <div className="space-y-4">
        <p className="text-sm text-foreground/60">
          Check off who actually showed up to{" "}
          <span className="font-medium text-foreground">{gameNight.title || gameNight.game}</span>.
        </p>

        {rsvps.length === 0 ? (
          <p className="text-sm text-foreground/40">No RSVPs for this event.</p>
        ) : (
          <div className="space-y-2">
            {rsvps.map((a) => (
              <button
                key={a.userId}
                type="button"
                onClick={() => toggle(a.userId)}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${
                  attendedIds.has(a.userId)
                    ? "border-neon/40 bg-neon/5"
                    : "border-border bg-surface hover:border-border-light"
                }`}
              >
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
                    attendedIds.has(a.userId)
                      ? "border-neon bg-neon text-background"
                      : "border-foreground/30"
                  }`}
                >
                  {attendedIds.has(a.userId) && (
                    <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium text-foreground">
                  {formatWithTag(a.user.gamertag || a.user.name, a.userId, teamTagMap, gameNight.game)}
                </span>
                <span className={`ml-auto text-xs ${
                  a.status === "confirmed" ? "text-green-400" : "text-yellow-400"
                }`}>
                  {a.status === "confirmed" ? "Confirmed" : "Maybe"}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-foreground/40">
          <span>{attendedIds.size} marked as attended</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAttendedIds(new Set(rsvps.map((a) => a.userId)))}
              className="text-neon/70 hover:text-neon"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={() => setAttendedIds(new Set())}
              className="text-foreground/50 hover:text-foreground/70"
            >
              Clear
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? "Saving..." : gameNight.attendanceConfirmed ? "Update Attendance" : "Confirm Attendance"}
        </Button>
      </div>
    </Modal>
  );
}
