import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
      { dayOfWeek: 1, startTime: "18:00", endTime: "23:00" }, // Mon
      { dayOfWeek: 3, startTime: "18:00", endTime: "23:00" }, // Wed
      { dayOfWeek: 5, startTime: "17:00", endTime: "23:00" }, // Fri
      { dayOfWeek: 6, startTime: "17:00", endTime: "23:00" }, // Sat
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
      { dayOfWeek: 0, startTime: "17:00", endTime: "22:00" }, // Sun
      { dayOfWeek: 2, startTime: "19:00", endTime: "23:00" }, // Tue
      { dayOfWeek: 4, startTime: "19:00", endTime: "23:00" }, // Thu
      { dayOfWeek: 5, startTime: "19:00", endTime: "23:00" }, // Fri
      { dayOfWeek: 6, startTime: "17:00", endTime: "23:00" }, // Sat
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
      { dayOfWeek: 0, startTime: "17:00", endTime: "21:00" }, // Sun
      { dayOfWeek: 5, startTime: "18:00", endTime: "23:00" }, // Fri
      { dayOfWeek: 6, startTime: "17:00", endTime: "23:00" }, // Sat
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
      { dayOfWeek: 1, startTime: "20:00", endTime: "23:00" }, // Mon
      { dayOfWeek: 2, startTime: "20:00", endTime: "23:00" }, // Tue
      { dayOfWeek: 3, startTime: "20:00", endTime: "23:00" }, // Wed
      { dayOfWeek: 4, startTime: "20:00", endTime: "23:00" }, // Thu
      { dayOfWeek: 5, startTime: "18:00", endTime: "23:00" }, // Fri
      { dayOfWeek: 6, startTime: "17:00", endTime: "23:00" }, // Sat
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
      { dayOfWeek: 0, startTime: "17:00", endTime: "21:00" }, // Sun
      { dayOfWeek: 3, startTime: "18:00", endTime: "22:00" }, // Wed
      { dayOfWeek: 5, startTime: "17:00", endTime: "23:00" }, // Fri
      { dayOfWeek: 6, startTime: "17:00", endTime: "23:00" }, // Sat
    ],
  },
];

async function main() {
  for (const { profile, games, ranks, availability } of testUsers) {
    // Upsert user
    const user = await prisma.user.upsert({
      where: { discordId: profile.discordId },
      update: profile,
      create: profile,
    });

    // Clear old games, ranks, and availability, then re-create
    await prisma.userGame.deleteMany({ where: { userId: user.id } });
    await prisma.userGameRank.deleteMany({ where: { userId: user.id } });
    await prisma.userAvailability.deleteMany({ where: { userId: user.id } });

    await prisma.userGame.createMany({
      data: games.map((g) => ({ userId: user.id, ...g })),
    });

    await prisma.userGameRank.createMany({
      data: ranks.map((r) => ({ userId: user.id, ...r })),
    });

    await prisma.userAvailability.createMany({
      data: availability.map((a) => ({ userId: user.id, ...a })),
    });

    console.log(
      `${user.gamertag} — ${games.length} games, ${ranks.length} ranks, ${availability.length} availability slots, socials: ${[profile.twitter && "twitter", profile.twitch && "twitch", profile.youtube && "youtube", profile.customLink && "link"].filter(Boolean).join(", ") || "none"}`
    );
  }

  const count = await prisma.user.count();
  console.log(`\nTotal users in database: ${count}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
