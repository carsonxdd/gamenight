"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { fadeIn } from "@/lib/animations";
import { DAYS_OF_WEEK } from "@/lib/constants";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { cycleRole, removeUser } from "@/app/admin/actions";

interface PlayerData {
  id: string;
  name: string;
  gamertag: string | null;
  avatar: string | null;
  isAdmin: boolean;
  isModerator: boolean;
  isOwner: boolean;
  willingToModerate: boolean;
  games: string[];
  availabilityDays: number[];
}

interface Props {
  players: PlayerData[];
  currentUserId: string;
  isCurrentUserAdmin: boolean;
}

const dayAbbrevs = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function PlayerRoster({ players, currentUserId, isCurrentUserAdmin }: Props) {
  const [search, setSearch] = useState("");
  const [confirmRemove, setConfirmRemove] = useState<PlayerData | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = players.filter((p) => {
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

  return (
    <motion.div {...fadeIn}>
      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, gamertag, or game..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-neon/50 focus:outline-none focus:ring-1 focus:ring-neon/50"
        />
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
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3">
                      {!isSelf && !player.isOwner && isCurrentUserAdmin && (
                        <div className="flex gap-2 opacity-0 transition group-hover:opacity-100">
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
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
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
