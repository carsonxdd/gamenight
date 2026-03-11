"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { TAG_REGEX, TEAM_LIMITS } from "@/lib/team-constants";
import { updateTeam, transferCaptaincy, checkTagAvailability } from "@/app/teams/actions";
import type { TeamDetailData } from "./TeamDetail";

interface Props {
  open: boolean;
  onClose: () => void;
  team: TeamDetailData;
}

export default function EditTeamModal({ open, onClose, team }: Props) {
  const [name, setName] = useState(team.name);
  const [tag, setTag] = useState(team.tag);
  const [bio, setBio] = useState(team.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(team.avatarUrl || "");
  const [newCaptainId, setNewCaptainId] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tagStatus, setTagStatus] = useState<"idle" | "checking" | "available" | "taken" | "same">("same");

  useEffect(() => {
    if (tag.toUpperCase() === team.tag) {
      requestAnimationFrame(() => setTagStatus("same"));
      return;
    }
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
  }, [tag, team.tag]);

  const handleSave = async () => {
    setError("");
    setSubmitting(true);

    const result = await updateTeam({
      teamId: team.id,
      name: name.trim(),
      tag: tag.trim().toUpperCase(),
      bio: bio.trim(),
      avatarUrl: avatarUrl.trim(),
    });

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    // Transfer captaincy if changed
    if (newCaptainId && newCaptainId !== team.captainId) {
      const captainResult = await transferCaptaincy(team.id, newCaptainId);
      if (captainResult.error) {
        setError(captainResult.error);
        setSubmitting(false);
        return;
      }
    }

    setSubmitting(false);
    onClose();
  };

  const nonCaptainMembers = team.members.filter((m) => m.userId !== team.captainId);

  return (
    <Modal open={open} onClose={onClose} title="Edit Team" wide>
      {error && (
        <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground/70">Team Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={TEAM_LIMITS.NAME_MAX}
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-neon/50 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground/70">Tag</label>
          <div className="relative">
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5))}
              maxLength={5}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-mono text-foreground focus:border-neon/50 focus:outline-none"
            />
            {tag && tagStatus !== "same" && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs">
                {tagStatus === "checking" && <span className="text-foreground/40">Checking...</span>}
                {tagStatus === "available" && <span className="text-neon">Available</span>}
                {tagStatus === "taken" && <span className="text-danger">Taken</span>}
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground/70">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={TEAM_LIMITS.BIO_MAX}
            rows={3}
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:border-neon/50 focus:outline-none resize-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground/70">Avatar URL</label>
          <input
            type="text"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-neon/50 focus:outline-none"
          />
        </div>

        {nonCaptainMembers.length > 0 && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/70">
              Transfer Captaincy (optional)
            </label>
            <select
              value={newCaptainId}
              onChange={(e) => setNewCaptainId(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-neon/50 focus:outline-none"
            >
              <option value="">Keep current captain</option>
              {nonCaptainMembers.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.user.gamertag || m.user.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={submitting || tagStatus === "taken"}
        >
          {submitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </Modal>
  );
}
