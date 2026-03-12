"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

// ─── Invite Codes ────────────────────────────────────────────────────

function generateCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase(); // e.g. "A3F1B2C4"
}

export async function createInviteCode(data: {
  label?: string;
  maxUses: number;
  expiresInDays?: number;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return { error: "Admin only" };

  const code = generateCode();
  const expiresAt = data.expiresInDays
    ? new Date(Date.now() + data.expiresInDays * 86400000)
    : null;

  const inviteCode = await prisma.inviteCode.create({
    data: {
      code,
      label: data.label || null,
      maxUses: data.maxUses,
      expiresAt,
      createdById: session.user.id,
    },
  });

  revalidatePath("/admin");
  return { success: true, code: inviteCode.code };
}

export async function getInviteCodes() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return { error: "Admin only" };

  const codes = await prisma.inviteCode.findMany({
    include: {
      createdBy: { select: { name: true, gamertag: true } },
      usedBy: { select: { id: true, name: true, gamertag: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return { codes };
}

export async function toggleInviteCode(id: string, isActive: boolean) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return { error: "Admin only" };

  await prisma.inviteCode.update({
    where: { id },
    data: { isActive },
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function deleteInviteCode(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return { error: "Admin only" };

  await prisma.inviteCode.delete({ where: { id } });
  revalidatePath("/admin");
  return { success: true };
}

export async function validateInviteCode(code: string) {
  const inviteCode = await prisma.inviteCode.findUnique({
    where: { code: code.toUpperCase().trim() },
  });

  if (!inviteCode) return { valid: false, error: "Invalid invite code" };
  if (!inviteCode.isActive) return { valid: false, error: "This code has been deactivated" };
  if (inviteCode.uses >= inviteCode.maxUses) return { valid: false, error: "This code has been fully redeemed" };
  if (inviteCode.expiresAt && inviteCode.expiresAt < new Date()) return { valid: false, error: "This code has expired" };

  return { valid: true, codeId: inviteCode.id };
}

export async function redeemInviteCode(code: string, userId: string) {
  const validation = await validateInviteCode(code);
  if (!validation.valid) return { error: validation.error };

  await prisma.$transaction([
    prisma.inviteCode.update({
      where: { code: code.toUpperCase().trim() },
      data: { uses: { increment: 1 } },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { usedInviteCodeId: validation.codeId },
    }),
  ]);

  return { success: true };
}

// ─── Approval Queue ──────────────────────────────────────────────────

export async function getPendingUsers() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return { error: "Admin only" };

  const users = await prisma.user.findMany({
    where: { approvalStatus: "pending" },
    select: {
      id: true,
      name: true,
      avatar: true,
      discordId: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return { users };
}

export async function approveUser(userId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return { error: "Admin only" };

  await prisma.user.update({
    where: { id: userId },
    data: { approvalStatus: "approved" },
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function rejectUser(userId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return { error: "Admin only" };

  await prisma.user.update({
    where: { id: userId },
    data: { approvalStatus: "rejected" },
  });

  revalidatePath("/admin");
  return { success: true };
}
