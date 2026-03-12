// ─── Badge Categories ────────────────────────────────────────────────
export const BADGE_CATEGORIES = [
  "attendance",
  "competition",
  "community",
  "engagement",
  "profile",
  "special",
  "custom",
] as const;
export type BadgeCategory = (typeof BADGE_CATEGORIES)[number];

// ─── Badge Tiers ─────────────────────────────────────────────────────
export const BADGE_TIERS = {
  binary:  { label: "Standard", color: "var(--color-accent)" },
  bronze:  { label: "Bronze",   color: "#CD7F32" },
  silver:  { label: "Silver",   color: "#C0C0C0" },
  gold:    { label: "Gold",     color: "#FFD700" },
  diamond: { label: "Diamond",  color: "#B9F2FF" },
} as const;
export type BadgeTier = keyof typeof BADGE_TIERS;

// ─── Metric Keys ─────────────────────────────────────────────────────
export const METRIC_KEYS = [
  "events_attended",
  "poll_votes",
  "comments",
  "tournaments_joined",
  "tournament_wins",
  "polls_created",
  "attendance_streak",
  "weekly_activity",
  "team_joined",
  "team_captain",
  "profile_complete",
  "games_added",
] as const;
export type MetricKey = (typeof METRIC_KEYS)[number];

// ─── Showcase Limit ──────────────────────────────────────────────────
export const MAX_SHOWCASED_BADGES = 3;

// ─── System Badge Definitions ────────────────────────────────────────
export interface SystemBadge {
  key: string;
  name: string;
  description: string;
  icon: string;        // Lucide icon name
  category: BadgeCategory;
  tier: BadgeTier;
  triggerConfig: {
    type: "threshold" | "special";
    metric?: MetricKey;
    value?: number;
    check?: string;     // function name for special checks
  };
}

export const SYSTEM_BADGES: SystemBadge[] = [
  // ── Attendance ──
  {
    key: "first_timer",
    name: "First Timer",
    description: "Attended your first game night",
    icon: "PartyPopper",
    category: "attendance",
    tier: "binary",
    triggerConfig: { type: "threshold", metric: "events_attended", value: 1 },
  },
  {
    key: "regular_5",
    name: "Regular",
    description: "Attended 5 game nights",
    icon: "CalendarCheck",
    category: "attendance",
    tier: "bronze",
    triggerConfig: { type: "threshold", metric: "events_attended", value: 5 },
  },
  {
    key: "dedicated_25",
    name: "Dedicated",
    description: "Attended 25 game nights",
    icon: "CalendarHeart",
    category: "attendance",
    tier: "silver",
    triggerConfig: { type: "threshold", metric: "events_attended", value: 25 },
  },
  {
    key: "veteran_50",
    name: "Veteran",
    description: "Attended 50 game nights",
    icon: "Award",
    category: "attendance",
    tier: "gold",
    triggerConfig: { type: "threshold", metric: "events_attended", value: 50 },
  },
  {
    key: "streak_3",
    name: "On a Roll",
    description: "3-event attendance streak",
    icon: "Flame",
    category: "attendance",
    tier: "bronze",
    triggerConfig: { type: "threshold", metric: "attendance_streak", value: 3 },
  },
  {
    key: "streak_10",
    name: "Unstoppable",
    description: "10-event attendance streak",
    icon: "Zap",
    category: "attendance",
    tier: "gold",
    triggerConfig: { type: "threshold", metric: "attendance_streak", value: 10 },
  },

  // ── Competition ──
  {
    key: "competitor",
    name: "Competitor",
    description: "Joined your first tournament",
    icon: "Swords",
    category: "competition",
    tier: "binary",
    triggerConfig: { type: "threshold", metric: "tournaments_joined", value: 1 },
  },
  {
    key: "champion",
    name: "Champion",
    description: "Won a tournament",
    icon: "Trophy",
    category: "competition",
    tier: "gold",
    triggerConfig: { type: "threshold", metric: "tournament_wins", value: 1 },
  },
  {
    key: "dynasty",
    name: "Dynasty",
    description: "Won 5 tournaments",
    icon: "Crown",
    category: "competition",
    tier: "diamond",
    triggerConfig: { type: "threshold", metric: "tournament_wins", value: 5 },
  },

  // ── Community ──
  {
    key: "voice_heard",
    name: "Voice Heard",
    description: "Voted in your first poll",
    icon: "Vote",
    category: "community",
    tier: "binary",
    triggerConfig: { type: "threshold", metric: "poll_votes", value: 1 },
  },
  {
    key: "poll_maker",
    name: "Poll Maker",
    description: "Created 3 polls",
    icon: "ListChecks",
    category: "community",
    tier: "bronze",
    triggerConfig: { type: "threshold", metric: "polls_created", value: 3 },
  },
  {
    key: "commentator",
    name: "Commentator",
    description: "Left 10 comments",
    icon: "MessageSquare",
    category: "community",
    tier: "bronze",
    triggerConfig: { type: "threshold", metric: "comments", value: 10 },
  },

  // ── Engagement ──
  {
    key: "team_player",
    name: "Team Player",
    description: "Joined a team",
    icon: "Users",
    category: "engagement",
    tier: "binary",
    triggerConfig: { type: "threshold", metric: "team_joined", value: 1 },
  },
  {
    key: "team_leader",
    name: "Team Leader",
    description: "Created a team as captain",
    icon: "Shield",
    category: "engagement",
    tier: "silver",
    triggerConfig: { type: "threshold", metric: "team_captain", value: 1 },
  },
  {
    key: "weekly_warrior_4",
    name: "Weekly Warrior",
    description: "4-week activity streak",
    icon: "Calendar",
    category: "engagement",
    tier: "bronze",
    triggerConfig: { type: "threshold", metric: "weekly_activity", value: 4 },
  },
  {
    key: "weekly_warrior_12",
    name: "Iron Will",
    description: "12-week activity streak",
    icon: "CalendarRange",
    category: "engagement",
    tier: "gold",
    triggerConfig: { type: "threshold", metric: "weekly_activity", value: 12 },
  },

  // ── Profile ──
  {
    key: "profile_complete",
    name: "Profile Complete",
    description: "Filled out your full profile",
    icon: "UserCheck",
    category: "profile",
    tier: "binary",
    triggerConfig: { type: "special", check: "checkProfileComplete" },
  },
  {
    key: "game_collector",
    name: "Game Collector",
    description: "Added 5 games to your profile",
    icon: "Gamepad2",
    category: "profile",
    tier: "bronze",
    triggerConfig: { type: "threshold", metric: "games_added", value: 5 },
  },
];
