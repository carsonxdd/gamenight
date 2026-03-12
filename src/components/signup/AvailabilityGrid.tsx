"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { DAYS_OF_WEEK, formatTime, generateTimeSlots, DEFAULT_EXTENDED_START, DEFAULT_EXTENDED_END, DEFAULT_PRIME_START, DEFAULT_PRIME_END } from "@/lib/constants";
import { getPrimeTimeLegendInfo } from "@/lib/prime-time-utils";

interface AvailabilityGridProps {
  selected: Set<string>;
  onChange: (selected: Set<string>) => void;
  timezoneLabel?: string;
  primeSlots?: string[];
  extendedSlots?: string[];
  anchorTimezone?: string;
  /** The viewer's IANA timezone (e.g. "America/New_York") for comparing against anchor */
  viewerTimezone?: string;
  /** Original anchor prime hours (e.g. 17, 23) for the legend explanation */
  anchorPrimeStartHour?: number;
  anchorPrimeEndHour?: number;
}

function cellKey(day: number, slot: string): string {
  return `${day}-${slot}`;
}

export default function AvailabilityGrid({
  selected,
  onChange,
  timezoneLabel,
  primeSlots: primeSlotsArr,
  extendedSlots: extendedSlotsArr,
  anchorTimezone,
  viewerTimezone,
  anchorPrimeStartHour,
  anchorPrimeEndHour,
}: AvailabilityGridProps) {
  const [dragging, setDragging] = useState(false);
  const dragMode = useRef<"select" | "deselect">("select");
  const gridRef = useRef<HTMLDivElement>(null);

  // Use provided slots or fallback to defaults
  const timeSlots = useMemo(() => {
    if (extendedSlotsArr && extendedSlotsArr.length > 0) return extendedSlotsArr;
    return generateTimeSlots(DEFAULT_EXTENDED_START, DEFAULT_EXTENDED_END > 24 ? DEFAULT_EXTENDED_END - 1 : DEFAULT_EXTENDED_END);
  }, [extendedSlotsArr]);

  const primeSlotSet = useMemo(() => {
    if (primeSlotsArr && primeSlotsArr.length > 0) return new Set(primeSlotsArr);
    return new Set(generateTimeSlots(DEFAULT_PRIME_START, DEFAULT_PRIME_END));
  }, [primeSlotsArr]);

  const toggle = useCallback(
    (key: string) => {
      const next = new Set(selected);
      if (dragMode.current === "select") {
        next.add(key);
      } else {
        next.delete(key);
      }
      onChange(next);
    },
    [selected, onChange]
  );

  const handleMouseDown = useCallback(
    (day: number, slot: string) => {
      const key = cellKey(day, slot);
      dragMode.current = selected.has(key) ? "deselect" : "select";
      setDragging(true);
      toggle(key);
    },
    [selected, toggle]
  );

  const handleMouseEnter = useCallback(
    (day: number, slot: string) => {
      if (!dragging) return;
      toggle(cellKey(day, slot));
    },
    [dragging, toggle]
  );

  useEffect(() => {
    const handleUp = () => setDragging(false);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchend", handleUp);
    return () => {
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchend", handleUp);
    };
  }, []);

  // Touch support
  const handleTouchStart = useCallback(
    (day: number, slot: string) => {
      const key = cellKey(day, slot);
      dragMode.current = selected.has(key) ? "deselect" : "select";
      setDragging(true);
      toggle(key);
    },
    [selected, toggle]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!dragging || !gridRef.current) return;
      const touch = e.touches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      if (el instanceof HTMLElement && el.dataset.cellkey) {
        toggle(el.dataset.cellkey);
      }
    },
    [dragging, toggle]
  );

  const dayAbbrevs = DAYS_OF_WEEK.map((d) => d.slice(0, 3));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">
          Available Times
        </label>
        <span className="text-xs text-foreground/50">
          {selected.size} slots selected
        </span>
      </div>
      <p className="mb-1 text-xs text-foreground/40">
        Tap or click and drag to select your available times
        {timezoneLabel && (
          <span className="ml-1 text-foreground/30">({timezoneLabel})</span>
        )}
      </p>
      <div className="mb-3 space-y-1">
        {anchorTimezone && viewerTimezone && anchorPrimeStartHour != null && anchorPrimeEndHour != null && (() => {
          const legend = getPrimeTimeLegendInfo({
            primeSlots: primeSlotsArr || [],
            anchorTimezone,
            viewerTimezone,
            anchorPrimeStartHour,
            anchorPrimeEndHour,
          });

          if (legend.isLocal) {
            return (
              <p className="text-xs text-foreground/30">
                <span className="inline-block w-2 h-2 rounded-sm bg-neon/40 border border-neon/60 mr-1 align-middle" />
                <span className="text-neon/60">Prime time {legend.primeStartFormatted}–{legend.primeEndFormatted}</span>
                <span className="mx-1.5">&middot;</span>
                <span className="inline-block w-2 h-2 rounded-sm bg-foreground/20 border border-foreground/30 mr-1 align-middle" />
                Extended hours (still selectable)
              </p>
            );
          }

          return (
            <>
              <p className="text-xs text-foreground/30">
                <span className="inline-block w-2 h-2 rounded-sm bg-neon/40 border border-neon/60 mr-1 align-middle" />
                <span className="text-neon/60">Group prime time</span>
                <span className="text-neon/50"> — {legend.primeStartFormatted}–{legend.primeEndFormatted} your time</span>
                <span className="mx-1.5">&middot;</span>
                <span className="inline-block w-2 h-2 rounded-sm bg-foreground/20 border border-foreground/30 mr-1 align-middle" />
                Extended hours (still selectable)
              </p>
              <p className="text-xs text-foreground/20">
                Most of the group is in {legend.anchorLabel}, so prime time is based on {legend.anchorPrimeStartFormatted}–{legend.anchorPrimeEndFormatted} {legend.anchorLabel} — shown here in your timezone
              </p>
            </>
          );
        })()}
      </div>

      <div
        ref={gridRef}
        className="select-none overflow-x-auto"
        onTouchMove={handleTouchMove}
      >
        <table className="w-full border-collapse" style={{ minWidth: 360 }}>
          <thead>
            <tr>
              <th className="p-1 text-right text-xs text-foreground/50 w-16" />
              {dayAbbrevs.map((d, i) => (
                <th
                  key={i}
                  className="p-1 text-center text-xs font-medium text-foreground/70"
                >
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((slot) => {
              const isPrime = primeSlotSet.has(slot);
              return (
                <tr key={slot}>
                  <td className={`whitespace-nowrap pr-2 text-right text-xs ${isPrime ? "text-foreground/50" : "text-foreground/25"}`}>
                    {formatTime(slot)}
                  </td>
                  {dayAbbrevs.map((_, day) => {
                    const key = cellKey(day, slot);
                    const isOn = selected.has(key);
                    return (
                      <td key={day} className="p-0.5">
                        <div
                          data-cellkey={key}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleMouseDown(day, slot);
                          }}
                          onMouseEnter={() => handleMouseEnter(day, slot)}
                          onTouchStart={(e) => {
                            e.preventDefault();
                            handleTouchStart(day, slot);
                          }}
                          className={`h-9 w-full cursor-pointer rounded-sm transition-colors sm:h-7 ${
                            isOn
                              ? isPrime
                                ? "bg-neon/40 border border-neon/60"
                                : "bg-foreground/20 border border-foreground/30"
                              : isPrime
                                ? "bg-surface-light border border-border hover:border-border-light"
                                : "bg-surface-light/40 border border-border/50 hover:border-border-light/50"
                          }`}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
