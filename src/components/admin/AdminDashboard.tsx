"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { fadeIn } from "@/lib/animations";
import Card from "@/components/ui/Card";
import GamePopularity from "./GamePopularity";
import AvailabilityHeatmap from "./AvailabilityHeatmap";
import RSVPOverview from "./RSVPOverview";
import PlayerRoster from "./PlayerRoster";

interface GameStat {
  gameName: string;
  count: number;
  players: string[];
}

interface AvailabilityEntry {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  userName: string;
}

interface Attendee {
  status: string;
  userName: string;
}

interface GameNightData {
  id: string;
  title?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  game: string;
  status: string;
  attendees: Attendee[];
}

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
  stats: {
    playerCount: number;
    uniqueGames: number;
    gameNightCount: number;
    totalRSVPs: number;
  };
  gameStats: GameStat[];
  availability: AvailabilityEntry[];
  gameNights: GameNightData[];
  players: PlayerData[];
  currentUserId: string;
  isCurrentUserAdmin: boolean;
}

type Tab = "games" | "availability" | "rsvps" | "roster";

const tabs: { key: Tab; label: string }[] = [
  { key: "games", label: "Games" },
  { key: "availability", label: "Availability" },
  { key: "rsvps", label: "RSVPs" },
  { key: "roster", label: "Roster" },
];

export default function AdminDashboard({
  stats,
  gameStats,
  availability,
  gameNights,
  players,
  currentUserId,
  isCurrentUserAdmin,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("games");

  const statCards = [
    { label: "Players", value: stats.playerCount },
    { label: "Unique Games", value: stats.uniqueGames },
    { label: "Game Nights", value: stats.gameNightCount },
    { label: "Total RSVPs", value: stats.totalRSVPs },
  ];

  return (
    <div>
      {/* Summary Stats */}
      <motion.div
        {...fadeIn}
        className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4"
      >
        {statCards.map((stat) => (
          <Card key={stat.label} glow>
            <p className="text-xs text-foreground/50">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-neon">{stat.value}</p>
          </Card>
        ))}
      </motion.div>

      {/* Tab Navigation */}
      <div className="mb-6 flex rounded-lg border border-border bg-surface p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-md px-4 py-1.5 text-sm transition ${
              activeTab === tab.key
                ? "bg-neon/10 text-neon"
                : "text-foreground/50 hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "games" && <GamePopularity gameStats={gameStats} />}
      {activeTab === "availability" && (
        <AvailabilityHeatmap availability={availability} />
      )}
      {activeTab === "rsvps" && <RSVPOverview gameNights={gameNights} />}
      {activeTab === "roster" && (
        <PlayerRoster players={players} currentUserId={currentUserId} isCurrentUserAdmin={isCurrentUserAdmin} />
      )}
    </div>
  );
}
