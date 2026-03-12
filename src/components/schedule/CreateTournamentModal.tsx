"use client";

import { useState, useEffect, useMemo } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import MemberPicker from "./MemberPicker";
import { GAMES } from "@/lib/constants";
import {
  BRACKET_TYPES,
  FORMAT_OPTIONS,
  SEEDING_MODES,
  CAPTAIN_MODES,
  BEST_OF_OPTIONS,
  SLOT_PRESETS,
  GAME_TEAM_SIZES,
  TOURNAMENT_LIMITS,
} from "@/lib/tournament-constants";
import { calculatePrizePool } from "@/lib/bracket-utils";
import { createTournament, fetchTemplates } from "@/app/schedule/tournament-actions";
import { InvitableMember } from "./ScheduleView";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string;
  isAdmin?: boolean;
  members?: InvitableMember[];
}

interface TemplateData {
  id: string;
  name: string;
  bracketType: string;
  format: string;
  teamSize: number | null;
  bestOf: number;
  seedingMode: string;
  captainMode: string | null;
}

export default function CreateTournamentModal({
  open,
  onClose,
  members = [],
}: Props) {
  const settings = useSiteSettings();
  const maxSlotsCap = settings.maxTournamentSize || TOURNAMENT_LIMITS.MAX_SLOTS;
  const [step, setStep] = useState(1);
  const totalSteps = 6;

  // Step 1: Basics
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [game, setGame] = useState(GAMES[0]);

  // Step 2: Format
  const [format, setFormat] = useState("solo");
  const [teamSize, setTeamSize] = useState(5);
  const [bracketType, setBracketType] = useState("single_elim");
  const [bestOf, setBestOf] = useState(1);

  // Step 3: Seeding
  const [seedingMode, setSeedingMode] = useState("random");
  const [captainMode, setCaptainMode] = useState("random");

  // Step 4: Schedule
  const [isMultiSession, setIsMultiSession] = useState(false);
  const [sessions, setSessions] = useState<{ label: string; date: string }[]>([
    { label: "Round 1", date: "" },
  ]);
  const [scheduleMode, setScheduleMode] = useState<"dates" | "frequency">("dates");
  const [startDate, setStartDate] = useState("");
  const [sessionCount, setSessionCount] = useState(3);

  // Step 5: Extras
  const [buyIn, setBuyIn] = useState<string>("");
  const [maxSlots, setMaxSlots] = useState(8);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");

  // Step 6: Players
  const [participantIds, setParticipantIds] = useState<string[]>([]);

  // Templates
  const [templates, setTemplates] = useState<TemplateData[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load templates when modal opens
  useEffect(() => {
    if (open) {
      fetchTemplates().then((t) => {
        setTemplates(t as TemplateData[]);
      });
    }
  }, [open]);

  // Auto-set team size when game changes
  const handleGameChange = (newGame: string) => {
    setGame(newGame);
    if (format === "team" && GAME_TEAM_SIZES[newGame]) {
      setTeamSize(GAME_TEAM_SIZES[newGame]);
    }
  };

  const handleFormatChange = (newFormat: string) => {
    setFormat(newFormat);
    if (newFormat === "team" && GAME_TEAM_SIZES[game]) {
      setTeamSize(GAME_TEAM_SIZES[game]);
    }
  };

  // Auto-generate sessions from frequency
  const generatedSessions = useMemo(() => {
    if (isMultiSession && scheduleMode === "frequency" && startDate) {
      const newSessions: { label: string; date: string }[] = [];
      const roundLabels = ["Round 1", "Round 2", "Quarterfinals", "Semifinals", "Finals"];
      for (let i = 0; i < sessionCount; i++) {
        const d = new Date(startDate + "T00:00:00");
        d.setDate(d.getDate() + i * 7);
        const dateStr = d.toISOString().split("T")[0];
        newSessions.push({
          label: i < roundLabels.length ? roundLabels[i] : `Round ${i + 1}`,
          date: dateStr,
        });
      }
      return newSessions;
    }
    return null;
  }, [isMultiSession, scheduleMode, startDate, sessionCount]);

  const activeSessions = generatedSessions ?? sessions;

  const prizePool = calculatePrizePool(parseFloat(buyIn) || null, maxSlots);

  const applyTemplate = (template: TemplateData) => {
    setBracketType(template.bracketType);
    setFormat(template.format);
    setTeamSize(template.teamSize || 5);
    setBestOf(template.bestOf);
    setSeedingMode(template.seedingMode);
    setCaptainMode(template.captainMode || "random");
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    const result = await createTournament({
      title,
      description: description || undefined,
      game,
      bracketType,
      format,
      teamSize: format === "team" ? teamSize : undefined,
      bestOf,
      maxSlots,
      seedingMode,
      captainMode: format === "team" ? captainMode : undefined,
      buyIn: parseFloat(buyIn) || undefined,
      isMultiSession,
      sessions: isMultiSession ? activeSessions.filter((s) => s.date) : undefined,
      participantIds: participantIds.length > 0 ? participantIds : undefined,
      saveAsTemplate,
      templateName: saveAsTemplate ? templateName : undefined,
    });

    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      resetForm();
      onClose();
    }
  };

  const resetForm = () => {
    setStep(1);
    setTitle("");
    setDescription("");
    setGame(GAMES[0]);
    setFormat("solo");
    setBracketType("single_elim");
    setBestOf(1);
    setSeedingMode("random");
    setCaptainMode("random");
    setIsMultiSession(false);
    setSessions([{ label: "Round 1", date: "" }]);
    setBuyIn("");
    setMaxSlots(8);
    setParticipantIds([]);
    setSaveAsTemplate(false);
    setTemplateName("");
    setError("");
  };

  const canProceed = () => {
    switch (step) {
      case 1: return title.trim().length > 0 && title.length <= TOURNAMENT_LIMITS.TITLE_MAX;
      case 2: return true;
      case 3: return true;
      case 4: return !isMultiSession || activeSessions.some((s) => s.date);
      case 5: return maxSlots >= TOURNAMENT_LIMITS.MIN_SLOTS && maxSlots <= maxSlotsCap;
      case 6: return true;
      default: return true;
    }
  };

  const inputClass =
    "w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground placeholder:text-foreground/30 focus:border-neon focus:outline-none";
  const labelClass = "mb-1 block text-sm text-foreground/70";

  return (
    <Modal open={open} onClose={onClose} title="Create Tournament" wide>
      {/* Step indicator */}
      <div className="mb-6 flex items-center gap-1">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition ${
              i + 1 <= step ? "bg-neon" : "bg-border"
            }`}
          />
        ))}
      </div>

      {/* Template loader */}
      {step === 1 && templates.length > 0 && (
        <div className="mb-4">
          <label className={labelClass}>Load from template</label>
          <div className="flex flex-wrap gap-1.5">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => applyTemplate(t)}
                className="rounded-full border border-border bg-surface-light px-2.5 py-1 text-xs text-foreground/60 transition hover:border-neon/30 hover:text-foreground"
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Step 1: Basics */}
        {step === 1 && (
          <>
            <div>
              <label className={labelClass}>Tournament Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Friday Night Valorant Championship"
                maxLength={TOURNAMENT_LIMITS.TITLE_MAX}
                className={inputClass}
              />
              <span className="mt-0.5 block text-right text-xs text-foreground/30">
                {title.length}/{TOURNAMENT_LIMITS.TITLE_MAX}
              </span>
            </div>
            <div>
              <label className={labelClass}>Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tournament rules, prizes, etc."
                maxLength={TOURNAMENT_LIMITS.DESCRIPTION_MAX}
                rows={3}
                className={inputClass + " resize-none"}
              />
            </div>
            <div>
              <label className={labelClass}>Game</label>
              <select
                value={game}
                onChange={(e) => handleGameChange(e.target.value)}
                className={inputClass}
              >
                {GAMES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* Step 2: Format */}
        {step === 2 && (
          <>
            <div>
              <label className={labelClass}>Format</label>
              <div className="grid grid-cols-2 gap-2">
                {FORMAT_OPTIONS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => handleFormatChange(f.value)}
                    className={`rounded-lg border p-3 text-left transition ${
                      format === f.value
                        ? "border-neon bg-neon/10 text-neon"
                        : "border-border text-foreground/60 hover:border-border-light"
                    }`}
                  >
                    <div className="text-sm font-medium">{f.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {format === "team" && (
              <div>
                <label className={labelClass}>
                  Team Size {GAME_TEAM_SIZES[game] ? `(${game} default: ${GAME_TEAM_SIZES[game]}v${GAME_TEAM_SIZES[game]})` : ""}
                </label>
                <div className="flex gap-2">
                  {[2, 3, 4, 5, 6].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setTeamSize(s)}
                      className={`rounded-lg border px-4 py-2 text-sm transition ${
                        teamSize === s
                          ? "border-neon bg-neon/10 text-neon"
                          : "border-border text-foreground/60 hover:border-border-light"
                      }`}
                    >
                      {s}v{s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className={labelClass}>Bracket Type</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {BRACKET_TYPES.map((b) => (
                  <button
                    key={b.value}
                    type="button"
                    onClick={() => setBracketType(b.value)}
                    className={`rounded-lg border p-3 text-left transition ${
                      bracketType === b.value
                        ? "border-neon bg-neon/10"
                        : "border-border hover:border-border-light"
                    }`}
                  >
                    <div className={`text-sm font-medium ${bracketType === b.value ? "text-neon" : "text-foreground/70"}`}>
                      {b.label}
                    </div>
                    <div className="text-xs text-foreground/40">{b.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Match Format</label>
              <div className="flex gap-2">
                {BEST_OF_OPTIONS.map((bo) => (
                  <button
                    key={bo.value}
                    type="button"
                    onClick={() => setBestOf(bo.value)}
                    className={`rounded-lg border px-4 py-2 text-sm transition ${
                      bestOf === bo.value
                        ? "border-neon bg-neon/10 text-neon"
                        : "border-border text-foreground/60 hover:border-border-light"
                    }`}
                  >
                    {bo.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Step 3: Seeding */}
        {step === 3 && (
          <>
            <div>
              <label className={labelClass}>Seeding Mode</label>
              <div className="space-y-2">
                {SEEDING_MODES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSeedingMode(s.value)}
                    className={`w-full rounded-lg border p-3 text-left transition ${
                      seedingMode === s.value
                        ? "border-neon bg-neon/10"
                        : "border-border hover:border-border-light"
                    }`}
                  >
                    <div className={`text-sm font-medium ${seedingMode === s.value ? "text-neon" : "text-foreground/70"}`}>
                      {s.label}
                    </div>
                    <div className="text-xs text-foreground/40">{s.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {format === "team" && (
              <div>
                <label className={labelClass}>Captain Selection</label>
                <div className="space-y-2">
                  {CAPTAIN_MODES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCaptainMode(c.value)}
                      className={`w-full rounded-lg border p-3 text-left transition ${
                        captainMode === c.value
                          ? "border-neon bg-neon/10"
                          : "border-border hover:border-border-light"
                      }`}
                    >
                      <div className={`text-sm font-medium ${captainMode === c.value ? "text-neon" : "text-foreground/70"}`}>
                        {c.label}
                      </div>
                      <div className="text-xs text-foreground/40">{c.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Step 4: Schedule */}
        {step === 4 && (
          <>
            <div>
              <label className="flex items-center gap-2 text-sm text-foreground/70">
                <input
                  type="checkbox"
                  checked={isMultiSession}
                  onChange={(e) => setIsMultiSession(e.target.checked)}
                  className="rounded accent-neon"
                />
                Multi-session tournament (spans multiple days)
              </label>
            </div>

            {isMultiSession && (
              <>
                <div className="flex rounded-lg border border-border bg-surface p-1">
                  <button
                    type="button"
                    onClick={() => setScheduleMode("dates")}
                    className={`flex-1 rounded-md px-3 py-1.5 text-sm transition ${
                      scheduleMode === "dates"
                        ? "bg-neon/10 text-neon"
                        : "text-foreground/50 hover:text-foreground"
                    }`}
                  >
                    Pick Dates
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleMode("frequency")}
                    className={`flex-1 rounded-md px-3 py-1.5 text-sm transition ${
                      scheduleMode === "frequency"
                        ? "bg-neon/10 text-neon"
                        : "text-foreground/50 hover:text-foreground"
                    }`}
                  >
                    Start Date + Frequency
                  </button>
                </div>

                {scheduleMode === "frequency" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Start Date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Number of Sessions</label>
                      <select
                        value={sessionCount}
                        onChange={(e) => setSessionCount(Number(e.target.value))}
                        className={inputClass}
                      >
                        {[2, 3, 4, 5, 6, 8].map((n) => (
                          <option key={n} value={n}>{n} sessions (weekly)</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className={labelClass}>Sessions</label>
                  {sessions.map((s, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={s.label}
                        onChange={(e) => {
                          const updated = [...sessions];
                          updated[i] = { ...updated[i], label: e.target.value };
                          setSessions(updated);
                        }}
                        placeholder="Round label"
                        className={inputClass + " flex-1"}
                      />
                      <input
                        type="date"
                        value={s.date}
                        onChange={(e) => {
                          const updated = [...sessions];
                          updated[i] = { ...updated[i], date: e.target.value };
                          setSessions(updated);
                        }}
                        className={inputClass + " w-40"}
                      />
                      {scheduleMode === "dates" && sessions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setSessions(sessions.filter((_, j) => j !== i))}
                          className="text-foreground/30 hover:text-danger transition"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  {scheduleMode === "dates" && (
                    <button
                      type="button"
                      onClick={() =>
                        setSessions([
                          ...sessions,
                          { label: `Round ${sessions.length + 1}`, date: "" },
                        ])
                      }
                      className="text-sm text-neon/70 hover:text-neon transition"
                    >
                      + Add Session
                    </button>
                  )}
                </div>
              </>
            )}

            {!isMultiSession && (
              <p className="text-sm text-foreground/40 rounded-lg bg-surface-light border border-border px-3 py-2">
                Single-session tournaments happen in one sitting. You can link it to a game night event later.
              </p>
            )}
          </>
        )}

        {/* Step 5: Extras */}
        {step === 5 && (
          <>
            <div>
              <label className={labelClass}>Max Slots ({format === "team" ? "teams" : "players"})</label>
              <div className="flex gap-2 mb-2">
                {SLOT_PRESETS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setMaxSlots(s)}
                    className={`rounded-lg border px-4 py-2 text-sm transition ${
                      maxSlots === s
                        ? "border-neon bg-neon/10 text-neon"
                        : "border-border text-foreground/60 hover:border-border-light"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={maxSlots}
                onChange={(e) => setMaxSlots(Math.max(TOURNAMENT_LIMITS.MIN_SLOTS, Math.min(maxSlotsCap, Number(e.target.value))))}
                min={TOURNAMENT_LIMITS.MIN_SLOTS}
                max={maxSlotsCap}
                className={inputClass}
              />
            </div>

            {settings.enableBuyIns && (
              <div>
                <label className={labelClass}>Buy-in (optional)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40">$</span>
                  <input
                    type="number"
                    value={buyIn}
                    onChange={(e) => setBuyIn(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className={inputClass + " pl-7"}
                  />
                </div>
                {prizePool && (
                  <p className="mt-1 text-sm text-neon">
                    Estimated prize pool: ${prizePool.toFixed(2)}
                  </p>
                )}
              </div>
            )}

            <div className="border-t border-border pt-3">
              <label className="flex items-center gap-2 text-sm text-foreground/70">
                <input
                  type="checkbox"
                  checked={saveAsTemplate}
                  onChange={(e) => setSaveAsTemplate(e.target.checked)}
                  className="rounded accent-neon"
                />
                Save as template for future tournaments
              </label>
              {saveAsTemplate && (
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Template name"
                  className={inputClass + " mt-2"}
                />
              )}
            </div>
          </>
        )}

        {/* Step 6: Players */}
        {step === 6 && (
          <>
            {format === "solo" ? (
              <>
                <p className="text-sm text-foreground/50">
                  Add players now, or leave empty and open signups. You can also pull from event RSVPs later.
                </p>
                <MemberPicker
                  members={members}
                  selected={participantIds}
                  onChange={setParticipantIds}
                  maxSelections={maxSlots}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Randomize from all members up to maxSlots
                      const shuffled = [...members].sort(() => Math.random() - 0.5);
                      setParticipantIds(shuffled.slice(0, maxSlots).map((m) => m.id));
                    }}
                  >
                    Randomize
                  </Button>
                  {participantIds.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setParticipantIds([])}
                    >
                      Clear All
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-foreground/50 rounded-lg bg-surface-light border border-border px-3 py-2">
                  Team tournaments support two modes:
                </p>
                <div className="rounded-lg border border-border bg-surface p-3">
                  <h4 className="text-sm font-medium text-neon mb-1">Live Draft</h4>
                  <p className="text-xs text-foreground/50">
                    Add individual players, then use the snake draft system to form teams. Create the tournament, add players, and start the draft from the tournament detail page.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-surface p-3">
                  <h4 className="text-sm font-medium text-neon mb-1">Premade Teams</h4>
                  <p className="text-xs text-foreground/50">
                    Team captains register their persistent teams from the Teams page. Each team&apos;s roster is snapshotted at registration. Open the tournament and let captains register.
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <div>
            {step > 1 && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setStep(step - 1); setError(""); }}
              >
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <span className="self-center text-xs text-foreground/30">
              Step {step} of {totalSteps}
            </span>
            {step < totalSteps ? (
              <Button
                type="button"
                onClick={() => { if (canProceed()) { setStep(step + 1); setError(""); } }}
                disabled={!canProceed()}
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !canProceed()}
              >
                {loading ? "Creating..." : "Create Tournament"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
