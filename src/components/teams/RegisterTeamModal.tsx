"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import {
  registerPersistentTeam,
  getOpenTournamentsForGame,
} from "@/app/schedule/tournament-actions";

interface TournamentOption {
  id: string;
  title: string;
  status: string;
  maxSlots: number;
  teamSize: number | null;
  bracketType: string;
  currentTeamCount: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  teamId: string;
  teamGame: string;
  teamName: string;
  teamTag: string;
  memberCount: number;
}

export default function RegisterTeamModal({
  open,
  onClose,
  teamId,
  teamGame,
  teamName,
  teamTag,
  memberCount,
}: Props) {
  const [tournaments, setTournaments] = useState<TournamentOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    requestAnimationFrame(() => {
      if (cancelled) return;
      setFetching(true);
      setError("");
      setSelectedId(null);
      getOpenTournamentsForGame(teamGame).then((result) => {
        if (!cancelled) {
          setTournaments(result);
          setFetching(false);
        }
      });
    });
    return () => { cancelled = true; };
  }, [open, teamGame]);

  const handleRegister = async () => {
    if (!selectedId) return;
    setLoading(true);
    setError("");

    const result = await registerPersistentTeam(selectedId, teamId);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    onClose();
  };

  const selected = tournaments.find((t) => t.id === selectedId);

  return (
    <Modal open={open} onClose={onClose} title="Register for Tournament">
      <p className="mb-4 text-sm text-foreground/50">
        Register <span className="font-mono text-neon">[{teamTag}] {teamName}</span> for
        an open {teamGame} tournament.
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      {fetching ? (
        <p className="py-8 text-center text-sm text-foreground/40">Loading tournaments...</p>
      ) : tournaments.length === 0 ? (
        <p className="py-8 text-center text-sm text-foreground/40">
          No open team tournaments for {teamGame} right now.
        </p>
      ) : (
        <div className="max-h-64 overflow-y-auto space-y-2">
          {tournaments.map((t) => {
            const isFull = t.currentTeamCount >= t.maxSlots;
            const tooSmall = t.teamSize != null && memberCount < t.teamSize;

            return (
              <button
                key={t.id}
                type="button"
                disabled={isFull || tooSmall}
                onClick={() => setSelectedId(t.id)}
                className={`w-full rounded-lg border p-3 text-left transition ${
                  selectedId === t.id
                    ? "border-neon bg-neon/10"
                    : isFull || tooSmall
                      ? "border-border/50 bg-surface/50 opacity-50 cursor-not-allowed"
                      : "border-border bg-surface hover:border-border-light"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{t.title}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-foreground/40">
                      {t.currentTeamCount}/{t.maxSlots} teams
                    </span>
                    <Badge variant={t.status === "open" ? "neon" : "neutral"}>
                      {t.status}
                    </Badge>
                  </div>
                </div>
                {t.teamSize && (
                  <p className="mt-1 text-xs text-foreground/40">
                    {t.teamSize}v{t.teamSize} &middot; {t.bracketType.replace("_", " ")}
                    {tooSmall && (
                      <span className="text-danger ml-2">
                        (need {t.teamSize} members, you have {memberCount})
                      </span>
                    )}
                  </p>
                )}
                {isFull && (
                  <p className="mt-1 text-xs text-danger">Full</p>
                )}
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="mt-4 rounded-lg border border-border bg-background p-3 text-sm">
          <p className="text-foreground/60">
            Registering <span className="text-neon font-mono">[{teamTag}]</span> for{" "}
            <span className="font-medium text-foreground">{selected.title}</span>
          </p>
          <p className="mt-1 text-xs text-foreground/40">
            Your current roster will be snapshotted. Roster changes after registration won&apos;t affect the tournament.
          </p>
        </div>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleRegister} disabled={!selectedId || loading}>
          {loading ? "Registering..." : "Register Team"}
        </Button>
      </div>
    </Modal>
  );
}
