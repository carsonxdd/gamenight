"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import CreateTournamentModal from "./CreateTournamentModal";
import TournamentDetail from "./TournamentDetail";
import { BRACKET_TYPES, TOURNAMENT_STATUSES } from "@/lib/tournament-constants";
import { calculatePrizePool } from "@/lib/bracket-utils";
import { InvitableMember } from "./ScheduleView";

export interface TournamentTeamData {
  id: string;
  name: string;
  captainId: string;
  captain: { name: string; gamertag: string | null };
  members: {
    userId: string;
    user: { name: string; gamertag: string | null };
  }[];
}

export interface TournamentData {
  id: string;
  title: string;
  description: string | null;
  game: string;
  bracketType: string;
  format: string;
  teamSize: number | null;
  bestOf: number;
  maxSlots: number;
  seedingMode: string;
  captainMode: string | null;
  status: string;
  buyIn: number | null;
  isMultiSession: boolean;
  draftStatus: string | null;
  createdById: string;
  createdBy: { name: string; gamertag: string | null };
  entrants: {
    id: string;
    type: string;
    userId: string | null;
    teamId: string | null;
    displayName: string;
    seed: number | null;
  }[];
  teams: TournamentTeamData[];
  matches: {
    id: string;
    round: number;
    matchNumber: number;
    bracketSide: string | null;
    entrant1Id: string | null;
    entrant2Id: string | null;
    winnerEntrantId: string | null;
    score1: number | null;
    score2: number | null;
    bestOfGame: number;
    status: string;
    reportedById: string | null;
    confirmedById: string | null;
    entrant1: { id: string; displayName: string; seed: number | null } | null;
    entrant2: { id: string; displayName: string; seed: number | null } | null;
    winner: { id: string; displayName: string } | null;
  }[];
  sessions: {
    id: string;
    label: string;
    date: string;
    orderIndex: number;
    gameNightId: string | null;
  }[];
  predictions: {
    id: string;
    matchId: string;
    userId: string;
    predictedWinnerId: string;
    correct: boolean | null;
  }[];
  comments: {
    id: string;
    text: string;
    userId: string;
    user: { name: string; gamertag: string | null };
    createdAt: string;
  }[];
  createdAt: string;
}

interface Props {
  tournaments: TournamentData[];
  userId?: string;
  isAdmin?: boolean;
  isModerator?: boolean;
  isOwner?: boolean;
  members?: InvitableMember[];
  initialTournamentId?: string;
}

export default function TournamentList({
  tournaments,
  userId,
  isAdmin,
  isModerator,
  isOwner,
  members = [],
  initialTournamentId,
}: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [viewingTournament, setViewingTournament] = useState<TournamentData | null>(() => {
    if (initialTournamentId) {
      return tournaments.find((t) => t.id === initialTournamentId) || null;
    }
    return null;
  });
  const [filter, setFilter] = useState<"active" | "past">(() => {
    if (initialTournamentId) {
      const t = tournaments.find((t) => t.id === initialTournamentId);
      if (t && ["completed", "archived"].includes(t.status)) return "past";
    }
    return "active";
  });

  const isAdminOrMod = isAdmin || isModerator || isOwner;

  const activeTournaments = tournaments.filter(
    (t) => ["draft", "open", "in_progress"].includes(t.status)
  );
  const pastTournaments = tournaments.filter(
    (t) => ["completed", "archived"].includes(t.status)
  );

  const displayed = filter === "active" ? activeTournaments : pastTournaments;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex rounded-lg border border-border bg-surface p-1">
          <button
            onClick={() => setFilter("active")}
            className={`rounded-md px-3 py-1 text-sm transition ${
              filter === "active"
                ? "bg-neon/10 text-neon"
                : "text-foreground/50 hover:text-foreground"
            }`}
          >
            Active ({activeTournaments.length})
          </button>
          <button
            onClick={() => setFilter("past")}
            className={`rounded-md px-3 py-1 text-sm transition ${
              filter === "past"
                ? "bg-neon/10 text-neon"
                : "text-foreground/50 hover:text-foreground"
            }`}
          >
            Past ({pastTournaments.length})
          </button>
        </div>

        {userId && (
          <Button onClick={() => setShowCreate(true)} size="sm">
            + New Tournament
          </Button>
        )}
      </div>

      {displayed.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="text-foreground/50">
            {filter === "active"
              ? "No active tournaments. Create one to get started!"
              : "No past tournaments yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((t) => (
            <TournamentCard
              key={t.id}
              tournament={t}
              onClick={() => setViewingTournament(t)}
              userId={userId}
            />
          ))}
        </div>
      )}

      {userId && (
        <CreateTournamentModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          userId={userId}
          isAdmin={isAdminOrMod}
          members={members}
        />
      )}

      {viewingTournament && (
        <TournamentDetail
          open
          onClose={() => setViewingTournament(null)}
          tournament={viewingTournament}
          userId={userId}
          isAdmin={isAdmin}
          isModerator={isModerator}
          isOwner={isOwner}
          members={members}
        />
      )}
    </div>
  );
}

function TournamentCard({
  tournament: t,
  onClick,
  userId,
}: {
  tournament: TournamentData;
  onClick: () => void;
  userId?: string;
}) {
  const bracketLabel = BRACKET_TYPES.find((b) => b.value === t.bracketType)?.label || t.bracketType;
  const statusInfo = TOURNAMENT_STATUSES.find((s) => s.value === t.status);
  const prizePool = calculatePrizePool(t.buyIn, t.maxSlots);
  const isEntered = t.entrants.some((e) => e.userId === userId);

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-xl border border-border bg-surface p-4 transition hover:border-neon/30 hover:bg-surface-light"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="truncate text-base font-bold text-foreground group-hover:text-neon transition">
              {t.title}
            </h3>
            <span className={`shrink-0 text-xs font-medium ${statusInfo?.color || "text-foreground/50"}`}>
              {statusInfo?.label || t.status}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground/50">
            <span className="font-medium text-foreground/70">{t.game}</span>
            <span>{bracketLabel}</span>
            <span>{t.format === "team" ? `${t.teamSize}v${t.teamSize}` : "Solo"}</span>
            <span>Bo{t.bestOf}</span>
            <span>
              {t.entrants.length}/{t.maxSlots} {t.format === "team" ? "teams" : "players"}
            </span>
            {prizePool && (
              <span className="font-medium text-neon">${prizePool} pot</span>
            )}
          </div>

          {t.description && (
            <p className="mt-1.5 text-xs text-foreground/40 line-clamp-1">
              {t.description}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          {isEntered && (
            <span className="rounded-full bg-neon/10 px-2 py-0.5 text-xs font-medium text-neon">
              Entered
            </span>
          )}
          <span className="text-xs text-foreground/30">
            by {t.createdBy.gamertag || t.createdBy.name}
          </span>
        </div>
      </div>
    </div>
  );
}
