export const BRACKET_TYPES = [
  { value: "single_elim", label: "Single Elimination", description: "Lose once, you're out" },
  { value: "double_elim", label: "Double Elimination", description: "Two losses to eliminate" },
  { value: "round_robin", label: "Round Robin", description: "Everyone plays everyone" },
  { value: "swiss", label: "Swiss System", description: "Paired by similar records" },
  { value: "constellation", label: "Constellation", description: "Losers re-seeded into secondary brackets" },
  { value: "ffa", label: "Free-for-All", description: "Point-based, no brackets" },
] as const;

export const BRACKET_TYPE_VALUES = BRACKET_TYPES.map((b) => b.value);
export type BracketType = (typeof BRACKET_TYPE_VALUES)[number];

export const FORMAT_OPTIONS = [
  { value: "solo", label: "1v1 / Solo" },
  { value: "team", label: "Team" },
] as const;

export const SEEDING_MODES = [
  { value: "random", label: "Random", description: "Fully random seeding" },
  { value: "ranked", label: "Ranked", description: "Seed by game rank (highest vs lowest)" },
  { value: "random_constrained", label: "Balanced Random", description: "Random but top seeds can't meet in round 1" },
] as const;

export const CAPTAIN_MODES = [
  { value: "ranked", label: "By Rank", description: "Highest ranked players become captains" },
  { value: "manual", label: "Manual", description: "Tournament creator picks captains" },
  { value: "random", label: "Random", description: "Randomly selected captains" },
] as const;

export const BEST_OF_OPTIONS = [
  { value: 1, label: "Best of 1" },
  { value: 3, label: "Best of 3" },
] as const;

export const TOURNAMENT_STATUSES = [
  { value: "draft", label: "Draft", color: "text-foreground/50" },
  { value: "open", label: "Open", color: "text-neon" },
  { value: "in_progress", label: "In Progress", color: "text-warning" },
  { value: "completed", label: "Completed", color: "text-foreground" },
  { value: "archived", label: "Archived", color: "text-foreground/30" },
] as const;

// Default team sizes per game
export const GAME_TEAM_SIZES: Record<string, number> = {
  "League of Legends": 5,
  "Dota 2": 5,
  "Valorant": 5,
  "CS2": 5,
  "Overwatch 2": 6,
  "Marvel Rivals": 6,
  "Halo": 5,
  "TF2": 6,
  "Rocket League": 3,
};

// Slot presets for quick selection
export const SLOT_PRESETS = [4, 8, 16, 32] as const;

export const TOURNAMENT_LIMITS = {
  TITLE_MAX: 100,
  DESCRIPTION_MAX: 500,
  COMMENT_MAX: 500,
  MAX_SLOTS: 64,
  MIN_SLOTS: 2,
  MAX_TOURNAMENTS_PER_WEEK: 3,
} as const;
