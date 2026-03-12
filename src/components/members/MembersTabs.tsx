"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import MembersGrid, { type MemberData } from "./MembersGrid";
import GamePopularity from "@/components/admin/GamePopularity";
import AvailabilityHeatmap from "@/components/admin/AvailabilityHeatmap";
import CommunityStats from "./CommunityStats";
import type { CommunityStats as CommunityStatsData } from "@/app/members/stats-actions";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";

const ALL_TABS = ["Members", "Games", "Availability", "Stats"] as const;
type Tab = (typeof ALL_TABS)[number];

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
  games: string[];
}

interface Props {
  members: MemberData[];
  gameStats: GameStat[];
  availability: AvailabilityEntry[];
  primeSlots?: string[];
  extendedSlots?: string[];
  anchorTimezone?: string;
  viewerTimezone?: string;
  anchorPrimeStartHour?: number;
  anchorPrimeEndHour?: number;
  communityStats?: CommunityStatsData;
}

export default function MembersTabs({ members, gameStats, availability, primeSlots, extendedSlots, anchorTimezone, viewerTimezone, anchorPrimeStartHour, anchorPrimeEndHour, communityStats }: Props) {
  const settings = useSiteSettings();
  const tabs = ALL_TABS.filter((t) => t !== "Stats" || settings.enableStats);
  const [activeTab, setActiveTab] = useState<Tab>("Members");

  return (
    <div className="mx-auto max-w-6xl px-4 py-20">
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="flex flex-col gap-8"
      >
        <motion.div variants={staggerItem}>
          <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-neon text-glow-sm sm:text-5xl">
            Members
          </h1>
          <p className="text-foreground/50">
            {members.length} {members.length === 1 ? "player" : "players"} in
            the community
          </p>
          <div className="mt-3 h-px w-16 bg-neon/40" />
        </motion.div>

        {/* Tab Navigation */}
        <motion.div variants={staggerItem} className="flex gap-3 border-b border-border sm:gap-6">
          {tabs.map((tab) => (
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
              {activeTab === tab && (
                <motion.div
                  layoutId="members-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          ))}
        </motion.div>

        {/* Tab Content */}
        {activeTab === "Members" && <MembersGrid members={members} />}
        {activeTab === "Games" && <GamePopularity gameStats={gameStats} />}
        {activeTab === "Availability" && <AvailabilityHeatmap availability={availability} primeSlots={primeSlots} extendedSlots={extendedSlots} anchorTimezone={anchorTimezone} viewerTimezone={viewerTimezone} anchorPrimeStartHour={anchorPrimeStartHour} anchorPrimeEndHour={anchorPrimeEndHour} />}
        {activeTab === "Stats" && communityStats && <CommunityStats stats={communityStats} gameStats={gameStats} availability={availability} memberCount={members.length} />}
      </motion.div>
    </div>
  );
}
