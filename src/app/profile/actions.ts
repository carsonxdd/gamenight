"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { localTimeToUtc, DEFAULT_TIMEZONE } from "@/lib/timezone-utils";

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
  favoriteGames: string[];
  twitter: string;
  twitch: string;
  youtube: string;
  customLink: string;
}

function parseSlot(key: string) {
  const [dayStr, startTime] = key.split("-");
  const dayOfWeek = parseInt(dayStr, 10);
  const [h, m] = startTime.split(":").map(Number);
  const endM = m === 0 ? "30" : "00";
  const endH = m === 0 ? h : (h + 1) % 24;
  const endDayOfWeek = m !== 0 && h === 23 ? (dayOfWeek + 1) % 7 : dayOfWeek;
  const endTime = `${endH.toString().padStart(2, "0")}:${endM}`;
  return { dayOfWeek, startTime, endTime, endDayOfWeek };
}

/** Convert a parsed local slot to UTC using the user's timezone */
function parseSlotUtc(key: string, timezone: string) {
  const local = parseSlot(key);
  const utcStart = localTimeToUtc(local.startTime, local.dayOfWeek, timezone);
  const utcEnd = localTimeToUtc(local.endTime, local.endDayOfWeek, timezone);
  return {
    dayOfWeek: utcStart.utcDayOfWeek,
    startTime: utcStart.utcTime,
    endTime: utcEnd.utcTime,
  };
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
          ...parseSlotUtc(key, data.timezone || DEFAULT_TIMEZONE),
        })),
      });
    });

    // Badge: profile_complete + games_added
    import("@/lib/badges/engine").then(async ({ evaluateBadges, checkProfileComplete }) => {
      await checkProfileComplete(session.user.id).catch(() => {});
      await evaluateBadges(session.user.id, "games_added").catch(() => {});
    });

    const { revalidatePath } = await import("next/cache");
    revalidatePath("/profile");
    revalidatePath("/members");
    revalidatePath("/admin");

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
    // Check if ranks are locked by admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { ranksLocked: true },
    });
    const ranksLocked = currentUser?.ranksLocked ?? false;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          interestedInBuyIn: data.interestedInBuyIn,
          interestedInLAN: data.interestedInLAN,
          willingToModerate: data.willingToModerate,
          favoriteGames: data.favoriteGames.length > 0
            ? JSON.stringify(data.favoriteGames.slice(0, 3))
            : null,
          twitter: data.twitter || null,
          twitch: data.twitch || null,
          youtube: data.youtube || null,
          customLink: data.customLink || null,
        },
      });

      // Skip rank changes if locked
      if (!ranksLocked) {
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
      }
    });

    const { revalidatePath } = await import("next/cache");
    revalidatePath("/profile");
    revalidatePath("/members");

    return { success: true, ranksLocked };
  } catch {
    return { error: "Failed to save extended profile" };
  }
}

export async function createInviteGroup(data: { name: string; memberIds: string[] }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const name = data.name.trim();
  if (!name) return { error: "Group name is required" };
  if (name.length > 30) return { error: "Group name must be 30 characters or less" };
  if (data.memberIds.length === 0) return { error: "Add at least one member" };
  if (data.memberIds.length > 10) return { error: "Maximum 10 members per group" };
  if (data.memberIds.includes(session.user.id)) return { error: "You cannot add yourself" };

  const groupCount = await prisma.inviteGroup.count({
    where: { ownerId: session.user.id },
  });
  if (groupCount >= 10) return { error: "Maximum 10 groups allowed" };

  try {
    await prisma.$transaction(async (tx) => {
      const group = await tx.inviteGroup.create({
        data: { name, ownerId: session.user.id },
      });
      await tx.inviteGroupMember.createMany({
        data: data.memberIds.map((userId) => ({
          groupId: group.id,
          userId,
        })),
      });
    });
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/profile");
    return { success: true };
  } catch {
    return { error: "Failed to create group" };
  }
}

export async function updateInviteGroup(groupId: string, data: { name: string; memberIds: string[] }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const group = await prisma.inviteGroup.findUnique({ where: { id: groupId } });
  if (!group || group.ownerId !== session.user.id) {
    return { error: "Group not found" };
  }

  const name = data.name.trim();
  if (!name) return { error: "Group name is required" };
  if (name.length > 30) return { error: "Group name must be 30 characters or less" };
  if (data.memberIds.length === 0) return { error: "Add at least one member" };
  if (data.memberIds.length > 10) return { error: "Maximum 10 members per group" };
  if (data.memberIds.includes(session.user.id)) return { error: "You cannot add yourself" };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.inviteGroup.update({
        where: { id: groupId },
        data: { name },
      });
      await tx.inviteGroupMember.deleteMany({ where: { groupId } });
      await tx.inviteGroupMember.createMany({
        data: data.memberIds.map((userId) => ({
          groupId,
          userId,
        })),
      });
    });
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/profile");
    return { success: true };
  } catch {
    return { error: "Failed to update group" };
  }
}

export async function deleteInviteGroup(groupId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const group = await prisma.inviteGroup.findUnique({ where: { id: groupId } });
  if (!group || group.ownerId !== session.user.id) {
    return { error: "Group not found" };
  }

  try {
    await prisma.inviteGroup.delete({ where: { id: groupId } });
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/profile");
    return { success: true };
  } catch {
    return { error: "Failed to delete group" };
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
