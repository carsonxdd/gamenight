"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { respondToInvite } from "@/app/teams/actions";

interface InviteData {
  id: string;
  team: { id: string; name: string; tag: string; game: string };
  invitedBy: { id: string; name: string; gamertag: string | null };
  createdAt: string;
}

export default function PendingInvites({ invites }: { invites: InviteData[] }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<string[]>([]);

  const handleRespond = async (inviteId: string, accept: boolean) => {
    setLoading(inviteId);
    const result = await respondToInvite(inviteId, accept);
    setLoading(null);
    if (result.success) {
      setDismissed((prev) => [...prev, inviteId]);
    }
  };

  const visible = invites.filter((inv) => !dismissed.includes(inv.id));
  if (visible.length === 0) return null;

  return (
    <div className="rounded-xl border border-neon/30 bg-neon/5 p-4">
      <h3 className="mb-3 text-sm font-semibold text-neon">
        Pending Invites ({visible.length})
      </h3>
      <div className="flex flex-col gap-3">
        {visible.map((inv) => (
          <div key={inv.id} className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-foreground">
                <span className="font-medium">[{inv.team.tag}] {inv.team.name}</span>
                <span className="text-foreground/40"> — {inv.team.game}</span>
              </p>
              <p className="text-xs text-foreground/40">
                Invited by {inv.invitedBy.gamertag || inv.invitedBy.name}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                onClick={() => handleRespond(inv.id, true)}
                disabled={loading === inv.id}
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleRespond(inv.id, false)}
                disabled={loading === inv.id}
              >
                Decline
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
