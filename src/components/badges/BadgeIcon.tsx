"use client";

import * as LucideIcons from "lucide-react";
import { BADGE_TIERS, type BadgeTier } from "@/lib/badges/constants";

interface Props {
  icon: string;
  tier: BadgeTier;
  size?: number;
  tooltip?: string;
  className?: string;
  earned?: boolean;
}

export default function BadgeIcon({
  icon,
  tier,
  size = 20,
  tooltip,
  className = "",
  earned = true,
}: Props) {
  const tierColor = BADGE_TIERS[tier]?.color ?? BADGE_TIERS.binary.color;
  // Dynamically resolve Lucide icon by name
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (LucideIcons as any)[icon] ?? LucideIcons.Award;

  return (
    <div className={`group relative inline-flex ${className}`}>
      <div
        className="flex items-center justify-center rounded-full"
        style={{
          width: size + 8,
          height: size + 8,
          border: `2px solid ${earned ? tierColor : "rgba(255,255,255,0.1)"}`,
          opacity: earned ? 1 : 0.3,
        }}
      >
        <IconComponent
          size={size}
          className={earned ? "text-foreground" : "text-foreground/20"}
        />
      </div>
      {tooltip && (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-surface px-2 py-1 text-xs text-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
          {tooltip}
        </div>
      )}
    </div>
  );
}
