import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Users ──────────────────────────────────────────────────────────────────

const testUsers = [
  {
    profile: {
      discordId: "test_user_1",
      name: "Alex Turner",
      gamertag: "TurnerAlex",
      avatar: null,
      timezone: "America/New_York",
      isAdmin: false,
      isModerator: false,
      isOwner: false,
      willingToModerate: false,
      interestedInBuyIn: true,
      interestedInLAN: true,
      favoriteGames: JSON.stringify(["Valorant", "CS2", "Rocket League"]),
      twitter: "turneralex",
      twitch: "turneralexlive",
      youtube: null,
      customLink: null,
    },
    games: [
      { gameName: "Valorant", modes: JSON.stringify(["Casual 5v5"]) },
      { gameName: "CS2", modes: null },
      { gameName: "Rocket League", modes: JSON.stringify(["3v3"]) },
      { gameName: "Among Us", modes: null },
    ],
    ranks: [
      { gameName: "Valorant", rank: "Diamond 2" },
      { gameName: "CS2", rank: "Master Guardian II" },
      { gameName: "Rocket League", rank: "Champion II" },
    ],
    availability: [
      { dayOfWeek: 1, startTime: "19:00", endTime: "00:00" },
      { dayOfWeek: 3, startTime: "19:30", endTime: "01:00" },
      { dayOfWeek: 5, startTime: "19:00", endTime: "01:00" },
      { dayOfWeek: 6, startTime: "19:00", endTime: "01:00" },
    ],
  },
  {
    profile: {
      discordId: "test_user_2",
      name: "Jordan Smith",
      gamertag: "J_Smithy",
      avatar: null,
      timezone: "America/Chicago",
      isAdmin: false,
      isModerator: false,
      isOwner: false,
      willingToModerate: true,
      interestedInBuyIn: true,
      interestedInLAN: false,
      favoriteGames: JSON.stringify(["League of Legends", "Overwatch 2"]),
      twitter: null,
      twitch: "jsmithygaming",
      youtube: "UCjsmithygaming",
      customLink: null,
    },
    games: [
      { gameName: "League of Legends", modes: JSON.stringify(["ARAM", "Draft (Rift)"]) },
      { gameName: "Overwatch 2", modes: null },
      { gameName: "Minecraft", modes: JSON.stringify(["Survival"]) },
    ],
    ranks: [
      { gameName: "League of Legends", rank: "Platinum II" },
      { gameName: "Overwatch 2", rank: "Diamond 3" },
    ],
    availability: [
      { dayOfWeek: 0, startTime: "18:00", endTime: "23:00" },
      { dayOfWeek: 2, startTime: "19:00", endTime: "00:00" },
      { dayOfWeek: 4, startTime: "19:00", endTime: "00:00" },
      { dayOfWeek: 5, startTime: "18:00", endTime: "00:00" },
      { dayOfWeek: 6, startTime: "18:00", endTime: "00:00" },
    ],
  },
  {
    profile: {
      discordId: "test_user_3",
      name: "Casey Jones",
      gamertag: "CaseyJ",
      avatar: null,
      timezone: "America/Denver",
      isAdmin: false,
      isModerator: false,
      isOwner: false,
      willingToModerate: false,
      interestedInBuyIn: false,
      interestedInLAN: true,
      favoriteGames: JSON.stringify(["Halo", "Marvel Rivals", "Brawlhalla"]),
      twitter: "caseyjones_gg",
      twitch: null,
      youtube: null,
      customLink: "https://linktr.ee/caseyj",
    },
    games: [
      { gameName: "Halo", modes: JSON.stringify(["Big Team (8v8/10v10)", "Custom Games (5v5)"]) },
      { gameName: "Marvel Rivals", modes: null },
      { gameName: "Brawlhalla", modes: null },
      { gameName: "Pummel Party", modes: null },
    ],
    ranks: [
      { gameName: "Halo", rank: "Diamond 3" },
      { gameName: "Marvel Rivals", rank: "Grandmaster I" },
      { gameName: "Brawlhalla", rank: "Platinum" },
    ],
    availability: [
      { dayOfWeek: 0, startTime: "17:00", endTime: "21:00" },
      { dayOfWeek: 5, startTime: "18:00", endTime: "23:00" },
      { dayOfWeek: 6, startTime: "17:00", endTime: "23:00" },
    ],
  },
  {
    profile: {
      discordId: "test_user_4",
      name: "Morgan Lee",
      gamertag: "MorgzLee",
      avatar: null,
      timezone: "America/Los_Angeles",
      isAdmin: false,
      isModerator: true,
      isOwner: false,
      willingToModerate: true,
      interestedInBuyIn: false,
      interestedInLAN: false,
      favoriteGames: JSON.stringify(["CS2", "Valorant", "Dota 2"]),
      twitter: "morgzlee",
      twitch: "morgzleetv",
      youtube: "UCmorgzlee",
      customLink: null,
    },
    games: [
      { gameName: "CS2", modes: null },
      { gameName: "Valorant", modes: JSON.stringify(["Casual 5v5", "1v1 Tournament"]) },
      { gameName: "Dota 2", modes: null },
      { gameName: "Golf With Friends", modes: null },
      { gameName: "Jackbox", modes: null },
    ],
    ranks: [
      { gameName: "CS2", rank: "Legendary Eagle Master" },
      { gameName: "Valorant", rank: "Ascendant 1" },
      { gameName: "Dota 2", rank: "Ancient" },
    ],
    availability: [
      { dayOfWeek: 1, startTime: "16:00", endTime: "21:00" },
      { dayOfWeek: 2, startTime: "16:00", endTime: "21:00" },
      { dayOfWeek: 3, startTime: "16:00", endTime: "21:00" },
      { dayOfWeek: 4, startTime: "16:00", endTime: "21:00" },
      { dayOfWeek: 5, startTime: "16:00", endTime: "22:00" },
      { dayOfWeek: 6, startTime: "15:00", endTime: "22:00" },
    ],
  },
  {
    profile: {
      discordId: "test_user_5",
      name: "Riley Chen",
      gamertag: "RileyC",
      avatar: null,
      timezone: "America/New_York",
      isAdmin: false,
      isModerator: false,
      isOwner: false,
      willingToModerate: false,
      interestedInBuyIn: true,
      interestedInLAN: true,
      favoriteGames: JSON.stringify(["Chess.com Arena", "League of Legends", "Street Fighter"]),
      twitter: null,
      twitch: "rileychenplays",
      youtube: null,
      customLink: "https://chess.com/member/rileyc",
    },
    games: [
      { gameName: "Chess.com Arena", modes: null },
      { gameName: "League of Legends", modes: JSON.stringify(["ARAM", "Tournament 1v1"]) },
      { gameName: "Street Fighter", modes: null },
      { gameName: "Mortal Kombat", modes: null },
      { gameName: "Skribbl.io", modes: null },
    ],
    ranks: [
      { gameName: "Chess.com Arena", rank: "1800-2000" },
      { gameName: "League of Legends", rank: "Emerald I" },
    ],
    availability: [
      { dayOfWeek: 0, startTime: "19:00", endTime: "23:00" },
      { dayOfWeek: 3, startTime: "20:00", endTime: "00:00" },
      { dayOfWeek: 5, startTime: "19:00", endTime: "01:00" },
      { dayOfWeek: 6, startTime: "19:00", endTime: "01:00" },
    ],
  },
  // ─── New users 6-10 ───────────────────────────────────────────────
  {
    profile: {
      discordId: "test_user_6",
      name: "Sam Rivera",
      gamertag: "SamR1va",
      avatar: null,
      timezone: "America/Phoenix",
      isAdmin: true,
      isModerator: true,
      isOwner: false,
      willingToModerate: true,
      interestedInBuyIn: true,
      interestedInLAN: true,
      favoriteGames: JSON.stringify(["CS2", "League of Legends", "Among Us"]),
      twitter: "samriva_gg",
      twitch: "samrivatv",
      youtube: null,
      customLink: null,
    },
    games: [
      { gameName: "CS2", modes: null },
      { gameName: "League of Legends", modes: JSON.stringify(["ARAM", "Draft (Rift)", "Tournament 5v5"]) },
      { gameName: "Among Us", modes: null },
      { gameName: "Pummel Party", modes: null },
      { gameName: "Jackbox", modes: null },
      { gameName: "Garry's Mod", modes: JSON.stringify(["Murder", "TTT"]) },
    ],
    ranks: [
      { gameName: "CS2", rank: "Supreme Master First Class" },
      { gameName: "League of Legends", rank: "Diamond III" },
    ],
    availability: [
      { dayOfWeek: 0, startTime: "18:00", endTime: "23:00" },
      { dayOfWeek: 1, startTime: "19:00", endTime: "23:00" },
      { dayOfWeek: 2, startTime: "19:00", endTime: "23:00" },
      { dayOfWeek: 3, startTime: "19:00", endTime: "23:00" },
      { dayOfWeek: 4, startTime: "19:00", endTime: "23:00" },
      { dayOfWeek: 5, startTime: "17:00", endTime: "23:00" },
      { dayOfWeek: 6, startTime: "15:00", endTime: "23:00" },
    ],
  },
  {
    profile: {
      discordId: "test_user_7",
      name: "Dakota Nguyen",
      gamertag: "DakotaN",
      avatar: null,
      timezone: "America/Chicago",
      isAdmin: false,
      isModerator: false,
      isOwner: false,
      willingToModerate: false,
      interestedInBuyIn: false,
      interestedInLAN: true,
      favoriteGames: JSON.stringify(["Halo", "Overwatch 2", "Left 4 Dead 2"]),
      twitter: null,
      twitch: "dakotanplays",
      youtube: null,
      customLink: null,
    },
    games: [
      { gameName: "Halo", modes: JSON.stringify(["Custom Games (5v5)", "Free-for-All"]) },
      { gameName: "Overwatch 2", modes: null },
      { gameName: "Left 4 Dead 2", modes: null },
      { gameName: "TF2", modes: null },
      { gameName: "Minecraft", modes: JSON.stringify(["Survival", "Minigames"]) },
    ],
    ranks: [
      { gameName: "Halo", rank: "Onyx" },
      { gameName: "Overwatch 2", rank: "Master 2" },
    ],
    availability: [
      { dayOfWeek: 1, startTime: "18:00", endTime: "22:00" },
      { dayOfWeek: 3, startTime: "18:00", endTime: "22:00" },
      { dayOfWeek: 5, startTime: "18:00", endTime: "00:00" },
      { dayOfWeek: 6, startTime: "16:00", endTime: "00:00" },
    ],
  },
  {
    profile: {
      discordId: "test_user_8",
      name: "Taylor Brooks",
      gamertag: "TBrooks",
      avatar: null,
      timezone: "America/Denver",
      isAdmin: false,
      isModerator: false,
      isOwner: false,
      willingToModerate: true,
      interestedInBuyIn: true,
      interestedInLAN: false,
      favoriteGames: JSON.stringify(["Valorant", "Rocket League", "Brawlhalla"]),
      twitter: "tbrooks_gaming",
      twitch: null,
      youtube: "UCtbrooks",
      customLink: null,
    },
    games: [
      { gameName: "Valorant", modes: JSON.stringify(["Casual 5v5", "1v1 Tournament"]) },
      { gameName: "Rocket League", modes: JSON.stringify(["1v1 Tournament", "2v2", "3v3"]) },
      { gameName: "Brawlhalla", modes: null },
      { gameName: "SpeedRunners", modes: null },
      { gameName: "Stick Fight: The Game", modes: null },
    ],
    ranks: [
      { gameName: "Valorant", rank: "Immortal 1" },
      { gameName: "Rocket League", rank: "Grand Champion I" },
      { gameName: "Brawlhalla", rank: "Diamond" },
    ],
    availability: [
      { dayOfWeek: 0, startTime: "16:00", endTime: "22:00" },
      { dayOfWeek: 2, startTime: "19:00", endTime: "23:00" },
      { dayOfWeek: 4, startTime: "19:00", endTime: "23:00" },
      { dayOfWeek: 5, startTime: "18:00", endTime: "23:00" },
      { dayOfWeek: 6, startTime: "16:00", endTime: "23:00" },
    ],
  },
  {
    profile: {
      discordId: "test_user_9",
      name: "Avery Patel",
      gamertag: "AveryP",
      avatar: null,
      timezone: "America/New_York",
      isAdmin: false,
      isModerator: true,
      isOwner: false,
      willingToModerate: true,
      interestedInBuyIn: true,
      interestedInLAN: true,
      favoriteGames: JSON.stringify(["Dota 2", "CS2", "Marvel Rivals"]),
      twitter: "averyp_dota",
      twitch: "averypatel",
      youtube: "UCaveryp",
      customLink: "https://dotabuff.com/averyp",
    },
    games: [
      { gameName: "Dota 2", modes: null },
      { gameName: "CS2", modes: null },
      { gameName: "Marvel Rivals", modes: null },
      { gameName: "Splitgate", modes: null },
      { gameName: "Town of Salem", modes: null },
      { gameName: "Secret Hitler", modes: null },
    ],
    ranks: [
      { gameName: "Dota 2", rank: "Immortal" },
      { gameName: "CS2", rank: "Global Elite" },
      { gameName: "Marvel Rivals", rank: "Grandmaster III" },
    ],
    availability: [
      { dayOfWeek: 0, startTime: "20:00", endTime: "01:00" },
      { dayOfWeek: 1, startTime: "20:00", endTime: "23:00" },
      { dayOfWeek: 3, startTime: "20:00", endTime: "01:00" },
      { dayOfWeek: 5, startTime: "19:00", endTime: "01:00" },
      { dayOfWeek: 6, startTime: "18:00", endTime: "01:00" },
    ],
  },
  {
    profile: {
      discordId: "test_user_10",
      name: "Jamie Kim",
      gamertag: "JamieK",
      avatar: null,
      timezone: "America/Los_Angeles",
      isAdmin: false,
      isModerator: false,
      isOwner: false,
      willingToModerate: false,
      interestedInBuyIn: false,
      interestedInLAN: true,
      favoriteGames: JSON.stringify(["Minecraft", "Among Us", "Jackbox"]),
      twitter: null,
      twitch: null,
      youtube: null,
      customLink: null,
    },
    games: [
      { gameName: "Minecraft", modes: JSON.stringify(["Survival", "Minigames"]) },
      { gameName: "Among Us", modes: null },
      { gameName: "Jackbox", modes: null },
      { gameName: "Skribbl.io", modes: null },
      { gameName: "Golf With Friends", modes: null },
      { gameName: "Draw My Thing", modes: null },
      { gameName: "Pummel Party", modes: null },
    ],
    ranks: [],
    availability: [
      { dayOfWeek: 5, startTime: "17:00", endTime: "22:00" },
      { dayOfWeek: 6, startTime: "16:00", endTime: "22:00" },
    ],
  },
];

// ─── Helper: date offset from today ────────────────────────────────────────

function futureDate(daysFromNow: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(12, 0, 0, 0);
  return d;
}

function pastDate(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(12, 0, 0, 0);
  return d;
}

/**
 * Convert a local time in a given timezone to UTC HH:mm string.
 * This ensures seed event times display correctly when the app
 * converts from UTC back to viewer timezone for display.
 *
 * Timezone offsets (standard time, no DST for Phoenix):
 *   America/Phoenix     = UTC-7
 *   America/Los_Angeles = UTC-8 (PST) / UTC-7 (PDT)
 *   America/Denver      = UTC-7 (MST) / UTC-6 (MDT)
 *   America/Chicago     = UTC-6 (CST) / UTC-5 (CDT)
 *   America/New_York    = UTC-5 (EST) / UTC-4 (EDT)
 */
function localToUtc(localTime: string, timezone: string): string {
  // Use approximate standard offsets (good enough for seed data)
  const offsets: Record<string, number> = {
    "America/Phoenix": -7,
    "America/Los_Angeles": -8,
    "America/Denver": -7,
    "America/Chicago": -6,
    "America/New_York": -5,
    "Pacific/Honolulu": -10,
    "America/Anchorage": -9,
  };
  const offset = offsets[timezone] ?? -7;
  const [h, m] = localTime.split(":").map(Number);
  let utcH = h - offset; // UTC = local - offset (offset is negative, so subtracting adds)
  if (utcH >= 24) utcH -= 24;
  if (utcH < 0) utcH += 24;
  return `${utcH.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/**
 * Convert local availability (dayOfWeek, startTime, endTime) to UTC.
 * Handles day-of-week shifts when UTC conversion crosses midnight.
 */
function localAvailabilityToUtc(
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  timezone: string
): { dayOfWeek: number; startTime: string; endTime: string } {
  const offsets: Record<string, number> = {
    "America/Phoenix": -7,
    "America/Los_Angeles": -8,
    "America/Denver": -7,
    "America/Chicago": -6,
    "America/New_York": -5,
    "Pacific/Honolulu": -10,
    "America/Anchorage": -9,
  };
  const offset = offsets[timezone] ?? -7;

  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);

  let utcSh = sh - offset;
  let utcEh = eh - offset;
  let dayShift = 0;

  // Handle day wrap for start time
  if (utcSh >= 24) {
    utcSh -= 24;
    dayShift = 1;
  } else if (utcSh < 0) {
    utcSh += 24;
    dayShift = -1;
  }

  // End time shifts same way
  if (utcEh >= 24) utcEh -= 24;
  if (utcEh < 0) utcEh += 24;

  const utcDay = ((dayOfWeek + dayShift) % 7 + 7) % 7;

  return {
    dayOfWeek: utcDay,
    startTime: `${utcSh.toString().padStart(2, "0")}:${sm.toString().padStart(2, "0")}`,
    endTime: `${utcEh.toString().padStart(2, "0")}:${em.toString().padStart(2, "0")}`,
  };
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  // ══════════════════════════════════════════════════════════════════════
  //  1. SEED USERS
  // ══════════════════════════════════════════════════════════════════════
  const userIds: string[] = [];

  for (const { profile, games, ranks, availability } of testUsers) {
    const user = await prisma.user.upsert({
      where: { discordId: profile.discordId },
      update: profile,
      create: profile,
    });
    userIds.push(user.id);

    await prisma.userGame.deleteMany({ where: { userId: user.id } });
    await prisma.userGameRank.deleteMany({ where: { userId: user.id } });
    await prisma.userAvailability.deleteMany({ where: { userId: user.id } });

    if (games.length > 0) {
      await prisma.userGame.createMany({
        data: games.map((g) => ({ userId: user.id, ...g })),
      });
    }
    if (ranks.length > 0) {
      await prisma.userGameRank.createMany({
        data: ranks.map((r) => ({ userId: user.id, ...r })),
      });
    }
    if (availability.length > 0) {
      await prisma.userAvailability.createMany({
        data: availability.map((a) => ({
          userId: user.id,
          ...localAvailabilityToUtc(a.dayOfWeek, a.startTime, a.endTime, profile.timezone),
        })),
      });
    }

    console.log(
      `✓ ${user.gamertag} — ${games.length} games, ${ranks.length} ranks, ${availability.length} availability slots`
    );
  }

  // Alias user IDs for readability
  const [alex, jordan, casey, morgan, riley, sam, dakota, taylor, avery, jamie] = userIds;

  // ══════════════════════════════════════════════════════════════════════
  //  2. SEED GAME NIGHTS (7 events)
  // ══════════════════════════════════════════════════════════════════════
  console.log("\n--- Seeding Game Nights ---");

  // Clean old seed events
  await prisma.gameNight.deleteMany({
    where: { title: { startsWith: "[Seed]" } },
  });

  // All startTime/endTime are stored in UTC. Use localToUtc() to convert
  // local times in each event's timezone to UTC for correct display.
  // Prime time = 5-11 PM Phoenix (17:00-23:00 MST)
  // Late night = 11 PM - 1 AM Phoenix (23:00-01:00 MST)

  const eventDefs = [
    {
      title: "[Seed] Friday Valorant 5v5",
      description: "Casual 5v5 Valorant — all skill levels welcome!",
      date: futureDate(5), // upcoming Friday-ish
      startTime: localToUtc("19:00", "America/Phoenix"),   // 7 PM Phoenix
      endTime: localToUtc("22:00", "America/Phoenix"),     // 10 PM Phoenix
      game: "Valorant",
      status: "scheduled",
      createdById: sam,
      hostId: sam,
      timezone: "America/Phoenix",
      rsvps: [
        { userId: alex, status: "confirmed" },
        { userId: morgan, status: "confirmed" },
        { userId: taylor, status: "confirmed" },
        { userId: avery, status: "confirmed" },
        { userId: casey, status: "maybe" },
        { userId: jordan, status: "confirmed" },
        { userId: dakota, status: "declined" },
      ],
    },
    {
      title: "[Seed] Saturday ARAM Night",
      description: "League ARAM all night — hop in and out as you please.",
      date: futureDate(6),
      startTime: localToUtc("19:00", "America/Chicago"),   // 7 PM CT = 6 PM Phoenix
      endTime: localToUtc("23:00", "America/Chicago"),     // 11 PM CT = 10 PM Phoenix
      game: "League of Legends",
      status: "scheduled",
      createdById: jordan,
      hostId: jordan,
      timezone: "America/Chicago",
      rsvps: [
        { userId: riley, status: "confirmed" },
        { userId: sam, status: "confirmed" },
        { userId: avery, status: "maybe" },
        { userId: jamie, status: "confirmed" },
        { userId: alex, status: "confirmed" },
      ],
    },
    {
      title: "[Seed] Midweek Among Us",
      description: "Wednesday deception & betrayal. 10 player lobby.",
      date: futureDate(3),
      startTime: localToUtc("20:00", "America/Phoenix"),   // 8 PM Phoenix
      endTime: localToUtc("22:30", "America/Phoenix"),     // 10:30 PM Phoenix
      game: "Among Us",
      status: "scheduled",
      createdById: jamie,
      hostId: sam,
      timezone: "America/Phoenix",
      rsvps: [
        { userId: alex, status: "confirmed" },
        { userId: jordan, status: "confirmed" },
        { userId: casey, status: "confirmed" },
        { userId: morgan, status: "confirmed" },
        { userId: riley, status: "confirmed" },
        { userId: dakota, status: "confirmed" },
        { userId: taylor, status: "confirmed" },
        { userId: avery, status: "confirmed" },
        { userId: jamie, status: "confirmed" },
      ],
    },
    {
      title: "[Seed] Jackbox Party Night",
      description: "Jackbox Party Pack 8 & 9! Laughs guaranteed.",
      date: futureDate(10),
      startTime: localToUtc("19:00", "America/Los_Angeles"), // 7 PM PT = 8 PM Phoenix
      endTime: localToUtc("22:00", "America/Los_Angeles"),   // 10 PM PT = 11 PM Phoenix
      game: "Jackbox",
      status: "scheduled",
      createdById: morgan,
      hostId: morgan,
      timezone: "America/Los_Angeles",
      rsvps: [
        { userId: sam, status: "confirmed" },
        { userId: jamie, status: "confirmed" },
        { userId: casey, status: "maybe" },
        { userId: jordan, status: "confirmed" },
      ],
    },
    {
      title: "[Seed] CS2 Comp Night",
      description: "Serious CS2 — lets run some ranked.",
      date: futureDate(12),
      startTime: localToUtc("21:00", "America/New_York"),  // 9 PM ET = 7 PM Phoenix
      endTime: localToUtc("23:30", "America/New_York"),    // 11:30 PM ET = 9:30 PM Phoenix
      game: "CS2",
      status: "scheduled",
      createdById: avery,
      hostId: avery,
      timezone: "America/New_York",
      rsvps: [
        { userId: alex, status: "confirmed" },
        { userId: morgan, status: "confirmed" },
        { userId: sam, status: "confirmed" },
        { userId: taylor, status: "maybe" },
      ],
    },
    {
      title: "[Seed] Pummel Party Chaos",
      description: "Board game chaos — last one standing wins bragging rights.",
      date: pastDate(3), // past event
      startTime: localToUtc("19:00", "America/Denver"),    // 7 PM MT = 7 PM Phoenix
      endTime: localToUtc("21:30", "America/Denver"),      // 9:30 PM MT = 9:30 PM Phoenix
      game: "Pummel Party",
      status: "scheduled",
      attendanceConfirmed: true,
      createdById: casey,
      hostId: casey,
      timezone: "America/Denver",
      rsvps: [
        { userId: sam, status: "confirmed", attended: true },
        { userId: jamie, status: "confirmed", attended: true },
        { userId: alex, status: "confirmed", attended: true },
        { userId: morgan, status: "confirmed", attended: false },
        { userId: jordan, status: "declined" },
      ],
    },
    {
      title: "[Seed] Halo Custom Games",
      description: "Halo custom games — infection, griffball, and more!",
      date: futureDate(8),
      startTime: localToUtc("17:00", "America/Phoenix"),   // 5 PM Phoenix (early prime)
      endTime: localToUtc("21:00", "America/Phoenix"),     // 9 PM Phoenix
      game: "Halo",
      status: "scheduled",
      createdById: dakota,
      hostId: casey,
      timezone: "America/Phoenix",
      rsvps: [
        { userId: casey, status: "confirmed" },
        { userId: dakota, status: "confirmed" },
        { userId: alex, status: "confirmed" },
        { userId: taylor, status: "confirmed" },
        { userId: sam, status: "confirmed" },
        { userId: avery, status: "maybe" },
      ],
    },
  ];

  for (const { rsvps, ...eventData } of eventDefs) {
    const event = await prisma.gameNight.create({
      data: {
        ...eventData,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        attendanceConfirmed: (eventData as any).attendanceConfirmed ?? false,
      },
    });

    if (rsvps.length > 0) {
      await prisma.gameNightAttendee.createMany({
        data: rsvps.map((r) => ({
          gameNightId: event.id,
          userId: r.userId,
          status: r.status,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          attended: (r as any).attended ?? false,
        })),
      });
    }

    console.log(`✓ Event: ${event.title} (${rsvps.length} RSVPs)`);
  }

  // ══════════════════════════════════════════════════════════════════════
  //  3. SEED PERSISTENT TEAMS (3 teams)
  // ══════════════════════════════════════════════════════════════════════
  console.log("\n--- Seeding Persistent Teams ---");

  // Clean old seed teams
  await prisma.team.deleteMany({
    where: { name: { startsWith: "[Seed]" } },
  });

  const teamDefs = [
    {
      name: "[Seed] Nova Esports",
      tag: "NOVA",
      game: "Valorant",
      captainId: alex,
      bio: "Competitive Valorant squad — Diamond+ only.",
      minSize: 5,
      maxSize: 7,
      members: [
        { userId: alex, role: "captain" },
        { userId: morgan, role: "co_captain" },
        { userId: taylor, role: "member" },
        { userId: sam, role: "member" },
        { userId: avery, role: "member" },
      ],
    },
    {
      name: "[Seed] Rift Runners",
      tag: "RIFT",
      game: "League of Legends",
      captainId: jordan,
      bio: "ARAM and Rift warriors. Chill vibes, hard plays.",
      minSize: 5,
      maxSize: 6,
      members: [
        { userId: jordan, role: "captain" },
        { userId: riley, role: "co_captain" },
        { userId: sam, role: "member" },
        { userId: jamie, role: "member" },
        { userId: dakota, role: "sub" },
      ],
    },
    {
      name: "[Seed] Headshot Heroes",
      tag: "HSH",
      game: "CS2",
      captainId: avery,
      bio: "CS2 grinders. Global or bust.",
      minSize: 5,
      maxSize: 7,
      members: [
        { userId: avery, role: "captain" },
        { userId: sam, role: "co_captain" },
        { userId: morgan, role: "member" },
        { userId: alex, role: "member" },
        { userId: taylor, role: "sub" },
      ],
    },
  ];

  const teamIds: string[] = [];

  for (const { members, ...teamData } of teamDefs) {
    // Delete existing team with same tag if any
    await prisma.team.deleteMany({ where: { tag: teamData.tag } });

    const team = await prisma.team.create({ data: teamData });
    teamIds.push(team.id);

    await prisma.teamMember.createMany({
      data: members.map((m) => ({ teamId: team.id, ...m })),
    });

    console.log(`✓ Team: ${teamData.name} [${teamData.tag}] (${members.length} members)`);
  }

  // Add a pending invite
  await prisma.teamInvite.create({
    data: {
      teamId: teamIds[0], // NOVA
      invitedUserId: casey,
      invitedByUserId: alex,
      status: "pending",
    },
  });
  console.log("✓ Pending invite: Casey → Nova Esports");

  // ══════════════════════════════════════════════════════════════════════
  //  4. SEED POLLS (4 polls with votes & comments)
  // ══════════════════════════════════════════════════════════════════════
  console.log("\n--- Seeding Polls ---");

  await prisma.poll.deleteMany({
    where: { title: { startsWith: "[Seed]" } },
  });

  const pollDefs = [
    {
      title: "[Seed] What game for next Friday?",
      description: "Vote for what we play this Friday night.",
      game: null,
      multiSelect: false,
      status: "active",
      pinned: true,
      createdById: sam,
      options: ["Valorant", "CS2", "Among Us", "Pummel Party", "Jackbox"],
      votes: [
        // [optionIndex, userId]
        [0, alex], [0, taylor], [0, morgan],
        [1, avery], [1, sam],
        [2, jordan], [2, jamie], [2, casey], [2, riley],
        [3, dakota],
      ] as [number, string][],
      comments: [
        { userId: jordan, text: "Among Us all the way! We had a blast last time." },
        { userId: alex, text: "Val would be fun, we can run a 10-man." },
        { userId: casey, text: "I'm down for anything honestly." },
        { userId: sam, text: "Let's see how the vote goes by Thursday." },
      ],
    },
    {
      title: "[Seed] Should we do a buy-in tournament?",
      description: "$5 buy-in, winner takes all. Thoughts?",
      game: "CS2",
      multiSelect: false,
      status: "active",
      pinned: false,
      createdById: avery,
      options: ["Yes — $5 buy-in", "Yes — $10 buy-in", "No buy-in, just for fun", "Not interested"],
      votes: [
        [0, alex], [0, riley], [0, taylor], [0, sam],
        [1, avery], [1, morgan],
        [2, jordan], [2, casey], [2, jamie],
        [3, dakota],
      ] as [number, string][],
      comments: [
        { userId: avery, text: "I think $5 keeps it fun without too much pressure." },
        { userId: riley, text: "Count me in either way." },
        { userId: dakota, text: "I'd rather just play for fun tbh." },
      ],
    },
    {
      title: "[Seed] Best night for weekly game nights?",
      description: "Trying to find the night that works for most people.",
      game: null,
      multiSelect: true,
      status: "active",
      pinned: false,
      createdById: sam,
      options: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      votes: [
        [4, alex], [5, alex],
        [4, jordan], [5, jordan], [6, jordan],
        [4, casey], [5, casey],
        [4, morgan], [5, morgan], [3, morgan],
        [4, riley], [5, riley],
        [4, sam], [5, sam], [6, sam],
        [4, dakota], [5, dakota],
        [4, taylor], [5, taylor], [2, taylor],
        [4, avery], [5, avery],
        [5, jamie], [4, jamie],
      ] as [number, string][],
      comments: [
        { userId: sam, text: "Friday & Saturday are looking like the clear winners." },
        { userId: morgan, text: "Thursday works for me too since I'm west coast." },
      ],
    },
    {
      title: "[Seed] LAN Party interest check",
      description: "Would you be interested in an in-person LAN party? Location TBD.",
      game: null,
      multiSelect: false,
      status: "closed",
      pinned: false,
      createdById: casey,
      options: ["Yes — I'd travel for it!", "Yes — if it's nearby", "Maybe", "No"],
      votes: [
        [0, alex], [0, casey], [0, riley], [0, sam],
        [1, taylor], [1, avery], [1, dakota],
        [2, jordan], [2, jamie],
        [3, morgan],
      ] as [number, string][],
      comments: [
        { userId: casey, text: "I've been wanting to do this forever." },
        { userId: alex, text: "I'm literally ready to book a flight lol." },
        { userId: morgan, text: "Hard pass for me but have fun!" },
        { userId: sam, text: "We could do Phoenix — central-ish and cheap flights." },
        { userId: riley, text: "This would be legendary." },
      ],
    },
  ];

  for (const { options, votes, comments, ...pollData } of pollDefs) {
    const poll = await prisma.poll.create({ data: pollData });

    const createdOptions = await Promise.all(
      options.map((label) =>
        prisma.pollOption.create({ data: { pollId: poll.id, label } })
      )
    );

    if (votes.length > 0) {
      await prisma.pollVote.createMany({
        data: votes.map(([optIdx, userId]) => ({
          pollId: poll.id,
          optionId: createdOptions[optIdx].id,
          userId,
        })),
      });
    }

    if (comments.length > 0) {
      for (const comment of comments) {
        await prisma.pollComment.create({
          data: { pollId: poll.id, userId: comment.userId, text: comment.text },
        });
      }
    }

    console.log(
      `✓ Poll: ${pollData.title} (${options.length} options, ${votes.length} votes, ${comments.length} comments)`
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  //  5. SEED TOURNAMENTS (3 tournaments)
  // ══════════════════════════════════════════════════════════════════════
  console.log("\n--- Seeding Tournaments ---");

  await prisma.tournament.deleteMany({
    where: { title: { startsWith: "[Seed]" } },
  });

  // --- Tournament 1: Solo Brawlhalla bracket (8 player, single elim, open) ---
  {
    const tourney = await prisma.tournament.create({
      data: {
        title: "[Seed] Brawlhalla Brawl",
        description: "1v1 single elimination — 8 slots. Sign up now!",
        game: "Brawlhalla",
        bracketType: "single_elim",
        format: "solo",
        teamSize: null,
        bestOf: 3,
        maxSlots: 8,
        seedingMode: "random",
        status: "open",
        createdById: sam,
      },
    });

    // 6 entrants signed up so far
    const entrantUsers = [casey, taylor, riley, avery, alex, morgan];
    for (let i = 0; i < entrantUsers.length; i++) {
      const user = await prisma.user.findUnique({ where: { id: entrantUsers[i] } });
      await prisma.tournamentEntrant.create({
        data: {
          tournamentId: tourney.id,
          type: "solo",
          userId: entrantUsers[i],
          displayName: user!.gamertag || user!.name,
          seed: i + 1,
        },
      });
    }

    // Add a comment
    await prisma.tournamentComment.create({
      data: {
        tournamentId: tourney.id,
        userId: casey,
        text: "Let's gooo! I'm taking this one.",
      },
    });
    await prisma.tournamentComment.create({
      data: {
        tournamentId: tourney.id,
        userId: taylor,
        text: "Casey you're going down first round 😤",
      },
    });

    console.log(`✓ Tournament: ${tourney.title} (6/8 entrants, open)`);
  }

  // --- Tournament 2: CS2 5v5 team tournament (4 teams, single elim, in_progress) ---
  {
    const tourney = await prisma.tournament.create({
      data: {
        title: "[Seed] CS2 Showdown",
        description: "5v5 team tournament — $5 buy-in, winner takes the pot!",
        game: "CS2",
        bracketType: "single_elim",
        format: "team",
        teamSize: 5,
        bestOf: 1,
        maxSlots: 4,
        seedingMode: "random",
        buyIn: 5.0,
        status: "in_progress",
        createdById: avery,
      },
    });

    // Create 4 tournament teams
    const teamConfigs = [
      { name: "Headshot Heroes", captainId: avery, members: [avery, sam, morgan, alex, taylor] },
      { name: "Rift Runners", captainId: jordan, members: [jordan, riley, dakota, jamie, casey] },
      { name: "Team Alpha", captainId: sam, members: [sam, alex, casey, morgan, avery] },
      { name: "Team Bravo", captainId: taylor, members: [taylor, jordan, riley, dakota, jamie] },
    ];

    const entrantIds: string[] = [];
    for (let i = 0; i < teamConfigs.length; i++) {
      const tc = teamConfigs[i];
      const tTeam = await prisma.tournamentTeam.create({
        data: {
          tournamentId: tourney.id,
          name: tc.name,
          captainId: tc.captainId,
        },
      });

      // Only create members that are unique per team
      const uniqueMembers = [...new Set(tc.members)];
      await prisma.tournamentTeamMember.createMany({
        data: uniqueMembers.map((uid) => ({ teamId: tTeam.id, userId: uid })),
      });

      const entrant = await prisma.tournamentEntrant.create({
        data: {
          tournamentId: tourney.id,
          type: "team",
          teamId: tTeam.id,
          displayName: tc.name,
          seed: i + 1,
        },
      });
      entrantIds.push(entrant.id);
    }

    // Create semifinal matches
    await prisma.tournamentMatch.create({
      data: {
        tournamentId: tourney.id,
        round: 1,
        matchNumber: 1,
        entrant1Id: entrantIds[0],
        entrant2Id: entrantIds[1],
        status: "completed",
        score1: 16,
        score2: 12,
        winnerEntrantId: entrantIds[0],
      },
    });

    await prisma.tournamentMatch.create({
      data: {
        tournamentId: tourney.id,
        round: 1,
        matchNumber: 2,
        entrant1Id: entrantIds[2],
        entrant2Id: entrantIds[3],
        status: "completed",
        score1: 14,
        score2: 16,
        winnerEntrantId: entrantIds[3],
      },
    });

    // Finals match — pending
    await prisma.tournamentMatch.create({
      data: {
        tournamentId: tourney.id,
        round: 2,
        matchNumber: 1,
        entrant1Id: entrantIds[0], // Headshot Heroes
        entrant2Id: entrantIds[3], // Team Bravo
        status: "pending",
      },
    });

    // Some pick-ems predictions on the finals
    const finalsMatch = await prisma.tournamentMatch.findFirst({
      where: { tournamentId: tourney.id, round: 2 },
    });
    if (finalsMatch) {
      await prisma.tournamentPrediction.createMany({
        data: [
          { tournamentId: tourney.id, userId: jordan, matchId: finalsMatch.id, predictedWinnerId: entrantIds[0] },
          { tournamentId: tourney.id, userId: casey, matchId: finalsMatch.id, predictedWinnerId: entrantIds[3] },
          { tournamentId: tourney.id, userId: riley, matchId: finalsMatch.id, predictedWinnerId: entrantIds[0] },
          { tournamentId: tourney.id, userId: jamie, matchId: finalsMatch.id, predictedWinnerId: entrantIds[3] },
          { tournamentId: tourney.id, userId: dakota, matchId: finalsMatch.id, predictedWinnerId: entrantIds[0] },
        ],
      });
    }

    // Comments
    await prisma.tournamentComment.createMany({
      data: [
        { tournamentId: tourney.id, userId: avery, text: "GG to Rift Runners, close game." },
        { tournamentId: tourney.id, userId: jordan, text: "We'll get you next time! Good shots." },
        { tournamentId: tourney.id, userId: sam, text: "Finals are gonna be hype 🔥" },
      ],
    });

    console.log(`✓ Tournament: ${tourney.title} (4 teams, semifinals done, finals pending)`);
  }

  // --- Tournament 3: Street Fighter FFA (completed) ---
  {
    const tourney = await prisma.tournament.create({
      data: {
        title: "[Seed] Street Fighter Showdown",
        description: "Free-for-all Street Fighter — round robin style.",
        game: "Street Fighter",
        bracketType: "round_robin",
        format: "solo",
        teamSize: null,
        bestOf: 3,
        maxSlots: 4,
        seedingMode: "random",
        status: "completed",
        createdById: riley,
      },
    });

    const rrPlayers = [riley, casey, taylor, avery];
    const rrEntrants: string[] = [];
    for (let i = 0; i < rrPlayers.length; i++) {
      const user = await prisma.user.findUnique({ where: { id: rrPlayers[i] } });
      const e = await prisma.tournamentEntrant.create({
        data: {
          tournamentId: tourney.id,
          type: "solo",
          userId: rrPlayers[i],
          displayName: user!.gamertag || user!.name,
          seed: i + 1,
        },
      });
      rrEntrants.push(e.id);
    }

    // Round robin: 6 matches (each player plays every other player)
    const rrMatches = [
      { e1: 0, e2: 1, s1: 2, s2: 1, winner: 0 }, // Riley vs Casey → Riley
      { e1: 0, e2: 2, s1: 1, s2: 2, winner: 2 }, // Riley vs Taylor → Taylor
      { e1: 0, e2: 3, s1: 2, s2: 0, winner: 0 }, // Riley vs Avery → Riley
      { e1: 1, e2: 2, s1: 0, s2: 2, winner: 2 }, // Casey vs Taylor → Taylor
      { e1: 1, e2: 3, s1: 2, s2: 1, winner: 1 }, // Casey vs Avery → Casey
      { e1: 2, e2: 3, s1: 2, s2: 1, winner: 2 }, // Taylor vs Avery → Taylor
    ];

    for (let i = 0; i < rrMatches.length; i++) {
      const m = rrMatches[i];
      await prisma.tournamentMatch.create({
        data: {
          tournamentId: tourney.id,
          round: 1,
          matchNumber: i + 1,
          entrant1Id: rrEntrants[m.e1],
          entrant2Id: rrEntrants[m.e2],
          score1: m.s1,
          score2: m.s2,
          winnerEntrantId: rrEntrants[m.winner],
          status: "completed",
        },
      });
    }

    // Comments celebrating
    await prisma.tournamentComment.createMany({
      data: [
        { tournamentId: tourney.id, userId: taylor, text: "3-0 let's goooo! Taylor is the champ!" },
        { tournamentId: tourney.id, userId: riley, text: "GGs everyone. Taylor was unstoppable." },
        { tournamentId: tourney.id, userId: casey, text: "Rematch soon please 🙏" },
      ],
    });

    console.log(`✓ Tournament: ${tourney.title} (4 players, round robin, completed — Taylor wins 3-0)`);
  }

  // ══════════════════════════════════════════════════════════════════════
  //  6. SEED MORE USERS (11-15) — WAVE 2
  // ══════════════════════════════════════════════════════════════════════
  console.log("\n--- Seeding Wave 2 Users ---");

  const wave2Users = [
    {
      profile: {
        discordId: "test_user_11",
        name: "Kai Nakamura",
        gamertag: "Kai808",
        avatar: null,
        timezone: "Pacific/Honolulu",
        isAdmin: false,
        isModerator: false,
        isOwner: false,
        willingToModerate: false,
        interestedInBuyIn: true,
        interestedInLAN: false,
        favoriteGames: JSON.stringify(["Valorant", "CS2", "Among Us"]),
        twitter: "kai_808",
        twitch: "kainakamura",
        youtube: null,
        customLink: null,
      },
      games: [
        { gameName: "Valorant", modes: JSON.stringify(["Casual 5v5", "1v1 Tournament"]) },
        { gameName: "CS2", modes: null },
        { gameName: "Halo", modes: JSON.stringify(["Custom Games (5v5)"]) },
        { gameName: "Among Us", modes: null },
      ],
      ranks: [
        { gameName: "Valorant", rank: "Diamond 1" },
        { gameName: "CS2", rank: "Distinguished Master Guardian" },
      ],
      availability: [
        { dayOfWeek: 1, startTime: "14:00", endTime: "20:00" },
        { dayOfWeek: 3, startTime: "15:00", endTime: "20:00" },
        { dayOfWeek: 5, startTime: "14:00", endTime: "20:00" },
        { dayOfWeek: 6, startTime: "13:00", endTime: "21:00" },
        { dayOfWeek: 0, startTime: "17:00", endTime: "21:00" },
      ],
    },
    {
      profile: {
        discordId: "test_user_12",
        name: "Leilani Kealoha",
        gamertag: "LeilaniK",
        avatar: null,
        timezone: "Pacific/Honolulu",
        isAdmin: false,
        isModerator: false,
        isOwner: false,
        willingToModerate: false,
        interestedInBuyIn: false,
        interestedInLAN: false,
        favoriteGames: JSON.stringify(["League of Legends", "Overwatch 2"]),
        twitter: null,
        twitch: "leilani_plays",
        youtube: null,
        customLink: null,
      },
      games: [
        { gameName: "League of Legends", modes: JSON.stringify(["ARAM", "Draft (Rift)"]) },
        { gameName: "Overwatch 2", modes: null },
        { gameName: "Jackbox", modes: null },
        { gameName: "Minecraft", modes: JSON.stringify(["Survival"]) },
      ],
      ranks: [
        { gameName: "League of Legends", rank: "Gold II" },
        { gameName: "Overwatch 2", rank: "Platinum 3" },
      ],
      availability: [
        { dayOfWeek: 2, startTime: "14:30", endTime: "19:30" },
        { dayOfWeek: 4, startTime: "15:00", endTime: "19:00" },
        { dayOfWeek: 5, startTime: "14:00", endTime: "20:00" },
        { dayOfWeek: 6, startTime: "12:00", endTime: "20:00" },
      ],
    },
    {
      profile: {
        discordId: "test_user_13",
        name: "Ethan Frost",
        gamertag: "FrostbiteAK",
        avatar: null,
        timezone: "America/Anchorage",
        isAdmin: false,
        isModerator: false,
        isOwner: false,
        willingToModerate: false,
        interestedInBuyIn: true,
        interestedInLAN: true,
        favoriteGames: JSON.stringify(["Halo", "Rocket League"]),
        twitter: null,
        twitch: "frostbite_ak",
        youtube: null,
        customLink: null,
      },
      games: [
        { gameName: "Halo", modes: JSON.stringify(["Big Team (8v8/10v10)", "Custom Games (5v5)"]) },
        { gameName: "Rocket League", modes: JSON.stringify(["2v2", "3v3"]) },
        { gameName: "Left 4 Dead 2", modes: null },
        { gameName: "Pummel Party", modes: null },
        { gameName: "Garry's Mod", modes: JSON.stringify(["Murder", "TTT"]) },
      ],
      ranks: [
        { gameName: "Halo", rank: "Platinum 4" },
        { gameName: "Rocket League", rank: "Diamond II" },
      ],
      availability: [
        { dayOfWeek: 1, startTime: "15:00", endTime: "21:00" },
        { dayOfWeek: 3, startTime: "16:00", endTime: "21:00" },
        { dayOfWeek: 5, startTime: "15:00", endTime: "22:00" },
        { dayOfWeek: 6, startTime: "14:00", endTime: "22:00" },
        { dayOfWeek: 0, startTime: "16:00", endTime: "20:00" },
      ],
    },
    {
      profile: {
        discordId: "test_user_14",
        name: "Harper Wells",
        gamertag: "HarpWells",
        avatar: null,
        timezone: "America/Chicago",
        isAdmin: false,
        isModerator: true,
        isOwner: false,
        willingToModerate: true,
        interestedInBuyIn: true,
        interestedInLAN: false,
        favoriteGames: JSON.stringify(["Overwatch 2", "Marvel Rivals", "Rocket League"]),
        twitter: "harpwells",
        twitch: null,
        youtube: null,
        customLink: "https://overbuff.com/harpwells",
      },
      games: [
        { gameName: "Overwatch 2", modes: null },
        { gameName: "Marvel Rivals", modes: null },
        { gameName: "Rocket League", modes: JSON.stringify(["2v2", "3v3"]) },
        { gameName: "Splitgate", modes: null },
        { gameName: "TF2", modes: null },
      ],
      ranks: [
        { gameName: "Overwatch 2", rank: "Grandmaster 3" },
        { gameName: "Marvel Rivals", rank: "Diamond I" },
        { gameName: "Rocket League", rank: "Diamond III" },
      ],
      availability: [
        { dayOfWeek: 0, startTime: "17:00", endTime: "22:00" },
        { dayOfWeek: 1, startTime: "19:00", endTime: "23:00" },
        { dayOfWeek: 2, startTime: "19:00", endTime: "23:00" },
        { dayOfWeek: 4, startTime: "19:00", endTime: "23:00" },
        { dayOfWeek: 5, startTime: "17:00", endTime: "23:00" },
        { dayOfWeek: 6, startTime: "16:00", endTime: "23:00" },
      ],
    },
    {
      profile: {
        discordId: "test_user_15",
        name: "Rowan Blake",
        gamertag: "RowanB",
        avatar: null,
        timezone: "America/Denver",
        isAdmin: false,
        isModerator: false,
        isOwner: false,
        willingToModerate: false,
        interestedInBuyIn: false,
        interestedInLAN: true,
        favoriteGames: JSON.stringify(["CS2", "Garry's Mod", "Left 4 Dead 2"]),
        twitter: null,
        twitch: null,
        youtube: null,
        customLink: null,
      },
      games: [
        { gameName: "CS2", modes: null },
        { gameName: "Garry's Mod", modes: JSON.stringify(["Murder", "TTT"]) },
        { gameName: "Left 4 Dead 2", modes: null },
        { gameName: "Golf With Friends", modes: null },
        { gameName: "Secret Hitler", modes: null },
        { gameName: "Throne of Lies", modes: null },
      ],
      ranks: [
        { gameName: "CS2", rank: "Distinguished Master Guardian" },
      ],
      availability: [
        { dayOfWeek: 5, startTime: "19:00", endTime: "23:00" },
        { dayOfWeek: 6, startTime: "17:00", endTime: "23:00" },
        { dayOfWeek: 0, startTime: "17:00", endTime: "21:00" },
      ],
    },
  ];

  const wave2Ids: string[] = [];
  for (const { profile, games, ranks, availability } of wave2Users) {
    const user = await prisma.user.upsert({
      where: { discordId: profile.discordId },
      update: profile,
      create: profile,
    });
    wave2Ids.push(user.id);

    await prisma.userGame.deleteMany({ where: { userId: user.id } });
    await prisma.userGameRank.deleteMany({ where: { userId: user.id } });
    await prisma.userAvailability.deleteMany({ where: { userId: user.id } });

    if (games.length > 0) {
      await prisma.userGame.createMany({ data: games.map((g) => ({ userId: user.id, ...g })) });
    }
    if (ranks.length > 0) {
      await prisma.userGameRank.createMany({ data: ranks.map((r) => ({ userId: user.id, ...r })) });
    }
    if (availability.length > 0) {
      await prisma.userAvailability.createMany({
        data: availability.map((a) => ({
          userId: user.id,
          ...localAvailabilityToUtc(a.dayOfWeek, a.startTime, a.endTime, profile.timezone),
        })),
      });
    }
    console.log(`✓ ${user.gamertag} — ${games.length} games, ${ranks.length} ranks, ${availability.length} availability slots`);
  }

  const [kai, leilani, ethan, harper, rowan] = wave2Ids;

  // ══════════════════════════════════════════════════════════════════════
  //  7. MORE GAME NIGHTS — WAVE 2 (recurring, invite-only, cancelled, past)
  // ══════════════════════════════════════════════════════════════════════
  console.log("\n--- Seeding Wave 2 Game Nights ---");

  const recurGroupId = "recur_friday_val";
  const wave2Events = [
    {
      title: "[Seed] Weekly Valorant (Recurring)",
      description: "Every Friday — recurring Valorant session.",
      date: futureDate(19),
      startTime: localToUtc("20:00", "America/Phoenix"),   // 8 PM Phoenix
      endTime: localToUtc("23:00", "America/Phoenix"),     // 11 PM Phoenix
      game: "Valorant",
      status: "scheduled",
      isRecurring: true,
      recurDay: 5,
      recurGroupId,
      createdById: sam,
      hostId: sam,
      timezone: "America/Phoenix",
      rsvps: [
        { userId: alex, status: "confirmed" },
        { userId: kai, status: "confirmed" },
        { userId: morgan, status: "confirmed" },
        { userId: taylor, status: "maybe" },
        { userId: harper, status: "confirmed" },
      ],
    },
    {
      title: "[Seed] Weekly Valorant (Recurring)",
      description: "Every Friday — recurring Valorant session.",
      date: futureDate(26),
      startTime: localToUtc("20:00", "America/Phoenix"),   // 8 PM Phoenix
      endTime: localToUtc("23:00", "America/Phoenix"),     // 11 PM Phoenix
      game: "Valorant",
      status: "scheduled",
      isRecurring: true,
      recurDay: 5,
      recurGroupId,
      createdById: sam,
      hostId: sam,
      timezone: "America/Phoenix",
      rsvps: [
        { userId: alex, status: "confirmed" },
        { userId: taylor, status: "confirmed" },
        { userId: avery, status: "confirmed" },
      ],
    },
    {
      title: "[Seed] Garry's Mod TTT Night",
      description: "Traitors among us... but literally in GMod. Private lobby.",
      date: futureDate(4),
      startTime: localToUtc("21:00", "America/Denver"),    // 9 PM MT = 9 PM Phoenix
      endTime: localToUtc("23:30", "America/Denver"),      // 11:30 PM MT = 11:30 PM Phoenix
      game: "Garry's Mod",
      status: "scheduled",
      visibility: "invite_only",
      createdById: rowan,
      hostId: rowan,
      timezone: "America/Denver",
      rsvps: [
        { userId: sam, status: "confirmed" },
        { userId: kai, status: "confirmed" },
        { userId: morgan, status: "confirmed" },
        { userId: dakota, status: "confirmed" },
        { userId: casey, status: "confirmed" },
        { userId: ethan, status: "confirmed" },
      ],
      invites: [sam, kai, morgan, dakota, casey, alex, jordan, ethan],
    },
    {
      title: "[Seed] Overwatch 2 Comp Stack",
      description: "6-stack comp queue. Diamond+ preferred.",
      date: futureDate(7),
      startTime: localToUtc("20:00", "America/Chicago"),   // 8 PM CT = 7 PM Phoenix
      endTime: localToUtc("23:00", "America/Chicago"),     // 11 PM CT = 10 PM Phoenix
      game: "Overwatch 2",
      status: "scheduled",
      createdById: harper,
      hostId: harper,
      timezone: "America/Chicago",
      rsvps: [
        { userId: jordan, status: "confirmed" },
        { userId: dakota, status: "confirmed" },
        { userId: harper, status: "confirmed" },
        { userId: kai, status: "maybe" },
        { userId: leilani, status: "confirmed" },
      ],
    },
    {
      title: "[Seed] Rocket League 3v3 Tourney Prep",
      description: "Practicing for the weekend tournament.",
      date: futureDate(2),
      startTime: localToUtc("18:00", "America/Phoenix"),   // 6 PM Phoenix
      endTime: localToUtc("20:30", "America/Phoenix"),     // 8:30 PM Phoenix
      game: "Rocket League",
      status: "scheduled",
      createdById: taylor,
      hostId: taylor,
      timezone: "America/Phoenix",
      rsvps: [
        { userId: alex, status: "confirmed" },
        { userId: taylor, status: "confirmed" },
        { userId: harper, status: "confirmed" },
        { userId: kai, status: "confirmed" },
        { userId: ethan, status: "confirmed" },
      ],
    },
    {
      title: "[Seed] Cancelled — Dota 2 Night",
      description: "Not enough people :( cancelled.",
      date: futureDate(1),
      startTime: localToUtc("21:00", "America/New_York"),  // 9 PM ET = 7 PM Phoenix
      endTime: localToUtc("23:30", "America/New_York"),    // 11:30 PM ET = 9:30 PM Phoenix
      game: "Dota 2",
      status: "cancelled",
      createdById: avery,
      hostId: avery,
      timezone: "America/New_York",
      rsvps: [
        { userId: morgan, status: "confirmed" },
        { userId: leilani, status: "declined" },
      ],
    },
    {
      title: "[Seed] Last Week's LoL Clash",
      description: "Clash tournament practice — went great!",
      date: pastDate(7),
      startTime: localToUtc("20:00", "America/Chicago"),   // 8 PM CT = 7 PM Phoenix
      endTime: localToUtc("23:00", "America/Chicago"),     // 11 PM CT = 10 PM Phoenix
      game: "League of Legends",
      status: "scheduled",
      attendanceConfirmed: true,
      createdById: jordan,
      hostId: jordan,
      timezone: "America/Chicago",
      rsvps: [
        { userId: jordan, status: "confirmed", attended: true },
        { userId: riley, status: "confirmed", attended: true },
        { userId: sam, status: "confirmed", attended: true },
        { userId: leilani, status: "confirmed", attended: true },
        { userId: jamie, status: "confirmed", attended: true },
        { userId: kai, status: "confirmed", attended: false },
        { userId: dakota, status: "maybe", attended: false },
      ],
    },
    {
      title: "[Seed] Minecraft Server Build Night",
      description: "Working on the community base. Survival mode.",
      date: pastDate(10),
      startTime: localToUtc("18:00", "America/Chicago"),   // 6 PM CT = 5 PM Phoenix
      endTime: localToUtc("22:00", "America/Chicago"),     // 10 PM CT = 9 PM Phoenix
      game: "Minecraft",
      status: "scheduled",
      attendanceConfirmed: true,
      createdById: jamie,
      hostId: dakota,
      timezone: "America/Chicago",
      rsvps: [
        { userId: jamie, status: "confirmed", attended: true },
        { userId: dakota, status: "confirmed", attended: true },
        { userId: jordan, status: "confirmed", attended: true },
        { userId: leilani, status: "confirmed", attended: true },
        { userId: rowan, status: "confirmed", attended: true },
        { userId: casey, status: "maybe", attended: false },
      ],
    },
    {
      title: "[Seed] Golf With Friends Tournament",
      description: "18 holes, lowest score wins. Loser hosts next time.",
      date: futureDate(14),
      startTime: localToUtc("19:00", "America/Los_Angeles"), // 7 PM PT = 8 PM Phoenix
      endTime: localToUtc("21:30", "America/Los_Angeles"),   // 9:30 PM PT = 10:30 PM Phoenix
      game: "Golf With Friends",
      status: "scheduled",
      createdById: morgan,
      hostId: morgan,
      timezone: "America/Los_Angeles",
      rsvps: [
        { userId: morgan, status: "confirmed" },
        { userId: rowan, status: "confirmed" },
        { userId: jamie, status: "confirmed" },
        { userId: sam, status: "confirmed" },
        { userId: alex, status: "confirmed" },
        { userId: ethan, status: "confirmed" },
        { userId: harper, status: "maybe" },
        { userId: kai, status: "confirmed" },
      ],
    },
    {
      title: "[Seed] Secret Hitler & Social Deduction",
      description: "Multiple rounds of Secret Hitler + Town of Salem.",
      date: pastDate(14),
      startTime: localToUtc("20:30", "America/Phoenix"),   // 8:30 PM Phoenix
      endTime: localToUtc("23:30", "America/Phoenix"),     // 11:30 PM Phoenix (late night!)
      game: "Secret Hitler",
      status: "scheduled",
      attendanceConfirmed: true,
      createdById: sam,
      hostId: sam,
      timezone: "America/Phoenix",
      rsvps: [
        { userId: sam, status: "confirmed", attended: true },
        { userId: avery, status: "confirmed", attended: true },
        { userId: rowan, status: "confirmed", attended: true },
        { userId: leilani, status: "confirmed", attended: true },
        { userId: jordan, status: "confirmed", attended: true },
        { userId: casey, status: "confirmed", attended: true },
        { userId: riley, status: "confirmed", attended: true },
        { userId: morgan, status: "declined" },
        { userId: alex, status: "confirmed", attended: false },
      ],
    },
    // Late night events (11 PM - 1 AM Phoenix range)
    {
      title: "[Seed] Late Night Valorant Grind",
      description: "Night owls only — ranked grind until the wee hours.",
      date: futureDate(9),
      startTime: localToUtc("23:00", "America/Phoenix"),   // 11 PM Phoenix
      endTime: localToUtc("01:30", "America/Phoenix"),     // 1:30 AM Phoenix
      game: "Valorant",
      status: "scheduled",
      createdById: kai,
      hostId: kai,
      timezone: "America/Phoenix",
      rsvps: [
        { userId: kai, status: "confirmed" },
        { userId: alex, status: "confirmed" },
        { userId: sam, status: "confirmed" },
        { userId: avery, status: "maybe" },
        { userId: taylor, status: "confirmed" },
      ],
    },
    {
      title: "[Seed] Midnight Horror Games",
      description: "Phasmophobia + Lethal Company. Lights off, volume up.",
      date: futureDate(11),
      startTime: localToUtc("23:30", "America/Phoenix"),   // 11:30 PM Phoenix
      endTime: localToUtc("02:00", "America/Phoenix"),     // 2 AM Phoenix
      game: "Phasmophobia",
      status: "scheduled",
      createdById: rowan,
      hostId: rowan,
      timezone: "America/Denver",
      rsvps: [
        { userId: rowan, status: "confirmed" },
        { userId: dakota, status: "confirmed" },
        { userId: casey, status: "confirmed" },
        { userId: jamie, status: "confirmed" },
        { userId: leilani, status: "maybe" },
        { userId: morgan, status: "confirmed" },
      ],
    },
    {
      title: "[Seed] East Coast Late Night LoL",
      description: "Late night ARAM session for the east coasters.",
      date: futureDate(6),
      startTime: localToUtc("00:00", "America/New_York"),  // midnight ET = 10 PM Phoenix
      endTime: localToUtc("02:00", "America/New_York"),    // 2 AM ET = midnight Phoenix
      game: "League of Legends",
      status: "scheduled",
      createdById: avery,
      hostId: avery,
      timezone: "America/New_York",
      rsvps: [
        { userId: avery, status: "confirmed" },
        { userId: alex, status: "confirmed" },
        { userId: jordan, status: "confirmed" },
        { userId: riley, status: "confirmed" },
        { userId: leilani, status: "maybe" },
      ],
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const { rsvps, invites, ...eventData } of wave2Events as any[]) {
    const event = await prisma.gameNight.create({
      data: {
        ...eventData,
        attendanceConfirmed: eventData.attendanceConfirmed ?? false,
        isRecurring: eventData.isRecurring ?? false,
        visibility: eventData.visibility ?? "public",
      },
    });

    if (rsvps && rsvps.length > 0) {
      await prisma.gameNightAttendee.createMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: rsvps.map((r: any) => ({
          gameNightId: event.id,
          userId: r.userId,
          status: r.status,
          attended: r.attended ?? false,
        })),
      });
    }

    if (invites && invites.length > 0) {
      await prisma.gameNightInvite.createMany({
        data: invites.map((uid: string) => ({
          gameNightId: event.id,
          userId: uid,
        })),
      });
    }

    console.log(`✓ Event: ${event.title} (${rsvps?.length ?? 0} RSVPs${invites ? `, ${invites.length} invites` : ""})`);
  }

  // ══════════════════════════════════════════════════════════════════════
  //  8. MORE PERSISTENT TEAMS — WAVE 2
  // ══════════════════════════════════════════════════════════════════════
  console.log("\n--- Seeding Wave 2 Teams ---");

  const wave2TeamDefs = [
    {
      name: "[Seed] Party Crashers",
      tag: "PARTY",
      game: "Among Us",
      captainId: jamie,
      bio: "We play party games. A lot. Jackbox, Among Us, Pummel Party — you name it.",
      minSize: 4,
      maxSize: 10,
      members: [
        { userId: jamie, role: "captain" },
        { userId: sam, role: "co_captain" },
        { userId: casey, role: "member" },
        { userId: kai, role: "member" },
        { userId: rowan, role: "member" },
        { userId: dakota, role: "member" },
        { userId: leilani, role: "sub" },
      ],
    },
    {
      name: "[Seed] Overtime Squad",
      tag: "OT",
      game: "Overwatch 2",
      captainId: harper,
      bio: "OW2 6-stack. We never give up the point.",
      minSize: 6,
      maxSize: 8,
      members: [
        { userId: harper, role: "captain" },
        { userId: jordan, role: "co_captain" },
        { userId: dakota, role: "member" },
        { userId: kai, role: "member" },
        { userId: leilani, role: "member" },
        { userId: casey, role: "member" },
      ],
    },
    {
      name: "[Seed] Fight Club",
      tag: "FIGHT",
      game: "Street Fighter",
      captainId: ethan,
      bio: "Fighting game enthusiasts. SF, MK, Brawlhalla — we do it all.",
      minSize: 3,
      maxSize: 8,
      members: [
        { userId: ethan, role: "captain" },
        { userId: riley, role: "co_captain" },
        { userId: casey, role: "member" },
        { userId: taylor, role: "member" },
      ],
    },
  ];

  const wave2TeamIds: string[] = [];
  for (const { members, ...teamData } of wave2TeamDefs) {
    await prisma.team.deleteMany({ where: { tag: teamData.tag } });
    const team = await prisma.team.create({ data: teamData });
    wave2TeamIds.push(team.id);
    await prisma.teamMember.createMany({
      data: members.map((m) => ({ teamId: team.id, ...m })),
    });
    console.log(`✓ Team: ${teamData.name} [${teamData.tag}] (${members.length} members)`);
  }

  // More team invites
  await prisma.teamInvite.create({
    data: { teamId: wave2TeamIds[0], invitedUserId: ethan, invitedByUserId: jamie, status: "pending" },
  });
  await prisma.teamInvite.create({
    data: { teamId: wave2TeamIds[1], invitedUserId: morgan, invitedByUserId: harper, status: "pending" },
  });
  await prisma.teamInvite.create({
    data: { teamId: wave2TeamIds[2], invitedUserId: avery, invitedByUserId: ethan, status: "accepted", respondedAt: new Date() },
  });
  await prisma.teamInvite.create({
    data: { teamId: wave2TeamIds[2], invitedUserId: alex, invitedByUserId: ethan, status: "declined", respondedAt: new Date() },
  });
  console.log("✓ Team invites: 2 pending, 1 accepted, 1 declined");

  // ══════════════════════════════════════════════════════════════════════
  //  9. INVITE GROUPS
  // ══════════════════════════════════════════════════════════════════════
  console.log("\n--- Seeding Invite Groups ---");

  await prisma.inviteGroup.deleteMany({
    where: { name: { startsWith: "[Seed]" } },
  });

  const groupDefs = [
    {
      name: "[Seed] FPS Crew",
      ownerId: sam,
      members: [alex, morgan, avery, taylor, kai, harper],
    },
    {
      name: "[Seed] Party Game People",
      ownerId: jamie,
      members: [casey, dakota, rowan, leilani, sam, jordan, kai],
    },
    {
      name: "[Seed] Fighting Game Gang",
      ownerId: ethan,
      members: [riley, casey, taylor, avery],
    },
  ];

  for (const { members, ...groupData } of groupDefs) {
    const group = await prisma.inviteGroup.create({ data: groupData });
    await prisma.inviteGroupMember.createMany({
      data: members.map((uid) => ({ groupId: group.id, userId: uid })),
    });
    console.log(`✓ Invite Group: ${groupData.name} (${members.length} members)`);
  }

  // ══════════════════════════════════════════════════════════════════════
  //  10. MORE POLLS — WAVE 2
  // ══════════════════════════════════════════════════════════════════════
  console.log("\n--- Seeding Wave 2 Polls ---");

  const wave2Polls = [
    {
      title: "[Seed] Favorite FPS right now?",
      description: "Quick poll — what FPS are you playing most?",
      game: null,
      multiSelect: false,
      status: "active",
      pinned: false,
      createdById: kai,
      options: ["Valorant", "CS2", "Overwatch 2", "Halo", "Marvel Rivals", "Splitgate"],
      votes: [
        [0, alex], [0, taylor], [0, kai],
        [1, avery], [1, morgan], [1, sam], [1, rowan],
        [2, harper], [2, jordan], [2, dakota],
        [3, casey],
        [4, ethan], [4, harper],
      ] as [number, string][],
      comments: [
        { userId: kai, text: "Val gameplay is just unmatched right now." },
        { userId: avery, text: "CS2 forever. Nothing else compares." },
        { userId: harper, text: "OW2 has been popping off since the new season." },
      ],
    },
    {
      title: "[Seed] Tournament format preference?",
      description: "For our next big tournament — what bracket style do you prefer?",
      game: null,
      multiSelect: false,
      status: "active",
      pinned: true,
      createdById: sam,
      options: ["Single Elimination", "Double Elimination", "Round Robin", "Swiss System"],
      votes: [
        [0, casey], [0, ethan],
        [1, alex], [1, avery], [1, taylor], [1, sam], [1, morgan], [1, harper],
        [2, jordan], [2, riley], [2, leilani],
        [3, kai], [3, rowan], [3, dakota],
      ] as [number, string][],
      comments: [
        { userId: sam, text: "Double elim feels the fairest — one bad game shouldn't end your run." },
        { userId: casey, text: "Single elim is more exciting though. Higher stakes!" },
        { userId: kai, text: "Swiss is underrated. Everyone plays more games." },
        { userId: jordan, text: "Round robin so we can all play each other." },
        { userId: avery, text: "Double elim + best of 3 finals is the GOAT format." },
      ],
    },
    {
      title: "[Seed] Should we start a Minecraft server?",
      description: "We'd need someone to host. Java edition.",
      game: "Minecraft",
      multiSelect: false,
      status: "active",
      pinned: false,
      createdById: dakota,
      options: ["Yes — Survival", "Yes — Minigames/Custom", "Yes — Both!", "Nah, not interested"],
      votes: [
        [0, dakota], [0, leilani], [0, rowan],
        [1, jamie], [1, kai],
        [2, jordan], [2, casey], [2, sam],
        [3, alex], [3, morgan], [3, avery], [3, taylor],
      ] as [number, string][],
      comments: [
        { userId: dakota, text: "I can host it on my spare PC if people are actually gonna play." },
        { userId: jamie, text: "I'd play every day honestly." },
        { userId: morgan, text: "Not my thing but do your thing!" },
        { userId: leilani, text: "Survival with a shopping district would be amazing." },
      ],
    },
    {
      title: "[Seed] Rate last Friday's game night",
      description: "How was the Valorant night? Feedback appreciated.",
      game: "Valorant",
      multiSelect: false,
      status: "closed",
      pinned: false,
      createdById: sam,
      options: ["10/10 Amazing", "7-9 Great", "4-6 Okay", "1-3 Not great"],
      votes: [
        [0, alex], [0, taylor], [0, kai],
        [1, morgan], [1, avery], [1, harper], [1, sam],
        [2, jordan],
        [3, casey],
      ] as [number, string][],
      comments: [
        { userId: alex, text: "Best night we've had in a while!" },
        { userId: sam, text: "Thanks for the feedback everyone. We'll keep doing these." },
        { userId: casey, text: "Honestly I just got tilted, it was probably fine lol." },
        { userId: taylor, text: "The 10-man customs were absolutely insane. More please." },
        { userId: morgan, text: "Really solid night, just wish we started a bit earlier." },
      ],
    },
  ];

  for (const { options, votes, comments, ...pollData } of wave2Polls) {
    const poll = await prisma.poll.create({ data: pollData });
    const createdOptions = await Promise.all(
      options.map((label) => prisma.pollOption.create({ data: { pollId: poll.id, label } }))
    );
    if (votes.length > 0) {
      // Handle potential duplicate user-option combos from multi-vote in non-multiSelect
      for (const [optIdx, userId] of votes) {
        try {
          await prisma.pollVote.create({
            data: { pollId: poll.id, optionId: createdOptions[optIdx].id, userId },
          });
        } catch {
          // skip duplicates
        }
      }
    }
    for (const comment of comments) {
      await prisma.pollComment.create({
        data: { pollId: poll.id, userId: comment.userId, text: comment.text },
      });
    }
    console.log(`✓ Poll: ${pollData.title} (${options.length} options, ${votes.length} votes, ${comments.length} comments)`);
  }

  // ══════════════════════════════════════════════════════════════════════
  //  11. MORE TOURNAMENTS — WAVE 2
  // ══════════════════════════════════════════════════════════════════════
  console.log("\n--- Seeding Wave 2 Tournaments ---");

  // --- Tournament 4: Valorant 1v1 Double Elimination (8 players, in progress) ---
  {
    const tourney = await prisma.tournament.create({
      data: {
        title: "[Seed] Valorant 1v1 Invitational",
        description: "Double elimination 1v1 — prove you're the best aimer. $10 buy-in.",
        game: "Valorant",
        bracketType: "double_elim",
        format: "solo",
        teamSize: null,
        bestOf: 3,
        maxSlots: 8,
        seedingMode: "ranked",
        buyIn: 10.0,
        status: "in_progress",
        createdById: sam,
      },
    });

    const valPlayers = [alex, morgan, taylor, avery, kai, harper, sam, ethan];
    const valEntrants: string[] = [];
    for (let i = 0; i < valPlayers.length; i++) {
      const user = await prisma.user.findUnique({ where: { id: valPlayers[i] } });
      const e = await prisma.tournamentEntrant.create({
        data: {
          tournamentId: tourney.id,
          type: "solo",
          userId: valPlayers[i],
          displayName: user!.gamertag || user!.name,
          seed: i + 1,
        },
      });
      valEntrants.push(e.id);
    }

    // Winners bracket R1 (4 matches)
    const wR1 = [
      { e1: 0, e2: 7, s1: 2, s2: 0, winner: 0 }, // Alex vs Phoenix → Alex
      { e1: 1, e2: 6, s1: 1, s2: 2, winner: 6 }, // Morgan vs Sam → Sam
      { e1: 2, e2: 5, s1: 2, s2: 1, winner: 2 }, // Taylor vs Harper → Taylor
      { e1: 3, e2: 4, s1: 2, s2: 1, winner: 3 }, // Avery vs Kai → Avery
    ];

    for (let i = 0; i < wR1.length; i++) {
      const m = wR1[i];
      await prisma.tournamentMatch.create({
        data: {
          tournamentId: tourney.id,
          round: 1,
          matchNumber: i + 1,
          bracketSide: "winners",
          entrant1Id: valEntrants[m.e1],
          entrant2Id: valEntrants[m.e2],
          score1: m.s1,
          score2: m.s2,
          winnerEntrantId: valEntrants[m.winner],
          status: "completed",
        },
      });
    }

    // Winners bracket R2 (2 matches) — pending
    await prisma.tournamentMatch.create({
      data: {
        tournamentId: tourney.id,
        round: 2,
        matchNumber: 1,
        bracketSide: "winners",
        entrant1Id: valEntrants[0], // Alex
        entrant2Id: valEntrants[6], // Sam
        status: "pending",
      },
    });
    await prisma.tournamentMatch.create({
      data: {
        tournamentId: tourney.id,
        round: 2,
        matchNumber: 2,
        bracketSide: "winners",
        entrant1Id: valEntrants[2], // Taylor
        entrant2Id: valEntrants[3], // Avery
        status: "pending",
      },
    });

    // Losers bracket R1 (2 matches) — pending
    await prisma.tournamentMatch.create({
      data: {
        tournamentId: tourney.id,
        round: 1,
        matchNumber: 1,
        bracketSide: "losers",
        entrant1Id: valEntrants[7], // Phoenix (lost to Alex)
        entrant2Id: valEntrants[1], // Morgan (lost to Sam)
        status: "pending",
      },
    });
    await prisma.tournamentMatch.create({
      data: {
        tournamentId: tourney.id,
        round: 1,
        matchNumber: 2,
        bracketSide: "losers",
        entrant1Id: valEntrants[5], // Harper (lost to Taylor)
        entrant2Id: valEntrants[4], // Kai (lost to Avery)
        status: "pending",
      },
    });

    // Comments
    await prisma.tournamentComment.createMany({
      data: [
        { tournamentId: tourney.id, userId: alex, text: "2-0 clean! Let's keep it going." },
        { tournamentId: tourney.id, userId: ethan, text: "Dropped to losers but I'm NOT out. Watch me run it back." },
        { tournamentId: tourney.id, userId: sam, text: "Morgan put up a fight but I clutched round 3." },
        { tournamentId: tourney.id, userId: taylor, text: "Harper's aim is cracked, barely survived." },
        { tournamentId: tourney.id, userId: kai, text: "Avery's crosshair placement is insane. GG." },
      ],
    });

    console.log(`✓ Tournament: ${tourney.title} (8 players, double elim, winners R1 done)`);
  }

  // --- Tournament 5: Chess Swiss System (completed) ---
  {
    const tourney = await prisma.tournament.create({
      data: {
        title: "[Seed] Chess Masters Swiss",
        description: "4-round Swiss system chess tournament. Top rating wins tiebreaker.",
        game: "Chess.com Arena",
        bracketType: "swiss",
        format: "solo",
        teamSize: null,
        bestOf: 1,
        maxSlots: 8,
        seedingMode: "ranked",
        status: "completed",
        createdById: riley,
      },
    });

    const chessPlayers = [riley, avery, sam, morgan, alex, taylor, kai, leilani];
    const chessEntrants: string[] = [];
    for (let i = 0; i < chessPlayers.length; i++) {
      const user = await prisma.user.findUnique({ where: { id: chessPlayers[i] } });
      const e = await prisma.tournamentEntrant.create({
        data: {
          tournamentId: tourney.id,
          type: "solo",
          userId: chessPlayers[i],
          displayName: user!.gamertag || user!.name,
          seed: i + 1,
        },
      });
      chessEntrants.push(e.id);
    }

    // 4 rounds, 4 matches each
    const swissRounds = [
      // Round 1
      [
        { e1: 0, e2: 7, winner: 0 }, // Riley vs Leilani → Riley
        { e1: 1, e2: 6, winner: 1 }, // Avery vs Kai → Avery
        { e1: 2, e2: 5, winner: 2 }, // Sam vs Taylor → Sam
        { e1: 3, e2: 4, winner: 4 }, // Morgan vs Alex → Alex
      ],
      // Round 2
      [
        { e1: 0, e2: 1, winner: 0 }, // Riley vs Avery → Riley
        { e1: 2, e2: 4, winner: 4 }, // Sam vs Alex → Alex
        { e1: 3, e2: 7, winner: 3 }, // Morgan vs Leilani → Morgan
        { e1: 5, e2: 6, winner: 6 }, // Taylor vs Kai → Kai
      ],
      // Round 3
      [
        { e1: 0, e2: 4, winner: 0 }, // Riley vs Alex → Riley
        { e1: 1, e2: 2, winner: 1 }, // Avery vs Sam → Avery
        { e1: 3, e2: 6, winner: 3 }, // Morgan vs Kai → Morgan
        { e1: 5, e2: 7, winner: 5 }, // Taylor vs Leilani → Taylor
      ],
      // Round 4
      [
        { e1: 0, e2: 3, winner: 0 }, // Riley vs Morgan → Riley (4-0!)
        { e1: 1, e2: 4, winner: 1 }, // Avery vs Alex → Avery (3-1)
        { e1: 2, e2: 6, winner: 2 }, // Sam vs Kai → Sam (2-2)
        { e1: 5, e2: 7, winner: 7 }, // Taylor vs Leilani → Leilani (1-3 each)
      ],
    ];

    for (let round = 0; round < swissRounds.length; round++) {
      for (let match = 0; match < swissRounds[round].length; match++) {
        const m = swissRounds[round][match];
        await prisma.tournamentMatch.create({
          data: {
            tournamentId: tourney.id,
            round: round + 1,
            matchNumber: match + 1,
            entrant1Id: chessEntrants[m.e1],
            entrant2Id: chessEntrants[m.e2],
            score1: m.winner === m.e1 ? 1 : 0,
            score2: m.winner === m.e2 ? 1 : 0,
            winnerEntrantId: chessEntrants[m.winner],
            status: "completed",
          },
        });
      }
    }

    await prisma.tournamentComment.createMany({
      data: [
        { tournamentId: tourney.id, userId: riley, text: "4-0! Perfect run! That was an intense tournament." },
        { tournamentId: tourney.id, userId: avery, text: "Riley is a machine. GG champ." },
        { tournamentId: tourney.id, userId: sam, text: "Swiss format was really fun, everyone got to play a lot." },
        { tournamentId: tourney.id, userId: alex, text: "I had a rough round 3 but came back. Fun stuff." },
        { tournamentId: tourney.id, userId: morgan, text: "Next time I'm studying openings beforehand lol." },
      ],
    });

    console.log(`✓ Tournament: ${tourney.title} (8 players, swiss, completed — Riley 4-0)`);
  }

  // --- Tournament 6: Mortal Kombat Draft (upcoming, open for signups) ---
  {
    const tourney = await prisma.tournament.create({
      data: {
        title: "[Seed] Mortal Kombat Madness",
        description: "16-slot single elim MK bracket. Best of 3, $5 buy-in. Who's the deadliest?",
        game: "Mortal Kombat",
        bracketType: "single_elim",
        format: "solo",
        teamSize: null,
        bestOf: 3,
        maxSlots: 16,
        seedingMode: "random",
        buyIn: 5.0,
        status: "open",
        createdById: ethan,
      },
    });

    // Only 4 signed up so far
    const mkPlayers = [ethan, riley, casey, taylor];
    for (let i = 0; i < mkPlayers.length; i++) {
      const user = await prisma.user.findUnique({ where: { id: mkPlayers[i] } });
      await prisma.tournamentEntrant.create({
        data: {
          tournamentId: tourney.id,
          type: "solo",
          userId: mkPlayers[i],
          displayName: user!.gamertag || user!.name,
          seed: i + 1,
        },
      });
    }

    await prisma.tournamentComment.createMany({
      data: [
        { tournamentId: tourney.id, userId: ethan, text: "I'm gonna body everyone. Sign up if you dare." },
        { tournamentId: tourney.id, userId: riley, text: "Fighting games are my thing. Let's go Ethan." },
        { tournamentId: tourney.id, userId: casey, text: "I'm terrible at MK but I'm here for the chaos." },
      ],
    });

    console.log(`✓ Tournament: ${tourney.title} (4/16 entrants, open)`);
  }

  // --- Tournament 7: Overwatch 2 Team Tournament (draft status) ---
  {
    const tourney = await prisma.tournament.create({
      data: {
        title: "[Seed] OW2 Winter Cup",
        description: "6v6 team tournament — draft your teams from the player pool!",
        game: "Overwatch 2",
        bracketType: "single_elim",
        format: "team",
        teamSize: 6,
        bestOf: 1,
        maxSlots: 4,
        seedingMode: "random",
        captainMode: "ranked",
        status: "draft",
        draftStatus: "pending",
        createdById: harper,
      },
    });

    // Sign up entrants (solo for now, teams will be drafted)
    const owPlayers = [harper, jordan, dakota, kai, leilani, casey, sam, morgan, alex, taylor, avery, riley];
    for (let i = 0; i < owPlayers.length; i++) {
      const user = await prisma.user.findUnique({ where: { id: owPlayers[i] } });
      await prisma.tournamentEntrant.create({
        data: {
          tournamentId: tourney.id,
          type: "solo",
          userId: owPlayers[i],
          displayName: user!.gamertag || user!.name,
          seed: null,
        },
      });
    }

    await prisma.tournamentComment.createMany({
      data: [
        { tournamentId: tourney.id, userId: harper, text: "Draft is coming soon! Captains will be announced." },
        { tournamentId: tourney.id, userId: jordan, text: "I call captain!" },
        { tournamentId: tourney.id, userId: dakota, text: "Pick me first, I promise I'll carry." },
      ],
    });

    console.log(`✓ Tournament: ${tourney.title} (12 players in pool, draft pending)`);
  }

  // ══════════════════════════════════════════════════════════════════════
  //  Summary
  // ══════════════════════════════════════════════════════════════════════
  const counts = {
    users: await prisma.user.count(),
    events: await prisma.gameNight.count(),
    rsvps: await prisma.gameNightAttendee.count(),
    inviteGroups: await prisma.inviteGroup.count(),
    teams: await prisma.team.count(),
    teamMembers: await prisma.teamMember.count(),
    teamInvites: await prisma.teamInvite.count(),
    polls: await prisma.poll.count(),
    pollVotes: await prisma.pollVote.count(),
    pollComments: await prisma.pollComment.count(),
    tournaments: await prisma.tournament.count(),
    tournamentEntrants: await prisma.tournamentEntrant.count(),
    tournamentMatches: await prisma.tournamentMatch.count(),
    tournamentComments: await prisma.tournamentComment.count(),
    tournamentPredictions: await prisma.tournamentPrediction.count(),
  };

  console.log("\n══════════════════════════════════");
  console.log("  SEED COMPLETE — Database totals:");
  console.log("══════════════════════════════════");
  for (const [key, val] of Object.entries(counts)) {
    console.log(`  ${key}: ${val}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
