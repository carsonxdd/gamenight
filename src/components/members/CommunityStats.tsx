"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/animations";
import Card from "@/components/ui/Card";
import { DAYS_OF_WEEK, formatTime } from "@/lib/constants";
import type { CommunityStats as CommunityStatsData } from "@/app/members/stats-actions";

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
  stats: CommunityStatsData;
  gameStats: GameStat[];
  availability: AvailabilityEntry[];
  memberCount: number;
}

function slotsBetween(start: string, end: string): string[] {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const slots: string[] = [];
  for (let m = startMin; m < endMin; m += 30) {
    const h = Math.floor(m / 60) % 24;
    const min = m % 60;
    slots.push(`${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`);
  }
  return slots;
}

export default function CommunityStats({ stats, gameStats, availability, memberCount }: Props) {
  // Peak times — aggregate availability into day+slot buckets
  const peakTimes = useMemo(() => {
    const buckets: Record<string, Set<string>> = {};
    for (const entry of availability) {
      const slots = slotsBetween(entry.startTime, entry.endTime);
      for (const slot of slots) {
        const key = `${entry.dayOfWeek}-${slot}`;
        if (!buckets[key]) buckets[key] = new Set();
        buckets[key].add(entry.userName);
      }
    }
    return Object.entries(buckets)
      .map(([key, players]) => {
        const [day, slot] = key.split("-");
        return { day: Number(day), slot: slot, count: players.size };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [availability]);

  const peakMax = peakTimes.length > 0 ? peakTimes[0].count : 1;
  const topGames = gameStats.slice(0, 5);
  const topGameMax = topGames.length > 0 ? topGames[0].count : 1;

  const summaryCards = [
    { label: "Members", value: memberCount },
    { label: "Games Played", value: gameStats.length },
    { label: "Game Nights", value: stats.gameNightCount },
    { label: "Total RSVPs", value: stats.totalRSVPs },
  ];

  const funFacts: { label: string; value: string }[] = [];
  if (stats.mostActiveDay !== null) {
    funFacts.push({ label: "Most Active Day", value: DAYS_OF_WEEK[stats.mostActiveDay] });
  }
  if (stats.biggestNight) {
    funFacts.push({ label: "Biggest Game Night", value: `${stats.biggestNight.count} players — ${stats.biggestNight.game}` });
  }
  if (stats.newestMember) {
    funFacts.push({ label: "Newest Member", value: stats.newestMember });
  }
  if (stats.teamCount > 0) {
    funFacts.push({ label: "Teams Formed", value: String(stats.teamCount) });
  }
  if (stats.tournamentCount > 0) {
    funFacts.push({ label: "Tournaments Completed", value: String(stats.tournamentCount) });
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Summary Cards */}
      <motion.div
        {...fadeIn}
        className="grid grid-cols-2 gap-4 md:grid-cols-4"
      >
        {summaryCards.map((card) => (
          <Card key={card.label} glow>
            <p className="text-xs text-foreground/50">{card.label}</p>
            <p className="mt-1 text-2xl font-bold text-neon">{card.value}</p>
          </Card>
        ))}
      </motion.div>

      {/* Popular Games */}
      {topGames.length > 0 && (
        <motion.div variants={staggerItem}>
          <Card>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Popular Games</h3>
            <div className="space-y-3">
              {topGames.map((game, i) => (
                <div key={game.gameName}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm text-foreground">
                      <span className="mr-2 text-foreground/30">{i + 1}.</span>
                      {game.gameName}
                    </span>
                    <span className="text-xs text-foreground/50">
                      {game.count} {game.count === 1 ? "player" : "players"}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-light">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(game.count / topGameMax) * 100}%` }}
                      transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
                      className="h-full rounded-full bg-neon/60"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Peak Times */}
      {peakTimes.length > 0 && (
        <motion.div variants={staggerItem}>
          <Card>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Peak Times</h3>
            <p className="mb-3 text-xs text-foreground/30">
              Time slots with the most players available
            </p>
            <div className="space-y-2">
              {peakTimes.map((peak, i) => (
                <div key={`${peak.day}-${peak.slot}`} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-xs text-foreground/60">
                    {DAYS_OF_WEEK[peak.day].slice(0, 3)} {formatTime(peak.slot)}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-light">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(peak.count / peakMax) * 100}%` }}
                      transition={{ duration: 0.5, delay: i * 0.06, ease: "easeOut" }}
                      className="h-full rounded-full bg-neon/50"
                    />
                  </div>
                  <span className="w-8 text-right text-xs text-foreground/40">
                    {peak.count}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Most Played (from event history) */}
      {stats.mostPlayed.length > 0 && (
        <motion.div variants={staggerItem}>
          <Card>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Most Played</h3>
            <p className="mb-3 text-xs text-foreground/30">
              Games with the most scheduled game nights
            </p>
            <div className="space-y-3">
              {stats.mostPlayed.map((game) => (
                <div
                  key={game.game}
                  className="flex items-center justify-between rounded-lg border border-border bg-surface-light/50 px-3 py-2"
                >
                  <span className="text-sm font-medium text-foreground">{game.game}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-foreground/50">
                      {game.eventCount} {game.eventCount === 1 ? "night" : "nights"}
                    </span>
                    <span className="text-xs text-neon/70">
                      ~{game.avgAttendees} avg
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Fun Facts */}
      {funFacts.length > 0 && (
        <motion.div variants={staggerItem}>
          <Card>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Community Highlights</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {funFacts.map((fact) => (
                <div
                  key={fact.label}
                  className="rounded-lg border border-border bg-surface-light/30 px-3 py-2.5"
                >
                  <p className="text-xs text-foreground/40">{fact.label}</p>
                  <p className="mt-0.5 text-sm font-medium text-foreground">{fact.value}</p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
