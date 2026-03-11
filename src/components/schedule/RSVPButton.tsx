"use client";

import { useState } from "react";
import { updateRSVP } from "@/app/schedule/actions";

const statuses = [
  { value: "confirmed", label: "Going", color: "bg-neon/20 text-neon border-neon/40" },
  { value: "maybe", label: "Maybe", color: "bg-warning/20 text-warning border-warning/40" },
  { value: "declined", label: "Can't", color: "bg-danger/20 text-danger border-danger/40" },
] as const;

interface RSVPButtonProps {
  gameNightId: string;
  currentStatus?: string;
  onStatusChange?: (newStatus: string) => void;
}

export default function RSVPButton({ gameNightId, currentStatus, onStatusChange }: RSVPButtonProps) {
  const [loading, setLoading] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useState<string | undefined>(undefined);

  const displayStatus = optimisticStatus ?? currentStatus;

  const handleRSVP = async (status: string) => {
    setOptimisticStatus(status);
    onStatusChange?.(status);
    setLoading(true);
    await updateRSVP(gameNightId, status);
    setLoading(false);
  };

  return (
    <div className="flex gap-1.5">
      {statuses.map((s) => (
        <button
          key={s.value}
          onClick={() => handleRSVP(s.value)}
          disabled={loading}
          className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
            displayStatus === s.value
              ? s.color
              : "border-border text-foreground/50 hover:border-border-light"
          } disabled:opacity-50`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
