"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { fadeIn } from "@/lib/animations";
import Card from "@/components/ui/Card";
import { BADGE_CATEGORIES, BADGE_TIERS, type BadgeCategory, type BadgeTier } from "@/lib/badges/constants";
import { toggleBadgeEnabled, deleteBadge } from "@/app/badges/actions";
import CreateBadgeModal from "./CreateBadgeModal";
import ManualAwardModal from "./ManualAwardModal";
import BadgeIcon from "@/components/badges/BadgeIcon";

export interface BadgeData {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tier: string;
  source: string;
  isEnabled: boolean;
  triggerConfig: string;
  earnedCount: number;
  createdAt: string;
}

export interface UserOption {
  id: string;
  name: string;
  gamertag: string | null;
  avatar: string | null;
}

interface Props {
  badges: BadgeData[];
  users: UserOption[];
}

export default function BadgeManager({ badges: initialBadges, users }: Props) {
  const [badges, setBadges] = useState(initialBadges);
  const [filter, setFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [showAward, setShowAward] = useState(false);

  const filtered = filter === "all"
    ? badges
    : badges.filter((b) => b.category === filter);

  const totalAwarded = badges.reduce((s, b) => s + b.earnedCount, 0);
  const mostCommon = [...badges].sort((a, b) => b.earnedCount - a.earnedCount)[0];

  async function handleToggleEnabled(id: string) {
    const result = await toggleBadgeEnabled(id);
    if (result.success) {
      setBadges((prev) =>
        prev.map((b) => (b.id === id ? { ...b, isEnabled: !b.isEnabled } : b))
      );
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this custom badge? This will remove it from all users.")) return;
    const result = await deleteBadge(id);
    if (result.success) {
      setBadges((prev) => prev.filter((b) => b.id !== id));
    }
  }

  return (
    <motion.div {...fadeIn} className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <Card glow>
          <p className="text-xs text-foreground/50">Total Badges</p>
          <p className="mt-1 text-2xl font-bold text-neon">{badges.length}</p>
        </Card>
        <Card glow>
          <p className="text-xs text-foreground/50">Total Awarded</p>
          <p className="mt-1 text-2xl font-bold text-neon">{totalAwarded}</p>
        </Card>
        <Card glow>
          <p className="text-xs text-foreground/50">Most Common</p>
          <p className="mt-1 text-sm font-bold text-neon truncate">
            {mostCommon ? mostCommon.name : "—"}
          </p>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground"
        >
          <option value="all">All Categories</option>
          {BADGE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-neon/10 px-4 py-1.5 text-sm font-medium text-neon transition hover:bg-neon/20"
        >
          + Create Custom Badge
        </button>
        <button
          onClick={() => setShowAward(true)}
          className="rounded-lg border border-border bg-surface px-4 py-1.5 text-sm font-medium text-foreground transition hover:border-neon/40"
        >
          Award Badge
        </button>
      </div>

      {/* Badge Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface/50 text-left text-xs text-foreground/50">
              <th className="px-4 py-3">Badge</th>
              <th className="px-4 py-3 hidden sm:table-cell">Category</th>
              <th className="px-4 py-3 hidden md:table-cell">Tier</th>
              <th className="px-4 py-3">Earned</th>
              <th className="px-4 py-3">Enabled</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((badge) => (
              <tr key={badge.id} className="hover:bg-surface/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <BadgeIcon
                      icon={badge.icon}
                      tier={badge.tier as BadgeTier}
                      size={24}
                    />
                    <div>
                      <p className="font-medium text-foreground">{badge.name}</p>
                      <p className="text-xs text-foreground/40">{badge.description}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-foreground/60">
                    {badge.category}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span
                    className="text-xs font-medium"
                    style={{ color: BADGE_TIERS[badge.tier as BadgeTier]?.color }}
                  >
                    {BADGE_TIERS[badge.tier as BadgeTier]?.label ?? badge.tier}
                  </span>
                </td>
                <td className="px-4 py-3 text-foreground/60">{badge.earnedCount}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggleEnabled(badge.id)}
                    className={`relative h-5 w-9 rounded-full transition ${
                      badge.isEnabled ? "bg-neon/30" : "bg-foreground/10"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full transition-transform ${
                        badge.isEnabled ? "translate-x-4 bg-neon" : "bg-foreground/30"
                      }`}
                    />
                  </button>
                </td>
                <td className="px-4 py-3">
                  {badge.source === "custom" && (
                    <button
                      onClick={() => handleDelete(badge.id)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateBadgeModal
          onClose={() => setShowCreate(false)}
          onCreated={(newBadge) => {
            setBadges((prev) => [...prev, newBadge]);
            setShowCreate(false);
          }}
        />
      )}

      {showAward && (
        <ManualAwardModal
          badges={badges.filter((b) => b.isEnabled)}
          users={users}
          onClose={() => setShowAward(false)}
        />
      )}
    </motion.div>
  );
}
