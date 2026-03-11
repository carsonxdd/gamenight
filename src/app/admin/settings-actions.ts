"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSiteSettings() {
  let settings = await prisma.siteSettings.findUnique({
    where: { id: "singleton" },
  });

  if (!settings) {
    // Create with defaults
    settings = await prisma.siteSettings.create({
      data: { id: "singleton" },
    });
  }

  return settings;
}

export async function updateSiteSettings(data: {
  primeStartHour?: number;
  primeEndHour?: number;
  extendedStartHour?: number;
  extendedEndHour?: number;
  anchorTimezone?: string;
  defaultEventDuration?: number;
  maxEventsPerWeek?: number;
  maxPollsPerWeek?: number;
  communityName?: string;
  motd?: string | null;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return { error: "Admin only" };
  }

  try {
    // Validate time windows
    if (data.primeStartHour !== undefined && data.primeEndHour !== undefined) {
      if (data.primeStartHour >= data.primeEndHour) {
        return { error: "Prime start must be before prime end" };
      }
    }
    if (data.extendedStartHour !== undefined && data.extendedEndHour !== undefined) {
      if (data.extendedStartHour >= data.extendedEndHour) {
        return { error: "Extended start must be before extended end" };
      }
    }
    if (data.extendedStartHour !== undefined && data.primeStartHour !== undefined) {
      if (data.extendedStartHour > data.primeStartHour) {
        return { error: "Extended start must be before or equal to prime start" };
      }
    }
    if (data.extendedEndHour !== undefined && data.primeEndHour !== undefined) {
      if (data.extendedEndHour < data.primeEndHour) {
        return { error: "Extended end must be after or equal to prime end" };
      }
    }

    await prisma.siteSettings.upsert({
      where: { id: "singleton" },
      update: data,
      create: { id: "singleton", ...data },
    });

    revalidatePath("/admin");
    revalidatePath("/profile");
    revalidatePath("/signup");
    revalidatePath("/members");
    return { success: true };
  } catch {
    return { error: "Failed to update settings" };
  }
}
