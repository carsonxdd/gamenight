"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import MemberCard from "./MemberCard";

export interface MemberData {
  id: string;
  name: string;
  discordUsername: string;
  avatar: string | null;
  games: string[];
  displayGames: string[];
  ranks: { gameName: string; rank: string; color: string }[];
  teamTags: { tag: string; game: string; teamId: string }[];
  twitter: string | null;
  twitch: string | null;
  youtube: string | null;
  customLink: string | null;
  isModerator: boolean;
  isOwner: boolean;
}

interface MembersGridProps {
  members: MemberData[];
}

export default function MembersGrid({ members }: MembersGridProps) {
  const [search, setSearch] = useState("");
  const [gameFilter, setGameFilter] = useState("");

  // Collect all unique games for the filter dropdown
  const allGames = Array.from(
    new Set(members.flatMap((m) => m.games))
  ).sort();

  const filtered = members.filter((m) => {
    const matchesSearch =
      !search || m.name.toLowerCase().includes(search.toLowerCase());
    const matchesGame = !gameFilter || m.games.includes(gameFilter);
    return matchesSearch && matchesGame;
  });

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="flex flex-col gap-8"
    >
        {/* Search & Filter */}
        <motion.div
          variants={staggerItem}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:border-neon/50 focus:outline-none"
          />
          <select
            value={gameFilter}
            onChange={(e) => setGameFilter(e.target.value)}
            className="rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-foreground focus:border-neon/50 focus:outline-none sm:w-56"
          >
            <option value="">All games</option>
            {allGames.map((game) => (
              <option key={game} value={game}>
                {game}
              </option>
            ))}
          </select>
        </motion.div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <motion.p variants={staggerItem} className="text-foreground/40">
            No members found.
          </motion.p>
        ) : (
          <motion.div
            variants={staggerContainer}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((member) => (
              <motion.div key={member.id} variants={staggerItem}>
                <MemberCard member={member} />
              </motion.div>
            ))}
          </motion.div>
        )}
    </motion.div>
  );
}
