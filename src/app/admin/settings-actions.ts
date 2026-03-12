"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { SiteSettingsData } from "@/lib/settings-constants";

export async function getSiteSettings(): Promise<SiteSettingsData> {
  let settings = await prisma.siteSettings.findUnique({
    where: { id: "singleton" },
  });

  if (!settings) {
    settings = await prisma.siteSettings.create({
      data: { id: "singleton" },
    });
  }

  return settings as SiteSettingsData;
}

export async function updateSiteSettings(data: Partial<SiteSettingsData>) {
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

    // Validate numeric ranges
    if (data.maxAttendeesDefault !== undefined && data.maxAttendeesDefault < 0) {
      return { error: "Max attendees cannot be negative" };
    }
    if (data.autoArchiveDays !== undefined && (data.autoArchiveDays < 1 || data.autoArchiveDays > 365)) {
      return { error: "Auto-archive days must be between 1 and 365" };
    }
    if (data.maxTournamentSize !== undefined && (data.maxTournamentSize < 2 || data.maxTournamentSize > 128)) {
      return { error: "Max tournament size must be between 2 and 128" };
    }
    if (data.maxTeamsPerUser !== undefined && (data.maxTeamsPerUser < 1 || data.maxTeamsPerUser > 20)) {
      return { error: "Max teams per user must be between 1 and 20" };
    }
    if (data.maxTeamSize !== undefined && (data.maxTeamSize < 2 || data.maxTeamSize > 50)) {
      return { error: "Max team size must be between 2 and 50" };
    }

    // Validate join mode
    if (data.joinMode && !["open", "invite_only", "approval"].includes(data.joinMode)) {
      return { error: "Invalid join mode" };
    }

    // Validate accent color format
    if (data.accentColor && !/^#[0-9a-fA-F]{6}$/.test(data.accentColor)) {
      return { error: "Invalid accent color format" };
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
    revalidatePath("/");
    revalidatePath("/schedule");
    revalidatePath("/polls");
    revalidatePath("/teams");
    revalidatePath("/highlights");
    return { success: true };
  } catch {
    return { error: "Failed to update settings" };
  }
}
