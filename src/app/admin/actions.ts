"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";

export async function cycleRole(userId: string, direction: "promote" | "demote") {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return { error: "Admin only" };
  }
  if (session.user.id === userId) {
    return { error: "Cannot change your own role" };
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { error: "User not found" };
    if (user.isOwner) return { error: "Cannot change owner role" };

    // Role ladder: Member -> Moderator -> Admin
    let data: { isAdmin: boolean; isModerator: boolean };
    if (direction === "promote") {
      if (user.isAdmin) return { error: "Already an admin" };
      if (user.isModerator) {
        data = { isAdmin: true, isModerator: false };
      } else {
        data = { isAdmin: false, isModerator: true };
      }
    } else {
      if (!user.isAdmin && !user.isModerator) return { error: "Already a member" };
      if (user.isAdmin) {
        data = { isAdmin: false, isModerator: true };
      } else {
        data = { isAdmin: false, isModerator: false };
      }
    }

    const fromRole = user.isAdmin ? "Admin" : user.isModerator ? "Moderator" : "Member";
    await prisma.user.update({ where: { id: userId }, data });
    const toRole = data.isAdmin ? "Admin" : data.isModerator ? "Moderator" : "Member";
    revalidatePath("/admin");
    logAudit({ action: "ROLE_CHANGED", entityType: "User", entityId: userId, actorId: session.user.id, metadata: { targetName: user.gamertag || user.name, fromRole, toRole } });
    return { success: true };
  } catch {
    return { error: "Failed to update role" };
  }
}

export async function muteUser(userId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin && !session?.user?.isModerator) {
    return { error: "Admin or moderator only" };
  }
  if (session.user.id === userId) {
    return { error: "Cannot mute yourself" };
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { error: "User not found" };
    if (user.isOwner) return { error: "Cannot mute owner" };
    // Mods can only mute regular members, not admins or other mods
    if (session.user.isModerator && !session.user.isAdmin && (user.isAdmin || user.isModerator)) {
      return { error: "Moderators can only mute regular members" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isMuted: true, mutedUntil: null },
    });
    revalidatePath("/admin");
    logAudit({ action: "USER_MUTED", entityType: "User", entityId: userId, actorId: session.user.id, metadata: { targetName: user.gamertag || user.name } });
    return { success: true };
  } catch {
    return { error: "Failed to mute user" };
  }
}

export async function unmuteUser(userId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return { error: "Admin only" };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { isMuted: false, mutedUntil: null },
    });
    revalidatePath("/admin");
    logAudit({ action: "USER_UNMUTED", entityType: "User", entityId: userId, actorId: session.user.id });
    return { success: true };
  } catch {
    return { error: "Failed to unmute user" };
  }
}

export async function tempMuteUser(userId: string, minutes: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin && !session?.user?.isModerator) {
    return { error: "Admin or moderator only" };
  }
  if (session.user.id === userId) {
    return { error: "Cannot mute yourself" };
  }

  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 10080) {
    return { error: "Duration must be 1–10080 minutes (1 week max)" };
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { error: "User not found" };
    if (user.isOwner) return { error: "Cannot mute owner" };
    // Mods can only mute regular members, not admins or other mods
    if (session.user.isModerator && !session.user.isAdmin && (user.isAdmin || user.isModerator)) {
      return { error: "Moderators can only mute regular members" };
    }

    const mutedUntil = new Date(Date.now() + minutes * 60000);
    await prisma.user.update({
      where: { id: userId },
      data: { isMuted: false, mutedUntil },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { error: "Failed to temp mute user" };
  }
}

export async function lockRanks(userId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return { error: "Admin only" };
  }
  if (session.user.id === userId) {
    return { error: "Cannot lock your own ranks" };
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { error: "User not found" };
    if (user.isOwner) return { error: "Cannot lock owner ranks" };

    await prisma.user.update({
      where: { id: userId },
      data: { ranksLocked: true },
    });
    revalidatePath("/admin");
    logAudit({ action: "RANKS_LOCKED", entityType: "User", entityId: userId, actorId: session.user.id, metadata: { targetName: user.gamertag || user.name } });
    return { success: true };
  } catch {
    return { error: "Failed to lock ranks" };
  }
}

export async function unlockRanks(userId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return { error: "Admin only" };
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { error: "User not found" };

    await prisma.user.update({
      where: { id: userId },
      data: { ranksLocked: false },
    });
    revalidatePath("/admin");
    logAudit({ action: "RANKS_UNLOCKED", entityType: "User", entityId: userId, actorId: session.user.id, metadata: { targetName: user.gamertag || user.name } });
    return { success: true };
  } catch {
    return { error: "Failed to unlock ranks" };
  }
}

interface RankInput {
  gameName: string;
  rank: string;
}

export async function setUserRanks(userId: string, ranks: RankInput[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return { error: "Admin only" };
  }
  if (session.user.id === userId) {
    return { error: "Cannot override your own ranks" };
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { error: "User not found" };
    if (user.isOwner) return { error: "Cannot override owner ranks" };

    await prisma.$transaction(async (tx) => {
      await tx.userGameRank.deleteMany({ where: { userId } });
      const ranksToCreate = ranks.filter((r) => r.rank);
      if (ranksToCreate.length > 0) {
        await tx.userGameRank.createMany({
          data: ranksToCreate.map((r) => ({
            userId,
            gameName: r.gameName,
            rank: r.rank,
          })),
        });
      }
    });

    revalidatePath("/admin");
    revalidatePath("/members");
    logAudit({
      action: "RANKS_OVERRIDDEN",
      entityType: "User",
      entityId: userId,
      actorId: session.user.id,
      metadata: { targetName: user.gamertag || user.name, ranks: ranks.filter((r) => r.rank) },
    });
    return { success: true };
  } catch {
    return { error: "Failed to set ranks" };
  }
}

export async function removeUser(userId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return { error: "Admin only" };
  }
  if (session.user.id === userId) {
    return { error: "Cannot remove yourself" };
  }

  try {
    await prisma.user.delete({ where: { id: userId } });
    revalidatePath("/admin");
    logAudit({ action: "USER_REMOVED", entityType: "User", entityId: userId, actorId: session.user.id });
    return { success: true };
  } catch (err) {
    console.error("Failed to remove user:", err);
    return { error: "Failed to remove user" };
  }
}
