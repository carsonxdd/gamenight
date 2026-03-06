"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface GameInput {
  name: string;
  modes?: string[];
}

interface RankInput {
  gameName: string;
  rank: string;
}

interface ProfileData {
  gamertag: string;
  timezone: string;
  games: GameInput[];
  slots: string[];
  willingToModerate: boolean;
}

interface ExtendedProfileData {
  ranks: RankInput[];
  interestedInBuyIn: boolean;
  interestedInLAN: boolean;
  willingToModerate: boolean;
}

function parseSlot(key: string) {
  const [dayStr, startTime] = key.split("-");
  const dayOfWeek = parseInt(dayStr, 10);
  const [h, m] = startTime.split(":").map(Number);
  const endM = m === 0 ? "30" : "00";
  const endH = m === 0 ? h : h + 1;
  const endTime = `${endH.toString().padStart(2, "0")}:${endM}`;
  return { dayOfWeek, startTime, endTime };
}

export async function updateProfile(data: ProfileData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  if (!data.gamertag.trim()) {
    return { error: "Gamertag is required" };
  }
  if (!data.timezone) {
    return { error: "Timezone is required" };
  }
  if (data.games.length === 0) {
    return { error: "Select at least one game" };
  }
  if (data.slots.length === 0) {
    return { error: "Select at least one time slot" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          gamertag: data.gamertag.trim(),
          timezone: data.timezone,
          willingToModerate: data.willingToModerate,
        },
      });

      await tx.userGame.deleteMany({ where: { userId: session.user.id } });
      await tx.userAvailability.deleteMany({ where: { userId: session.user.id } });

      await tx.userGame.createMany({
        data: data.games.map((g) => ({
          userId: session.user.id,
          gameName: g.name,
          modes: g.modes && g.modes.length > 0 ? JSON.stringify(g.modes) : null,
        })),
      });

      await tx.userAvailability.createMany({
        data: data.slots.map((key) => ({
          userId: session.user.id,
          ...parseSlot(key),
        })),
      });
    });

    return { success: true };
  } catch {
    return { error: "Failed to save profile" };
  }
}

export async function updateExtendedProfile(data: ExtendedProfileData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          interestedInBuyIn: data.interestedInBuyIn,
          interestedInLAN: data.interestedInLAN,
          willingToModerate: data.willingToModerate,
        },
      });

      await tx.userGameRank.deleteMany({ where: { userId: session.user.id } });

      const ranksToCreate = data.ranks.filter((r) => r.rank);
      if (ranksToCreate.length > 0) {
        await tx.userGameRank.createMany({
          data: ranksToCreate.map((r) => ({
            userId: session.user.id,
            gameName: r.gameName,
            rank: r.rank,
          })),
        });
      }
    });

    return { success: true };
  } catch {
    return { error: "Failed to save extended profile" };
  }
}

export async function dismissProfileBanner() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { dismissedProfileBanner: true },
  });

  return { success: true };
}
