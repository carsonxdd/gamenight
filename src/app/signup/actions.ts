"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { localTimeToUtc, DEFAULT_TIMEZONE } from "@/lib/timezone-utils";
import { notifyMemberJoined } from "@/lib/discord-webhook";

interface GameInput {
  name: string;
  modes?: string[];
}

interface ProfileData {
  gamertag: string;
  timezone: string;
  games: GameInput[];
  slots: string[];
  willingToModerate: boolean;
  inviteCode?: string;
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

/** Convert a parsed local slot to UTC using the user's timezone */
function parseSlotUtc(key: string, timezone: string) {
  const local = parseSlot(key);
  const utcStart = localTimeToUtc(local.startTime, local.dayOfWeek, timezone);
  const utcEnd = localTimeToUtc(local.endTime, local.dayOfWeek, timezone);
  return {
    dayOfWeek: utcStart.utcDayOfWeek,
    startTime: utcStart.utcTime,
    endTime: utcEnd.utcTime,
  };
}

export async function completeProfile(data: ProfileData) {
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

  // If invite code provided, validate and redeem
  if (data.inviteCode) {
    const inviteCode = await prisma.inviteCode.findUnique({
      where: { code: data.inviteCode.toUpperCase().trim() },
    });
    if (!inviteCode || !inviteCode.isActive || inviteCode.uses >= inviteCode.maxUses) {
      return { error: "Invalid or expired invite code" };
    }
    if (inviteCode.expiresAt && inviteCode.expiresAt < new Date()) {
      return { error: "Invite code has expired" };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Redeem invite code if provided
      if (data.inviteCode) {
        const code = data.inviteCode.toUpperCase().trim();
        await tx.inviteCode.update({
          where: { code },
          data: { uses: { increment: 1 } },
        });
        await tx.user.update({
          where: { id: session.user.id },
          data: { usedInviteCodeId: (await tx.inviteCode.findUnique({ where: { code } }))!.id },
        });
      }

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

    notifyMemberJoined({ gamertag: data.gamertag.trim() });
    return { success: true };
  } catch {
    return { error: "Failed to save profile" };
  }
}
