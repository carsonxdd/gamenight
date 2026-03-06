"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import MemberPicker from "@/components/schedule/MemberPicker";
import { InvitableMember } from "@/components/schedule/ScheduleView";
import { createInviteGroup, updateInviteGroup, deleteInviteGroup } from "@/app/profile/actions";
import { INVITE_LIMITS } from "@/lib/constants";

interface GroupData {
  id: string;
  name: string;
  memberIds: string[];
}

interface Props {
  groups: GroupData[];
  members: InvitableMember[];
}

export default function InviteGroupManager({ groups: initialGroups, members }: Props) {
  const [groups, setGroups] = useState(initialGroups);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMembers, setNewMembers] = useState<string[]>([]);
  const [editName, setEditName] = useState("");
  const [editMembers, setEditMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!newName.trim()) {
      setError("Group name is required");
      return;
    }
    if (newMembers.length === 0) {
      setError("Add at least one member");
      return;
    }
    setLoading(true);
    setError("");
    const result = await createInviteGroup({ name: newName.trim(), memberIds: newMembers });
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setShowNew(false);
      setNewName("");
      setNewMembers([]);
      // Optimistic: add to local list (will be overwritten on revalidation)
      setGroups((prev) => [...prev, { id: Date.now().toString(), name: newName.trim(), memberIds: newMembers }]);
    }
  };

  const startEdit = (group: GroupData) => {
    setEditingId(group.id);
    setEditName(group.name);
    setEditMembers([...group.memberIds]);
    setError("");
  };

  const handleUpdate = async (groupId: string) => {
    if (!editName.trim()) {
      setError("Group name is required");
      return;
    }
    if (editMembers.length === 0) {
      setError("Add at least one member");
      return;
    }
    setLoading(true);
    setError("");
    const result = await updateInviteGroup(groupId, { name: editName.trim(), memberIds: editMembers });
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setEditingId(null);
      setGroups((prev) =>
        prev.map((g) => g.id === groupId ? { ...g, name: editName.trim(), memberIds: editMembers } : g)
      );
    }
  };

  const handleDelete = async (groupId: string) => {
    setLoading(true);
    setError("");
    const result = await deleteInviteGroup(groupId);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      if (editingId === groupId) setEditingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {groups.length === 0 && !showNew && (
        <p className="text-sm text-foreground/40">
          No groups yet. Create one to quickly invite the same friends to events.
        </p>
      )}

      {groups.map((group) => (
        <div key={group.id} className="rounded-lg border border-border bg-surface p-3">
          {editingId === group.id ? (
            <div className="space-y-3">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={INVITE_LIMITS.GROUP_NAME_MAX}
                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-foreground/30 focus:border-neon focus:outline-none"
              />
              <MemberPicker
                members={members}
                selected={editMembers}
                onChange={setEditMembers}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleUpdate(group.id)} disabled={loading}>
                  {loading ? "Saving..." : "Save"}
                </Button>
                <button
                  onClick={() => setEditingId(null)}
                  className="rounded-lg px-3 py-1.5 text-xs text-foreground/50 hover:text-foreground transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(group.id)}
                  disabled={loading}
                  className="ml-auto rounded-lg px-3 py-1.5 text-xs text-danger hover:bg-danger/10 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div
              className="flex items-center justify-between cursor-pointer hover:bg-surface-light rounded-md px-1 py-0.5 transition"
              onClick={() => startEdit(group)}
            >
              <div>
                <span className="font-medium text-foreground text-sm">{group.name}</span>
                <span className="ml-2 text-xs text-foreground/40">
                  {group.memberIds.length} member{group.memberIds.length !== 1 ? "s" : ""}
                </span>
              </div>
              <span className="text-xs text-foreground/30">Edit</span>
            </div>
          )}
        </div>
      ))}

      {showNew && (
        <div className="rounded-lg border border-neon/30 bg-neon/5 p-3 space-y-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Group name"
            maxLength={INVITE_LIMITS.GROUP_NAME_MAX}
            className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground placeholder:text-foreground/30 focus:border-neon focus:outline-none"
          />
          <MemberPicker
            members={members}
            selected={newMembers}
            onChange={setNewMembers}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={loading}>
              {loading ? "Creating..." : "Create Group"}
            </Button>
            <button
              onClick={() => { setShowNew(false); setNewName(""); setNewMembers([]); setError(""); }}
              className="rounded-lg px-3 py-1.5 text-xs text-foreground/50 hover:text-foreground transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      {!showNew && groups.length < INVITE_LIMITS.MAX_GROUPS && (
        <button
          onClick={() => { setShowNew(true); setEditingId(null); setError(""); }}
          className="rounded-lg border border-dashed border-border px-4 py-2 text-sm text-foreground/50 transition hover:border-neon hover:text-neon w-full"
        >
          + New Group
        </button>
      )}
    </div>
  );
}
