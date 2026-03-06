"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { US_TIMEZONES } from "@/lib/constants";
import TimezoneMap from "./TimezoneMap";
import { TIMEZONE_ZONES, type TimezoneKey } from "@/lib/us-states";

interface TimezoneSelectProps {
  value: string;
  onChange: (value: string) => void;
  mode?: "setup" | "edit";
}

export default function TimezoneSelect({
  value,
  onChange,
  mode = "setup",
}: TimezoneSelectProps) {
  // In setup mode, map is always visible. In edit mode, collapsed behind a button.
  const [mapOpen, setMapOpen] = useState(mode === "setup");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = US_TIMEZONES.find((tz) => tz.value === value);
  const zoneData = value ? TIMEZONE_ZONES[value as TimezoneKey] : null;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMapChange = (tz: string) => {
    onChange(tz);
    // In edit mode, collapse map after selection
    if (mode === "edit") {
      setMapOpen(false);
    }
  };

  return (
    <div>
      {/* Desktop */}
      <div className="hidden sm:block">
        {mode === "edit" && (
          <button
            type="button"
            onClick={() => setMapOpen(!mapOpen)}
            className={`flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-left text-sm transition ${
              mapOpen
                ? "border-neon bg-surface"
                : value
                  ? "border-border bg-surface hover:border-border-light"
                  : "border-border bg-surface text-foreground/30 hover:border-border-light"
            }`}
          >
            <div className="flex items-center gap-2">
              {zoneData && (
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: zoneData.color }}
                />
              )}
              <span className={value ? "text-foreground" : "text-foreground/30"}>
                {selected ? selected.label : "Select your timezone..."}
              </span>
            </div>
            <motion.span
              animate={{ rotate: mapOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-foreground/40"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                className="stroke-current"
              >
                <path
                  d="M2.5 4.5L6 8L9.5 4.5"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.span>
          </button>
        )}
        <AnimatePresence initial={mode === "setup"}>
          {mapOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              className="overflow-hidden"
            >
              <div className={mode === "edit" ? "pt-3" : ""}>
                <TimezoneMap value={value} onChange={handleMapChange} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile: Animated dropdown */}
      <div className="sm:hidden relative" ref={containerRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={`flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-left text-sm transition ${
            dropdownOpen
              ? "border-neon bg-surface"
              : "border-border bg-surface hover:border-border-light"
          } ${selected ? "text-foreground" : "text-foreground/30"}`}
        >
          <span>{selected ? selected.label : "Select your timezone..."}</span>
          <motion.span
            animate={{ rotate: dropdownOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-foreground/40"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className="stroke-current"
            >
              <path
                d="M2.5 4.5L6 8L9.5 4.5"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.span>
        </button>

        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scaleY: 0.95 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -4, scaleY: 0.95 }}
              transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
              className="absolute z-50 mt-1 w-full origin-top rounded-lg border border-border bg-surface shadow-lg shadow-black/20"
            >
              {US_TIMEZONES.map((tz) => {
                const isSelected = tz.value === value;
                return (
                  <button
                    key={tz.value}
                    type="button"
                    onClick={() => {
                      onChange(tz.value);
                      setDropdownOpen(false);
                    }}
                    className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition first:rounded-t-lg last:rounded-b-lg ${
                      isSelected
                        ? "bg-neon/10 text-neon"
                        : "text-foreground/70 hover:bg-surface-light hover:text-foreground"
                    }`}
                  >
                    <span className="flex-1">{tz.label}</span>
                    {isSelected && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-neon"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          className="stroke-current"
                        >
                          <path
                            d="M3 7L6 10L11 4"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </motion.span>
                    )}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
