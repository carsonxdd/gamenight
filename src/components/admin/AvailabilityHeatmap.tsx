"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { fadeIn } from "@/lib/animations";
import { DAYS_OF_WEEK, TIME_SLOTS, formatTime } from "@/lib/constants";
import Card from "@/components/ui/Card";

interface AvailabilityEntry {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  userName: string;
  games: string[];
}

interface Props {
  availability: AvailabilityEntry[];
}

function getIntensityClass(ratio: number): string {
  if (ratio === 0) return "bg-surface-light";
  if (ratio <= 0.2) return "bg-neon/10";
  if (ratio <= 0.4) return "bg-neon/20";
  if (ratio <= 0.6) return "bg-neon/30";
  if (ratio <= 0.8) return "bg-neon/45";
  return "bg-neon/60";
}

function slotCovered(slot: string, start: string, end: string): boolean {
  return slot >= start && slot < end;
}

export default function AvailabilityHeatmap({ availability }: Props) {
  const [selected, setSelected] = useState<{
    day: number;
    slot: string;
  } | null>(null);
  const [gameFilter, setGameFilter] = useState("");

  // Collect all unique games for the dropdown
  const allGames = useMemo(() => {
    const set = new Set<string>();
    for (const entry of availability) {
      for (const g of entry.games) set.add(g);
    }
    return [...set].sort();
  }, [availability]);

  // Filter availability by selected game
  const filtered = gameFilter
    ? availability.filter((e) => e.games.includes(gameFilter))
    : availability;

  // Build counts and player lists for each cell
  const cellData: Record<string, { count: number; players: string[] }> = {};

  for (const day of DAYS_OF_WEEK.keys()) {
    for (const slot of TIME_SLOTS) {
      const key = `${day}-${slot}`;
      const players: string[] = [];
      for (const entry of filtered) {
        if (entry.dayOfWeek === day && slotCovered(slot, entry.startTime, entry.endTime)) {
          players.push(entry.userName);
        }
      }
      cellData[key] = { count: players.length, players };
    }
  }

  const maxCount = Math.max(1, ...Object.values(cellData).map((c) => c.count));

  const selectedPlayers =
    selected && cellData[`${selected.day}-${selected.slot}`]?.players;

  const dayAbbrevs = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <motion.div {...fadeIn}>
      <Card>
        {/* Game filter */}
        <div className="mb-4">
          <select
            value={gameFilter}
            onChange={(e) => { setGameFilter(e.target.value); setSelected(null); }}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground focus:border-neon/50 focus:outline-none focus:ring-1 focus:ring-neon/50"
          >
            <option value="">All Games</option>
            {allGames.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-xs text-foreground/50" />
                {dayAbbrevs.map((d, i) => (
                  <th
                    key={i}
                    className="p-2 text-center text-xs font-medium text-foreground/70"
                  >
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map((slot) => (
                <tr key={slot}>
                  <td className="whitespace-nowrap pr-3 text-right text-xs text-foreground/50">
                    {formatTime(slot)}
                  </td>
                  {dayAbbrevs.map((_, day) => {
                    const key = `${day}-${slot}`;
                    const data = cellData[key];
                    const ratio = data.count / maxCount;
                    const isSelected =
                      selected?.day === day && selected?.slot === slot;
                    return (
                      <td key={day} className="p-0.5">
                        <button
                          onClick={() =>
                            setSelected(
                              isSelected ? null : { day, slot }
                            )
                          }
                          className={`flex h-8 w-full items-center justify-center rounded text-xs transition ${getIntensityClass(ratio)} ${
                            isSelected
                              ? "ring-2 ring-neon"
                              : "hover:ring-1 hover:ring-neon/50"
                          }`}
                          title={`${DAYS_OF_WEEK[day]} ${formatTime(slot)}: ${data.count} available`}
                        >
                          {data.count > 0 && (
                            <span className="text-foreground/70">
                              {data.count}
                            </span>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-2 text-xs text-foreground/50">
          <span>Less</span>
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((r) => (
            <div
              key={r}
              className={`h-4 w-6 rounded ${getIntensityClass(r)}`}
            />
          ))}
          <span>More</span>
        </div>

        {/* Selected cell detail */}
        {selected && selectedPlayers && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-lg border border-border bg-surface-light p-3"
          >
            <p className="mb-2 text-sm font-medium text-foreground">
              {DAYS_OF_WEEK[selected.day]} at {formatTime(selected.slot)}
              <span className="ml-2 text-foreground/50">
                ({selectedPlayers.length} available)
              </span>
            </p>
            {selectedPlayers.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedPlayers.map((name) => (
                  <span
                    key={name}
                    className="rounded-full border border-neon/30 bg-neon/10 px-2.5 py-0.5 text-xs text-neon"
                  >
                    {name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-foreground/40">No one available</p>
            )}
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
}
