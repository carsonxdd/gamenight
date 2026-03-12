// Accent color presets for the site theme
export const ACCENT_PRESETS = [
  { name: "Matrix Green", hex: "#00ff41" },
  { name: "Neon Green", hex: "#39FF14" },
  { name: "Electric Blue", hex: "#00D4FF" },
  { name: "Purple", hex: "#BF5AF2" },
  { name: "Hot Pink", hex: "#FF2D55" },
  { name: "Orange", hex: "#FF9500" },
  { name: "Gold", hex: "#FFD60A" },
  { name: "Red", hex: "#FF3B30" },
  { name: "Teal", hex: "#30D5C8" },
  { name: "Lime", hex: "#A8FF04" },
  { name: "Ice Blue", hex: "#64D2FF" },
  { name: "Coral", hex: "#FF6B6B" },
  { name: "Lavender", hex: "#D4BBFF" },
] as const;

export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 255, 65];
}

export function darkenHex(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex);
  const d = (v: number) => Math.round(v * (1 - factor));
  return `#${d(r).toString(16).padStart(2, "0")}${d(g).toString(16).padStart(2, "0")}${d(b).toString(16).padStart(2, "0")}`;
}

// Settings sections for the admin panel
export const SETTINGS_SECTIONS = [
  { key: "branding", label: "Branding" },
  { key: "availability", label: "Availability" },
  { key: "access", label: "Access & Privacy" },
  { key: "events", label: "Events" },
  { key: "polls", label: "Polls" },
  { key: "tournaments", label: "Tournaments" },
  { key: "teams", label: "Teams" },
  { key: "toggles", label: "Feature Toggles" },
] as const;

export type SettingsSection = (typeof SETTINGS_SECTIONS)[number]["key"];

// Join mode options
export const JOIN_MODES = [
  { value: "open", label: "Open", description: "Anyone can sign up" },
  { value: "invite_only", label: "Invite Only", description: "Requires an invite code" },
  { value: "approval", label: "Approval", description: "Admin must approve new members" },
] as const;

// Feature toggle definitions
export const FEATURE_TOGGLES = [
  { key: "enablePolls", label: "Polls", description: "Community polls and voting" },
  { key: "enableTournaments", label: "Tournaments", description: "Tournament brackets and competition" },
  { key: "enableTeams", label: "Teams", description: "Persistent teams with rosters" },
  { key: "enableHighlights", label: "Highlights", description: "Highlights page" },
  { key: "enableStats", label: "Stats", description: "Stats tab on Members page" },
] as const;

// Type for all site settings
export interface SiteSettingsData {
  // Existing
  primeStartHour: number;
  primeEndHour: number;
  extendedStartHour: number;
  extendedEndHour: number;
  anchorTimezone: string;
  defaultEventDuration: number;
  maxEventsPerWeek: number;
  maxPollsPerWeek: number;
  communityName: string;
  motd: string | null;
  // Branding
  accentColor: string;
  communityTagline: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  // Access & Privacy
  joinMode: string;
  requireGamertag: boolean;
  allowPublicProfiles: boolean;
  showMemberCount: boolean;
  // Events
  allowMemberEvents: boolean;
  requireRSVP: boolean;
  maxAttendeesDefault: number;
  autoArchiveDays: number;
  // Polls
  allowMemberPolls: boolean;
  allowPollComments: boolean;
  // Tournaments
  allowMemberTournaments: boolean;
  maxTournamentSize: number;
  enableBuyIns: boolean;
  // Teams
  allowTeamCreation: boolean;
  maxTeamsPerUser: number;
  maxTeamSize: number;
  // Feature Toggles
  enableTournaments: boolean;
  enableTeams: boolean;
  enablePolls: boolean;
  enableHighlights: boolean;
  enableStats: boolean;
}
