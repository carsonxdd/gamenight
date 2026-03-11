"use client";

import { useState } from "react";
import { getRoundLabel } from "@/lib/bracket-utils";

interface MatchData {
  id: string;
  round: number;
  matchNumber: number;
  bracketSide: string | null;
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
  winner: { id: string; displayName: string } | null;
}

interface Props {
  matches: MatchData[];
  bracketType: string;
  onMatchClick: (matchId: string) => void;
  userId?: string;
  isAdmin?: boolean;
  tournamentCreatorId: string;
}

export default function TournamentBracket({
  matches,
  bracketType,
  onMatchClick,
  userId,
  isAdmin,
  tournamentCreatorId,
}: Props) {
  if (bracketType === "round_robin") {
    return <RoundRobinView matches={matches} onMatchClick={onMatchClick} userId={userId} isAdmin={isAdmin} tournamentCreatorId={tournamentCreatorId} />;
  }

  if (bracketType === "swiss") {
    return <SwissView matches={matches} onMatchClick={onMatchClick} userId={userId} isAdmin={isAdmin} tournamentCreatorId={tournamentCreatorId} />;
  }

  if (bracketType === "ffa") {
    return <FFAView matches={matches} />;
  }

  if (bracketType === "double_elim" || bracketType === "constellation") {
    return (
      <DualBracketView
        matches={matches}
        bracketType={bracketType}
        onMatchClick={onMatchClick}
        userId={userId}
        isAdmin={isAdmin}
        tournamentCreatorId={tournamentCreatorId}
      />
    );
  }

  // Default: single elimination
  return (
    <SingleElimView
      matches={matches}
      bracketType={bracketType}
      onMatchClick={onMatchClick}
      userId={userId}
      isAdmin={isAdmin}
      tournamentCreatorId={tournamentCreatorId}
    />
  );
}

// ─── Single Elimination View ─────────────────────────────────────────

function SingleElimView({
  matches,
  bracketType,
  onMatchClick,
  userId,
  isAdmin,
  tournamentCreatorId,
}: {
  matches: MatchData[];
  bracketType: string;
  onMatchClick: (id: string) => void;
  userId?: string;
  isAdmin?: boolean;
  tournamentCreatorId: string;
}) {
  const rounds = groupByRound(matches);
  const sortedRounds = Array.from(rounds.entries()).sort((a, b) => a[0] - b[0]);
  const totalRounds = sortedRounds.length;

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-6 min-w-max pb-4">
        {sortedRounds.map(([round, roundMatches]) => {
          const sorted = roundMatches.sort((a, b) => a.matchNumber - b.matchNumber);
          const label = getRoundLabel(round, totalRounds, bracketType);

          return (
            <div key={round} className="flex flex-col">
              <h4 className="mb-3 text-center text-xs font-medium text-foreground/50 uppercase tracking-wider">
                {label}
              </h4>
              <div className="flex flex-1 flex-col justify-around gap-3">
                {sorted.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onClick={() => onMatchClick(match.id)}
                    userId={userId}
                    isAdmin={isAdmin}
                    tournamentCreatorId={tournamentCreatorId}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Double Elim / Constellation View ────────────────────────────────

function DualBracketView({
  matches,
  bracketType,
  onMatchClick,
  userId,
  isAdmin,
  tournamentCreatorId,
}: {
  matches: MatchData[];
  bracketType: string;
  onMatchClick: (id: string) => void;
  userId?: string;
  isAdmin?: boolean;
  tournamentCreatorId: string;
}) {
  const [viewSide, setViewSide] = useState<"winners" | "losers">("winners");

  const winnersMatches = matches.filter((m) => m.bracketSide === "winners" || !m.bracketSide);
  const losersMatches = matches.filter((m) => m.bracketSide === "losers");

  const displayed = viewSide === "winners" ? winnersMatches : losersMatches;
  const rounds = groupByRound(displayed);
  const sortedRounds = Array.from(rounds.entries()).sort((a, b) => a[0] - b[0]);
  const totalRounds = sortedRounds.length;

  const losersLabel = bracketType === "constellation" ? "Consolation" : "Losers";

  return (
    <div>
      {/* Bracket side toggle */}
      <div className="mb-3 flex rounded-lg border border-border bg-surface p-1">
        <button
          onClick={() => setViewSide("winners")}
          className={`flex-1 rounded-md px-3 py-1 text-sm transition ${
            viewSide === "winners"
              ? "bg-neon/10 text-neon"
              : "text-foreground/50 hover:text-foreground"
          }`}
        >
          Winners ({winnersMatches.length})
        </button>
        <button
          onClick={() => setViewSide("losers")}
          className={`flex-1 rounded-md px-3 py-1 text-sm transition ${
            viewSide === "losers"
              ? "bg-neon/10 text-neon"
              : "text-foreground/50 hover:text-foreground"
          }`}
        >
          {losersLabel} ({losersMatches.length})
        </button>
      </div>

      {displayed.length === 0 ? (
        <p className="py-4 text-center text-sm text-foreground/40">
          No matches in {viewSide === "winners" ? "winners" : losersLabel.toLowerCase()} bracket yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex gap-6 min-w-max pb-4">
            {sortedRounds.map(([round, roundMatches]) => {
              const sorted = roundMatches.sort((a, b) => a.matchNumber - b.matchNumber);
              const label = getRoundLabel(round, totalRounds, bracketType, viewSide);

              return (
                <div key={round} className="flex flex-col">
                  <h4 className="mb-3 text-center text-xs font-medium text-foreground/50 uppercase tracking-wider">
                    {label}
                  </h4>
                  <div className="flex flex-1 flex-col justify-around gap-3">
                    {sorted.map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        onClick={() => onMatchClick(match.id)}
                        userId={userId}
                        isAdmin={isAdmin}
                        tournamentCreatorId={tournamentCreatorId}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Swiss View ──────────────────────────────────────────────────────

function SwissView({
  matches,
  onMatchClick,
  userId,
  isAdmin,
  tournamentCreatorId,
}: {
  matches: MatchData[];
  onMatchClick: (id: string) => void;
  userId?: string;
  isAdmin?: boolean;
  tournamentCreatorId: string;
}) {
  const rounds = groupByRound(matches);
  const sortedRounds = Array.from(rounds.entries()).sort((a, b) => a[0] - b[0]);

  // Build standings
  const entrantMap = new Map<string, string>();
  const records = new Map<string, { wins: number; losses: number }>();

  for (const m of matches) {
    if (m.entrant1) entrantMap.set(m.entrant1.id, m.entrant1.displayName);
    if (m.entrant2) entrantMap.set(m.entrant2.id, m.entrant2.displayName);
  }

  for (const [id] of entrantMap) {
    records.set(id, { wins: 0, losses: 0 });
  }

  for (const m of matches) {
    if (m.status !== "completed" || !m.winnerEntrantId) continue;
    if (m.entrant1Id && m.entrant2Id) {
      const loserId = m.winnerEntrantId === m.entrant1Id ? m.entrant2Id : m.entrant1Id;
      const wr = records.get(m.winnerEntrantId);
      const lr = records.get(loserId);
      if (wr) wr.wins++;
      if (lr) lr.losses++;
    }
  }

  const sortedStandings = Array.from(entrantMap.entries())
    .map(([id, name]) => ({ id, name, ...records.get(id)! }))
    .sort((a, b) => b.wins - a.wins || a.losses - b.losses);

  return (
    <div className="space-y-4">
      {/* Standings */}
      <div>
        <h4 className="mb-2 text-xs font-medium text-foreground/50 uppercase tracking-wider">
          Standings
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-3 py-1.5 text-left text-xs font-medium text-foreground/50">#</th>
                <th className="px-3 py-1.5 text-left text-xs font-medium text-foreground/50">Player</th>
                <th className="px-3 py-1.5 text-center text-xs font-medium text-foreground/50">W</th>
                <th className="px-3 py-1.5 text-center text-xs font-medium text-foreground/50">L</th>
              </tr>
            </thead>
            <tbody>
              {sortedStandings.map((s, i) => (
                <tr key={s.id} className="border-b border-border/50">
                  <td className="px-3 py-1.5 text-foreground/30">{i + 1}</td>
                  <td className="px-3 py-1.5 text-foreground/70">{s.name}</td>
                  <td className="px-3 py-1.5 text-center text-neon">{s.wins}</td>
                  <td className="px-3 py-1.5 text-center text-danger">{s.losses}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Round matches */}
      {sortedRounds.map(([round, roundMatches]) => (
        <div key={round}>
          <h4 className="mb-2 text-xs font-medium text-foreground/50 uppercase tracking-wider">
            Round {round}
          </h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {roundMatches
              .sort((a, b) => a.matchNumber - b.matchNumber)
              .map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onClick={() => onMatchClick(match.id)}
                  userId={userId}
                  isAdmin={isAdmin}
                  tournamentCreatorId={tournamentCreatorId}
                  compact
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── FFA View ────────────────────────────────────────────────────────

function FFAView({ matches }: { matches: MatchData[] }) {
  // Group by round, each "match" is one entrant's score
  const rounds = groupByRound(matches);
  const sortedRounds = Array.from(rounds.entries()).sort((a, b) => a[0] - b[0]);

  // Build cumulative scores
  const scores = new Map<string, { name: string; total: number; rounds: Map<number, number> }>();

  for (const m of matches) {
    if (!m.entrant1) continue;
    if (!scores.has(m.entrant1.id)) {
      scores.set(m.entrant1.id, { name: m.entrant1.displayName, total: 0, rounds: new Map() });
    }
    const entry = scores.get(m.entrant1.id)!;
    if (m.status === "completed" && m.score1 != null) {
      entry.rounds.set(m.round, m.score1);
      entry.total = Array.from(entry.rounds.values()).reduce((a, b) => a + b, 0);
    }
  }

  const sortedScores = Array.from(scores.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.total - a.total);

  const roundNumbers = sortedRounds.map(([r]) => r);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-3 py-2 text-left text-xs font-medium text-foreground/50">#</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-foreground/50">Player</th>
            {roundNumbers.map((r) => (
              <th key={r} className="px-3 py-2 text-center text-xs font-medium text-foreground/50">
                R{r}
              </th>
            ))}
            <th className="px-3 py-2 text-center text-xs font-medium text-foreground/50">Total</th>
          </tr>
        </thead>
        <tbody>
          {sortedScores.map((s, i) => (
            <tr key={s.id} className="border-b border-border/50">
              <td className="px-3 py-2 text-foreground/30">{i + 1}</td>
              <td className="px-3 py-2 text-foreground/70">{s.name}</td>
              {roundNumbers.map((r) => (
                <td key={r} className="px-3 py-2 text-center text-foreground/50">
                  {s.rounds.get(r) ?? "-"}
                </td>
              ))}
              <td className="px-3 py-2 text-center font-medium text-neon">{s.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Round Robin View ────────────────────────────────────────────────

function RoundRobinView({
  matches,
  onMatchClick,
  userId,
  isAdmin,
  tournamentCreatorId,
}: {
  matches: MatchData[];
  onMatchClick: (id: string) => void;
  userId?: string;
  isAdmin?: boolean;
  tournamentCreatorId: string;
}) {
  const [showTab, setShowTab] = useState<"standings" | "matches">("standings");

  const entrantMap = new Map<string, string>();
  for (const m of matches) {
    if (m.entrant1) entrantMap.set(m.entrant1.id, m.entrant1.displayName);
    if (m.entrant2) entrantMap.set(m.entrant2.id, m.entrant2.displayName);
  }

  const standings = new Map<string, { wins: number; losses: number }>();
  for (const [id] of entrantMap) {
    standings.set(id, { wins: 0, losses: 0 });
  }

  for (const m of matches) {
    if (m.status !== "completed") continue;
    if (m.winnerEntrantId && m.entrant1Id && m.entrant2Id) {
      const loserId = m.winnerEntrantId === m.entrant1Id ? m.entrant2Id : m.entrant1Id;
      const ws = standings.get(m.winnerEntrantId);
      const ls = standings.get(loserId);
      if (ws) ws.wins++;
      if (ls) ls.losses++;
    }
  }

  const sortedEntrants = Array.from(entrantMap.entries())
    .map(([id, name]) => ({ id, name, ...standings.get(id)! }))
    .sort((a, b) => b.wins - a.wins || a.losses - b.losses);

  const rounds = groupByRound(matches);
  const sortedRounds = Array.from(rounds.entries()).sort((a, b) => a[0] - b[0]);

  return (
    <div>
      <div className="mb-3 flex rounded-lg border border-border bg-surface p-1">
        <button
          onClick={() => setShowTab("standings")}
          className={`flex-1 rounded-md px-3 py-1 text-sm transition ${
            showTab === "standings" ? "bg-neon/10 text-neon" : "text-foreground/50 hover:text-foreground"
          }`}
        >
          Standings
        </button>
        <button
          onClick={() => setShowTab("matches")}
          className={`flex-1 rounded-md px-3 py-1 text-sm transition ${
            showTab === "matches" ? "bg-neon/10 text-neon" : "text-foreground/50 hover:text-foreground"
          }`}
        >
          Matches
        </button>
      </div>

      {showTab === "standings" && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left text-xs font-medium text-foreground/50">#</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-foreground/50">Player</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-foreground/50">W</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-foreground/50">L</th>
              </tr>
            </thead>
            <tbody>
              {sortedEntrants.map((s, i) => (
                <tr key={s.id} className="border-b border-border/50">
                  <td className="px-3 py-2 text-foreground/30">{i + 1}</td>
                  <td className="px-3 py-2 text-foreground/70">{s.name}</td>
                  <td className="px-3 py-2 text-center text-neon">{s.wins}</td>
                  <td className="px-3 py-2 text-center text-danger">{s.losses}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showTab === "matches" && (
        <div className="space-y-3">
          {sortedRounds.map(([round, roundMatches]) => (
            <div key={round}>
              <h4 className="mb-2 text-xs font-medium text-foreground/50 uppercase tracking-wider">
                Round {round}
              </h4>
              <div className="grid gap-2 sm:grid-cols-2">
                {roundMatches
                  .sort((a, b) => a.matchNumber - b.matchNumber)
                  .map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      onClick={() => onMatchClick(match.id)}
                      userId={userId}
                      isAdmin={isAdmin}
                      tournamentCreatorId={tournamentCreatorId}
                      compact
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Shared Match Card ───────────────────────────────────────────────

function MatchCard({
  match: m,
  onClick,
  userId,
  isAdmin,
  tournamentCreatorId,
  compact,
}: {
  match: MatchData;
  onClick: () => void;
  userId?: string;
  isAdmin?: boolean;
  tournamentCreatorId: string;
  compact?: boolean;
}) {
  const isParticipant =
    m.entrant1?.id === userId || m.entrant2?.id === userId;
  const canReport =
    m.status !== "completed" &&
    m.status !== "bye" &&
    m.entrant1Id &&
    m.entrant2Id &&
    (isAdmin || userId === tournamentCreatorId || isParticipant);

  const needsConfirmation = m.status === "in_progress" && m.reportedById;

  return (
    <div
      onClick={canReport ? onClick : undefined}
      className={`${compact ? "w-full" : "w-56"} rounded-lg border p-2 transition ${
        m.status === "completed"
          ? "border-neon/20 bg-neon/5"
          : m.status === "bye"
            ? "border-border/50 bg-surface/50"
            : canReport
              ? "border-border bg-surface cursor-pointer hover:border-neon/30"
              : "border-border bg-surface"
      }`}
    >
      {/* Entrant 1 */}
      <div
        className={`flex items-center justify-between rounded px-2 py-1 text-sm ${
          m.winnerEntrantId === m.entrant1Id && m.status === "completed"
            ? "text-neon font-medium"
            : "text-foreground/70"
        }`}
      >
        <span className="flex items-center gap-1.5 min-w-0">
          {m.entrant1?.seed && (
            <span className="text-xs text-foreground/30 shrink-0">
              {m.entrant1.seed}
            </span>
          )}
          <span className="truncate">
            {m.entrant1?.displayName || "TBD"}
          </span>
        </span>
        {m.score1 != null && (
          <span className="ml-2 shrink-0 font-mono text-xs">{m.score1}</span>
        )}
      </div>

      {/* Divider */}
      <div className="my-0.5 border-t border-border/50" />

      {/* Entrant 2 */}
      <div
        className={`flex items-center justify-between rounded px-2 py-1 text-sm ${
          m.status === "bye"
            ? "text-foreground/20 italic"
            : m.winnerEntrantId === m.entrant2Id && m.status === "completed"
              ? "text-neon font-medium"
              : "text-foreground/70"
        }`}
      >
        <span className="flex items-center gap-1.5 min-w-0">
          {m.entrant2?.seed && (
            <span className="text-xs text-foreground/30 shrink-0">
              {m.entrant2.seed}
            </span>
          )}
          <span className="truncate">
            {m.status === "bye" ? "BYE" : m.entrant2?.displayName || "TBD"}
          </span>
        </span>
        {m.score2 != null && (
          <span className="ml-2 shrink-0 font-mono text-xs">{m.score2}</span>
        )}
      </div>

      {/* Status indicator */}
      {needsConfirmation && (
        <div className="mt-1 text-center text-xs text-warning">
          Awaiting confirmation
        </div>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────

function groupByRound(matches: MatchData[]): Map<number, MatchData[]> {
  const rounds = new Map<number, MatchData[]>();
  for (const m of matches) {
    if (!rounds.has(m.round)) rounds.set(m.round, []);
    rounds.get(m.round)!.push(m);
  }
  return rounds;
}
