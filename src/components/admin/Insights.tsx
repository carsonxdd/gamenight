"use client";

import { useState, useEffect, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeIn } from "@/lib/animations";
import Card from "@/components/ui/Card";
import {
  getBestTimesForGame,
  getPeakAvailability,
  findSquadTimes,
  getLonelyGames,
  getInactiveMembers,
  getScheduleGaps,
  getRsvpStats,
  getGameNightHistory,
  getAllGameNames,
} from "@/app/admin/insight-actions";

type InsightKey =
  | "bestTime"
  | "peak"
  | "squad"
  | "lonely"
  | "inactive"
  | "gaps"
  | "rsvp"
  | "history";

interface InsightDef {
  key: InsightKey;
  label: string;
  description: string;
  icon: string;
}

const INSIGHTS: InsightDef[] = [
  { key: "bestTime", label: "Best Time for Game", description: "Top time slots where the most players of a game overlap", icon: "🎯" },
  { key: "peak", label: "Peak Availability", description: "Busiest time slots across all players", icon: "📈" },
  { key: "squad", label: "Squad Finder", description: "Find times where enough players are free for a specific game", icon: "👥" },
  { key: "lonely", label: "Lonely Games", description: "Games only one person plays — help them find teammates", icon: "🎮" },
  { key: "inactive", label: "Inactive Members", description: "Signed up but never RSVP'd to anything", icon: "💤" },
  { key: "gaps", label: "Schedule Gaps", description: "Days with available players but no upcoming events", icon: "📅" },
  { key: "rsvp", label: "RSVP Stats", description: "Who shows up, who's a maybe, who declines", icon: "📊" },
  { key: "history", label: "Game Night History", description: "Most scheduled games and average attendance", icon: "🏆" },
];

export default function Insights() {
  const [activeInsight, setActiveInsight] = useState<InsightKey | null>(null);
  const [gameNames, setGameNames] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  // Inputs
  const [selectedGame, setSelectedGame] = useState("");
  const [minPlayers, setMinPlayers] = useState(3);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    getAllGameNames().then(setGameNames);
  }, []);

  function runInsight(key: InsightKey) {
    if (activeInsight === key) {
      setActiveInsight(null);
      setResults(null);
      return;
    }
    setActiveInsight(key);
    setResults(null);

    // Insights that run immediately (no inputs needed)
    if (!["bestTime", "squad"].includes(key)) {
      startTransition(async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let data: any;
        switch (key) {
          case "peak": data = await getPeakAvailability(); break;
          case "lonely": data = await getLonelyGames(); break;
          case "inactive": data = await getInactiveMembers(); break;
          case "gaps": data = await getScheduleGaps(); break;
          case "rsvp": data = await getRsvpStats(); break;
          case "history": data = await getGameNightHistory(); break;
        }
        setResults(data);
      });
    }
  }

  function runGameInsight(key: "bestTime" | "squad") {
    if (!selectedGame) return;
    startTransition(async () => {
      const data = key === "bestTime"
        ? await getBestTimesForGame(selectedGame)
        : await findSquadTimes(selectedGame, minPlayers);
      setResults(data);
    });
  }

  return (
    <motion.div {...fadeIn} className="space-y-4">
      {/* Insight buttons grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {INSIGHTS.map((insight) => {
          const isActive = activeInsight === insight.key;
          return (
            <button
              key={insight.key}
              onClick={() => runInsight(insight.key)}
              className={`rounded-xl border p-4 text-left transition ${
                isActive
                  ? "border-neon/50 bg-neon/5"
                  : "border-border bg-surface hover:border-border-light"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{insight.icon}</span>
                <div>
                  <p className={`text-sm font-semibold ${isActive ? "text-neon" : "text-foreground"}`}>
                    {insight.label}
                  </p>
                  <p className="text-xs text-foreground/40">{insight.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active insight results */}
      <AnimatePresence mode="wait">
        {activeInsight && (
          <motion.div
            key={activeInsight}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              {/* Game selector for bestTime and squad */}
              {(activeInsight === "bestTime" || activeInsight === "squad") && (
                <div className="mb-4 flex flex-wrap items-end gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-foreground/50">Game</label>
                    <select
                      value={selectedGame}
                      onChange={(e) => { setSelectedGame(e.target.value); setResults(null); }}
                      className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground focus:border-neon/50 focus:outline-none focus:ring-1 focus:ring-neon/50"
                    >
                      <option value="">Select a game...</option>
                      {gameNames.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  {activeInsight === "squad" && (
                    <div>
                      <label className="mb-1 block text-xs text-foreground/50">Min players</label>
                      <input
                        type="number"
                        min={2}
                        max={20}
                        value={minPlayers}
                        onChange={(e) => { setMinPlayers(Number(e.target.value)); setResults(null); }}
                        className="w-20 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground focus:border-neon/50 focus:outline-none focus:ring-1 focus:ring-neon/50"
                      />
                    </div>
                  )}
                  <button
                    onClick={() => runGameInsight(activeInsight as "bestTime" | "squad")}
                    disabled={!selectedGame || isPending}
                    className="rounded-lg bg-neon/20 px-4 py-1.5 text-sm font-medium text-neon transition hover:bg-neon/30 disabled:opacity-40"
                  >
                    {isPending ? "Running..." : "Run"}
                  </button>
                </div>
              )}

              {/* Loading */}
              {isPending && (
                <div className="flex items-center gap-2 py-4 text-sm text-foreground/50">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-neon/30 border-t-neon" />
                  Crunching numbers...
                </div>
              )}

              {/* Results */}
              {!isPending && results && (
                <div className="space-y-2">
                  {activeInsight === "bestTime" && <TimeSlotResults data={results as TimeSlotRow[]} />}
                  {activeInsight === "peak" && <TimeSlotResults data={results as TimeSlotRow[]} />}
                  {activeInsight === "squad" && <SquadResults data={results as TimeSlotRow[]} />}
                  {activeInsight === "lonely" && <LonelyResults data={results as LonelyRow[]} />}
                  {activeInsight === "inactive" && <InactiveResults data={results as InactiveRow[]} />}
                  {activeInsight === "gaps" && <GapsResults data={results as GapRow[]} />}
                  {activeInsight === "rsvp" && <RsvpResults data={results as RsvpRow[]} />}
                  {activeInsight === "history" && <HistoryResults data={results as HistoryRow[]} />}
                </div>
              )}

              {/* No inputs yet for game-based insights */}
              {!isPending && !results && (activeInsight === "bestTime" || activeInsight === "squad") && (
                <p className="text-sm text-foreground/40">Select a game and hit Run.</p>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Result types ────────────────────────────────────────────────────
interface TimeSlotRow { day: string; time: string; players: string[]; count: number }
interface LonelyRow { gameName: string; player: string }
interface InactiveRow { name: string; gamesCount: number; availabilitySlots: number; joinedAt: string }
interface GapRow { day: string; availablePlayers: number; hasUpcomingEvent: boolean }
interface RsvpRow { name: string; confirmed: number; maybe: number; declined: number; attended: number; noShow: number; total: number }
interface HistoryRow { game: string; scheduled: number; cancelled: number; totalEvents: number; totalRsvps: number; avgAttendance: number }

// ── Result renderers ────────────────────────────────────────────────

function PlayerTags({ players }: { players: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {players.map((p) => (
        <span key={p} className="rounded-full border border-neon/30 bg-neon/10 px-2 py-0.5 text-xs text-neon">
          {p}
        </span>
      ))}
    </div>
  );
}

function TimeSlotResults({ data }: { data: TimeSlotRow[] }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  if (data.length === 0) return <p className="text-sm text-foreground/40">No availability data found.</p>;
  return (
    <div className="space-y-2">
      {data.map((row, i) => (
        <button
          key={i}
          onClick={() => setExpanded(expanded === i ? null : i)}
          className="w-full rounded-lg border border-border bg-surface-light p-3 text-left transition hover:border-border-light"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-foreground">{row.day}</span>
              <span className="text-sm text-foreground/50">{row.time}</span>
            </div>
            <span className="rounded-full bg-neon/15 px-2.5 py-0.5 text-xs font-semibold text-neon">
              {row.count} {row.count === 1 ? "player" : "players"}
            </span>
          </div>
          {expanded === i && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="mt-2"
            >
              <PlayerTags players={row.players} />
            </motion.div>
          )}
        </button>
      ))}
    </div>
  );
}

function SquadResults({ data }: { data: TimeSlotRow[] }) {
  if (data.length === 0) return <p className="text-sm text-foreground/40">No time slots found with enough players. Try lowering the minimum.</p>;
  return <TimeSlotResults data={data} />;
}

function LonelyResults({ data }: { data: LonelyRow[] }) {
  if (data.length === 0) return <p className="text-sm text-foreground/40">No lonely games — every game has at least 2 players!</p>;
  return (
    <div className="space-y-2">
      {data.map((row) => (
        <div key={row.gameName} className="flex items-center justify-between rounded-lg border border-border bg-surface-light p-3">
          <span className="text-sm font-medium text-foreground">{row.gameName}</span>
          <span className="rounded-full border border-foreground/20 bg-foreground/5 px-2.5 py-0.5 text-xs text-foreground/60">{row.player}</span>
        </div>
      ))}
    </div>
  );
}

function InactiveResults({ data }: { data: InactiveRow[] }) {
  if (data.length === 0) return <p className="text-sm text-foreground/40">Everyone has RSVP&apos;d to at least one event!</p>;
  return (
    <div className="space-y-2">
      {data.map((row) => (
        <div key={row.name} className="flex items-center justify-between rounded-lg border border-border bg-surface-light p-3">
          <div>
            <span className="text-sm font-medium text-foreground">{row.name}</span>
            <span className="ml-2 text-xs text-foreground/40">joined {row.joinedAt}</span>
          </div>
          <div className="flex gap-3 text-xs text-foreground/50">
            <span>{row.gamesCount} games</span>
            <span>{row.availabilitySlots} slots</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function GapsResults({ data }: { data: GapRow[] }) {
  if (data.length === 0) return <p className="text-sm text-foreground/40">Every day with available players already has an event scheduled!</p>;
  return (
    <div className="space-y-2">
      {data.map((row) => (
        <div key={row.day} className="flex items-center justify-between rounded-lg border border-border bg-surface-light p-3">
          <span className="text-sm font-medium text-foreground">{row.day}</span>
          <span className="rounded-full bg-neon/15 px-2.5 py-0.5 text-xs font-semibold text-neon">
            {row.availablePlayers} {row.availablePlayers === 1 ? "player" : "players"} free
          </span>
        </div>
      ))}
    </div>
  );
}

function RsvpResults({ data }: { data: RsvpRow[] }) {
  if (data.length === 0) return <p className="text-sm text-foreground/40">No RSVP data yet.</p>;
  return (
    <div className="space-y-2">
      {data.map((row) => (
        <div key={row.name} className="flex items-center justify-between rounded-lg border border-border bg-surface-light p-3">
          <span className="text-sm font-medium text-foreground">{row.name}</span>
          <div className="flex gap-2 text-xs">
            <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-green-400">{row.confirmed} yes</span>
            <span className="rounded-full bg-yellow-500/15 px-2 py-0.5 text-yellow-400">{row.maybe} maybe</span>
            <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-red-400">{row.declined} no</span>
            {(row.attended > 0 || row.noShow > 0) && (
              <>
                <span className="rounded-full bg-neon/15 px-2 py-0.5 text-neon">{row.attended} showed</span>
                {row.noShow > 0 && (
                  <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-orange-400">{row.noShow} no-show</span>
                )}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function HistoryResults({ data }: { data: HistoryRow[] }) {
  if (data.length === 0) return <p className="text-sm text-foreground/40">No game night history yet.</p>;
  return (
    <div className="space-y-2">
      {data.map((row) => (
        <div key={row.game} className="flex items-center justify-between rounded-lg border border-border bg-surface-light p-3">
          <div>
            <span className="text-sm font-medium text-foreground">{row.game}</span>
            <span className="ml-2 text-xs text-foreground/40">
              {row.totalEvents} {row.totalEvents === 1 ? "event" : "events"}
              {row.cancelled > 0 && ` (${row.cancelled} cancelled)`}
            </span>
          </div>
          <div className="flex gap-3 text-xs text-foreground/50">
            <span>{row.totalRsvps} RSVPs</span>
            <span>{row.avgAttendance} avg</span>
          </div>
        </div>
      ))}
    </div>
  );
}
