"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BADGE_TIERS, type BadgeTier } from "@/lib/badges/constants";
import * as LucideIcons from "lucide-react";

interface Props {
  name: string;
  icon: string;
  tier: string;
  onDismiss: () => void;
}

const DURATION = 4000;

export default function BadgeToast({ name, icon, tier, onDismiss }: Props) {
  const [progress, setProgress] = useState(100);
  const tierColor = BADGE_TIERS[tier as BadgeTier]?.color ?? BADGE_TIERS.binary.color;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (LucideIcons as any)[icon] ?? LucideIcons.Award;

  useEffect(() => {
    const timer = setTimeout(onDismiss, DURATION);
    const interval = setInterval(() => {
      setProgress((p) => Math.max(0, p - 100 / (DURATION / 50)));
    }, 50);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 80, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="relative w-72 overflow-hidden rounded-xl border bg-surface shadow-2xl"
      style={{ borderColor: tierColor, boxShadow: `0 0 20px ${tierColor}33` }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ border: `2px solid ${tierColor}` }}
        >
          <IconComponent size={20} className="text-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: tierColor }}>
            Achievement Unlocked!
          </p>
          <p className="truncate text-sm font-bold text-foreground">{name}</p>
        </div>
      </div>
      {/* Progress bar */}
      <div className="h-0.5 w-full bg-border">
        <div
          className="h-full transition-all duration-50 ease-linear"
          style={{ width: `${progress}%`, backgroundColor: tierColor }}
        />
      </div>
    </motion.div>
  );
}
