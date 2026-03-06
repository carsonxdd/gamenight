export interface GameDef {
  name: string;
  modes?: string[];
}

export interface GameCategory {
  name: string;
  description: string;
  games: GameDef[];
}

export const GAME_CATEGORIES: GameCategory[] = [
  {
    name: "Everyone Plays",
    description: "One big lobby, everyone together",
    games: [
      { name: "Pummel Party" },
      { name: "Jackbox" },
      { name: "Skribbl.io" },
      { name: "Draw My Thing" },
      { name: "Among Us" },
      { name: "Golf With Friends" },
      { name: "Garry's Mod", modes: ["Murder", "TTT"] },
      { name: "Town of Salem" },
      { name: "Secret Hitler" },
      { name: "Throne of Lies" },
      { name: "Minecraft", modes: ["Survival", "Minigames"] },
    ],
  },
  {
    name: "Team Games",
    description: "Split into teams",
    games: [
      { name: "CS2" },
      {
        name: "Valorant",
        modes: ["Casual 5v5", "1v1 Tournament"],
      },
      {
        name: "Halo",
        modes: ["Big Team (8v8/10v10)", "Custom Games (5v5)", "Free-for-All"],
      },
      { name: "TF2" },
      { name: "Overwatch 2" },
      { name: "Marvel Rivals" },
      { name: "Splitgate" },
      { name: "Left 4 Dead 2" },
      {
        name: "League of Legends",
        modes: ["ARAM", "Draft (Rift)", "Tournament 1v1", "Tournament 3v3", "Tournament 5v5"],
      },
      { name: "Dota 2" },
      {
        name: "Rocket League",
        modes: ["1v1 Tournament", "2v2", "3v3"],
      },
    ],
  },
  {
    name: "Bracket / Tournament",
    description: "1v1 or small teams, everyone spectates",
    games: [
      { name: "Mortal Kombat" },
      { name: "Street Fighter" },
      { name: "Stick Fight: The Game" },
      { name: "Brawlhalla" },
      { name: "SpeedRunners" },
      { name: "Chess.com Arena" },
    ],
  },
];

export const ALL_GAME_DEFS: GameDef[] = GAME_CATEGORIES.flatMap((c) => c.games);
export const GAMES: string[] = ALL_GAME_DEFS.map((g) => g.name);

// Structured rank tiers with colors for visual rank picker
export interface RankTier {
  name: string;
  color: string;
  ranks: string[]; // individual ranks within this tier
}

export const GAME_RANK_TIERS: Record<string, RankTier[]> = {
  "CS2": [
    { name: "Silver", color: "#8C8C8C", ranks: ["Silver I", "Silver II", "Silver III", "Silver IV", "Silver Elite", "Silver Elite Master"] },
    { name: "Gold Nova", color: "#D4A017", ranks: ["Gold Nova I", "Gold Nova II", "Gold Nova III", "Gold Nova Master"] },
    { name: "Master Guardian", color: "#4A90D9", ranks: ["Master Guardian I", "Master Guardian II", "Master Guardian Elite", "Distinguished Master Guardian"] },
    { name: "Eagle", color: "#A855F7", ranks: ["Legendary Eagle", "Legendary Eagle Master"] },
    { name: "Supreme", color: "#EF4444", ranks: ["Supreme Master First Class"] },
    { name: "Global Elite", color: "#FFD700", ranks: ["The Global Elite"] },
  ],
  "Valorant": [
    { name: "Iron", color: "#6B6B6B", ranks: ["Iron 1", "Iron 2", "Iron 3"] },
    { name: "Bronze", color: "#CD7F32", ranks: ["Bronze 1", "Bronze 2", "Bronze 3"] },
    { name: "Silver", color: "#C0C0C0", ranks: ["Silver 1", "Silver 2", "Silver 3"] },
    { name: "Gold", color: "#FFD700", ranks: ["Gold 1", "Gold 2", "Gold 3"] },
    { name: "Platinum", color: "#00CED1", ranks: ["Platinum 1", "Platinum 2", "Platinum 3"] },
    { name: "Diamond", color: "#B9F2FF", ranks: ["Diamond 1", "Diamond 2", "Diamond 3"] },
    { name: "Ascendant", color: "#50C878", ranks: ["Ascendant 1", "Ascendant 2", "Ascendant 3"] },
    { name: "Immortal", color: "#EF4444", ranks: ["Immortal 1", "Immortal 2", "Immortal 3"] },
    { name: "Radiant", color: "#FFFACD", ranks: ["Radiant"] },
  ],
  "League of Legends": [
    { name: "Iron", color: "#6B6B6B", ranks: ["Iron IV", "Iron III", "Iron II", "Iron I"] },
    { name: "Bronze", color: "#CD7F32", ranks: ["Bronze IV", "Bronze III", "Bronze II", "Bronze I"] },
    { name: "Silver", color: "#C0C0C0", ranks: ["Silver IV", "Silver III", "Silver II", "Silver I"] },
    { name: "Gold", color: "#FFD700", ranks: ["Gold IV", "Gold III", "Gold II", "Gold I"] },
    { name: "Platinum", color: "#00CED1", ranks: ["Platinum IV", "Platinum III", "Platinum II", "Platinum I"] },
    { name: "Emerald", color: "#50C878", ranks: ["Emerald IV", "Emerald III", "Emerald II", "Emerald I"] },
    { name: "Diamond", color: "#B9F2FF", ranks: ["Diamond IV", "Diamond III", "Diamond II", "Diamond I"] },
    { name: "Master", color: "#A855F7", ranks: ["Master"] },
    { name: "Grandmaster", color: "#EF4444", ranks: ["Grandmaster"] },
    { name: "Challenger", color: "#FFD700", ranks: ["Challenger"] },
  ],
  "Dota 2": [
    { name: "Herald", color: "#6B6B6B", ranks: ["Herald"] },
    { name: "Guardian", color: "#CD7F32", ranks: ["Guardian"] },
    { name: "Crusader", color: "#C0C0C0", ranks: ["Crusader"] },
    { name: "Archon", color: "#FFD700", ranks: ["Archon"] },
    { name: "Legend", color: "#00CED1", ranks: ["Legend"] },
    { name: "Ancient", color: "#50C878", ranks: ["Ancient"] },
    { name: "Divine", color: "#A855F7", ranks: ["Divine"] },
    { name: "Immortal", color: "#EF4444", ranks: ["Immortal"] },
  ],
  "Rocket League": [
    { name: "Bronze", color: "#CD7F32", ranks: ["Bronze I", "Bronze II", "Bronze III"] },
    { name: "Silver", color: "#C0C0C0", ranks: ["Silver I", "Silver II", "Silver III"] },
    { name: "Gold", color: "#FFD700", ranks: ["Gold I", "Gold II", "Gold III"] },
    { name: "Platinum", color: "#00CED1", ranks: ["Platinum I", "Platinum II", "Platinum III"] },
    { name: "Diamond", color: "#B9F2FF", ranks: ["Diamond I", "Diamond II", "Diamond III"] },
    { name: "Champion", color: "#A855F7", ranks: ["Champion I", "Champion II", "Champion III"] },
    { name: "Grand Champ", color: "#EF4444", ranks: ["Grand Champion I", "Grand Champion II", "Grand Champion III"] },
    { name: "SSL", color: "#FFD700", ranks: ["Supersonic Legend"] },
  ],
  "Overwatch 2": [
    { name: "Bronze", color: "#CD7F32", ranks: ["Bronze 5", "Bronze 4", "Bronze 3", "Bronze 2", "Bronze 1"] },
    { name: "Silver", color: "#C0C0C0", ranks: ["Silver 5", "Silver 4", "Silver 3", "Silver 2", "Silver 1"] },
    { name: "Gold", color: "#FFD700", ranks: ["Gold 5", "Gold 4", "Gold 3", "Gold 2", "Gold 1"] },
    { name: "Platinum", color: "#00CED1", ranks: ["Platinum 5", "Platinum 4", "Platinum 3", "Platinum 2", "Platinum 1"] },
    { name: "Diamond", color: "#B9F2FF", ranks: ["Diamond 5", "Diamond 4", "Diamond 3", "Diamond 2", "Diamond 1"] },
    { name: "Master", color: "#A855F7", ranks: ["Master 5", "Master 4", "Master 3", "Master 2", "Master 1"] },
    { name: "Grandmaster", color: "#EF4444", ranks: ["Grandmaster 5", "Grandmaster 4", "Grandmaster 3", "Grandmaster 2", "Grandmaster 1"] },
    { name: "Champion", color: "#FFD700", ranks: ["Champion 5", "Champion 4", "Champion 3", "Champion 2", "Champion 1"] },
  ],
  "Marvel Rivals": [
    { name: "Bronze", color: "#CD7F32", ranks: ["Bronze III", "Bronze II", "Bronze I"] },
    { name: "Silver", color: "#C0C0C0", ranks: ["Silver III", "Silver II", "Silver I"] },
    { name: "Gold", color: "#FFD700", ranks: ["Gold III", "Gold II", "Gold I"] },
    { name: "Platinum", color: "#00CED1", ranks: ["Platinum III", "Platinum II", "Platinum I"] },
    { name: "Diamond", color: "#B9F2FF", ranks: ["Diamond III", "Diamond II", "Diamond I"] },
    { name: "Grandmaster", color: "#A855F7", ranks: ["Grandmaster III", "Grandmaster II", "Grandmaster I"] },
    { name: "Celestial", color: "#60A5FA", ranks: ["Celestial III", "Celestial II", "Celestial I"] },
    { name: "Eternity", color: "#EF4444", ranks: ["Eternity"] },
    { name: "One Above All", color: "#FFD700", ranks: ["One Above All"] },
  ],
  "Chess.com Arena": [
    { name: "Beginner", color: "#6B6B6B", ranks: ["Under 400", "400-600"] },
    { name: "Casual", color: "#CD7F32", ranks: ["600-800", "800-1000"] },
    { name: "Intermediate", color: "#C0C0C0", ranks: ["1000-1200", "1200-1400"] },
    { name: "Advanced", color: "#FFD700", ranks: ["1400-1600", "1600-1800"] },
    { name: "Expert", color: "#A855F7", ranks: ["1800-2000", "2000+"] },
  ],
};

// Flat list of all ranks per game (for validation / backwards compat)
export const RANKED_GAMES: Record<string, string[]> = Object.fromEntries(
  Object.entries(GAME_RANK_TIERS).map(([game, tiers]) => [
    game,
    tiers.flatMap((t) => t.ranks),
  ])
);

export const US_TIMEZONES = [
  { value: "America/New_York", label: "Eastern (ET)" },
  { value: "America/Chicago", label: "Central (CT)" },
  { value: "America/Denver", label: "Mountain (MT)" },
  { value: "America/Phoenix", label: "Arizona (MST, no DST)" },
  { value: "America/Los_Angeles", label: "Pacific (PT)" },
  { value: "America/Anchorage", label: "Alaska (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii (HST)" },
] as const;

export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

// 5:00 PM to 11:00 PM in 30-minute increments
export const TIME_SLOTS: string[] = [];
for (let hour = 17; hour <= 23; hour++) {
  TIME_SLOTS.push(`${hour.toString().padStart(2, "0")}:00`);
  if (hour < 23) {
    TIME_SLOTS.push(`${hour.toString().padStart(2, "0")}:30`);
  }
}

export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}
