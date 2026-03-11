import { GAME_TEAM_SIZES } from "./tournament-constants";

export const TAG_REGEX = /^[A-Za-z0-9]{3,5}$/;
export const TAG_MIN = 3;
export const TAG_MAX = 5;

export const TEAM_LIMITS = {
  NAME_MAX: 50,
  BIO_MAX: 300,
  MAX_TEAMS_CREATED_PER_USER: 5,
  INVITE_EXPIRY_DAYS: 7,
} as const;

export const TEAM_ROLES = [
  { value: "captain", label: "Captain" },
  { value: "co_captain", label: "Co-Captain" },
  { value: "member", label: "Member" },
  { value: "sub", label: "Sub" },
] as const;

export type TeamRole = (typeof TEAM_ROLES)[number]["value"];

// Default min/max roster sizes per game
// Min = standard team size, Max = standard + 2–3 bench spots
export function getTeamSizeLimits(game: string): { minSize: number; maxSize: number } {
  const base = GAME_TEAM_SIZES[game] ?? 5;
  return {
    minSize: base,
    maxSize: base + 3,
  };
}
