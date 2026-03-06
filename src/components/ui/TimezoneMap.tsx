"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  US_STATES,
  TIMEZONE_ZONES,
  STATES_BY_ZONE,
  type TimezoneKey,
} from "@/lib/us-states";

interface TimezoneMapProps {
  value: string;
  onChange: (value: string) => void;
}

function formatLiveTime(tz: string): string {
  try {
    return new Date().toLocaleTimeString("en-US", {
      timeZone: tz,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}

export default function TimezoneMap({ value, onChange }: TimezoneMapProps) {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [liveTimes, setLiveTimes] = useState<Record<string, string>>({});

  // Update live times every 15s
  useEffect(() => {
    const update = () => {
      const times: Record<string, string> = {};
      for (const tz of Object.keys(TIMEZONE_ZONES)) {
        times[tz] = formatLiveTime(tz);
      }
      setLiveTimes(times);
    };
    update();
    const interval = setInterval(update, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    []
  );

  const activeZone = hoveredZone || value;
  const activeZoneData = activeZone
    ? TIMEZONE_ZONES[activeZone as TimezoneKey]
    : null;

  // States in the hovered/selected zone
  const highlightedStates = new Set(
    activeZone ? STATES_BY_ZONE[activeZone] || [] : []
  );

  return (
    <div className="relative">
      <svg
        viewBox="60 0 920 540"
        className="w-full h-auto"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredZone(null)}
      >
        {/* Glow filter definitions */}
        <defs>
          {Object.entries(TIMEZONE_ZONES).map(([tz, data]) => (
            <filter key={tz} id={`glow-${tz.replace(/\//g, "-")}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feFlood floodColor={data.color} floodOpacity="0.6" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="shadow" />
              <feMerge>
                <feMergeNode in="shadow" />
                <feMergeNode in="shadow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
        </defs>

        {/* Inset labels */}
        <text x="105" y="450" className="fill-foreground/20 text-[11px]" textAnchor="middle">Alaska</text>
        <text x="242" y="450" className="fill-foreground/20 text-[11px]" textAnchor="middle">Hawaii</text>

        {/* Inset separator lines */}
        <line x1="72" y1="440" x2="198" y2="440" stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
        <line x1="218" y1="440" x2="270" y2="440" stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />

        {/* State paths */}
        {US_STATES.map((state) => {
          const zoneData = TIMEZONE_ZONES[state.zone as TimezoneKey];
          const isHighlighted = highlightedStates.has(state.id);
          const isSelected = state.zone === value;
          const isHoveredZone = state.zone === hoveredZone;

          return (
            <motion.path
              key={state.id}
              d={state.path}
              onClick={() => onChange(state.zone)}
              onMouseEnter={() => setHoveredZone(state.zone)}
              className="cursor-pointer"
              fill={zoneData.color}
              fillOpacity={isHighlighted ? 0.3 : 0.08}
              stroke={zoneData.color}
              strokeWidth={isHighlighted ? 1.5 : 0.5}
              strokeOpacity={isHighlighted ? 0.8 : 0.15}
              filter={
                isHoveredZone
                  ? `url(#glow-${state.zone.replace(/\//g, "-")})`
                  : undefined
              }
              animate={{
                fillOpacity: isSelected
                  ? 0.35
                  : isHighlighted
                    ? 0.25
                    : 0.08,
                strokeOpacity: isSelected
                  ? 1
                  : isHighlighted
                    ? 0.7
                    : 0.15,
              }}
              transition={{ duration: 0.2 }}
            />
          );
        })}

        {/* Selected zone checkmark / indicator */}
        {value &&
          US_STATES.filter((s) => s.zone === value).map((state) => {
            // Show a subtle dot on selected states
            const zoneData = TIMEZONE_ZONES[state.zone as TimezoneKey];
            return (
              <circle
                key={`sel-${state.id}`}
                cx={getPathCenter(state.path).x}
                cy={getPathCenter(state.path).y}
                r="2"
                fill={zoneData.color}
                fillOpacity={0.6}
                className="pointer-events-none"
              />
            );
          })}
      </svg>

      {/* Tooltip */}
      {hoveredZone && activeZoneData && (
        <div
          className="pointer-events-none absolute z-50 rounded-lg border border-border bg-surface px-3 py-2 shadow-lg shadow-black/30"
          style={{
            left: tooltipPos.x + 12,
            top: tooltipPos.y - 40,
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: activeZoneData.color }}
            />
            <span className="text-xs font-medium text-foreground">
              {activeZoneData.label}
            </span>
          </div>
          {liveTimes[hoveredZone] && (
            <p
              className="mt-0.5 text-xs font-mono"
              style={{ color: activeZoneData.color }}
            >
              {liveTimes[hoveredZone]}
            </p>
          )}
        </div>
      )}

      {/* Selected label below map */}
      {value && (
        <div className="mt-2 flex items-center justify-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{
              backgroundColor:
                TIMEZONE_ZONES[value as TimezoneKey]?.color,
            }}
          />
          <span className="text-sm text-foreground">
            {TIMEZONE_ZONES[value as TimezoneKey]?.label}
          </span>
          <span
            className="text-xs font-mono"
            style={{ color: TIMEZONE_ZONES[value as TimezoneKey]?.color }}
          >
            {liveTimes[value]}
          </span>
        </div>
      )}
    </div>
  );
}

// Get approximate center of an SVG path by averaging its points
function getPathCenter(d: string): { x: number; y: number } {
  const nums = d.match(/[\d.]+/g);
  if (!nums || nums.length < 2) return { x: 0, y: 0 };
  let sumX = 0,
    sumY = 0,
    count = 0;
  for (let i = 0; i < nums.length - 1; i += 2) {
    sumX += parseFloat(nums[i]);
    sumY += parseFloat(nums[i + 1]);
    count++;
  }
  return { x: sumX / count, y: sumY / count };
}
