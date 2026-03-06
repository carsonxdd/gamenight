"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { INVITE_LIMITS } from "@/lib/constants";

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export async function createGameNight(data: {
  title?: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  game: string;
  isRecurring: boolean;
  recurDay?: number;
  recurWeeks?: number;
  visibility?: string;
  inviteeIds?: string[];
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const isAdminOrMod = session.user.isAdmin || session.user.isModerator;
  const visibility = data.visibility === "invite_only" ? "invite_only" : "public";
  const isInviteOnly = visibility === "invite_only";

  // Invite-only events auto-schedule; public events need mod approval unless admin/mod
  const status = isInviteOnly ? "scheduled" : isAdminOrMod ? "scheduled" : "pending";

  // Only admins/mods can create recurring events
  const isRecurring = data.isRecurring && isAdminOrMod && !isInviteOnly;

  // Guardrails for non-admin/mod users
  if (!isAdminOrMod) {
    const title = data.title?.trim() || "";
    const desc = data.description?.trim() || "";
    if (title.length > INVITE_LIMITS.TITLE_MAX) {
      return { error: `Title must be ${INVITE_LIMITS.TITLE_MAX} characters or less` };
    }
    if (desc.length > INVITE_LIMITS.DESCRIPTION_MAX) {
      return { error: `Description must be ${INVITE_LIMITS.DESCRIPTION_MAX} characters or less` };
    }

    const selectedDate = parseLocalDate(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      return { error: "Cannot create events in the past" };
    }

    if (isInviteOnly) {
      const inviteeIds = data.inviteeIds || [];
      if (inviteeIds.length === 0) {
        return { error: "Invite-only events need at least one invitee" };
      }
      if (inviteeIds.length > INVITE_LIMITS.MAX_INVITEES) {
        return { error: `Maximum ${INVITE_LIMITS.MAX_INVITEES} invitees allowed` };
      }
      if (inviteeIds.includes(session.user.id)) {
        return { error: "You cannot invite yourself" };
      }

      // Rate limit: max invite-only events per rolling 7 days
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const recentCount = await prisma.gameNight.count({
        where: {
          createdById: session.user.id,
          visibility: "invite_only",
          createdAt: { gte: weekAgo },
        },
      });
      if (recentCount >= INVITE_LIMITS.MAX_EVENTS_PER_WEEK) {
        return { error: `Maximum ${INVITE_LIMITS.MAX_EVENTS_PER_WEEK} invite-only events per week` };
      }
    }
  }

  try {
    const baseDate = parseLocalDate(data.date);
    const recurGroupId = isRecurring ? crypto.randomUUID() : null;
    const sharedFields = {
      title: data.title?.trim() || null,
      description: data.description?.trim() || null,
      startTime: data.startTime,
      endTime: data.endTime,
      game: data.game,
      status,
      visibility,
      isRecurring,
      recurDay: isRecurring ? data.recurDay ?? null : null,
      recurGroupId,
      createdById: session.user.id,
    };

    if (isRecurring) {
      const weeks = Math.min(Math.max(data.recurWeeks ?? 4, 2), 12);
      const dates = [baseDate];
      for (let i = 1; i < weeks; i++) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() + 7 * i);
        dates.push(d);
      }
      await prisma.gameNight.createMany({
        data: dates.map((date) => ({ ...sharedFields, date })),
      });
    } else if (isInviteOnly && data.inviteeIds && data.inviteeIds.length > 0) {
      await prisma.$transaction(async (tx) => {
        const gameNight = await tx.gameNight.create({
          data: { ...sharedFields, date: baseDate },
        });
        await tx.gameNightInvite.createMany({
          data: data.inviteeIds!.map((userId) => ({
            gameNightId: gameNight.id,
            userId,
          })),
        });
      });
    } else {
      await prisma.gameNight.create({
        data: { ...sharedFields, date: baseDate },
      });
    }

    revalidatePath("/schedule");
    return { success: true };
  } catch {
    return { error: "Failed to create game night" };
  }
}

export async function updateRSVP(gameNightId: string, status: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    await prisma.gameNightAttendee.upsert({
      where: {
        gameNightId_userId: {
          gameNightId,
          userId: session.user.id,
        },
      },
      update: { status },
      create: {
        gameNightId,
        userId: session.user.id,
        status,
      },
    });
    revalidatePath("/schedule");
    return { success: true };
  } catch {
    return { error: "Failed to update RSVP" };
  }
}

export async function updateGameNight(
  id: string,
  data: {
    title?: string;
    description?: string;
    date: string;
    startTime: string;
    endTime: string;
    game: string;
    status: string;
    isRecurring: boolean;
    recurDay?: number;
    inviteeIds?: string[];
  }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const isAdminOrMod = session.user.isAdmin || session.user.isModerator;

  // Fetch the event to check ownership and visibility
  const existing = await prisma.gameNight.findUnique({ where: { id } });
  if (!existing) {
    return { error: "Event not found" };
  }

  const isCreator = existing.createdById === session.user.id;
  const isInviteOnly = existing.visibility === "invite_only";

  // Authorization: admin/mod can edit anything, creator can edit their own invite-only events
  if (!isAdminOrMod && !(isCreator && isInviteOnly)) {
    return { error: "Admin or moderator only" };
  }

  // Guardrails for non-admin users editing invite-only events
  if (!isAdminOrMod) {
    const title = data.title?.trim() || "";
    const desc = data.description?.trim() || "";
    if (title.length > INVITE_LIMITS.TITLE_MAX) {
      return { error: `Title must be ${INVITE_LIMITS.TITLE_MAX} characters or less` };
    }
    if (desc.length > INVITE_LIMITS.DESCRIPTION_MAX) {
      return { error: `Description must be ${INVITE_LIMITS.DESCRIPTION_MAX} characters or less` };
    }

    const selectedDate = parseLocalDate(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      return { error: "Cannot set event date in the past" };
    }

    if (data.inviteeIds) {
      if (data.inviteeIds.length === 0) {
        return { error: "Invite-only events need at least one invitee" };
      }
      if (data.inviteeIds.length > INVITE_LIMITS.MAX_INVITEES) {
        return { error: `Maximum ${INVITE_LIMITS.MAX_INVITEES} invitees allowed` };
      }
      if (data.inviteeIds.includes(session.user.id)) {
        return { error: "You cannot invite yourself" };
      }
    }
  }

  try {
    const updateData: Record<string, unknown> = {
      title: data.title?.trim() || null,
      description: data.description?.trim() || null,
      date: parseLocalDate(data.date),
      startTime: data.startTime,
      endTime: data.endTime,
      game: data.game,
    };

    // Only admin/mod can change status, recurring, visibility
    if (isAdminOrMod) {
      updateData.status = data.status;
      updateData.isRecurring = data.isRecurring;
      updateData.recurDay = data.isRecurring ? data.recurDay : null;
    }

    if (data.inviteeIds !== undefined && isInviteOnly) {
      await prisma.$transaction(async (tx) => {
        await tx.gameNight.update({ where: { id }, data: updateData });
        await tx.gameNightInvite.deleteMany({ where: { gameNightId: id } });
        if (data.inviteeIds!.length > 0) {
          await tx.gameNightInvite.createMany({
            data: data.inviteeIds!.map((userId) => ({
              gameNightId: id,
              userId,
            })),
          });
        }
      });
    } else {
      await prisma.gameNight.update({ where: { id }, data: updateData });
    }

    revalidatePath("/schedule");
    return { success: true };
  } catch {
    return { error: "Failed to update game night" };
  }
}

export async function cancelGameNight(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const isAdminOrMod = session.user.isAdmin || session.user.isModerator;

  // Allow creator to cancel their own invite-only events
  if (!isAdminOrMod) {
    const existing = await prisma.gameNight.findUnique({ where: { id } });
    if (!existing || existing.createdById !== session.user.id || existing.visibility !== "invite_only") {
      return { error: "Admin or moderator only" };
    }
  }

  try {
    await prisma.gameNight.update({
      where: { id },
      data: { status: "cancelled" },
    });
    revalidatePath("/schedule");
    return { success: true };
  } catch {
    return { error: "Failed to cancel game night" };
  }
}

export async function approveGameNight(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin && !session?.user?.isModerator) {
    return { error: "Admin or moderator only" };
  }

  try {
    await prisma.gameNight.update({
      where: { id },
      data: { status: "scheduled" },
    });
    revalidatePath("/schedule");
    return { success: true };
  } catch {
    return { error: "Failed to approve game night" };
  }
}

export async function rejectGameNight(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin && !session?.user?.isModerator) {
    return { error: "Admin or moderator only" };
  }

  try {
    await prisma.gameNight.update({
      where: { id },
      data: { status: "rejected" },
    });
    revalidatePath("/schedule");
    return { success: true };
  } catch {
    return { error: "Failed to reject game night" };
  }
}

export async function deleteGameNight(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const isAdminOrMod = session.user.isAdmin || session.user.isModerator;

  // Allow creator to delete their own invite-only events
  if (!isAdminOrMod) {
    const existing = await prisma.gameNight.findUnique({ where: { id } });
    if (!existing || existing.createdById !== session.user.id || existing.visibility !== "invite_only") {
      return { error: "Admin or moderator only" };
    }
  }

  try {
    await prisma.gameNight.delete({ where: { id } });
    revalidatePath("/schedule");
    return { success: true };
  } catch {
    return { error: "Failed to delete game night" };
  }
}

export async function deleteRecurringGroup(recurGroupId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin && !session?.user?.isModerator) {
    return { error: "Admin or moderator only" };
  }

  try {
    await prisma.gameNight.deleteMany({
      where: { recurGroupId },
    });
    revalidatePath("/schedule");
    return { success: true };
  } catch {
    return { error: "Failed to delete recurring events" };
  }
}

export async function fetchInvitableMembers() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return [];
  }

  const members = await prisma.user.findMany({
    where: {
      gamertag: { not: null },
      id: { not: session.user.id },
    },
    select: {
      id: true,
      name: true,
      gamertag: true,
      avatar: true,
    },
    orderBy: { gamertag: "asc" },
  });

  return members;
}
