"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { awardBadge, revokeBadge, getUserBadgeStatus } from "@/app/badges/actions";
import type { BadgeData, UserOption } from "./BadgeManager";

interface Props {
  badges: BadgeData[];
  users: UserOption[];
  onClose: () => void;
}

export default function ManualAwardModal({ badges, users, onClose }: Props) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedBadge, setSelectedBadge] = useState("");
  const [status, setStatus] = useState<{ earned: boolean; revoked: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [userSearch, setUserSearch] = useState("");

  const filteredUsers = userSearch
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
          u.gamertag?.toLowerCase().includes(userSearch.toLowerCase())
      )
    : users;

  function handleUserClick(userId: string, e: React.MouseEvent) {
    setStatus(null);
    setMessage("");
    if (e.ctrlKey || e.metaKey) {
      // Toggle individual user
      setSelectedUsers((prev) =>
        prev.includes(userId)
          ? prev.filter((id) => id !== userId)
          : [...prev, userId]
      );
    } else {
      // Single select (replace)
      setSelectedUsers((prev) =>
        prev.length === 1 && prev[0] === userId ? [] : [userId]
      );
    }
  }

  function handleSelectAll() {
    setStatus(null);
    setMessage("");
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map((u) => u.id));
    }
  }

  async function checkStatus() {
    if (selectedUsers.length !== 1 || !selectedBadge) return;
    const s = await getUserBadgeStatus(selectedUsers[0], selectedBadge);
    setStatus(s);
  }

  async function handleAward() {
    if (selectedUsers.length === 0 || !selectedBadge) return;
    setLoading(true);
    setMessage("");
    let succeeded = 0;
    let failed = 0;
    for (const userId of selectedUsers) {
      const result = await awardBadge(userId, selectedBadge);
      if (result.success) succeeded++;
      else failed++;
    }
    setLoading(false);
    if (failed === 0) {
      setMessage(`Badge awarded to ${succeeded} user${succeeded > 1 ? "s" : ""}!`);
    } else {
      setMessage(`Awarded: ${succeeded}, Failed: ${failed}`);
    }
    setStatus(null);
  }

  async function handleRevoke() {
    if (selectedUsers.length === 0 || !selectedBadge) return;
    const count = selectedUsers.length;
    if (!confirm(`Revoke this badge from ${count} user${count > 1 ? "s" : ""}? It won't be auto-re-awarded.`)) return;
    setLoading(true);
    setMessage("");
    let succeeded = 0;
    let failed = 0;
    for (const userId of selectedUsers) {
      const result = await revokeBadge(userId, selectedBadge);
      if (result.success) succeeded++;
      else failed++;
    }
    setLoading(false);
    if (failed === 0) {
      setMessage(`Badge revoked from ${succeeded} user${succeeded > 1 ? "s" : ""}.`);
    } else {
      setMessage(`Revoked: ${succeeded}, Failed: ${failed}`);
    }
    setStatus(null);
  }

  return (
    <Modal open onClose={onClose} title="Award / Revoke Badge">
      <div className="space-y-4">
        {/* User Picker */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-xs text-foreground/50">
              Users ({selectedUsers.length} selected)
            </label>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs text-neon hover:underline"
            >
              {selectedUsers.length === filteredUsers.length ? "Deselect All" : "Select All"}
            </button>
          </div>
          <input
            value={userSearch}
            onChange={(e) => {
              setUserSearch(e.target.value);
              setStatus(null);
            }}
            placeholder="Search users..."
            className="mb-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
          <div
            className="max-h-48 overflow-y-auto rounded-lg border border-border bg-background"
          >
            {filteredUsers.map((u) => {
              const isSelected = selectedUsers.includes(u.id);
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={(e) => handleUserClick(u.id, e)}
                  className={`w-full px-3 py-1.5 text-left text-sm transition ${
                    isSelected
                      ? "bg-neon/15 text-neon"
                      : "text-foreground hover:bg-surface"
                  }`}
                >
                  {u.gamertag || u.name}
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-[11px] text-foreground/30">
            Ctrl+click to select multiple
          </p>
        </div>

        {/* Badge Picker */}
        <div>
          <label className="mb-1 block text-xs text-foreground/50">Badge</label>
          <select
            value={selectedBadge}
            onChange={(e) => {
              setSelectedBadge(e.target.value);
              setStatus(null);
            }}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="">Select a badge...</option>
            {badges.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.category})
              </option>
            ))}
          </select>
        </div>

        {/* Check Status (single user only) */}
        {selectedUsers.length === 1 && selectedBadge && (
          <div>
            {!status ? (
              <button
                onClick={checkStatus}
                className="text-sm text-neon hover:underline"
              >
                Check current status
              </button>
            ) : (
              <p className="text-sm text-foreground/60">
                Status:{" "}
                {status.revoked
                  ? "Revoked (suppressed)"
                  : status.earned
                  ? "Earned"
                  : "Not earned"}
              </p>
            )}
          </div>
        )}

        {message && (
          <p className={`text-sm ${message.includes("!") ? "text-neon" : "text-red-400"}`}>
            {message}
          </p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm text-foreground/60 hover:text-foreground"
          >
            Close
          </button>
          <button
            onClick={handleRevoke}
            disabled={loading || selectedUsers.length === 0 || !selectedBadge}
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
          >
            Revoke{selectedUsers.length > 1 ? ` (${selectedUsers.length})` : ""}
          </button>
          <button
            onClick={handleAward}
            disabled={loading || selectedUsers.length === 0 || !selectedBadge}
            className="rounded-lg bg-neon px-4 py-2 text-sm font-medium text-background transition hover:bg-neon/90 disabled:opacity-50"
          >
            {loading ? "..." : `Award${selectedUsers.length > 1 ? ` (${selectedUsers.length})` : ""}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
