"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { formatTime } from "@/lib/constants";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface Attendee {
  status: string;
  userName: string;
}

interface GameNightData {
  id: string;
  title?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  game: string;
  status: string;
  attendees: Attendee[];
}

interface Props {
  gameNights: GameNightData[];
}

const statusColors: Record<string, "neon" | "warning" | "danger"> = {
  confirmed: "neon",
  maybe: "warning",
  declined: "danger",
};

export default function RSVPOverview({ gameNights }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (gameNights.length === 0) {
    return (
      <Card>
        <p className="text-center text-foreground/50">No game nights yet.</p>
      </Card>
    );
  }

  return (
    <motion.div
      {...staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-3"
    >
      {gameNights.map((gn) => {
        const grouped: Record<string, string[]> = {
          confirmed: [],
          maybe: [],
          declined: [],
        };
        for (const a of gn.attendees) {
          if (grouped[a.status]) grouped[a.status].push(a.userName);
        }
        const isExpanded = expandedId === gn.id;
        const dateStr = new Date(gn.date).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });

        return (
          <motion.div key={gn.id} {...staggerItem}>
            <Card>
              <button
                onClick={() => setExpandedId(isExpanded ? null : gn.id)}
                className="w-full text-left"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-sm font-semibold text-foreground">
                      {gn.title || gn.game}
                    </span>
                    {gn.title && (
                      <span className="ml-1 text-xs text-foreground/40">{gn.game}</span>
                    )}
                    {gn.status === "cancelled" && (
                      <Badge variant="danger">Cancelled</Badge>
                    )}
                    <p className="text-xs text-foreground/50">
                      {dateStr} &middot; {formatTime(gn.startTime)} -{" "}
                      {formatTime(gn.endTime)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {Object.entries(grouped).map(
                      ([status, names]) =>
                        names.length > 0 && (
                          <Badge key={status} variant={statusColors[status]}>
                            {names.length} {status}
                          </Badge>
                        )
                    )}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="mt-3 space-y-2 border-t border-border pt-3"
                >
                  {Object.entries(grouped).map(
                    ([status, names]) =>
                      names.length > 0 && (
                        <div key={status}>
                          <p className="mb-1 text-xs font-medium capitalize text-foreground/60">
                            {status}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {names.map((name) => (
                              <span
                                key={name}
                                className={`rounded-full border px-2.5 py-0.5 text-xs ${
                                  status === "confirmed"
                                    ? "border-neon/30 bg-neon/10 text-neon"
                                    : status === "maybe"
                                      ? "border-warning/30 bg-warning/10 text-warning"
                                      : "border-danger/30 bg-danger/10 text-danger"
                                }`}
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )
                  )}
                  {gn.attendees.length === 0 && (
                    <p className="text-xs text-foreground/40">
                      No RSVPs yet
                    </p>
                  )}
                </motion.div>
              )}
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
