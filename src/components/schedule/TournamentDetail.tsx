"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import TournamentBracket from "./TournamentBracket";
import MatchReportModal from "./MatchReportModal";
import TournamentComments from "./TournamentComments";
import TournamentPickEms from "./TournamentPickEms";
import TeamDraftModal from "./TeamDraftModal";
import { TournamentData } from "./TournamentList";
import { InvitableMember } from "./ScheduleView";
import { BRACKET_TYPES, TOURNAMENT_STATUSES } from "@/lib/tournament-constants";
import { calculatePrizePool, generateDiscordText } from "@/lib/bracket-utils";
import {
  updateTournamentStatus,
  generateBracket,
  joinTournament,
  leaveTournament,
  deleteTournament,
  generateNextSwissRound,
} from "@/app/schedule/tournament-actions";

interface Props {
  open: boolean;
  onClose: () => void;
  tournament: TournamentData;
  userId?: string;
  isAdmin?: boolean;
  isModerator?: boolean;
  isOwner?: boolean;
  members?: InvitableMember[];
}

export default function TournamentDetail({
  open,
  onClose,
  tournament: t,
  userId,
  isAdmin,
  isModerator,
  isOwner,
  members = [],
}: Props) {
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const [reportingMatch, setReportingMatch] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"bracket" | "pickems" | "discussion">("bracket");
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showDraft, setShowDraft] = useState(false);

  const isAdminOrMod = isAdmin || isModerator || isOwner;
  const isCreator = t.createdById === userId;
  const canManage = isAdminOrMod || isCreator;
  const isEntered = t.entrants.some((e) => e.userId === userId);
  const bracketLabel = BRACKET_TYPES.find((b) => b.value === t.bracketType)?.label || t.bracketType;
  const statusInfo = TOURNAMENT_STATUSES.find((s) => s.value === t.status);
  const prizePool = calculatePrizePool(t.buyIn, t.maxSlots);

  const handleAction = async (action: () => Promise<{ error?: string; success?: boolean }>, loadingKey: string) => {
    setLoading(loadingKey);
    setError("");
    const result = await action();
    setLoading("");
    if (result?.error) setError(result.error);
    else onClose();
  };

  const handleCopyDiscord = () => {
    const text = generateDiscordText({
      title: t.title,
      bracketType: t.bracketType,
      bestOf: t.bestOf,
      format: t.format,
      entrants: t.entrants,
      matches: t.matches,
    });
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const matchForReport = reportingMatch
    ? t.matches.find((m) => m.id === reportingMatch)
    : null;

  return (
    <>
      <Modal open={open} onClose={onClose} title="" wide>
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-foreground">{t.title}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground/50">
                <span className="font-medium text-foreground/70">{t.game}</span>
                <span>{bracketLabel}</span>
                <span>{t.format === "team" ? `${t.teamSize}v${t.teamSize}` : "Solo"}</span>
                <span>Bo{t.bestOf}</span>
                <span className={statusInfo?.color}>{statusInfo?.label}</span>
              </div>
            </div>
            {prizePool && (
              <div className="text-right">
                <div className="text-sm text-foreground/40">Prize Pool</div>
                <div className="text-lg font-bold text-neon">${prizePool.toFixed(2)}</div>
                {t.buyIn && (
                  <div className="text-xs text-foreground/30">${t.buyIn} buy-in</div>
                )}
              </div>
            )}
          </div>

          {t.description && (
            <p className="mt-2 text-sm text-foreground/50">{t.description}</p>
          )}

          <div className="mt-2 text-xs text-foreground/30">
            Created by {t.createdBy?.gamertag || t.createdBy?.name || "Unknown"}
          </div>
        </div>

        {/* Action buttons */}
        <div className="mb-4 flex flex-wrap gap-2">
          {/* Join/Leave */}
          {userId && t.status === "open" && t.format === "solo" && !isEntered && (
            <Button
              size="sm"
              onClick={() => handleAction(() => joinTournament(t.id), "join")}
              disabled={loading === "join"}
            >
              {loading === "join" ? "Joining..." : "Join Tournament"}
            </Button>
          )}
          {userId && t.status === "open" && isEntered && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleAction(() => leaveTournament(t.id), "leave")}
              disabled={loading === "leave"}
            >
              {loading === "leave" ? "Leaving..." : "Leave Tournament"}
            </Button>
          )}

          {/* Management buttons */}
          {canManage && t.status === "draft" && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleAction(() => updateTournamentStatus(t.id, "open"), "open")}
              disabled={loading === "open"}
            >
              {loading === "open" ? "Opening..." : "Open Signups"}
            </Button>
          )}
          {/* Team Draft button */}
          {canManage && t.format === "team" && (t.status === "open" || t.status === "draft") && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowDraft(true)}
            >
              {t.draftStatus === "completed" ? "View Draft" : t.draftStatus === "in_progress" ? "Resume Draft" : "Start Team Draft"}
            </Button>
          )}
          {/* Non-captain participants can view draft too */}
          {!canManage && t.format === "team" && t.draftStatus === "in_progress" && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowDraft(true)}
            >
              View Draft
            </Button>
          )}
          {canManage && t.status === "open" && t.entrants.length >= 2 && (t.format === "solo" || t.draftStatus === "completed") && (
            <Button
              size="sm"
              onClick={() => handleAction(() => generateBracket(t.id), "generate")}
              disabled={loading === "generate"}
            >
              {loading === "generate" ? "Generating..." : "Generate Bracket & Start"}
            </Button>
          )}
          {canManage && t.status === "completed" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleAction(() => updateTournamentStatus(t.id, "archived"), "archive")}
              disabled={loading === "archive"}
            >
              Archive
            </Button>
          )}

          {/* Swiss: Generate Next Round */}
          {canManage && t.status === "in_progress" && t.bracketType === "swiss" && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleAction(() => generateNextSwissRound(t.id), "swiss_next")}
              disabled={loading === "swiss_next"}
            >
              {loading === "swiss_next" ? "Generating..." : "Generate Next Round"}
            </Button>
          )}

          {/* Complete tournament manually (for swiss/ffa/round_robin) */}
          {canManage && t.status === "in_progress" && ["swiss", "ffa", "round_robin"].includes(t.bracketType) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleAction(() => updateTournamentStatus(t.id, "completed"), "complete")}
              disabled={loading === "complete"}
            >
              {loading === "complete" ? "..." : "End Tournament"}
            </Button>
          )}

          {/* Share buttons */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/schedule?tournament=${t.id}`
              );
              setCopiedLink(true);
              setTimeout(() => setCopiedLink(false), 2000);
            }}
          >
            {copiedLink ? "Link Copied!" : "Share Link"}
          </Button>
          {t.matches.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopyDiscord}
            >
              {copied ? "Copied!" : "Copy for Discord"}
            </Button>
          )}

          {/* Delete */}
          {canManage && (t.status === "draft" || t.status === "archived") && (
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleAction(() => deleteTournament(t.id), "delete")}
              disabled={loading === "delete"}
            >
              {loading === "delete" ? "Deleting..." : "Delete"}
            </Button>
          )}
        </div>

        {error && <p className="mb-3 text-sm text-danger">{error}</p>}

        {/* Entrants / Teams list (when no bracket yet) */}
        {t.matches.length === 0 && (
          <div className="mb-4">
            {/* Show teams if they exist */}
            {t.teams.length > 0 ? (
              <div>
                <h3 className="mb-2 text-sm font-medium text-foreground/70">
                  Teams ({t.teams.length}/{t.maxSlots})
                  {t.draftStatus && t.draftStatus !== "completed" && (
                    <span className="ml-2 text-xs text-warning">Draft {t.draftStatus}</span>
                  )}
                </h3>
                <div className="space-y-2">
                  {t.teams.map((team) => (
                    <div key={team.id} className="rounded-lg border border-border bg-surface p-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">{team.name}</span>
                        <span className="text-xs text-foreground/30">
                          Captain: {team.captain?.gamertag || team.captain?.name || "Unknown"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {team.members.map((m) => (
                          <span
                            key={m.userId}
                            className={`rounded-full px-2 py-0.5 text-xs ${
                              m.userId === team.captainId
                                ? "border border-neon/30 bg-neon/10 text-neon"
                                : "border border-border bg-surface-light text-foreground/50"
                            }`}
                          >
                            {m.user.gamertag || m.user.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <h3 className="mb-2 text-sm font-medium text-foreground/70">
                  {t.format === "team" ? "Player Pool" : "Players"} ({t.entrants.length}/{t.format === "team" ? `${t.maxSlots * (t.teamSize || 5)} needed` : t.maxSlots})
                </h3>
                {t.entrants.length === 0 ? (
                  <p className="text-sm text-foreground/40">No entrants yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {t.entrants.map((e) => (
                      <span
                        key={e.id}
                        className="rounded-full border border-border bg-surface-light px-2.5 py-1 text-xs text-foreground/70"
                      >
                        {e.seed ? `#${e.seed} ` : ""}{e.displayName}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tabs for bracket/pickems/discussion */}
        {(t.matches.length > 0 || t.status === "open") && (
          <>
            <div className="mb-3 flex rounded-lg border border-border bg-surface p-1">
              {t.matches.length > 0 && (
                <button
                  onClick={() => setActiveTab("bracket")}
                  className={`flex-1 rounded-md px-3 py-1.5 text-sm transition ${
                    activeTab === "bracket"
                      ? "bg-neon/10 text-neon"
                      : "text-foreground/50 hover:text-foreground"
                  }`}
                >
                  Bracket
                </button>
              )}
              <button
                onClick={() => setActiveTab("pickems")}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm transition ${
                  activeTab === "pickems"
                    ? "bg-neon/10 text-neon"
                    : "text-foreground/50 hover:text-foreground"
                }`}
              >
                Pick&apos;ems
                {t.predictions.filter((p) => p.userId === userId).length > 0 && (
                  <span className="ml-1 text-xs text-foreground/30">
                    ({t.predictions.filter((p) => p.userId === userId).length})
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("discussion")}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm transition ${
                  activeTab === "discussion"
                    ? "bg-neon/10 text-neon"
                    : "text-foreground/50 hover:text-foreground"
                }`}
              >
                Discussion ({t.comments.length})
              </button>
            </div>

            {activeTab === "bracket" && t.matches.length > 0 && (
              <TournamentBracket
                matches={t.matches}
                bracketType={t.bracketType}
                onMatchClick={(matchId) => {
                  if (!userId) return;
                  const match = t.matches.find((m) => m.id === matchId);
                  if (match && match.status !== "completed" && match.status !== "bye" && match.entrant1Id && match.entrant2Id) {
                    setReportingMatch(matchId);
                  }
                }}
                userId={userId}
                isAdmin={isAdminOrMod}
                tournamentCreatorId={t.createdById ?? ""}
              />
            )}

            {activeTab === "pickems" && (
              <TournamentPickEms
                tournamentId={t.id}
                tournamentStatus={t.status}
                bracketType={t.bracketType}
                matches={t.matches}
                predictions={t.predictions}
                userId={userId}
              />
            )}

            {activeTab === "discussion" && (
              <TournamentComments
                tournamentId={t.id}
                comments={t.comments}
                userId={userId}
              />
            )}
          </>
        )}

        {/* Sessions */}
        {t.isMultiSession && t.sessions.length > 0 && (
          <div className="mt-4 border-t border-border pt-3">
            <h3 className="mb-2 text-sm font-medium text-foreground/70">Schedule</h3>
            <div className="space-y-1">
              {t.sessions
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground/60">{s.label}</span>
                    <span className="text-foreground/40">
                      {new Date(s.date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Match Report Modal */}
      {reportingMatch && matchForReport && (
        <MatchReportModal
          open
          onClose={() => setReportingMatch(null)}
          match={matchForReport}
          userId={userId}
          isAdmin={isAdminOrMod}
          isCreator={isCreator}
        />
      )}

      {/* Team Draft Modal */}
      {showDraft && (
        <TeamDraftModal
          open
          onClose={() => setShowDraft(false)}
          tournamentId={t.id}
          tournamentGame={t.game}
          teamSize={t.teamSize || 5}
          maxSlots={t.maxSlots}
          captainMode={t.captainMode}
          createdById={t.createdById ?? ""}
          userId={userId}
          isAdmin={isAdminOrMod}
          members={members}
          existingPlayerIds={t.entrants.filter((e) => e.userId).map((e) => e.userId!)}
        />
      )}
    </>
  );
}
