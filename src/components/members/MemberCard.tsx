"use client";

import { useState } from "react";
import type { MemberData } from "./MembersGrid";

const MAX_VISIBLE_GAMES = 6;

export default function MemberCard({ member }: { member: MemberData }) {
  const [copied, setCopied] = useState(false);

  const copyDiscord = async () => {
    await navigator.clipboard.writeText(member.discordUsername);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const extraGames = member.games.length - MAX_VISIBLE_GAMES;

  return (
    <div className="rounded-xl border border-border bg-surface p-5 transition hover:border-neon/30">
      {/* Avatar + Name */}
      <div className="flex items-center gap-3">
        {member.avatar ? (
          <img
            src={member.avatar}
            alt={member.name}
            className="h-14 w-14 flex-shrink-0 rounded-full"
          />
        ) : (
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-surface-lighter text-lg font-bold text-neon">
            {member.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-foreground">
            {member.name}
          </p>
        </div>
      </div>

      {/* Games */}
      {member.displayGames.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {member.displayGames.slice(0, MAX_VISIBLE_GAMES).map((game) => (
            <span
              key={game}
              className="rounded-full bg-neon/10 px-2 py-0.5 text-xs text-neon/80"
            >
              {game}
            </span>
          ))}
          {extraGames > 0 && (
            <span className="rounded-full bg-surface-lighter px-2 py-0.5 text-xs text-foreground/40">
              +{extraGames} more
            </span>
          )}
        </div>
      )}

      {/* Ranks */}
      {member.ranks.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {member.ranks.map((r) => (
            <span
              key={r.gameName}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                color: r.color,
                backgroundColor: `${r.color}15`,
              }}
            >
              {r.gameName}: {r.rank}
            </span>
          ))}
        </div>
      )}

      {/* Social Links */}
      <div className="mt-3 flex items-center gap-2">
        {/* Discord — always shown, copies username */}
        <button
          type="button"
          onClick={copyDiscord}
          title={copied ? "Copied!" : `Copy: ${member.discordUsername}`}
          className="inline-flex items-center justify-center rounded-lg border border-border p-1.5 text-foreground/40 transition hover:border-border-light hover:text-foreground/70"
        >
          {copied ? (
            <svg className="h-4 w-4 text-neon" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
          )}
        </button>

        {member.twitter && (
          <a
            href={`https://x.com/${member.twitter.replace(/^@/, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Twitter / X"
            className="inline-flex items-center justify-center rounded-lg border border-border p-1.5 text-foreground/40 transition hover:border-border-light hover:text-foreground/70"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
        )}

        {member.twitch && (
          <a
            href={`https://twitch.tv/${member.twitch}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Twitch"
            className="inline-flex items-center justify-center rounded-lg border border-border p-1.5 text-foreground/40 transition hover:border-border-light hover:text-foreground/70"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
            </svg>
          </a>
        )}

        {member.youtube && (
          <a
            href={
              member.youtube.startsWith("http")
                ? member.youtube
                : `https://youtube.com/@${member.youtube}`
            }
            target="_blank"
            rel="noopener noreferrer"
            title="YouTube"
            className="inline-flex items-center justify-center rounded-lg border border-border p-1.5 text-foreground/40 transition hover:border-border-light hover:text-foreground/70"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12z" />
            </svg>
          </a>
        )}

        {member.customLink && (
          <a
            href={
              member.customLink.startsWith("http")
                ? member.customLink
                : `https://${member.customLink}`
            }
            target="_blank"
            rel="noopener noreferrer"
            title="Link"
            className="inline-flex items-center justify-center rounded-lg border border-border p-1.5 text-foreground/40 transition hover:border-border-light hover:text-foreground/70"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}
