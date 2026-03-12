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
  const [selectedUser, setSelectedUser] = useState("");
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

  async function checkStatus() {
    if (!selectedUser || !selectedBadge) return;
    const s = await getUserBadgeStatus(selectedUser, selectedBadge);
    setStatus(s);
  }

  async function handleAward() {
    if (!selectedUser || !selectedBadge) return;
    setLoading(true);
    setMessage("");
    const result = await awardBadge(selectedUser, selectedBadge);
    setLoading(false);
    if (result.success) {
      setMessage("Badge awarded!");
      setStatus({ earned: true, revoked: false });
    } else {
      setMessage(result.error || "Failed");
    }
  }

  async function handleRevoke() {
    if (!selectedUser || !selectedBadge) return;
    if (!confirm("Revoke this badge? It won't be auto-re-awarded.")) return;
    setLoading(true);
    setMessage("");
    const result = await revokeBadge(selectedUser, selectedBadge);
    setLoading(false);
    if (result.success) {
      setMessage("Badge revoked (soft-delete).");
      setStatus({ earned: false, revoked: true });
    } else {
      setMessage(result.error || "Failed");
    }
  }

  return (
    <Modal open onClose={onClose} title="Award / Revoke Badge">
      <div className="space-y-4">
        {/* User Picker */}
        <div>
          <label className="mb-1 block text-xs text-foreground/50">User</label>
          <input
            value={userSearch}
            onChange={(e) => {
              setUserSearch(e.target.value);
              setStatus(null);
            }}
            placeholder="Search users..."
            className="mb-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
          <select
            value={selectedUser}
            onChange={(e) => {
              setSelectedUser(e.target.value);
              setStatus(null);
            }}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            size={Math.min(filteredUsers.length, 6)}
          >
            {filteredUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.gamertag || u.name}
              </option>
            ))}
          </select>
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

        {/* Check Status */}
        {selectedUser && selectedBadge && (
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
            disabled={loading || !selectedUser || !selectedBadge}
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
          >
            Revoke
          </button>
          <button
            onClick={handleAward}
            disabled={loading || !selectedUser || !selectedBadge}
            className="rounded-lg bg-neon px-4 py-2 text-sm font-medium text-background transition hover:bg-neon/90 disabled:opacity-50"
          >
            {loading ? "..." : "Award"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
