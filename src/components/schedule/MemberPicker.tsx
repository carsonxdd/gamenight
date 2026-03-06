"use client";

import { useState } from "react";
import { InvitableMember, InviteGroupData } from "./ScheduleView";
import { INVITE_LIMITS } from "@/lib/constants";

interface Props {
  members: InvitableMember[];
  selected: string[];
  onChange: (ids: string[]) => void;
  maxSelections?: number;
  groups?: InviteGroupData[];
}

export default function MemberPicker({
  members,
  selected,
  onChange,
  maxSelections = INVITE_LIMITS.MAX_INVITEES,
  groups = [],
}: Props) {
  const [search, setSearch] = useState("");

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    return (
      (m.gamertag?.toLowerCase().includes(q) || m.name.toLowerCase().includes(q))
    );
  });

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else if (selected.length < maxSelections) {
      onChange([...selected, id]);
    }
  };

  const toggleGroup = (group: InviteGroupData) => {
    const allSelected = group.memberIds.every((id) => selected.includes(id));
    if (allSelected) {
      onChange(selected.filter((id) => !group.memberIds.includes(id)));
    } else {
      const newIds = new Set([...selected, ...group.memberIds]);
      // Respect max
      const arr = Array.from(newIds).slice(0, maxSelections);
      onChange(arr);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-foreground/70">Invite Members</span>
        <span className="text-xs text-foreground/40">
          {selected.length}/{maxSelections} selected
        </span>
      </div>

      {groups.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {groups.map((g) => {
            const allIn = g.memberIds.every((id) => selected.includes(id));
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => toggleGroup(g)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                  allIn
                    ? "bg-neon/20 text-neon border border-neon/40"
                    : "bg-surface-light text-foreground/60 border border-border hover:border-neon/30"
                }`}
              >
                {g.name} ({g.memberIds.length})
              </button>
            );
          })}
        </div>
      )}

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search members..."
        className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground placeholder:text-foreground/30 focus:border-neon focus:outline-none"
      />

      <div className="max-h-40 overflow-y-auto rounded-lg border border-border bg-surface">
        {filtered.length === 0 ? (
          <p className="px-3 py-2 text-xs text-foreground/40">No members found</p>
        ) : (
          filtered.map((m) => (
            <label
              key={m.id}
              className={`flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm transition hover:bg-surface-light ${
                selected.includes(m.id) ? "bg-neon/5" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={selected.includes(m.id)}
                onChange={() => toggle(m.id)}
                disabled={!selected.includes(m.id) && selected.length >= maxSelections}
                className="accent-neon"
              />
              {m.avatar && (
                <img
                  src={m.avatar}
                  alt=""
                  className="h-5 w-5 rounded-full"
                />
              )}
              <span className="text-foreground">
                {m.gamertag || m.name}
              </span>
              {m.gamertag && (
                <span className="text-foreground/40 text-xs">{m.name}</span>
              )}
            </label>
          ))
        )}
      </div>
    </div>
  );
}
