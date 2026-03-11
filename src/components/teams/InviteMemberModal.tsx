"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { inviteMember } from "@/app/teams/actions";

interface Props {
  open: boolean;
  onClose: () => void;
  teamId: string;
  teamGame: string;
  existingMemberIds: string[];
  allMembers: { id: string; name: string; gamertag: string | null; avatar: string | null }[];
}

export default function InviteMemberModal({
  open,
  onClose,
  teamId,
  teamGame,
  existingMemberIds,
  allMembers,
}: Props) {
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState<string | null>(null);
  const [sent, setSent] = useState<string[]>([]);
  const [error, setError] = useState("");

  const available = allMembers.filter(
    (m) => !existingMemberIds.includes(m.id) && !sent.includes(m.id)
  );

  const filtered = available.filter(
    (m) =>
      !search ||
      (m.gamertag || m.name).toLowerCase().includes(search.toLowerCase())
  );

  const handleInvite = async (userId: string) => {
    setError("");
    setSending(userId);
    const result = await inviteMember(teamId, userId);
    setSending(null);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSent((prev) => [...prev, userId]);
  };

  const handleClose = () => {
    setSearch("");
    setError("");
    setSent([]);
    setSending(null);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Invite Member">
      <p className="mb-4 text-sm text-foreground/50">
        Invite a player to join your {teamGame} team.
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search players..."
        className="mb-4 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:border-neon/50 focus:outline-none"
      />

      <div className="max-h-64 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="py-4 text-center text-sm text-foreground/40">No players found</p>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface p-3"
              >
                <div className="flex items-center gap-3">
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={member.gamertag || member.name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-lighter text-xs font-medium text-foreground/50">
                      {(member.gamertag || member.name).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium text-foreground">
                    {member.gamertag || member.name}
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleInvite(member.id)}
                  disabled={sending === member.id}
                >
                  {sending === member.id ? "Sending..." : "Invite"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {sent.length > 0 && (
        <p className="mt-3 text-xs text-neon">
          {sent.length} invite{sent.length !== 1 ? "s" : ""} sent
        </p>
      )}
    </Modal>
  );
}
