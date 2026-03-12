"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import { MAX_SHOWCASED_BADGES } from "@/lib/badges/constants";

// ─── User-Facing ─────────────────────────────────────────────────────

export async function getUserBadges(userId: string) {
  const allBadges = await prisma.badgeDefinition.findMany({
    where: { isEnabled: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  const userBadges = await prisma.userBadge.findMany({
    where: { userId, suppressAutoAward: false },
    include: { badge: true },
  });

  const earnedMap = new Map(
    userBadges.map((ub) => [ub.badgeId, ub])
  );

  return allBadges.map((badge) => {
    const earned = earnedMap.get(badge.id);
    return {
      id: badge.id,
      key: badge.key,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      category: badge.category,
      tier: badge.tier,
      source: badge.source,
      earned: !!earned,
      awardedAt: earned?.awardedAt?.toISOString() ?? null,
      showcased: earned?.showcased ?? false,
      userBadgeId: earned?.id ?? null,
    };
  });
}

export async function toggleShowcase(userBadgeId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Not authenticated" };

  const userBadge = await prisma.userBadge.findUnique({
    where: { id: userBadgeId },
  });
  if (!userBadge || userBadge.userId !== session.user.id) {
    return { error: "Badge not found" };
  }

  if (userBadge.suppressAutoAward) {
    return { error: "Badge has been revoked" };
  }

  // If toggling ON, check max limit
  if (!userBadge.showcased) {
    const currentShowcased = await prisma.userBadge.count({
      where: { userId: session.user.id, showcased: true, suppressAutoAward: false },
    });
    if (currentShowcased >= MAX_SHOWCASED_BADGES) {
      return { error: `Maximum ${MAX_SHOWCASED_BADGES} showcased badges` };
    }
  }

  await prisma.userBadge.update({
    where: { id: userBadgeId },
    data: { showcased: !userBadge.showcased },
  });

  revalidatePath("/profile");
  revalidatePath("/members");
  return { success: true };
}

export async function getUserStreaks(userId: string) {
  const streaks = await prisma.userStreak.findMany({
    where: { userId },
  });

  return {
    attendance: streaks.find((s) => s.type === "attendance") ?? {
      currentCount: 0,
      longestCount: 0,
    },
    weekly: streaks.find((s) => s.type === "weekly_activity") ?? {
      currentCount: 0,
      longestCount: 0,
    },
  };
}

// ─── Admin ───────────────────────────────────────────────────────────

export async function getAllBadges() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin && !session?.user?.isModerator) {
    return [];
  }

  const badges = await prisma.badgeDefinition.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: { awards: { where: { suppressAutoAward: false } } },
      },
    },
  });

  return badges.map((b) => ({
    id: b.id,
    key: b.key,
    name: b.name,
    description: b.description,
    icon: b.icon,
    category: b.category,
    tier: b.tier,
    source: b.source,
    isEnabled: b.isEnabled,
    triggerConfig: b.triggerConfig,
    earnedCount: b._count.awards,
    createdAt: b.createdAt.toISOString(),
  }));
}

export async function awardBadge(userId: string, badgeId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return { error: "Not authorized" };

  const badge = await prisma.badgeDefinition.findUnique({ where: { id: badgeId } });
  if (!badge) return { error: "Badge not found" };

  await prisma.userBadge.upsert({
    where: { userId_badgeId: { userId, badgeId } },
    create: {
      userId,
      badgeId,
      awardedBy: session.user.id,
      suppressAutoAward: false,
    },
    update: {
      suppressAutoAward: false,
      awardedBy: session.user.id,
      awardedAt: new Date(),
    },
  });

  logAudit({
    action: "BADGE_AWARDED",
    entityType: "Badge",
    entityId: badgeId,
    actorId: session.user.id,
    metadata: { badgeName: badge.name, targetUserId: userId, manual: true },
  });

  revalidatePath("/admin");
  revalidatePath("/members");
  return { success: true };
}

export async function revokeBadge(userId: string, badgeId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return { error: "Not authorized" };

  const badge = await prisma.badgeDefinition.findUnique({ where: { id: badgeId } });
  if (!badge) return { error: "Badge not found" };

  await prisma.userBadge.upsert({
    where: { userId_badgeId: { userId, badgeId } },
    create: {
      userId,
      badgeId,
      suppressAutoAward: true,
      showcased: false,
    },
    update: {
      suppressAutoAward: true,
      showcased: false,
    },
  });

  logAudit({
    action: "BADGE_REVOKED",
    entityType: "Badge",
    entityId: badgeId,
    actorId: session.user.id,
    metadata: { badgeName: badge.name, targetUserId: userId },
  });

  revalidatePath("/admin");
  revalidatePath("/members");
  return { success: true };
}

export async function createCustomBadge(data: {
  name: string;
  description: string;
  icon: string;
  category: string;
  tier: string;
  triggerType: "manual" | "threshold";
  metric?: string;
  value?: number;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return { error: "Not authorized" };

  const key = `custom_${data.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;

  const triggerConfig =
    data.triggerType === "threshold" && data.metric && data.value
      ? JSON.stringify({ type: "threshold", metric: data.metric, value: data.value })
      : JSON.stringify({ type: "manual" });

  const badge = await prisma.badgeDefinition.create({
    data: {
      key,
      name: data.name,
      description: data.description,
      icon: data.icon,
      category: data.category,
      tier: data.tier,
      source: "custom",
      triggerConfig,
    },
  });

  logAudit({
    action: "BADGE_CREATED",
    entityType: "Badge",
    entityId: badge.id,
    actorId: session.user.id,
    metadata: { name: data.name },
  });

  revalidatePath("/admin");
  return { success: true, id: badge.id };
}

export async function updateBadge(
  id: string,
  data: { name?: string; description?: string; icon?: string; category?: string; tier?: string }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return { error: "Not authorized" };

  await prisma.badgeDefinition.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description && { description: data.description }),
      ...(data.icon && { icon: data.icon }),
      ...(data.category && { category: data.category }),
      ...(data.tier && { tier: data.tier }),
    },
  });

  logAudit({
    action: "BADGE_UPDATED",
    entityType: "Badge",
    entityId: id,
    actorId: session.user.id,
    metadata: data,
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function deleteBadge(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return { error: "Not authorized" };

  const badge = await prisma.badgeDefinition.findUnique({ where: { id } });
  if (!badge) return { error: "Badge not found" };
  if (badge.source !== "custom") return { error: "Cannot delete system badges" };

  await prisma.badgeDefinition.delete({ where: { id } });

  logAudit({
    action: "BADGE_DELETED",
    entityType: "Badge",
    entityId: id,
    actorId: session.user.id,
    metadata: { name: badge.name },
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function toggleBadgeEnabled(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return { error: "Not authorized" };

  const badge = await prisma.badgeDefinition.findUnique({ where: { id } });
  if (!badge) return { error: "Badge not found" };

  await prisma.badgeDefinition.update({
    where: { id },
    data: { isEnabled: !badge.isEnabled },
  });

  logAudit({
    action: badge.isEnabled ? "BADGE_DISABLED" : "BADGE_ENABLED",
    entityType: "Badge",
    entityId: id,
    actorId: session.user.id,
    metadata: { name: badge.name },
  });

  revalidatePath("/admin");
  return { success: true };
}

// ─── Data fetching for admin ─────────────────────────────────────────

export async function getAllUsersForBadgeAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return [];

  return prisma.user.findMany({
    select: { id: true, name: true, gamertag: true, avatar: true },
    orderBy: { name: "asc" },
  });
}

export async function getUserBadgeStatus(userId: string, badgeId: string) {
  const userBadge = await prisma.userBadge.findUnique({
    where: { userId_badgeId: { userId, badgeId } },
  });
  return {
    earned: !!userBadge && !userBadge.suppressAutoAward,
    revoked: !!userBadge && userBadge.suppressAutoAward,
  };
}
