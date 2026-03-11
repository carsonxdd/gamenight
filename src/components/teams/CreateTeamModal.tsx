"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { GAMES } from "@/lib/constants";
import { TAG_REGEX, TEAM_LIMITS, getTeamSizeLimits } from "@/lib/team-constants";
import { createTeam, checkTagAvailability } from "@/app/teams/actions";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CreateTeamModal({ open, onClose }: Props) {
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Step 1
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [game, setGame] = useState("");
  const [tagStatus, setTagStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  // Step 2
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Check tag availability with debounce
  useEffect(() => {
    if (!tag || !TAG_REGEX.test(tag)) {
      requestAnimationFrame(() => setTagStatus("idle"));
      return;
    }

    requestAnimationFrame(() => setTagStatus("checking"));
    const timeout = setTimeout(async () => {
      const result = await checkTagAvailability(tag);
      setTagStatus(result.available ? "available" : "taken");
    }, 400);

    return () => clearTimeout(timeout);
  }, [tag]);

  const resetForm = () => {
    setStep(1);
    setName("");
    setTag("");
    setGame("");
    setBio("");
    setAvatarUrl("");
    setError("");
    setTagStatus("idle");
    setSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const canProceed = () => {
    if (step === 1) {
      return name.trim() && tag.trim() && TAG_REGEX.test(tag) && tagStatus === "available" && game;
    }
    return true;
  };

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);

    const result = await createTeam({
      name: name.trim(),
      tag: tag.trim().toUpperCase(),
      game,
      bio: bio.trim() || undefined,
      avatarUrl: avatarUrl.trim() || undefined,
    });

    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    handleClose();
  };

  const sizeLimits = game ? getTeamSizeLimits(game) : null;

  return (
    <Modal open={open} onClose={handleClose} title="Create Team" wide>
      {/* Step indicator */}
      <div className="mb-6 flex items-center gap-2">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
                step > i + 1
                  ? "bg-neon text-background"
                  : step === i + 1
                    ? "border-2 border-neon text-neon"
                    : "border border-border text-foreground/30"
              }`}
            >
              {i + 1}
            </div>
            {i < totalSteps - 1 && (
              <div className={`h-px w-8 ${step > i + 1 ? "bg-neon" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Step 1: Name, Tag, Game */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/70">Team Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={TEAM_LIMITS.NAME_MAX}
              placeholder="e.g. Nova Esports"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:border-neon/50 focus:outline-none"
            />
            <p className="mt-1 text-xs text-foreground/30">{name.length}/{TEAM_LIMITS.NAME_MAX}</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/70">Tag (3–5 characters)</label>
            <div className="relative">
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5))}
                maxLength={5}
                placeholder="e.g. NOVA"
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-mono text-foreground placeholder:text-foreground/30 focus:border-neon/50 focus:outline-none"
              />
              {tag && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs">
                  {tagStatus === "checking" && <span className="text-foreground/40">Checking...</span>}
                  {tagStatus === "available" && <span className="text-neon">Available</span>}
                  {tagStatus === "taken" && <span className="text-danger">Taken</span>}
                </span>
              )}
            </div>
            {tag && (
              <p className="mt-1 text-xs text-foreground/30">
                Players will appear as <span className="font-mono text-neon">[{tag}] Gamertag</span>
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/70">Game</label>
            <select
              value={game}
              onChange={(e) => setGame(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-neon/50 focus:outline-none"
            >
              <option value="">Select a game</option>
              {GAMES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            {sizeLimits && (
              <p className="mt-1 text-xs text-foreground/30">
                Roster size: {sizeLimits.minSize}–{sizeLimits.maxSize} players
              </p>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Bio & Avatar */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/70">Bio (optional)</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={TEAM_LIMITS.BIO_MAX}
              placeholder="A short description of your team..."
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:border-neon/50 focus:outline-none resize-none"
            />
            <p className="mt-1 text-xs text-foreground/30">{bio.length}/{TEAM_LIMITS.BIO_MAX}</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/70">Avatar URL (optional)</label>
            <input
              type="text"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.png"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:border-neon/50 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="flex items-center gap-3 mb-3">
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="h-12 w-12 rounded-lg object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-neon/10 text-sm font-bold text-neon">
                  {tag.slice(0, 2)}
                </div>
              )}
              <div>
                <h3 className="font-bold text-foreground">{name}</h3>
                <span className="text-sm font-mono text-neon/70">[{tag}]</span>
              </div>
            </div>
            <div className="space-y-1 text-sm text-foreground/60">
              <p>Game: <span className="text-foreground">{game}</span></p>
              {sizeLimits && <p>Roster: <span className="text-foreground">{sizeLimits.minSize}–{sizeLimits.maxSize} players</span></p>}
              {bio && <p>Bio: <span className="text-foreground">{bio}</span></p>}
            </div>
          </div>
          <p className="text-xs text-foreground/40">
            You will be the captain. Invite members after creating the team.
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <div>
          {step > 1 && (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
        </div>
        <div>
          {step < totalSteps ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Creating..." : "Create Team"}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
