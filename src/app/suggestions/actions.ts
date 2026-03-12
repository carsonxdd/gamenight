"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { SUGGESTION_LIMITS, SUGGESTION_STATUSES } from "@/lib/suggestion-constants";
import { isUserMuted } from "@/lib/mute-utils";

export async function createSuggestion(title: string, description?: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  // Mute check
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isMuted: true, mutedUntil: true },
  });
  if (dbUser && isUserMuted(dbUser)) {
    return { error: "You are currently muted" };
  }

  const trimmedTitle = title.trim();
  if (trimmedTitle.length < SUGGESTION_LIMITS.TITLE_MIN || trimmedTitle.length > SUGGESTION_LIMITS.TITLE_MAX) {
    return { error: `Title must be ${SUGGESTION_LIMITS.TITLE_MIN}–${SUGGESTION_LIMITS.TITLE_MAX} characters` };
  }

  const trimmedDesc = description?.trim() || null;
  if (trimmedDesc && trimmedDesc.length > SUGGESTION_LIMITS.DESCRIPTION_MAX) {
    return { error: `Description must be ${SUGGESTION_LIMITS.DESCRIPTION_MAX} characters or less` };
  }

  try {
    await prisma.suggestion.create({
      data: {
        title: trimmedTitle,
        description: trimmedDesc,
        userId: session.user.id,
      },
    });
    revalidatePath("/profile");
    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { error: "Failed to create suggestion" };
  }
}

export async function updateSuggestionStatus(suggestionId: string, status: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return { error: "Admin only" };
  }

  if (!SUGGESTION_STATUSES.includes(status as typeof SUGGESTION_STATUSES[number])) {
    return { error: "Invalid status" };
  }

  try {
    await prisma.suggestion.update({
      where: { id: suggestionId },
      data: { status },
    });
    revalidatePath("/admin");
    revalidatePath("/profile");
    return { success: true };
  } catch {
    return { error: "Failed to update status" };
  }
}

export async function deleteSuggestion(suggestionId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const suggestion = await prisma.suggestion.findUnique({
    where: { id: suggestionId },
  });
  if (!suggestion) return { error: "Suggestion not found" };

  if (suggestion.userId !== session.user.id && !session.user.isAdmin) {
    return { error: "Not authorized" };
  }

  try {
    await prisma.suggestion.delete({ where: { id: suggestionId } });
    revalidatePath("/profile");
    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { error: "Failed to delete suggestion" };
  }
}

export async function getMyRecentSuggestions() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return [];
  }

  const suggestions = await prisma.suggestion.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      createdAt: true,
    },
  });

  return suggestions.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
  }));
}

export async function getAllSuggestions() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return [];
  }

  const suggestions = await prisma.suggestion.findMany({
    include: {
      user: { select: { id: true, name: true, gamertag: true, avatar: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return suggestions.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    status: s.status,
    userId: s.userId,
    user: s.user,
    createdAt: s.createdAt.toISOString(),
  }));
}

export async function getOpenSuggestionCount() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return 0;
  }

  return prisma.suggestion.count({
    where: { status: "open" },
  });
}
