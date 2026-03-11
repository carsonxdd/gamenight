"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GAME_RANK_TIERS } from "@/lib/constants";

interface RankSelectorProps {
  gameName: string;
  value: string;
  onChange: (rank: string) => void;
}

export default function RankSelector({
  gameName,
  value,
  onChange,
}: RankSelectorProps) {
  const tiers = GAME_RANK_TIERS[gameName];

  // Find which tier the current value belongs to
  const activeTier = tiers?.find((t) => t.ranks.includes(value));
  const [expandedTier, setExpandedTier] = useState<string | null>(
    activeTier?.name ?? null
  );

  if (!tiers) return null;

  const handleTierClick = (tier: (typeof tiers)[0]) => {
    if (tier.ranks.length === 1) {
      // Single rank tier — select directly
      if (value === tier.ranks[0]) {
        onChange(""); // deselect
      } else {
        onChange(tier.ranks[0]);
      }
      setExpandedTier(null);
    } else {
      // Multi-rank tier — expand to show subdivisions
      setExpandedTier(expandedTier === tier.name ? null : tier.name);
    }
  };

  const handleRankClick = (rank: string) => {
    if (value === rank) {
      onChange(""); // deselect
    } else {
      onChange(rank);
    }
  };

  // Check if any rank in this tier is selected
  const isTierSelected = (tier: (typeof tiers)[0]) =>
    tier.ranks.includes(value);

  return (
    <div>
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
        {tiers.map((tier) => {
          const selected = isTierSelected(tier);
          const isExpanded = expandedTier === tier.name;
          return (
            <button
              key={tier.name}
              type="button"
              onClick={() => handleTierClick(tier)}
              className={`relative rounded-lg border px-2 py-2.5 text-center text-xs font-medium transition-all ${
                selected
                  ? "border-current ring-1 ring-current"
                  : isExpanded
                    ? "border-current/50"
                    : "border-border hover:border-current/30"
              }`}
              style={{
                color: tier.color,
                backgroundColor: selected
                  ? `${tier.color}20`
                  : `${tier.color}08`,
              }}
            >
              <span
                className={`transition-opacity ${
                  selected ? "opacity-100" : "opacity-60"
                }`}
              >
                {tier.name}
              </span>
              {tier.ranks.length > 1 && (
                <span
                  className="absolute right-1 top-1 text-[8px] opacity-30"
                >
                  {tier.ranks.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {expandedTier && (
          <motion.div
            key={expandedTier}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-lg border border-border/50 bg-surface-light p-2">
              <p className="mb-1.5 text-[10px] uppercase tracking-wider text-foreground/30">
                Select your {expandedTier} rank
              </p>
              <div className="flex flex-wrap gap-1.5">
                {tiers
                  .find((t) => t.name === expandedTier)
                  ?.ranks.map((rank) => {
                    const tierData = tiers.find(
                      (t) => t.name === expandedTier
                    )!;
                    const isSelected = value === rank;
                    // Extract just the subdivision part (e.g., "1" from "Gold 1", "IV" from "Iron IV")
                    const shortLabel =
                      rank.replace(expandedTier, "").trim() ||
                      rank.replace(tierData.name, "").trim() ||
                      rank;
                    return (
                      <button
                        key={rank}
                        type="button"
                        onClick={() => handleRankClick(rank)}
                        className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-all ${
                          isSelected
                            ? "border-current ring-1 ring-current"
                            : "border-border hover:border-current/30"
                        }`}
                        style={{
                          color: tierData.color,
                          backgroundColor: isSelected
                            ? `${tierData.color}20`
                            : `${tierData.color}08`,
                        }}
                        title={rank}
                      >
                        {shortLabel}
                      </button>
                    );
                  })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {value && (
        <div className="mt-2 flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: activeTier?.color }}
          />
          <span className="text-xs text-foreground/60">{value}</span>
          <button
            type="button"
            onClick={() => {
              onChange("");
              setExpandedTier(null);
            }}
            className="text-xs text-foreground/30 hover:text-danger transition"
          >
            clear
          </button>
        </div>
      )}
    </div>
  );
}
