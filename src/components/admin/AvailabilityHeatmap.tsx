"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { fadeIn } from "@/lib/animations";
import { DAYS_OF_WEEK, formatTime, generateTimeSlots, DEFAULT_EXTENDED_START, DEFAULT_EXTENDED_END } from "@/lib/constants";
import { getPrimeTimeLegendInfo } from "@/lib/prime-time-utils";
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
  primeSlots?: string[];
  extendedSlots?: string[];
  anchorTimezone?: string;
  viewerTimezone?: string;
  anchorPrimeStartHour?: number;
  anchorPrimeEndHour?: number;
}

function getIntensityClass(ratio: number, isPrime: boolean): string {
  if (ratio === 0) return isPrime ? "bg-surface-light" : "bg-surface-light/50";
  if (!isPrime) {
    if (ratio <= 0.25) return "bg-foreground/5";
    if (ratio <= 0.5) return "bg-foreground/8";
    if (ratio <= 0.75) return "bg-foreground/12";
    return "bg-foreground/15";
  }
  if (ratio <= 0.2) return "bg-neon/10";
  if (ratio <= 0.4) return "bg-neon/20";
  if (ratio <= 0.6) return "bg-neon/30";
  if (ratio <= 0.8) return "bg-neon/45";
  return "bg-neon/60";
}

function slotCovered(slot: string, start: string, end: string): boolean {
  if (start <= end) {
    return slot >= start && slot < end;
  }
  return slot >= start || slot < end;
}

export default function AvailabilityHeatmap({ availability, primeSlots: primeSlotsArr, extendedSlots: extendedSlotsArr, anchorTimezone, viewerTimezone, anchorPrimeStartHour, anchorPrimeEndHour }: Props) {
  const [selected, setSelected] = useState<{
    day: number;
    slot: string;
  } | null>(null);
  const [gameFilter, setGameFilter] = useState("");

  const allGames = useMemo(() => {
    const set = new Set<string>();
    for (const entry of availability) {
      for (const g of entry.games) set.add(g);
    }
    return [...set].sort();
  }, [availability]);

  // Use provided extended slots, or compute from data
  const timeSlots = useMemo(() => {
    if (extendedSlotsArr && extendedSlotsArr.length > 0) return extendedSlotsArr;
    // Fallback: compute from data range
    let minHour = DEFAULT_EXTENDED_START;
    let maxHour = DEFAULT_EXTENDED_END > 24 ? DEFAULT_EXTENDED_END - 24 : DEFAULT_EXTENDED_END;
    for (const entry of availability) {
      const startH = parseInt(entry.startTime.split(":")[0], 10);
      const endH = parseInt(entry.endTime.split(":")[0], 10);
      if (startH < minHour) minHour = startH;
      if (endH > maxHour) maxHour = endH;
    }
    return generateTimeSlots(minHour, maxHour);
  }, [availability, extendedSlotsArr]);

  const primeSlotSet = useMemo(() => new Set(primeSlotsArr || []), [primeSlotsArr]);

  const filtered = gameFilter
    ? availability.filter((e) => e.games.includes(gameFilter))
    : availability;

  // Build counts and player lists for each cell (deduplicated)
  const cellData: Record<string, { count: number; players: string[] }> = {};

  for (const day of DAYS_OF_WEEK.keys()) {
    for (const slot of timeSlots) {
      const key = `${day}-${slot}`;
      const playerSet = new Set<string>();
      for (const entry of filtered) {
        if (entry.dayOfWeek === day && slotCovered(slot, entry.startTime, entry.endTime)) {
          playerSet.add(entry.userName);
        }
      }
      cellData[key] = { count: playerSet.size, players: [...playerSet] };
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
        <div className="mb-4 flex items-center gap-3">
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
          {primeSlotsArr && primeSlotsArr.length > 0 && anchorTimezone && viewerTimezone && anchorPrimeStartHour != null && anchorPrimeEndHour != null && (() => {
            const legend = getPrimeTimeLegendInfo({
              primeSlots: primeSlotsArr,
              anchorTimezone,
              viewerTimezone,
              anchorPrimeStartHour,
              anchorPrimeEndHour,
            });

            if (legend.isLocal) {
              return (
                <span className="text-xs text-foreground/30">
                  Prime time {legend.primeStartFormatted}–{legend.primeEndFormatted} · Dimmed = extended hours
                </span>
              );
            }

            return (
              <span className="text-xs text-foreground/30">
                Prime time {legend.primeStartFormatted}–{legend.primeEndFormatted} your time
                <span className="text-foreground/20"> ({legend.anchorPrimeStartFormatted}–{legend.anchorPrimeEndFormatted} {legend.anchorLabel})</span>
                {" · Dimmed = extended hours"}
              </span>
            );
          })()}
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
              {timeSlots.map((slot) => {
                const isPrime = primeSlotSet.size === 0 || primeSlotSet.has(slot);
                return (
                  <tr key={slot}>
                    <td className={`whitespace-nowrap pr-3 text-right text-xs ${isPrime ? "text-foreground/50" : "text-foreground/25"}`}>
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
                            className={`flex h-10 w-full min-w-[2.5rem] items-center justify-center rounded text-xs transition sm:h-8 ${getIntensityClass(ratio, isPrime)} ${
                              isSelected
                                ? "ring-2 ring-neon"
                                : isPrime
                                  ? "hover:ring-1 hover:ring-neon/50"
                                  : "hover:ring-1 hover:ring-foreground/20"
                            } ${!isPrime && ratio === 0 ? "opacity-40" : ""}`}
                            title={`${DAYS_OF_WEEK[day]} ${formatTime(slot)}: ${data.count} available${!isPrime ? " (extended)" : ""}`}
                          >
                            {data.count > 0 && (
                              <span className={isPrime ? "text-foreground/70" : "text-foreground/40"}>
                                {data.count}
                              </span>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-foreground/50">
          <div className="flex items-center gap-2">
            <span>Less</span>
            {[0, 0.2, 0.4, 0.6, 0.8, 1].map((r) => (
              <div
                key={r}
                className={`h-4 w-6 rounded ${getIntensityClass(r, true)}`}
              />
            ))}
            <span>More</span>
          </div>
          {primeSlotSet.size > 0 && (
            <div className="flex items-center gap-2 text-foreground/30">
              <div className="h-4 w-6 rounded bg-foreground/10" />
              <span>Extended hours</span>
            </div>
          )}
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
              {!primeSlotSet.has(selected.slot) && primeSlotSet.size > 0 && (
                <span className="ml-2 text-xs text-foreground/30">(extended hours)</span>
              )}
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
