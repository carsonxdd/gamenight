"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createGameNight(data: {
  date: string;
  startTime: string;
  endTime: string;
  game: string;
  isRecurring: boolean;
  recurDay?: number;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return { error: "Admin only" };
  }

  try {
    await prisma.gameNight.create({
      data: {
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        game: data.game,
        isRecurring: data.isRecurring,
        recurDay: data.isRecurring ? data.recurDay : null,
        createdById: session.user.id,
      },
    });
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

export async function cancelGameNight(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return { error: "Admin only" };
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
