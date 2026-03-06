"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { DAYS_OF_WEEK, TIME_SLOTS, formatTime } from "@/lib/constants";

interface AvailabilityGridProps {
  selected: Set<string>;
  onChange: (selected: Set<string>) => void;
}

function cellKey(day: number, slot: string): string {
  return `${day}-${slot}`;
}

export default function AvailabilityGrid({
  selected,
  onChange,
}: AvailabilityGridProps) {
  const [dragging, setDragging] = useState(false);
  const dragMode = useRef<"select" | "deselect">("select");
  const gridRef = useRef<HTMLDivElement>(null);

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
      <p className="mb-3 text-xs text-foreground/40">
        Click and drag to select your available times
      </p>

      <div
        ref={gridRef}
        className="select-none overflow-x-auto"
        onTouchMove={handleTouchMove}
      >
        <table className="w-full border-collapse" style={{ minWidth: 420 }}>
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
            {TIME_SLOTS.map((slot) => (
              <tr key={slot}>
                <td className="whitespace-nowrap pr-2 text-right text-xs text-foreground/50">
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
                        className={`h-7 w-full cursor-pointer rounded-sm transition-colors ${
                          isOn
                            ? "bg-neon/40 border border-neon/60"
                            : "bg-surface-light border border-border hover:border-border-light"
                        }`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
