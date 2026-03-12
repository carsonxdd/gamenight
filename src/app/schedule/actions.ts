"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { INVITE_LIMITS } from "@/lib/constants";
import { localDateTimeToUtc, DEFAULT_TIMEZONE } from "@/lib/timezone-utils";
import { getSiteSettings } from "@/app/admin/settings-actions";
import { logAudit } from "@/lib/audit";

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function parseUtcDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
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
  hostId?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const isAdminOrMod = session.user.isAdmin || session.user.isModerator || session.user.isOwner;

  // Check allowMemberEvents setting
  if (!isAdminOrMod) {
    const settings = await getSiteSettings();
    if (!settings.allowMemberEvents) {
      return { error: "Only admins can create events" };
    }
  }

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
    // Look up the host's timezone for conversion
    const hostUser = await prisma.user.findUnique({
      where: { id: data.hostId || session.user.id },
      select: { timezone: true },
    });
    const eventTimezone = hostUser?.timezone || DEFAULT_TIMEZONE;

    // Convert local times to UTC
    const utcStart = localDateTimeToUtc(data.date, data.startTime, eventTimezone);
    const utcEnd = localDateTimeToUtc(data.date, data.endTime, eventTimezone);

    const baseDate = parseUtcDate(utcStart.utcDate);
    const recurGroupId = isRecurring ? crypto.randomUUID() : null;
    const sharedFields = {
      title: data.title?.trim() || null,
      description: data.description?.trim() || null,
      startTime: utcStart.utcTime,
      endTime: utcEnd.utcTime,
      game: data.game,
      status,
      visibility,
      isRecurring,
      recurDay: isRecurring ? data.recurDay ?? null : null,
      recurGroupId,
      createdById: session.user.id,
      hostId: data.hostId || session.user.id,
      timezone: eventTimezone,
    };

    if (isRecurring) {
      const weeks = Math.min(Math.max(data.recurWeeks ?? 4, 2), 12);
      const events = [];
      for (let i = 0; i < weeks; i++) {
        // Compute each instance individually to handle DST correctly
        const localDate = new Date(parseLocalDate(data.date));
        localDate.setDate(localDate.getDate() + 7 * i);
        const localDateStr = `${localDate.getFullYear()}-${(localDate.getMonth() + 1).toString().padStart(2, "0")}-${localDate.getDate().toString().padStart(2, "0")}`;
        const utcS = localDateTimeToUtc(localDateStr, data.startTime, eventTimezone);
        const utcE = localDateTimeToUtc(localDateStr, data.endTime, eventTimezone);
        events.push({
          ...sharedFields,
          date: parseUtcDate(utcS.utcDate),
          startTime: utcS.utcTime,
          endTime: utcE.utcTime,
        });
      }
      await prisma.gameNight.createMany({ data: events });
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
    logAudit({ action: "EVENT_CREATED", entityType: "GameNight", actorId: session.user.id, metadata: { title: data.title || data.game, game: data.game } });
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

  // If RSVPing as confirmed, check attendee cap
  if (status === "confirmed") {
    const settings = await getSiteSettings();
    if (settings.maxAttendeesDefault > 0) {
      const currentConfirmed = await prisma.gameNightAttendee.count({
        where: { gameNightId, status: "confirmed", userId: { not: session.user.id } },
      });
      if (currentConfirmed >= settings.maxAttendeesDefault) {
        return { error: "This event is full" };
      }
    }
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
    hostId?: string;
  }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const isAdminOrMod = session.user.isAdmin || session.user.isModerator || session.user.isOwner;

  // Fetch the event to check ownership and visibility
  const existing = await prisma.gameNight.findUnique({
    where: { id },
    select: { createdById: true, hostId: true, visibility: true, timezone: true },
  });
  if (!existing) {
    return { error: "Event not found" };
  }

  const isCreator = existing.createdById === session.user.id;
  const isHost = existing.hostId === session.user.id;
  const isInviteOnly = existing.visibility === "invite_only";

  // Authorization: admin/mod/owner can edit anything, host can edit, creator can edit own invite-only
  if (!isAdminOrMod && !isHost && !(isCreator && isInviteOnly)) {
    return { error: "Not authorized to edit this event" };
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
    // Convert local times to UTC using the event's timezone
    const eventTimezone = existing.timezone || DEFAULT_TIMEZONE;
    const utcStart = localDateTimeToUtc(data.date, data.startTime, eventTimezone);
    const utcEnd = localDateTimeToUtc(data.date, data.endTime, eventTimezone);

    const updateData: Record<string, unknown> = {
      title: data.title?.trim() || null,
      description: data.description?.trim() || null,
      date: parseUtcDate(utcStart.utcDate),
      startTime: utcStart.utcTime,
      endTime: utcEnd.utcTime,
      game: data.game,
    };

    // Only admin/mod can change status, recurring, visibility
    if (isAdminOrMod) {
      updateData.status = data.status;
      updateData.isRecurring = data.isRecurring;
      updateData.recurDay = data.isRecurring ? data.recurDay : null;
    }

    // Host can be changed by admin/mod or creator
    if (data.hostId !== undefined && (isAdminOrMod || isCreator)) {
      updateData.hostId = data.hostId;
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

  const isAdminOrMod = session.user.isAdmin || session.user.isModerator || session.user.isOwner;

  // Allow host or creator of invite-only events to cancel
  if (!isAdminOrMod) {
    const existing = await prisma.gameNight.findUnique({ where: { id } });
    if (!existing) return { error: "Event not found" };
    const isHost = existing.hostId === session.user.id;
    const isCreator = existing.createdById === session.user.id;
    if (!isHost && !(isCreator && existing.visibility === "invite_only")) {
      return { error: "Not authorized to cancel this event" };
    }
  }

  try {
    await prisma.gameNight.update({
      where: { id },
      data: { status: "cancelled" },
    });
    revalidatePath("/schedule");
    logAudit({ action: "EVENT_CANCELLED", entityType: "GameNight", entityId: id, actorId: session.user.id });
    return { success: true };
  } catch {
    return { error: "Failed to cancel game night" };
  }
}

export async function approveGameNight(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin && !session?.user?.isModerator && !session?.user?.isOwner) {
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
  if (!session?.user?.isAdmin && !session?.user?.isModerator && !session?.user?.isOwner) {
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

  const isAdminOrMod = session.user.isAdmin || session.user.isModerator || session.user.isOwner;

  // Allow host or creator of invite-only events to delete
  if (!isAdminOrMod) {
    const existing = await prisma.gameNight.findUnique({ where: { id } });
    if (!existing) return { error: "Event not found" };
    const isHost = existing.hostId === session.user.id;
    const isCreator = existing.createdById === session.user.id;
    if (!isHost && !(isCreator && existing.visibility === "invite_only")) {
      return { error: "Not authorized to delete this event" };
    }
  }

  try {
    await prisma.gameNight.delete({ where: { id } });
    revalidatePath("/schedule");
    logAudit({ action: "EVENT_DELETED", entityType: "GameNight", entityId: id, actorId: session.user.id });
    return { success: true };
  } catch {
    return { error: "Failed to delete game night" };
  }
}

export async function deleteRecurringGroup(recurGroupId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin && !session?.user?.isModerator && !session?.user?.isOwner) {
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

export async function markAttendance(gameNightId: string, attendedUserIds: string[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const isAdminOrMod = session.user.isAdmin || session.user.isModerator || session.user.isOwner;

  const gameNight = await prisma.gameNight.findUnique({
    where: { id: gameNightId },
    select: { hostId: true, createdById: true, date: true, endTime: true, timezone: true },
  });
  if (!gameNight) return { error: "Event not found" };

  // Only the host, creator, or admin/mod can mark attendance
  const isHost = gameNight.hostId === session.user.id;
  const isCreator = gameNight.createdById === session.user.id;
  if (!isAdminOrMod && !isHost && !isCreator) {
    return { error: "Only the host can mark attendance" };
  }

  // Only allow marking attendance for past events
  // endTime is stored in UTC, date is stored as UTC midnight
  const [endH, endM] = (gameNight.endTime || "23:59").split(":").map(Number);
  const eventEnd = new Date(gameNight.date);
  eventEnd.setUTCHours(endH, endM, 0, 0);
  if (eventEnd > new Date()) {
    return { error: "Cannot mark attendance for future events" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Reset all attendees to not attended
      await tx.gameNightAttendee.updateMany({
        where: { gameNightId },
        data: { attended: false },
      });

      // Mark selected users as attended
      if (attendedUserIds.length > 0) {
        await tx.gameNightAttendee.updateMany({
          where: { gameNightId, userId: { in: attendedUserIds } },
          data: { attended: true },
        });
      }

      // Mark the event as attendance confirmed
      await tx.gameNight.update({
        where: { id: gameNightId },
        data: { attendanceConfirmed: true },
      });
    });

    revalidatePath("/schedule");
    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { error: "Failed to mark attendance" };
  }
}
