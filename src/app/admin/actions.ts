"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleAdmin(userId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return { error: "Admin only" };
  }
  if (session.user.id === userId) {
    return { error: "Cannot change your own admin status" };
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { error: "User not found" };

    await prisma.user.update({
      where: { id: userId },
      data: { isAdmin: !user.isAdmin },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { error: "Failed to update admin status" };
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
