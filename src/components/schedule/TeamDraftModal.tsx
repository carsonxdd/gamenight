"use client";

import { useState, useEffect, useCallback } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import MemberPicker from "./MemberPicker";
import { InvitableMember } from "./ScheduleView";
import { CAPTAIN_MODES } from "@/lib/tournament-constants";
import {
  addPlayersToTeamTournament,
  startDraft,
  makeDraftPick,
  autoCompleteDraft,
  renameTeam,
  getDraftState,
} from "@/app/schedule/tournament-actions";

interface Props {
  open: boolean;
  onClose: () => void;
  tournamentId: string;
  tournamentGame: string;
  teamSize: number;
  maxSlots: number;
  captainMode: string | null;
  createdById: string;
  userId?: string;
  isAdmin?: boolean;
  members?: InvitableMember[];
  existingPlayerIds: string[];
}

interface DraftState {
  draftStatus: string | null;
  currentCaptainId: string | null;
  currentPickIndex: number;
  totalPicks: number;
  draftOrder: string[];
  teams: {
    id: string;
    name: string;
    captainId: string;
    captain: { id: string; name: string; gamertag: string | null };
    members: {
      userId: string;
      user: { id: string; name: string; gamertag: string | null; avatar: string | null };
    }[];
  }[];
  availablePlayers: {
    userId: string;
    name: string;
    gamertag: string | null;
    avatar: string | null;
  }[];
  teamSize: number;
  createdById: string;
}

export default function TeamDraftModal({
  open,
  onClose,
  tournamentId,
  tournamentGame,
  teamSize,
  maxSlots,
  captainMode,
  createdById,
  userId,
  isAdmin,
  members = [],
  existingPlayerIds,
}: Props) {
  const [phase, setPhase] = useState<"add_players" | "select_captains" | "drafting">("add_players");
  const [playerIds, setPlayerIds] = useState<string[]>([]);
  const [captainIds, setCaptainIds] = useState<string[]>([]);
  const [draftState, setDraftState] = useState<DraftState | null>(null);
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [teamNameInput, setTeamNameInput] = useState("");

  const canManage = userId === createdById || isAdmin;
  const totalPlayersNeeded = maxSlots * teamSize;

  // Load draft state
  const loadDraftState = useCallback(async () => {
    const state = await getDraftState(tournamentId);
    if (state) {
      setDraftState(state as DraftState);
      if (state.draftStatus === "in_progress" || state.draftStatus === "completed") {
        setPhase("drafting");
      } else if (state.teams.length > 0) {
        setPhase("select_captains");
      }
    }
  }, [tournamentId]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => loadDraftState());
    }
  }, [open, loadDraftState]);

  // Poll for draft updates during active draft
  useEffect(() => {
    if (phase === "drafting" && draftState?.draftStatus === "in_progress") {
      const interval = setInterval(loadDraftState, 3000);
      return () => clearInterval(interval);
    }
  }, [phase, draftState?.draftStatus, loadDraftState]);

  const handleAddPlayers = async () => {
    if (playerIds.length === 0) {
      setError("Select at least one player");
      return;
    }
    setLoading("add");
    setError("");
    const result = await addPlayersToTeamTournament(tournamentId, playerIds);
    setLoading("");
    if (result?.error) {
      setError(result.error);
    } else {
      setPlayerIds([]);
      await loadDraftState();
      setPhase("select_captains");
    }
  };

  const handleStartDraft = async () => {
    const mode = captainMode || "random";
    const manualCaptains = mode === "manual" ? captainIds : undefined;

    if (mode === "manual" && captainIds.length !== maxSlots) {
      setError(`Select exactly ${maxSlots} captains`);
      return;
    }

    setLoading("start");
    setError("");
    const result = await startDraft(tournamentId, manualCaptains);
    setLoading("");
    if (result?.error) {
      setError(result.error);
    } else {
      await loadDraftState();
      setPhase("drafting");
    }
  };

  const handlePick = async (pickedUserId: string) => {
    setLoading("pick");
    setError("");
    const result = await makeDraftPick(tournamentId, pickedUserId);
    setLoading("");
    if (result?.error) {
      setError(result.error);
    } else {
      await loadDraftState();
    }
  };

  const handleAutoComplete = async () => {
    setLoading("auto");
    setError("");
    const result = await autoCompleteDraft(tournamentId);
    setLoading("");
    if (result?.error) {
      setError(result.error);
    } else {
      await loadDraftState();
    }
  };

  const handleRenameTeam = async (teamId: string) => {
    if (!teamNameInput.trim()) return;
    setLoading("rename");
    setError("");
    const result = await renameTeam(teamId, teamNameInput);
    setLoading("");
    if (result?.error) {
      setError(result.error);
    } else {
      setEditingTeamId(null);
      setTeamNameInput("");
      await loadDraftState();
    }
  };

  const isMyTurn =
    draftState?.draftStatus === "in_progress" &&
    draftState.currentCaptainId === userId;

  // Available members for adding (filter out already-added)
  const availableMembers = members.filter(
    (m) => !existingPlayerIds.includes(m.id)
  );

  // For captain selection, get entrant user ids
  const entrantUsers = draftState?.availablePlayers
    ? [...(draftState.teams.flatMap((t) => [{ userId: t.captainId, name: t.captain?.name || "Unknown", gamertag: t.captain?.gamertag || null, avatar: null as string | null }])),
       ...draftState.availablePlayers]
    : [];

  return (
    <Modal open={open} onClose={onClose} title="Team Draft" wide>
      {/* Phase indicator */}
      <div className="mb-4 flex items-center gap-1">
        {["Add Players", "Captains", "Draft"].map((label, i) => (
          <div key={label} className="flex-1 text-center">
            <div
              className={`h-1 rounded-full mb-1 transition ${
                i < ["add_players", "select_captains", "drafting"].indexOf(phase) + 1
                  ? "bg-neon"
                  : "bg-border"
              }`}
            />
            <span className="text-xs text-foreground/40">{label}</span>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {/* Phase 1: Add Players */}
        {phase === "add_players" && (
          <>
            <div className="rounded-lg bg-surface-light border border-border p-3">
              <p className="text-sm text-foreground/60">
                Add players to the draft pool. You need at least <strong>{maxSlots * 2}</strong> players
                for {maxSlots} teams (ideal: {totalPlayersNeeded} for full {teamSize}v{teamSize} teams).
              </p>
              <p className="mt-1 text-sm text-foreground/40">
                Currently added: <strong>{existingPlayerIds.length}</strong> players
              </p>
            </div>

            <MemberPicker
              members={availableMembers}
              selected={playerIds}
              onChange={setPlayerIds}
              maxSelections={totalPlayersNeeded - existingPlayerIds.length}
            />

            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const shuffled = [...availableMembers].sort(() => Math.random() - 0.5);
                  const needed = totalPlayersNeeded - existingPlayerIds.length;
                  setPlayerIds(shuffled.slice(0, Math.min(needed, shuffled.length)).map((m) => m.id));
                }}
              >
                Randomize
              </Button>
              {playerIds.length > 0 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setPlayerIds([])}>
                  Clear
                </Button>
              )}
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <div className="flex justify-between">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <div className="flex gap-2">
                {existingPlayerIds.length >= maxSlots * 2 && (
                  <Button variant="secondary" onClick={() => setPhase("select_captains")}>
                    Skip to Captains
                  </Button>
                )}
                <Button onClick={handleAddPlayers} disabled={loading === "add" || playerIds.length === 0}>
                  {loading === "add" ? "Adding..." : `Add ${playerIds.length} Players`}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Phase 2: Select Captains */}
        {phase === "select_captains" && (
          <>
            <div className="rounded-lg bg-surface-light border border-border p-3">
              <p className="text-sm text-foreground/60">
                Captain selection mode: <strong>{CAPTAIN_MODES.find((c) => c.value === (captainMode || "random"))?.label || captainMode}</strong>
              </p>
              {captainMode === "manual" && (
                <p className="mt-1 text-sm text-foreground/40">
                  Select {maxSlots} captains from the player pool.
                </p>
              )}
            </div>

            {captainMode === "manual" && (
              <div className="space-y-2">
                <label className="text-sm text-foreground/70">
                  Select Captains ({captainIds.length}/{maxSlots})
                </label>
                <div className="max-h-40 overflow-y-auto rounded-lg border border-border bg-surface">
                  {entrantUsers.map((p) => (
                    <label
                      key={p.userId}
                      className={`flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm transition hover:bg-surface-light ${
                        captainIds.includes(p.userId) ? "bg-neon/5" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={captainIds.includes(p.userId)}
                        onChange={() => {
                          if (captainIds.includes(p.userId)) {
                            setCaptainIds(captainIds.filter((id) => id !== p.userId));
                          } else if (captainIds.length < maxSlots) {
                            setCaptainIds([...captainIds, p.userId]);
                          }
                        }}
                        disabled={!captainIds.includes(p.userId) && captainIds.length >= maxSlots}
                        className="accent-neon"
                      />
                      <span className="text-foreground">{p.gamertag || p.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {captainMode !== "manual" && (
              <p className="text-sm text-foreground/50">
                Captains will be selected {captainMode === "ranked" ? "by rank" : "randomly"} when the draft starts.
              </p>
            )}

            {error && <p className="text-sm text-danger">{error}</p>}

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setPhase("add_players")}>
                Back
              </Button>
              <Button
                onClick={handleStartDraft}
                disabled={loading === "start" || (captainMode === "manual" && captainIds.length !== maxSlots)}
              >
                {loading === "start" ? "Starting..." : "Start Draft"}
              </Button>
            </div>
          </>
        )}

        {/* Phase 3: Live Draft */}
        {phase === "drafting" && draftState && (
          <>
            {/* Draft status */}
            {draftState.draftStatus === "in_progress" && (
              <div className={`rounded-lg border p-3 ${
                isMyTurn
                  ? "border-neon bg-neon/10"
                  : "border-border bg-surface-light"
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {isMyTurn ? (
                        "Your turn to pick!"
                      ) : (
                        <>
                          Waiting for{" "}
                          <span className="text-neon">
                            {draftState.teams.find((t) => t.captainId === draftState.currentCaptainId)?.captain?.gamertag ||
                              draftState.teams.find((t) => t.captainId === draftState.currentCaptainId)?.captain?.name ||
                              "captain"}
                          </span>
                          {" "}to pick...
                        </>
                      )}
                    </p>
                    <p className="text-xs text-foreground/40 mt-0.5">
                      Pick {draftState.currentPickIndex + 1} of {draftState.totalPicks}
                    </p>
                  </div>
                  {canManage && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleAutoComplete}
                      disabled={loading === "auto"}
                    >
                      {loading === "auto" ? "..." : "Auto-fill Remaining"}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {draftState.draftStatus === "completed" && (
              <div className="rounded-lg border border-neon/30 bg-neon/5 p-3">
                <p className="text-sm font-medium text-neon">Draft complete! Teams are set.</p>
                <p className="text-xs text-foreground/40 mt-0.5">
                  Captains can rename their teams below. Close this modal and generate the bracket to start.
                </p>
              </div>
            )}

            {/* Teams */}
            <div className="space-y-3">
              {draftState.teams.map((team) => {
                const isCaptain = team.captainId === userId;
                const isEditing = editingTeamId === team.id;

                return (
                  <div key={team.id} className="rounded-lg border border-border bg-surface p-3">
                    <div className="flex items-center justify-between mb-2">
                      {isEditing ? (
                        <div className="flex gap-2 flex-1 mr-2">
                          <input
                            type="text"
                            value={teamNameInput}
                            onChange={(e) => setTeamNameInput(e.target.value)}
                            className="flex-1 rounded border border-border bg-surface-light px-2 py-1 text-sm text-foreground focus:border-neon focus:outline-none"
                            maxLength={30}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRenameTeam(team.id);
                              if (e.key === "Escape") { setEditingTeamId(null); setTeamNameInput(""); }
                            }}
                          />
                          <Button size="sm" onClick={() => handleRenameTeam(team.id)} disabled={loading === "rename"}>
                            Save
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-foreground">{team.name}</h4>
                          {(isCaptain || canManage) && (
                            <button
                              onClick={() => { setEditingTeamId(team.id); setTeamNameInput(team.name); }}
                              className="text-xs text-foreground/30 hover:text-foreground/60 transition"
                            >
                              rename
                            </button>
                          )}
                        </div>
                      )}
                      <span className="text-xs text-foreground/30">
                        {team.members.length}/{draftState.teamSize}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {team.members.map((m) => (
                        <span
                          key={m.userId}
                          className={`rounded-full px-2.5 py-1 text-xs ${
                            m.userId === team.captainId
                              ? "border border-neon/40 bg-neon/10 text-neon font-medium"
                              : "border border-border bg-surface-light text-foreground/60"
                          }`}
                        >
                          {m.userId === team.captainId && "C "}
                          {m.user.gamertag || m.user.name}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Available players to pick */}
            {draftState.draftStatus === "in_progress" &&
              draftState.availablePlayers.length > 0 &&
              (isMyTurn || canManage) && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-foreground/70">
                    Available Players ({draftState.availablePlayers.length})
                  </h4>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {draftState.availablePlayers.map((p) => (
                      <button
                        key={p.userId}
                        onClick={() => handlePick(p.userId)}
                        disabled={loading === "pick"}
                        className="flex items-center gap-2 rounded-lg border border-border bg-surface p-2 text-left text-sm transition hover:border-neon/30 hover:bg-surface-light disabled:opacity-50"
                      >
                        {p.avatar && (
                          <img src={p.avatar} alt="" className="h-6 w-6 rounded-full" />
                        )}
                        <span className="text-foreground/70 truncate">
                          {p.gamertag || p.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            {error && <p className="text-sm text-danger">{error}</p>}

            <div className="flex justify-end">
              <Button variant="ghost" onClick={onClose}>
                {draftState.draftStatus === "completed" ? "Close" : "Close (draft continues)"}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
