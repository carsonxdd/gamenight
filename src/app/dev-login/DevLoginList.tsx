"use client";

import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

type DevUser = {
  id: string;
  name: string;
  gamertag: string | null;
  avatar: string | null;
  isOwner: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  approvalStatus: string | null;
};

function roleLabel(u: DevUser): { label: string; tone: string } | null {
  if (u.isOwner) return { label: "Owner", tone: "bg-neon/20 text-neon" };
  if (u.isAdmin) return { label: "Admin", tone: "bg-danger/20 text-danger" };
  if (u.isModerator) return { label: "Mod", tone: "bg-yellow-500/20 text-yellow-400" };
  return null;
}

export default function DevLoginList({ users }: { users: DevUser[] }) {
  const { data: session } = useSession();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const filtered = filter.trim()
    ? users.filter((u) => {
        const q = filter.toLowerCase();
        return (
          u.name.toLowerCase().includes(q) ||
          (u.gamertag ?? "").toLowerCase().includes(q)
        );
      })
    : users;

  async function loginAs(userId: string) {
    setLoadingId(userId);
    await signIn("dev-login", { userId, callbackUrl: "/schedule" });
  }

  return (
    <div className="space-y-4">
      {session?.user && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-surface-lighter px-3 py-2 text-sm">
          <span className="text-foreground/60">
            Signed in as <span className="text-foreground">{session.user.name}</span>
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/dev-login" })}
            className="rounded px-2 py-1 text-foreground/60 hover:bg-surface hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      )}

      <input
        type="text"
        placeholder="Filter by name or gamertag..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full rounded-lg border border-border bg-surface-lighter px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-neon focus:outline-none"
      />

      <ul className="divide-y divide-border">
        {filtered.map((u) => {
          const role = roleLabel(u);
          const pending = u.approvalStatus === "pending";
          const rejected = u.approvalStatus === "rejected";
          return (
            <li key={u.id} className="flex items-center gap-3 py-2">
              {u.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={u.avatar}
                  alt=""
                  className="h-9 w-9 rounded-full border border-border object-cover"
                />
              ) : (
                <div className="h-9 w-9 rounded-full border border-border bg-surface-lighter" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-foreground">{u.name}</span>
                  {role && (
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${role.tone}`}>
                      {role.label}
                    </span>
                  )}
                  {pending && (
                    <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-yellow-400">
                      Pending
                    </span>
                  )}
                  {rejected && (
                    <span className="rounded bg-danger/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-danger">
                      Rejected
                    </span>
                  )}
                </div>
                <div className="truncate text-xs text-foreground/40">
                  {u.gamertag ?? "(no gamertag)"}
                </div>
              </div>
              <button
                onClick={() => loginAs(u.id)}
                disabled={loadingId !== null}
                className="shrink-0 rounded-lg border border-neon/40 bg-neon/10 px-3 py-1.5 text-xs font-semibold text-neon transition hover:bg-neon/20 disabled:opacity-40"
              >
                {loadingId === u.id ? "Signing in..." : "Sign in"}
              </button>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="py-6 text-center text-sm text-foreground/40">No users match.</li>
        )}
      </ul>
    </div>
  );
}
