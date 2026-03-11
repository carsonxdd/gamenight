"use client";

import Link from "next/link";
import Badge from "@/components/ui/Badge";

export interface TeamData {
  id: string;
  name: string;
  tag: string;
  game: string;
  bio: string | null;
  avatarUrl: string | null;
  minSize: number;
  maxSize: number;
  captainId: string;
  captain: { id: string; name: string; gamertag: string | null; avatar: string | null };
  memberCount: number;
  members: {
    userId: string;
    role: string;
    user: { id: string; name: string; gamertag: string | null; avatar: string | null };
  }[];
  createdAt: string;
}

export default function TeamCard({ team }: { team: TeamData }) {
  return (
    <Link href={`/teams/${team.id}`}>
      <div className="group rounded-xl border border-border bg-surface p-4 transition hover:border-neon/40 hover:shadow-lg hover:shadow-neon/5">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {team.avatarUrl ? (
              <img
                src={team.avatarUrl}
                alt={team.name}
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neon/10 text-sm font-bold text-neon">
                {team.tag.slice(0, 2)}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-foreground group-hover:text-neon transition">
                {team.name}
              </h3>
              <span className="text-xs font-mono text-neon/70">[{team.tag}]</span>
            </div>
          </div>
          <Badge>{team.game}</Badge>
        </div>

        {team.bio && (
          <p className="mb-3 text-xs text-foreground/50 line-clamp-2">{team.bio}</p>
        )}

        <div className="flex items-center justify-between text-xs text-foreground/40">
          <span>
            Captain: <span className="text-foreground/60">{team.captain.gamertag || team.captain.name}</span>
          </span>
          <span>
            {team.memberCount}/{team.maxSize} members
          </span>
        </div>

        {/* Member avatars */}
        <div className="mt-3 flex -space-x-2">
          {team.members.slice(0, 6).map((m) => (
            <div key={m.userId} className="relative">
              {m.user.avatar ? (
                <img
                  src={m.user.avatar}
                  alt={m.user.gamertag || m.user.name}
                  className="h-7 w-7 rounded-full border-2 border-surface object-cover"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface bg-surface-lighter text-[10px] font-medium text-foreground/50">
                  {(m.user.gamertag || m.user.name).charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          ))}
          {team.members.length > 6 && (
            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface bg-surface-lighter text-[10px] font-medium text-foreground/50">
              +{team.members.length - 6}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
