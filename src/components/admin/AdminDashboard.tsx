"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { fadeIn } from "@/lib/animations";
import Card from "@/components/ui/Card";
import GamePopularity from "./GamePopularity";
import AvailabilityHeatmap from "./AvailabilityHeatmap";
import RSVPOverview from "./RSVPOverview";
import PlayerRoster from "./PlayerRoster";
import Insights from "./Insights";
import SiteSettingsPanel from "./SiteSettingsPanel";
import AdminSuggestions from "./AdminSuggestions";
import AuditLogFeed from "./AuditLogFeed";
import BadgeManager from "./BadgeManager";
import type { BadgeData, UserOption } from "./BadgeManager";
import type { SiteSettingsData } from "@/lib/settings-constants";

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
  isMuted: boolean;
  mutedUntil: string | null;
  willingToModerate: boolean;
  games: string[];
  availabilityDays: number[];
}

interface PendingAttendanceEvent {
  id: string;
  title: string | null;
  game: string;
  date: string;
  hostName: string | null;
  attendeeCount: number;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorName: string;
  actorAvatar: string | null;
  metadata: string | null;
  createdAt: string;
}

interface Props {
  stats: {
    playerCount: number;
    uniqueGames: number;
    gameNightCount: number;
    totalRSVPs: number;
    activeUsersCount: number;
  };
  gameStats: GameStat[];
  availability: AvailabilityEntry[];
  gameNights: GameNightData[];
  players: PlayerData[];
  currentUserId: string;
  isCurrentUserAdmin: boolean;
  pendingAttendance: PendingAttendanceEvent[];
  siteSettings?: SiteSettingsData;
  primeSlots?: string[];
  extendedSlots?: string[];
  anchorTimezone?: string;
  viewerTimezone?: string;
  anchorPrimeStartHour?: number;
  anchorPrimeEndHour?: number;
  openSuggestionCount?: number;
  suggestions?: SuggestionItem[];
  auditLogs?: AuditLogEntry[];
  badgeDefinitions?: BadgeData[];
  badgeUsers?: UserOption[];
}

interface SuggestionItem {
  id: string;
  type: string;
  title: string;
  description: string | null;
  status: string;
  userId: string;
  user: { id: string; name: string; gamertag: string | null; avatar: string | null };
  createdAt: string;
}

type Tab = "games" | "availability" | "rsvps" | "roster" | "insights" | "activity" | "suggestions" | "badges" | "settings";

const tabs: { key: Tab; label: string; adminOnly?: boolean }[] = [
  { key: "games", label: "Games" },
  { key: "availability", label: "Availability" },
  { key: "rsvps", label: "RSVPs" },
  { key: "roster", label: "Roster" },
  { key: "insights", label: "Insights" },
  { key: "activity", label: "Activity" },
  { key: "suggestions", label: "Feedback" },
  { key: "badges", label: "Badges", adminOnly: true },
  { key: "settings", label: "Settings", adminOnly: true },
];

export default function AdminDashboard({
  stats,
  gameStats,
  availability,
  gameNights,
  players,
  currentUserId,
  isCurrentUserAdmin,
  pendingAttendance,
  siteSettings,
  primeSlots,
  extendedSlots,
  anchorTimezone,
  viewerTimezone,
  anchorPrimeStartHour,
  anchorPrimeEndHour,
  openSuggestionCount = 0,
  suggestions = [],
  auditLogs = [],
  badgeDefinitions = [],
  badgeUsers = [],
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("games");

  const statCards = [
    { label: "Players", value: stats.playerCount },
    { label: "Active Now", value: stats.activeUsersCount },
    { label: "Unique Games", value: stats.uniqueGames },
    { label: "Game Nights", value: stats.gameNightCount },
    { label: "Total RSVPs", value: stats.totalRSVPs },
  ];

  return (
    <div>
      {/* Attendance Nudge */}
      {pendingAttendance.length > 0 && (
        <motion.div {...fadeIn} className="mb-6">
          <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-lg">📋</span>
              <p className="text-sm font-semibold text-warning">
                {pendingAttendance.length} {pendingAttendance.length === 1 ? "event needs" : "events need"} attendance confirmation
              </p>
            </div>
            <div className="space-y-1.5">
              {pendingAttendance.map((e) => (
                <a
                  key={e.id}
                  href="/schedule"
                  className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-sm transition hover:border-warning/40"
                >
                  <div>
                    <span className="font-medium text-foreground">{e.title || e.game}</span>
                    {e.title && <span className="ml-2 text-foreground/40">{e.game}</span>}
                    <span className="ml-2 text-xs text-foreground/40">
                      {new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground/50">
                    {e.hostName && <span>Host: {e.hostName}</span>}
                    <span>{e.attendeeCount} RSVPs</span>
                  </div>
                </a>
              ))}
            </div>
            <p className="mt-2 text-xs text-foreground/40">
              Go to the schedule page and click &quot;Mark Attendance&quot; on past events.
            </p>
          </div>
        </motion.div>
      )}

      {/* Summary Stats */}
      <motion.div
        {...fadeIn}
        className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5"
      >
        {statCards.map((stat) => (
          <Card key={stat.label} glow>
            <p className="text-xs text-foreground/50">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-neon">{stat.value}</p>
          </Card>
        ))}
      </motion.div>

      {/* Tab Navigation */}
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg border border-border bg-surface p-1 sm:grid-cols-4 md:flex">
        {tabs
          .filter((tab) => !tab.adminOnly || isCurrentUserAdmin)
          .map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-md px-2 py-1.5 text-xs transition md:flex-1 md:px-4 md:text-sm ${
              activeTab === tab.key
                ? "bg-neon/10 text-neon"
                : "text-foreground/50 hover:text-foreground"
            }`}
          >
            {tab.label}
            {tab.key === "suggestions" && openSuggestionCount > 0 && (
              <span className="ml-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-neon text-[10px] font-bold text-background px-1">
                {openSuggestionCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "games" && <GamePopularity gameStats={gameStats} />}
      {activeTab === "availability" && (
        <AvailabilityHeatmap availability={availability} primeSlots={primeSlots} extendedSlots={extendedSlots} anchorTimezone={anchorTimezone} viewerTimezone={viewerTimezone} anchorPrimeStartHour={anchorPrimeStartHour} anchorPrimeEndHour={anchorPrimeEndHour} />
      )}
      {activeTab === "rsvps" && <RSVPOverview gameNights={gameNights} />}
      {activeTab === "roster" && (
        <PlayerRoster players={players} currentUserId={currentUserId} isCurrentUserAdmin={isCurrentUserAdmin} isCurrentUserModerator={!isCurrentUserAdmin} />
      )}
      {activeTab === "insights" && <Insights />}
      {activeTab === "activity" && <AuditLogFeed logs={auditLogs} />}
      {activeTab === "suggestions" && <AdminSuggestions isAdmin={isCurrentUserAdmin} initialSuggestions={suggestions} />}
      {activeTab === "badges" && <BadgeManager badges={badgeDefinitions} users={badgeUsers} />}
      {activeTab === "settings" && siteSettings && (
        <SiteSettingsPanel settings={siteSettings} />
      )}
    </div>
  );
}
