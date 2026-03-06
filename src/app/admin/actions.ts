"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

    await prisma.user.update({ where: { id: userId }, data });
    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { error: "Failed to update role" };
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
    return { success: true };
  } catch {
    return { error: "Failed to remove user" };
  }
}
