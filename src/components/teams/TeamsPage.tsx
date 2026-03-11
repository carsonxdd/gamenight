"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import TeamCard, { type TeamData } from "./TeamCard";
import CreateTeamModal from "./CreateTeamModal";
import PendingInvites from "./PendingInvites";
import Button from "@/components/ui/Button";

const TABS = ["All Teams", "My Teams"] as const;
type Tab = (typeof TABS)[number];

interface InviteData {
  id: string;
  team: { id: string; name: string; tag: string; game: string };
  invitedBy: { id: string; name: string; gamertag: string | null };
  createdAt: string;
}

interface Props {
  teams: TeamData[];
  myTeams: TeamData[];
  pendingInvites: InviteData[];
  userId: string;
  isAdmin: boolean;
}

export default function TeamsPage({ teams, myTeams, pendingInvites }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("All Teams");
  const [search, setSearch] = useState("");
  const [gameFilter, setGameFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const allGames = Array.from(new Set(teams.map((t) => t.game))).sort();

  const currentTeams = activeTab === "All Teams" ? teams : myTeams;

  const filtered = currentTeams.filter((t) => {
    const matchesSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.tag.toLowerCase().includes(search.toLowerCase());
    const matchesGame = !gameFilter || t.game === gameFilter;
    return matchesSearch && matchesGame;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-20">
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="flex flex-col gap-8"
      >
        {/* Header */}
        <motion.div variants={staggerItem} className="flex items-start justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-neon text-glow-sm sm:text-5xl">
              Teams
            </h1>
            <p className="text-foreground/50">
              {teams.length} {teams.length === 1 ? "team" : "teams"} in the community
            </p>
            <div className="mt-3 h-px w-16 bg-neon/40" />
          </div>
          <Button onClick={() => setCreateOpen(true)}>Create Team</Button>
        </motion.div>

        {/* Pending Invites */}
        {pendingInvites.length > 0 && (
          <motion.div variants={staggerItem}>
            <PendingInvites invites={pendingInvites} />
          </motion.div>
        )}

        {/* Tab Navigation */}
        <motion.div variants={staggerItem} className="flex gap-3 border-b border-border sm:gap-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative pb-3 text-sm font-medium transition ${
                activeTab === tab
                  ? "text-neon"
                  : "text-foreground/40 hover:text-foreground/70"
              }`}
            >
              {tab}
              {tab === "My Teams" && myTeams.length > 0 && (
                <span className="ml-1.5 text-xs text-foreground/30">({myTeams.length})</span>
              )}
              {activeTab === tab && (
                <motion.div
                  layoutId="teams-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          ))}
        </motion.div>

        {/* Search & Filter */}
        <motion.div variants={staggerItem} className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams..."
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
          <motion.div variants={staggerItem} className="text-center py-12">
            <p className="text-foreground/40">
              {activeTab === "My Teams"
                ? "You are not on any teams yet."
                : "No teams found."}
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={staggerContainer}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((team) => (
              <motion.div key={team.id} variants={staggerItem}>
                <TeamCard team={team} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      <CreateTeamModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
