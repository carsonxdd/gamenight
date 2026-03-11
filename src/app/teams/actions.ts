"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { TAG_REGEX, TEAM_LIMITS, getTeamSizeLimits } from "@/lib/team-constants";

// ─── Create Team ─────────────────────────────────────────────────────

export async function createTeam(data: {
  name: string;
  tag: string;
  game: string;
  bio?: string;
  avatarUrl?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Not authenticated" };

  const isAdminOrMod = session.user.isAdmin || session.user.isModerator || session.user.isOwner;

  const name = data.name?.trim();
  if (!name || name.length > TEAM_LIMITS.NAME_MAX) {
    return { error: `Team name is required and must be under ${TEAM_LIMITS.NAME_MAX} characters` };
  }

  const tag = data.tag?.trim().toUpperCase();
  if (!tag || !TAG_REGEX.test(tag)) {
    return { error: "Tag must be 3–5 alphanumeric characters" };
  }

  if (data.bio && data.bio.length > TEAM_LIMITS.BIO_MAX) {
    return { error: `Bio must be under ${TEAM_LIMITS.BIO_MAX} characters` };
  }

  // Check tag uniqueness
  const existingTag = await prisma.team.findUnique({ where: { tag } });
  if (existingTag) {
    return { error: `Tag "${tag}" is already taken` };
  }

  // Rate limit: max teams created per user
  if (!isAdminOrMod) {
    const teamCount = await prisma.team.count({
      where: { captainId: session.user.id },
    });
    if (teamCount >= TEAM_LIMITS.MAX_TEAMS_CREATED_PER_USER) {
      return { error: `You can only create up to ${TEAM_LIMITS.MAX_TEAMS_CREATED_PER_USER} teams` };
    }
  }

  // Check if user already has a team for this game
  const existingMembership = await prisma.teamMember.findFirst({
    where: {
      userId: session.user.id,
      team: { game: data.game, isActive: true },
    },
  });
  if (existingMembership) {
    return { error: `You are already on a team for ${data.game}` };
  }

  const { minSize, maxSize } = getTeamSizeLimits(data.game);

  try {
    const team = await prisma.team.create({
      data: {
        name,
        tag,
        game: data.game,
        captainId: session.user.id,
        bio: data.bio?.trim() || null,
        avatarUrl: data.avatarUrl?.trim() || null,
        minSize,
        maxSize,
        members: {
          create: {
            userId: session.user.id,
            role: "captain",
          },
        },
      },
    });

    revalidatePath("/teams");
    return { success: true, id: team.id };
  } catch {
    return { error: "Failed to create team" };
  }
}

// ─── Update Team ─────────────────────────────────────────────────────

export async function updateTeam(data: {
  teamId: string;
  name?: string;
  tag?: string;
  bio?: string;
  avatarUrl?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Not authenticated" };

  const team = await prisma.team.findUnique({ where: { id: data.teamId } });
  if (!team) return { error: "Team not found" };

  const isAdminOrMod = session.user.isAdmin || session.user.isModerator || session.user.isOwner;
  if (team.captainId !== session.user.id && !isAdminOrMod) {
    return { error: "Only the captain or an admin can edit this team" };
  }

  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) {
    const name = data.name.trim();
    if (!name || name.length > TEAM_LIMITS.NAME_MAX) {
      return { error: `Name must be under ${TEAM_LIMITS.NAME_MAX} characters` };
    }
    updateData.name = name;
  }

  if (data.tag !== undefined) {
    const tag = data.tag.trim().toUpperCase();
    if (!TAG_REGEX.test(tag)) {
      return { error: "Tag must be 3–5 alphanumeric characters" };
    }
    if (tag !== team.tag) {
      const existing = await prisma.team.findUnique({ where: { tag } });
      if (existing) return { error: `Tag "${tag}" is already taken` };
    }
    updateData.tag = tag;
  }

  if (data.bio !== undefined) {
    if (data.bio.length > TEAM_LIMITS.BIO_MAX) {
      return { error: `Bio must be under ${TEAM_LIMITS.BIO_MAX} characters` };
    }
    updateData.bio = data.bio.trim() || null;
  }

  if (data.avatarUrl !== undefined) {
    updateData.avatarUrl = data.avatarUrl.trim() || null;
  }

  try {
    await prisma.team.update({ where: { id: data.teamId }, data: updateData });
    revalidatePath("/teams");
    revalidatePath(`/teams/${data.teamId}`);
    return { success: true };
  } catch {
    return { error: "Failed to update team" };
  }
}

// ─── Disband Team ────────────────────────────────────────────────────

export async function disbandTeam(teamId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Not authenticated" };

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return { error: "Team not found" };

  const isAdminOrMod = session.user.isAdmin || session.user.isModerator || session.user.isOwner;
  if (team.captainId !== session.user.id && !isAdminOrMod) {
    return { error: "Only the captain or an admin can disband this team" };
  }

  try {
    await prisma.team.update({
      where: { id: teamId },
      data: { isActive: false },
    });
    revalidatePath("/teams");
    revalidatePath(`/teams/${teamId}`);
    return { success: true };
  } catch {
    return { error: "Failed to disband team" };
  }
}

// ─── Transfer Captaincy ──────────────────────────────────────────────

export async function transferCaptaincy(teamId: string, newCaptainId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Not authenticated" };

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: true },
  });
  if (!team) return { error: "Team not found" };

  const isAdminOrMod = session.user.isAdmin || session.user.isModerator || session.user.isOwner;
  if (team.captainId !== session.user.id && !isAdminOrMod) {
    return { error: "Only the captain or an admin can transfer captaincy" };
  }

  const newCaptainMember = team.members.find((m) => m.userId === newCaptainId);
  if (!newCaptainMember) return { error: "New captain must be a team member" };

  try {
    await prisma.$transaction([
      // Update team captain
      prisma.team.update({
        where: { id: teamId },
        data: { captainId: newCaptainId },
      }),
      // Update new captain's role
      prisma.teamMember.update({
        where: { id: newCaptainMember.id },
        data: { role: "captain" },
      }),
      // Demote old captain to member
      prisma.teamMember.updateMany({
        where: { teamId, userId: session.user.id, role: "captain" },
        data: { role: "member" },
      }),
    ]);

    revalidatePath("/teams");
    revalidatePath(`/teams/${teamId}`);
    return { success: true };
  } catch {
    return { error: "Failed to transfer captaincy" };
  }
}

// ─── Invite Member ───────────────────────────────────────────────────

export async function inviteMember(teamId: string, invitedUserId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Not authenticated" };

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: true },
  });
  if (!team || !team.isActive) return { error: "Team not found" };

  // Only captain, co_captain, or admin can invite
  const myMembership = team.members.find((m) => m.userId === session.user.id);
  const isAdminOrMod = session.user.isAdmin || session.user.isModerator || session.user.isOwner;
  if (!isAdminOrMod && (!myMembership || !["captain", "co_captain"].includes(myMembership.role))) {
    return { error: "Only captains or co-captains can invite members" };
  }

  // Check roster size
  if (team.members.length >= team.maxSize) {
    return { error: "Team roster is full" };
  }

  // Check if already a member
  if (team.members.some((m) => m.userId === invitedUserId)) {
    return { error: "This player is already on the team" };
  }

  // Check one-team-per-game constraint
  const existingMembership = await prisma.teamMember.findFirst({
    where: {
      userId: invitedUserId,
      team: { game: team.game, isActive: true },
    },
  });
  if (existingMembership) {
    return { error: `This player is already on a team for ${team.game}` };
  }

  // Check for pending invite
  const existingInvite = await prisma.teamInvite.findFirst({
    where: { teamId, invitedUserId, status: "pending" },
  });
  if (existingInvite) {
    return { error: "This player already has a pending invite" };
  }

  try {
    await prisma.teamInvite.create({
      data: {
        teamId,
        invitedUserId,
        invitedByUserId: session.user.id,
      },
    });
    revalidatePath("/teams");
    revalidatePath(`/teams/${teamId}`);
    return { success: true };
  } catch {
    return { error: "Failed to send invite" };
  }
}

// ─── Respond to Invite ───────────────────────────────────────────────

export async function respondToInvite(inviteId: string, accept: boolean) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Not authenticated" };

  const invite = await prisma.teamInvite.findUnique({
    where: { id: inviteId },
    include: { team: { include: { members: true } } },
  });
  if (!invite || invite.status !== "pending") return { error: "Invite not found or already responded" };
  if (invite.invitedUserId !== session.user.id) return { error: "This invite is not for you" };

  // Check expiry (7 days)
  const expiryDate = new Date(invite.createdAt);
  expiryDate.setDate(expiryDate.getDate() + 7);
  if (new Date() > expiryDate) {
    await prisma.teamInvite.update({
      where: { id: inviteId },
      data: { status: "expired", respondedAt: new Date() },
    });
    return { error: "This invite has expired" };
  }

  if (!accept) {
    await prisma.teamInvite.update({
      where: { id: inviteId },
      data: { status: "declined", respondedAt: new Date() },
    });
    revalidatePath("/teams");
    return { success: true };
  }

  // Accept: check one-team-per-game and roster size
  const existingMembership = await prisma.teamMember.findFirst({
    where: {
      userId: session.user.id,
      team: { game: invite.team.game, isActive: true },
    },
  });
  if (existingMembership) {
    return { error: `You are already on a team for ${invite.team.game}` };
  }

  if (invite.team.members.length >= invite.team.maxSize) {
    return { error: "Team roster is full" };
  }

  try {
    await prisma.$transaction([
      prisma.teamInvite.update({
        where: { id: inviteId },
        data: { status: "accepted", respondedAt: new Date() },
      }),
      prisma.teamMember.create({
        data: {
          teamId: invite.teamId,
          userId: session.user.id,
          role: "member",
        },
      }),
    ]);
    revalidatePath("/teams");
    revalidatePath(`/teams/${invite.teamId}`);
    return { success: true };
  } catch {
    return { error: "Failed to accept invite" };
  }
}

// ─── Remove Member ───────────────────────────────────────────────────

export async function removeMember(teamId: string, userId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Not authenticated" };

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: true },
  });
  if (!team) return { error: "Team not found" };

  const isAdminOrMod = session.user.isAdmin || session.user.isModerator || session.user.isOwner;
  if (team.captainId !== session.user.id && !isAdminOrMod) {
    return { error: "Only the captain or an admin can remove members" };
  }

  if (userId === team.captainId) {
    return { error: "Cannot remove the captain. Transfer captaincy first." };
  }

  const member = team.members.find((m) => m.userId === userId);
  if (!member) return { error: "Member not found" };

  try {
    await prisma.teamMember.delete({ where: { id: member.id } });
    revalidatePath("/teams");
    revalidatePath(`/teams/${teamId}`);
    return { success: true };
  } catch {
    return { error: "Failed to remove member" };
  }
}

// ─── Leave Team ──────────────────────────────────────────────────────

export async function leaveTeam(teamId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Not authenticated" };

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return { error: "Team not found" };

  if (team.captainId === session.user.id) {
    return { error: "Captain cannot leave. Transfer captaincy first or disband the team." };
  }

  const member = await prisma.teamMember.findFirst({
    where: { teamId, userId: session.user.id },
  });
  if (!member) return { error: "You are not on this team" };

  try {
    await prisma.teamMember.delete({ where: { id: member.id } });
    revalidatePath("/teams");
    revalidatePath(`/teams/${teamId}`);
    return { success: true };
  } catch {
    return { error: "Failed to leave team" };
  }
}

// ─── Update Member Role ──────────────────────────────────────────────

export async function updateMemberRole(teamId: string, userId: string, role: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Not authenticated" };

  if (!["co_captain", "member", "sub"].includes(role)) {
    return { error: "Invalid role" };
  }

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return { error: "Team not found" };

  const isAdminOrMod = session.user.isAdmin || session.user.isModerator || session.user.isOwner;
  if (team.captainId !== session.user.id && !isAdminOrMod) {
    return { error: "Only the captain or an admin can change roles" };
  }

  if (userId === team.captainId) {
    return { error: "Cannot change captain's role. Use transfer captaincy instead." };
  }

  const member = await prisma.teamMember.findFirst({
    where: { teamId, userId },
  });
  if (!member) return { error: "Member not found" };

  try {
    await prisma.teamMember.update({
      where: { id: member.id },
      data: { role },
    });
    revalidatePath(`/teams/${teamId}`);
    return { success: true };
  } catch {
    return { error: "Failed to update role" };
  }
}

// ─── Get Pending Invites ─────────────────────────────────────────────

export async function getMyPendingInvites() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Not authenticated" };

  const invites = await prisma.teamInvite.findMany({
    where: {
      invitedUserId: session.user.id,
      status: "pending",
    },
    include: {
      team: { select: { id: true, name: true, tag: true, game: true, avatarUrl: true } },
      invitedBy: { select: { id: true, name: true, gamertag: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Auto-expire old invites
  const now = new Date();
  const active = [];
  for (const invite of invites) {
    const expiryDate = new Date(invite.createdAt);
    expiryDate.setDate(expiryDate.getDate() + 7);
    if (now > expiryDate) {
      await prisma.teamInvite.update({
        where: { id: invite.id },
        data: { status: "expired" },
      });
    } else {
      active.push(invite);
    }
  }

  return { invites: active };
}

// ─── Check Tag Availability ──────────────────────────────────────────

export async function checkTagAvailability(tag: string) {
  const normalized = tag.trim().toUpperCase();
  if (!TAG_REGEX.test(normalized)) {
    return { available: false, error: "Tag must be 3–5 alphanumeric characters" };
  }
  const existing = await prisma.team.findUnique({ where: { tag: normalized } });
  return { available: !existing };
}
