"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { fadeIn } from "@/lib/animations";
import { Flame, Star } from "lucide-react";
import BadgeIcon from "./BadgeIcon";
import { BADGE_CATEGORIES, BADGE_TIERS, MAX_SHOWCASED_BADGES, type BadgeTier } from "@/lib/badges/constants";
import { toggleShowcase } from "@/app/badges/actions";

export interface BadgeItem {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tier: string;
  earned: boolean;
  awardedAt: string | null;
  showcased: boolean;
  userBadgeId: string | null;
}

export interface StreakData {
  attendance: { currentCount: number; longestCount: number };
  weekly: { currentCount: number; longestCount: number };
}

interface Props {
  badges: BadgeItem[];
  streaks: StreakData;
}

export default function AchievementsTab({ badges: initialBadges, streaks }: Props) {
  const [badges, setBadges] = useState(initialBadges);
  const [isPending, startTransition] = useTransition();

  const showcasedCount = badges.filter((b) => b.showcased).length;
  const earnedCount = badges.filter((b) => b.earned).length;

  // Group by category
  const grouped = BADGE_CATEGORIES.reduce((acc, cat) => {
    const catBadges = badges.filter((b) => b.category === cat);
    if (catBadges.length > 0) acc.push({ category: cat, badges: catBadges });
    return acc;
  }, [] as { category: string; badges: BadgeItem[] }[]);

  function handleToggleShowcase(badge: BadgeItem) {
    if (!badge.userBadgeId || !badge.earned) return;
    if (!badge.showcased && showcasedCount >= MAX_SHOWCASED_BADGES) return;

    startTransition(async () => {
      const result = await toggleShowcase(badge.userBadgeId!);
      if (result.success) {
        setBadges((prev) =>
          prev.map((b) =>
            b.id === badge.id ? { ...b, showcased: !b.showcased } : b
          )
        );
      }
    });
  }

  return (
    <motion.div {...fadeIn} className="space-y-6">
      {/* Streak Counters */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StreakCard
          label="Attendance Streak"
          icon={<Flame size={18} className="text-orange-400" />}
          current={streaks.attendance.currentCount}
          longest={streaks.attendance.longestCount}
        />
        <StreakCard
          label="Weekly Streak"
          icon={<Flame size={18} className="text-blue-400" />}
          current={streaks.weekly.currentCount}
          longest={streaks.weekly.longestCount}
        />
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-foreground/50">Badges Earned</p>
          <p className="mt-1 text-2xl font-bold text-neon">
            {earnedCount}<span className="text-sm text-foreground/30">/{badges.length}</span>
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-foreground/50">Showcased</p>
          <p className="mt-1 text-2xl font-bold text-neon">
            {showcasedCount}<span className="text-sm text-foreground/30">/{MAX_SHOWCASED_BADGES}</span>
          </p>
        </div>
      </div>

      {/* Badge Grid by Category */}
      {grouped.map(({ category, badges: catBadges }) => (
        <div key={category}>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground/50">
            {category}
          </h3>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {catBadges.map((badge) => {
              const tierInfo = BADGE_TIERS[badge.tier as BadgeTier];
              const canShowcase = badge.earned && badge.userBadgeId && (!badge.showcased || true) && (badge.showcased || showcasedCount < MAX_SHOWCASED_BADGES);
              return (
                <div key={badge.id} className="group relative">
                  <button
                    onClick={() => canShowcase ? handleToggleShowcase(badge) : undefined}
                    disabled={isPending}
                    className={`relative flex w-full flex-col items-center gap-1.5 rounded-xl border p-3 transition ${
                      badge.earned
                        ? badge.showcased
                          ? "border-yellow-400/40 bg-yellow-400/5 hover:border-yellow-400/60 cursor-pointer"
                          : "border-border bg-surface hover:border-neon/30 cursor-pointer"
                        : "border-border/30 bg-surface/30 cursor-default"
                    }`}
                  >
                    <BadgeIcon
                      icon={badge.icon}
                      tier={badge.tier as BadgeTier}
                      size={28}
                      earned={badge.earned}
                    />
                    <p className={`text-center text-[11px] leading-tight ${
                      badge.earned ? "text-foreground" : "text-foreground/20"
                    }`}>
                      {badge.name}
                    </p>
                    {badge.showcased && (
                      <Star size={10} className="absolute top-1.5 right-1.5 fill-yellow-400 text-yellow-400" />
                    )}
                  </button>
                  {/* Hover tooltip */}
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 w-56 rounded-xl border border-border bg-surface px-4 py-3 text-center opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                    <p
                      className="text-sm font-bold"
                      style={{ color: tierInfo?.color }}
                    >
                      {badge.name}
                    </p>
                    <p className="mt-1 text-xs text-foreground/60">{badge.description}</p>
                    {badge.earned && badge.awardedAt && (
                      <p className="mt-1.5 text-[11px] text-foreground/40">
                        Earned {new Date(badge.awardedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    )}
                    {badge.earned && (
                      <p className="mt-1 text-[11px] text-foreground/30">
                        {badge.showcased ? "Click to remove from showcase" : showcasedCount >= MAX_SHOWCASED_BADGES ? `Showcase full (${MAX_SHOWCASED_BADGES}/${MAX_SHOWCASED_BADGES})` : "Click to showcase"}
                      </p>
                    )}
                    {!badge.earned && (
                      <p className="mt-1.5 text-[11px] italic text-foreground/25">Not yet earned</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

    </motion.div>
  );
}

function StreakCard({
  label,
  icon,
  current,
  longest,
}: {
  label: string;
  icon: React.ReactNode;
  current: number;
  longest: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-xs text-foreground/50">{label}</p>
      </div>
      <p className="mt-1 text-2xl font-bold text-foreground">{current}</p>
      <p className="text-xs text-foreground/30">Best: {longest}</p>
    </div>
  );
}
