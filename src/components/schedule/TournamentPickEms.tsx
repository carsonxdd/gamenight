"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { submitPredictions } from "@/app/schedule/tournament-actions";
import { getRoundLabel } from "@/lib/bracket-utils";

interface MatchData {
  id: string;
  round: number;
  matchNumber: number;
  bracketSide: string | null;
  entrant1Id: string | null;
  entrant2Id: string | null;
  winnerEntrantId: string | null;
  status: string;
  entrant1: { id: string; displayName: string; seed: number | null } | null;
  entrant2: { id: string; displayName: string; seed: number | null } | null;
  winner: { id: string; displayName: string } | null;
}

interface PredictionData {
  id: string;
  matchId: string;
  userId: string;
  predictedWinnerId: string;
  correct: boolean | null;
}

interface Props {
  tournamentId: string;
  tournamentStatus: string;
  bracketType: string;
  matches: MatchData[];
  predictions: PredictionData[];
  userId?: string;
}

export default function TournamentPickEms({
  tournamentId,
  tournamentStatus,
  bracketType,
  matches,
  predictions,
  userId,
}: Props) {
  // Only show matches that have both entrants (predictable)
  const predictableMatches = matches.filter(
    (m) => m.entrant1Id && m.entrant2Id && m.status !== "bye"
  );

  // User's existing predictions
  const existingPredictions = new Map(
    predictions
      .filter((p) => p.userId === userId)
      .map((p) => [p.matchId, p])
  );

  const [picks, setPicks] = useState<Map<string, string>>(() => {
    const initial = new Map<string, string>();
    for (const [matchId, pred] of existingPredictions) {
      initial.set(matchId, pred.predictedWinnerId);
    }
    return initial;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const isLocked = tournamentStatus === "in_progress" || tournamentStatus === "completed" || tournamentStatus === "archived";
  const canPredict = userId && tournamentStatus === "open";

  // Group matches by round
  const rounds = new Map<number, MatchData[]>();
  for (const m of predictableMatches) {
    if (!rounds.has(m.round)) rounds.set(m.round, []);
    rounds.get(m.round)!.push(m);
  }
  const sortedRounds = Array.from(rounds.entries()).sort((a, b) => a[0] - b[0]);
  const totalRounds = sortedRounds.length;

  const handlePick = (matchId: string, entrantId: string) => {
    if (!canPredict) return;
    const newPicks = new Map(picks);
    newPicks.set(matchId, entrantId);
    setPicks(newPicks);
    setSaved(false);
  };

  const handleSubmit = async () => {
    const predictionList = Array.from(picks.entries()).map(([matchId, predictedWinnerId]) => ({
      matchId,
      predictedWinnerId,
    }));

    if (predictionList.length === 0) {
      setError("Make at least one prediction");
      return;
    }

    setLoading(true);
    setError("");
    const result = await submitPredictions(tournamentId, predictionList);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setSaved(true);
    }
  };

  // Calculate user's score
  const userPredictions = predictions.filter((p) => p.userId === userId);
  const totalPredictions = userPredictions.length;
  const correctCount = userPredictions.filter((p) => p.correct === true).length;
  const wrongCount = userPredictions.filter((p) => p.correct === false).length;
  const pendingCount = userPredictions.filter((p) => p.correct === null).length;

  // All users' prediction summaries
  const allUserIds = new Set(predictions.map((p) => p.userId));
  const userScores = Array.from(allUserIds).map((uid) => {
    const userPreds = predictions.filter((p) => p.userId === uid);
    return {
      userId: uid,
      total: userPreds.length,
      correct: userPreds.filter((p) => p.correct === true).length,
      isCurrentUser: uid === userId,
    };
  }).sort((a, b) => b.correct - a.correct);

  return (
    <div className="space-y-4">
      {/* Score summary */}
      {totalPredictions > 0 && (
        <div className="rounded-lg border border-border bg-surface p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground/70">Your Predictions</span>
            <div className="flex gap-3 text-sm">
              <span className="text-neon">{correctCount} correct</span>
              <span className="text-danger">{wrongCount} wrong</span>
              {pendingCount > 0 && (
                <span className="text-foreground/40">{pendingCount} pending</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard preview (when locked) */}
      {isLocked && userScores.length > 1 && (
        <div>
          <h4 className="mb-2 text-xs font-medium text-foreground/50 uppercase tracking-wider">
            Prediction Standings
          </h4>
          <div className="space-y-1">
            {userScores.slice(0, 10).map((s, i) => (
              <div
                key={s.userId}
                className={`flex items-center justify-between rounded px-3 py-1.5 text-sm ${
                  s.isCurrentUser ? "bg-neon/5 border border-neon/20" : ""
                }`}
              >
                <span className="text-foreground/50">
                  #{i + 1} {s.isCurrentUser ? "You" : `Player`}
                </span>
                <span className="text-foreground/70">
                  {s.correct}/{s.total} correct
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info banner */}
      {canPredict && (
        <div className="rounded-lg bg-neon/5 border border-neon/20 p-3">
          <p className="text-sm text-foreground/60">
            Predict the winner of each match before the tournament starts.
            Predictions lock when the bracket is generated.
          </p>
        </div>
      )}

      {isLocked && !canPredict && totalPredictions === 0 && (
        <div className="rounded-lg bg-surface-light border border-border p-3">
          <p className="text-sm text-foreground/40">
            Predictions are locked. The tournament has already started.
          </p>
        </div>
      )}

      {/* Match predictions */}
      {predictableMatches.length === 0 ? (
        <p className="text-center text-sm text-foreground/40 py-4">
          No matches to predict yet. Predictions will be available once the bracket has entrants assigned.
        </p>
      ) : (
        <div className="space-y-4">
          {sortedRounds.map(([round, roundMatches]) => {
            const label = getRoundLabel(round, totalRounds, bracketType, roundMatches[0]?.bracketSide);
            return (
              <div key={round}>
                <h4 className="mb-2 text-xs font-medium text-foreground/50 uppercase tracking-wider">
                  {label}
                </h4>
                <div className="space-y-2">
                  {roundMatches
                    .sort((a, b) => a.matchNumber - b.matchNumber)
                    .map((match) => {
                      const userPick = picks.get(match.id);
                      const existingPred = existingPredictions.get(match.id);
                      const isCompleted = match.status === "completed";
                      const wasCorrect = existingPred?.correct;

                      return (
                        <div
                          key={match.id}
                          className={`rounded-lg border p-2 ${
                            isCompleted && wasCorrect === true
                              ? "border-neon/30 bg-neon/5"
                              : isCompleted && wasCorrect === false
                                ? "border-danger/30 bg-danger/5"
                                : "border-border bg-surface"
                          }`}
                        >
                          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                            {/* Entrant 1 */}
                            <button
                              type="button"
                              onClick={() => match.entrant1 && handlePick(match.id, match.entrant1.id)}
                              disabled={!canPredict}
                              className={`rounded-lg border p-2 text-sm text-left transition ${
                                userPick === match.entrant1?.id
                                  ? isCompleted && wasCorrect === true
                                    ? "border-neon bg-neon/10 text-neon font-medium"
                                    : isCompleted && wasCorrect === false
                                      ? "border-danger bg-danger/10 text-danger font-medium"
                                      : "border-neon bg-neon/10 text-neon font-medium"
                                  : "border-border/50 text-foreground/60 hover:border-border-light disabled:hover:border-border/50"
                              }`}
                            >
                              <span className="flex items-center gap-1.5">
                                {match.entrant1?.seed && (
                                  <span className="text-xs text-foreground/30">{match.entrant1.seed}</span>
                                )}
                                {match.entrant1?.displayName || "TBD"}
                              </span>
                              {isCompleted && match.winnerEntrantId === match.entrant1?.id && (
                                <span className="text-xs text-neon mt-0.5 block">Winner</span>
                              )}
                            </button>

                            {/* VS */}
                            <span className="text-xs text-foreground/30 font-bold">VS</span>

                            {/* Entrant 2 */}
                            <button
                              type="button"
                              onClick={() => match.entrant2 && handlePick(match.id, match.entrant2.id)}
                              disabled={!canPredict}
                              className={`rounded-lg border p-2 text-sm text-right transition ${
                                userPick === match.entrant2?.id
                                  ? isCompleted && wasCorrect === true
                                    ? "border-neon bg-neon/10 text-neon font-medium"
                                    : isCompleted && wasCorrect === false
                                      ? "border-danger bg-danger/10 text-danger font-medium"
                                      : "border-neon bg-neon/10 text-neon font-medium"
                                  : "border-border/50 text-foreground/60 hover:border-border-light disabled:hover:border-border/50"
                              }`}
                            >
                              <span className="flex items-center justify-end gap-1.5">
                                {match.entrant2?.displayName || "TBD"}
                                {match.entrant2?.seed && (
                                  <span className="text-xs text-foreground/30">{match.entrant2.seed}</span>
                                )}
                              </span>
                              {isCompleted && match.winnerEntrantId === match.entrant2?.id && (
                                <span className="text-xs text-neon mt-0.5 block">Winner</span>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit button */}
      {canPredict && picks.size > 0 && (
        <div>
          {error && <p className="mb-2 text-sm text-danger">{error}</p>}
          {saved && <p className="mb-2 text-sm text-neon">Predictions saved!</p>}
          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? "Saving..." : `Save Predictions (${picks.size} picks)`}
          </Button>
        </div>
      )}
    </div>
  );
}
