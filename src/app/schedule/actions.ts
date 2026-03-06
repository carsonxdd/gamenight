"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createGameNight(data: {
  title?: string;
  date: string;
  startTime: string;
  endTime: string;
  game: string;
  isRecurring: boolean;
  recurDay?: number;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin && !session?.user?.isModerator) {
    return { error: "Admin or moderator only" };
  }

  try {
    const baseDate = new Date(data.date);
    const sharedFields = {
      title: data.title?.trim() || null,
      startTime: data.startTime,
      endTime: data.endTime,
      game: data.game,
      isRecurring: data.isRecurring,
      recurDay: data.isRecurring ? data.recurDay : null,
      createdById: session.user.id,
    };

    if (data.isRecurring) {
      // Create the initial event + 3 more weeks (4 total)
      const dates = [baseDate];
      for (let i = 1; i < 4; i++) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() + 7 * i);
        dates.push(d);
      }
      await prisma.gameNight.createMany({
        data: dates.map((date) => ({ ...sharedFields, date })),
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
    date: string;
    startTime: string;
    endTime: string;
    game: string;
    status: string;
    isRecurring: boolean;
    recurDay?: number;
  }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin && !session?.user?.isModerator) {
    return { error: "Admin or moderator only" };
  }

  try {
    await prisma.gameNight.update({
      where: { id },
      data: {
        title: data.title?.trim() || null,
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        game: data.game,
        status: data.status,
        isRecurring: data.isRecurring,
        recurDay: data.isRecurring ? data.recurDay : null,
      },
    });
    revalidatePath("/schedule");
    return { success: true };
  } catch {
    return { error: "Failed to update game night" };
  }
}

export async function cancelGameNight(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin && !session?.user?.isModerator) {
    return { error: "Admin or moderator only" };
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

export async function deleteGameNight(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin && !session?.user?.isModerator) {
    return { error: "Admin or moderator only" };
  }

  try {
    await prisma.gameNight.delete({ where: { id } });
    revalidatePath("/schedule");
    return { success: true };
  } catch {
    return { error: "Failed to delete game night" };
  }
}
