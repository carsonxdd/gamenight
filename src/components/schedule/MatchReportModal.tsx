"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { reportMatchResult, confirmMatchResult } from "@/app/schedule/tournament-actions";

interface MatchInfo {
  id: string;
  entrant1Id: string | null;
  entrant2Id: string | null;
  winnerEntrantId: string | null;
  score1: number | null;
  score2: number | null;
  status: string;
  reportedById: string | null;
  confirmedById: string | null;
  entrant1: { id: string; displayName: string; seed: number | null } | null;
  entrant2: { id: string; displayName: string; seed: number | null } | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  match: MatchInfo;
  userId?: string;
  isAdmin?: boolean;
  isCreator?: boolean;
}

export default function MatchReportModal({
  open,
  onClose,
  match,
  userId,
  isAdmin,
  isCreator,
}: Props) {
  const [winnerId, setWinnerId] = useState(match.winnerEntrantId || "");
  const [score1, setScore1] = useState(match.score1?.toString() || "0");
  const [score2, setScore2] = useState(match.score2?.toString() || "0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const needsConfirmation =
    match.status === "in_progress" &&
    match.reportedById &&
    match.reportedById !== userId;
  const canConfirm =
    needsConfirmation &&
    (isAdmin ||
      isCreator ||
      // Is the opponent
      (match.entrant1?.id === userId && match.reportedById !== userId) ||
      (match.entrant2?.id === userId && match.reportedById !== userId));

  const handleReport = async () => {
    if (!winnerId) {
      setError("Select a winner");
      return;
    }

    setLoading(true);
    setError("");
    const result = await reportMatchResult(match.id, {
      winnerId,
      score1: parseInt(score1) || 0,
      score2: parseInt(score2) || 0,
    });
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      onClose();
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError("");
    const result = await confirmMatchResult(match.id);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Report Match Result">
      <div className="space-y-4">
        {/* Match display */}
        <div className="rounded-lg border border-border bg-surface p-4 text-center">
          <div className="flex items-center justify-center gap-4">
            <div className="flex-1 text-right">
              <div className="text-sm font-medium text-foreground">
                {match.entrant1?.displayName || "TBD"}
              </div>
              {match.entrant1?.seed && (
                <div className="text-xs text-foreground/30">Seed #{match.entrant1.seed}</div>
              )}
            </div>
            <div className="text-foreground/30 text-sm font-bold">VS</div>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-foreground">
                {match.entrant2?.displayName || "TBD"}
              </div>
              {match.entrant2?.seed && (
                <div className="text-xs text-foreground/30">Seed #{match.entrant2.seed}</div>
              )}
            </div>
          </div>
        </div>

        {canConfirm ? (
          <>
            {/* Show reported result for confirmation */}
            <div className="rounded-lg bg-warning/10 border border-warning/20 p-3">
              <p className="text-sm text-foreground/70">
                A result has been reported. Please confirm:
              </p>
              <div className="mt-2 text-center">
                <span className="text-sm font-medium text-foreground">
                  Winner: {match.winnerEntrantId === match.entrant1?.id
                    ? match.entrant1?.displayName
                    : match.entrant2?.displayName}
                </span>
                {match.score1 != null && match.score2 != null && (
                  <span className="ml-2 text-sm text-foreground/50">
                    ({match.score1} - {match.score2})
                  </span>
                )}
              </div>
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="flex gap-2">
              <Button onClick={handleConfirm} disabled={loading} className="flex-1">
                {loading ? "Confirming..." : "Confirm Result"}
              </Button>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
            </div>
          </>
        ) : (
          <>
            {/* Winner selection */}
            <div>
              <label className="mb-1 block text-sm text-foreground/70">Winner</label>
              <div className="grid grid-cols-2 gap-2">
                {match.entrant1 && (
                  <button
                    type="button"
                    onClick={() => setWinnerId(match.entrant1!.id)}
                    className={`rounded-lg border p-3 text-sm font-medium transition ${
                      winnerId === match.entrant1.id
                        ? "border-neon bg-neon/10 text-neon"
                        : "border-border text-foreground/60 hover:border-border-light"
                    }`}
                  >
                    {match.entrant1.displayName}
                  </button>
                )}
                {match.entrant2 && (
                  <button
                    type="button"
                    onClick={() => setWinnerId(match.entrant2!.id)}
                    className={`rounded-lg border p-3 text-sm font-medium transition ${
                      winnerId === match.entrant2.id
                        ? "border-neon bg-neon/10 text-neon"
                        : "border-border text-foreground/60 hover:border-border-light"
                    }`}
                  >
                    {match.entrant2.displayName}
                  </button>
                )}
              </div>
            </div>

            {/* Score */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm text-foreground/70">
                  {match.entrant1?.displayName || "Player 1"} Score
                </label>
                <input
                  type="number"
                  value={score1}
                  onChange={(e) => setScore1(e.target.value)}
                  min="0"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-neon focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-foreground/70">
                  {match.entrant2?.displayName || "Player 2"} Score
                </label>
                <input
                  type="number"
                  value={score2}
                  onChange={(e) => setScore2(e.target.value)}
                  min="0"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground focus:border-neon focus:outline-none"
                />
              </div>
            </div>

            {!(isAdmin || isCreator) && (
              <p className="text-sm text-foreground/40 rounded-lg bg-surface-light border border-border px-3 py-2">
                Your opponent or an admin will need to confirm the result.
              </p>
            )}

            {error && <p className="text-sm text-danger">{error}</p>}

            <Button onClick={handleReport} disabled={loading || !winnerId} className="w-full">
              {loading ? "Submitting..." : isAdmin || isCreator ? "Report & Confirm" : "Report Result"}
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}
