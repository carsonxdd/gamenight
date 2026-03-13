"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { fadeIn } from "@/lib/animations";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { cycleRole, removeUser, muteUser, unmuteUser, tempMuteUser } from "@/app/admin/actions";
import { isUserMuted, formatMuteRemaining } from "@/lib/mute-utils";

interface PlayerData {
  id: string;
  name: string;
  gamertag: string | null;
  avatar: string | null;
  isAdmin: boolean;
  isModerator: boolean;
  isOwner: boolean;
  willingToModerate: boolean;
  isMuted: boolean;
  mutedUntil: string | null;
  games: string[];
  availabilityDays: number[];
  lastSeenAt: string | null;
}

interface Props {
  players: PlayerData[];
  currentUserId: string;
  isCurrentUserAdmin: boolean;
  isCurrentUserModerator?: boolean;
}

const dayAbbrevs = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function formatLastSeen(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

export default function PlayerRoster({ players, currentUserId, isCurrentUserAdmin, isCurrentUserModerator = false }: Props) {
  const [search, setSearch] = useState("");
  const [showModOnly, setShowModOnly] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<PlayerData | null>(null);
  const [tempMuteTarget, setTempMuteTarget] = useState<string | null>(null);
  const [tempMuteMinutes, setTempMuteMinutes] = useState("30");
  const [isPending, startTransition] = useTransition();

  const willingCount = players.filter((p) => p.willingToModerate).length;

  const filtered = players.filter((p) => {
    if (showModOnly && !p.willingToModerate) return false;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.gamertag?.toLowerCase().includes(q) ?? false) ||
      p.games.some((g) => g.toLowerCase().includes(q))
    );
  });

  function handleCycleRole(userId: string, direction: "promote" | "demote") {
    startTransition(async () => {
      const result = await cycleRole(userId, direction);
      if (result.error) alert(result.error);
    });
  }

  function handleRemove() {
    if (!confirmRemove) return;
    startTransition(async () => {
      const result = await removeUser(confirmRemove.id);
      if (result.error) alert(result.error);
      setConfirmRemove(null);
    });
  }

  function handleMute(userId: string) {
    startTransition(async () => {
      const result = await muteUser(userId);
      if (result.error) alert(result.error);
    });
  }

  function handleUnmute(userId: string) {
    startTransition(async () => {
      const result = await unmuteUser(userId);
      if (result.error) alert(result.error);
    });
  }

  function handleTempMute(userId: string) {
    const mins = parseInt(tempMuteMinutes);
    if (isNaN(mins) || mins < 1 || mins > 10080) {
      alert("Enter 1–10080 minutes");
      return;
    }
    startTransition(async () => {
      const result = await tempMuteUser(userId, mins);
      if (result.error) alert(result.error);
      setTempMuteTarget(null);
      setTempMuteMinutes("30");
    });
  }

  return (
    <motion.div {...fadeIn}>
      {/* Search & Filter */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Search by name, gamertag, or game..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-border bg-surface px-4 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-neon/50 focus:outline-none focus:ring-1 focus:ring-neon/50"
        />
        {willingCount > 0 && (
          <button
            onClick={() => setShowModOnly(!showModOnly)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
              showModOnly
                ? "border-warning/50 bg-warning/10 text-warning"
                : "border-border bg-surface text-foreground/50 hover:border-warning/30 hover:text-warning/70"
            }`}
          >
            <span>Willing to Mod</span>
            <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
              showModOnly ? "bg-warning/20 text-warning" : "bg-surface-lighter text-foreground/40"
            }`}>
              {willingCount}
            </span>
          </button>
        )}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 text-xs font-medium text-foreground/50">
                  Player
                </th>
                <th className="pb-3 text-xs font-medium text-foreground/50">
                  Gamertag
                </th>
                <th className="hidden pb-3 text-xs font-medium text-foreground/50 md:table-cell">
                  Games
                </th>
                <th className="hidden pb-3 text-xs font-medium text-foreground/50 lg:table-cell">
                  Availability
                </th>
                <th className="hidden pb-3 text-xs font-medium text-foreground/50 sm:table-cell">
                  Last Seen
                </th>
                <th className="pb-3 text-xs font-medium text-foreground/50">
                  Role
                </th>
                <th className="pb-3 text-xs font-medium text-foreground/50">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((player) => {
                const isSelf = player.id === currentUserId;
                return (
                  <tr
                    key={player.id}
                    className="group border-b border-border/50 last:border-0"
                  >
                    {/* Player */}
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        {player.avatar ? (
                          <img
                            src={player.avatar}
                            alt=""
                            className="h-7 w-7 rounded-full"
                          />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-light text-xs text-foreground/50">
                            {player.name.charAt(0)}
                          </div>
                        )}
                        <span className="text-sm text-foreground">
                          {player.name}
                        </span>
                      </div>
                    </td>

                    {/* Gamertag */}
                    <td className="py-3 pr-3">
                      <span className="text-sm text-foreground/70">
                        {player.gamertag || "—"}
                      </span>
                    </td>

                    {/* Games */}
                    <td className="hidden py-3 pr-3 md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {player.games.slice(0, 3).map((g) => (
                          <Badge key={g} variant="neutral">
                            {g}
                          </Badge>
                        ))}
                        {player.games.length > 3 && (
                          <Badge variant="neutral">
                            +{player.games.length - 3}
                          </Badge>
                        )}
                      </div>
                    </td>

                    {/* Availability */}
                    <td className="hidden py-3 pr-3 lg:table-cell">
                      <div className="flex gap-1">
                        {dayAbbrevs.map((d, i) => (
                          <span
                            key={i}
                            className={`rounded px-1.5 py-0.5 text-xs ${
                              player.availabilityDays.includes(i)
                                ? "bg-neon/15 text-neon"
                                : "text-foreground/20"
                            }`}
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Last Seen */}
                    <td className="hidden py-3 pr-3 sm:table-cell">
                      <span className={`text-xs ${
                        !player.lastSeenAt ? "text-foreground/30" :
                        Date.now() - new Date(player.lastSeenAt).getTime() < 900000 ? "text-neon" :
                        "text-foreground/50"
                      }`}>
                        {formatLastSeen(player.lastSeenAt)}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="py-3 pr-3">
                      <div className="flex flex-wrap gap-1">
                        {player.isOwner && (
                          <Badge variant="neon">Owner</Badge>
                        )}
                        {player.isAdmin && !player.isOwner && (
                          <Badge variant="neon">Admin</Badge>
                        )}
                        {player.isModerator && (
                          <Badge variant="danger">Mod</Badge>
                        )}
                        {!player.isAdmin && !player.isModerator && !player.isOwner && (
                          <Badge variant="neutral">Member</Badge>
                        )}
                        {isUserMuted(player) && (
                          <Badge variant="danger">
                            {player.mutedUntil && new Date(player.mutedUntil) > new Date()
                              ? `Muted ${formatMuteRemaining(player.mutedUntil)}`
                              : "Muted"}
                          </Badge>
                        )}
                        {player.willingToModerate && !player.isAdmin && !player.isModerator && !player.isOwner && (
                          <Badge variant="warning">Willing to Mod</Badge>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3">
                      {!isSelf && !player.isOwner && isCurrentUserAdmin && (
                        <>
                          <div className="flex flex-wrap gap-2 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
                            {!player.isAdmin && (
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={isPending}
                                onClick={() => handleCycleRole(player.id, "promote")}
                              >
                                Promote
                              </Button>
                            )}
                            {(player.isAdmin || player.isModerator) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={isPending}
                                onClick={() => handleCycleRole(player.id, "demote")}
                              >
                                Demote
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="danger"
                              disabled={isPending}
                              onClick={() => setConfirmRemove(player)}
                            >
                              Remove
                            </Button>
                            {isUserMuted(player) ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={isPending}
                                onClick={() => handleUnmute(player.id)}
                              >
                                Unmute
                              </Button>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={isPending}
                                  onClick={() => handleMute(player.id)}
                                >
                                  Mute
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={isPending}
                                  onClick={() => setTempMuteTarget(tempMuteTarget === player.id ? null : player.id)}
                                >
                                  Temp
                                </Button>
                              </>
                            )}
                          </div>
                          {tempMuteTarget === player.id && (
                            <div className="mt-1 flex items-center gap-2">
                              <input
                                type="number"
                                min={1}
                                max={10080}
                                value={tempMuteMinutes}
                                onChange={(e) => setTempMuteMinutes(e.target.value)}
                                className="w-20 rounded border border-border bg-surface px-2 py-1 text-xs text-foreground"
                                placeholder="mins"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={isPending}
                                onClick={() => handleTempMute(player.id)}
                              >
                                Apply
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                      {/* Mod-only actions: mute regular members only */}
                      {!isSelf && !player.isOwner && !isCurrentUserAdmin && isCurrentUserModerator && !player.isAdmin && !player.isModerator && (
                        <>
                          <div className="flex flex-wrap gap-2 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
                            {!isUserMuted(player) && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={isPending}
                                  onClick={() => handleMute(player.id)}
                                >
                                  Mute
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={isPending}
                                  onClick={() => setTempMuteTarget(tempMuteTarget === player.id ? null : player.id)}
                                >
                                  Temp
                                </Button>
                              </>
                            )}
                          </div>
                          {tempMuteTarget === player.id && (
                            <div className="mt-1 flex items-center gap-2">
                              <input
                                type="number"
                                min={1}
                                max={10080}
                                value={tempMuteMinutes}
                                onChange={(e) => setTempMuteMinutes(e.target.value)}
                                className="w-20 rounded border border-border bg-surface px-2 py-1 text-xs text-foreground"
                                placeholder="mins"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={isPending}
                                onClick={() => handleTempMute(player.id)}
                              >
                                Apply
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-sm text-foreground/40"
                  >
                    No players found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Remove confirmation modal */}
      <Modal
        open={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        title="Remove Player"
      >
        <p className="mb-4 text-sm text-foreground/70">
          Are you sure you want to remove{" "}
          <span className="font-semibold text-foreground">
            {confirmRemove?.name}
          </span>
          ? This will delete all their data including games, availability, and
          RSVPs.
        </p>
        <div className="flex justify-end gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmRemove(null)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={isPending}
            onClick={handleRemove}
          >
            {isPending ? "Removing..." : "Remove"}
          </Button>
        </div>
      </Modal>
    </motion.div>
  );
}
