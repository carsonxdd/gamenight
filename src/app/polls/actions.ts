"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { POLL_LIMITS } from "@/lib/constants";
import { getSiteSettings } from "@/app/admin/settings-actions";

export async function createPoll(data: {
  title: string;
  description?: string;
  game?: string;
  multiSelect: boolean;
  options: string[];
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const title = data.title.trim();
  const description = data.description?.trim() || null;
  const options = data.options.map((o) => o.trim()).filter(Boolean);

  if (!title) return { error: "Title is required" };
  if (title.length > POLL_LIMITS.TITLE_MAX) {
    return { error: `Title must be ${POLL_LIMITS.TITLE_MAX} characters or less` };
  }
  if (description && description.length > POLL_LIMITS.DESCRIPTION_MAX) {
    return { error: `Description must be ${POLL_LIMITS.DESCRIPTION_MAX} characters or less` };
  }
  if (options.length < POLL_LIMITS.MIN_OPTIONS) {
    return { error: `At least ${POLL_LIMITS.MIN_OPTIONS} options required` };
  }
  if (options.length > POLL_LIMITS.MAX_OPTIONS) {
    return { error: `Maximum ${POLL_LIMITS.MAX_OPTIONS} options allowed` };
  }
  for (const opt of options) {
    if (opt.length > POLL_LIMITS.OPTION_MAX) {
      return { error: `Option "${opt.slice(0, 20)}..." is too long (max ${POLL_LIMITS.OPTION_MAX} chars)` };
    }
  }

  const isAdminOrMod = session.user.isAdmin || session.user.isModerator;

  // Check allowMemberPolls setting
  if (!isAdminOrMod) {
    const settings = await getSiteSettings();
    if (!settings.allowMemberPolls) {
      return { error: "Only admins can create polls" };
    }
  }

  if (!isAdminOrMod) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentCount = await prisma.poll.count({
      where: {
        createdById: session.user.id,
        createdAt: { gte: weekAgo },
      },
    });
    if (recentCount >= POLL_LIMITS.MAX_POLLS_PER_WEEK) {
      return { error: `Maximum ${POLL_LIMITS.MAX_POLLS_PER_WEEK} polls per week` };
    }
  }

  try {
    await prisma.poll.create({
      data: {
        title,
        description,
        game: data.game || null,
        multiSelect: data.multiSelect,
        createdById: session.user.id,
        options: {
          create: options.map((label) => ({ label })),
        },
      },
    });
    revalidatePath("/polls");
    return { success: true };
  } catch {
    return { error: "Failed to create poll" };
  }
}

export async function votePoll(pollId: string, optionIds: string[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    select: { status: true, multiSelect: true },
  });
  if (!poll) return { error: "Poll not found" };
  if (poll.status !== "active") return { error: "Poll is closed" };

  if (!poll.multiSelect && optionIds.length > 1) {
    return { error: "Only one option allowed" };
  }
  if (optionIds.length === 0) {
    return { error: "Select at least one option" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Remove existing votes for this user on this poll
      await tx.pollVote.deleteMany({
        where: { pollId, userId: session.user.id },
      });
      // Create new votes
      await tx.pollVote.createMany({
        data: optionIds.map((optionId) => ({
          pollId,
          optionId,
          userId: session.user.id,
        })),
      });
    });
    revalidatePath("/polls");
    return { success: true };
  } catch {
    return { error: "Failed to vote" };
  }
}

export async function addComment(pollId: string, text: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const settings = await getSiteSettings();
  if (!settings.allowPollComments) {
    return { error: "Comments are disabled" };
  }

  const trimmed = text.trim();
  if (!trimmed) return { error: "Comment cannot be empty" };
  if (trimmed.length > POLL_LIMITS.COMMENT_MAX) {
    return { error: `Comment must be ${POLL_LIMITS.COMMENT_MAX} characters or less` };
  }

  try {
    await prisma.pollComment.create({
      data: {
        pollId,
        userId: session.user.id,
        text: trimmed,
      },
    });
    revalidatePath("/polls");
    return { success: true };
  } catch {
    return { error: "Failed to add comment" };
  }
}

export async function closePoll(pollId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const poll = await prisma.poll.findUnique({ where: { id: pollId } });
  if (!poll) return { error: "Poll not found" };

  const isAdminOrMod = session.user.isAdmin || session.user.isModerator;
  if (poll.createdById !== session.user.id && !isAdminOrMod) {
    return { error: "Not authorized" };
  }

  try {
    await prisma.poll.update({
      where: { id: pollId },
      data: { status: "closed", closedAt: new Date() },
    });
    revalidatePath("/polls");
    return { success: true };
  } catch {
    return { error: "Failed to close poll" };
  }
}

export async function deletePoll(pollId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const poll = await prisma.poll.findUnique({ where: { id: pollId } });
  if (!poll) return { error: "Poll not found" };

  const isAdminOrMod = session.user.isAdmin || session.user.isModerator;
  if (poll.createdById !== session.user.id && !isAdminOrMod) {
    return { error: "Not authorized" };
  }

  try {
    await prisma.poll.delete({ where: { id: pollId } });
    revalidatePath("/polls");
    return { success: true };
  } catch {
    return { error: "Failed to delete poll" };
  }
}

export async function togglePin(pollId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin && !session?.user?.isModerator) {
    return { error: "Admin or moderator only" };
  }

  const poll = await prisma.poll.findUnique({ where: { id: pollId } });
  if (!poll) return { error: "Poll not found" };

  try {
    await prisma.poll.update({
      where: { id: pollId },
      data: { pinned: !poll.pinned },
    });
    revalidatePath("/polls");
    return { success: true };
  } catch {
    return { error: "Failed to toggle pin" };
  }
}

export async function deleteComment(commentId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const comment = await prisma.pollComment.findUnique({ where: { id: commentId } });
  if (!comment) return { error: "Comment not found" };

  const isAdminOrMod = session.user.isAdmin || session.user.isModerator;
  if (comment.userId !== session.user.id && !isAdminOrMod) {
    return { error: "Not authorized" };
  }

  try {
    await prisma.pollComment.delete({ where: { id: commentId } });
    revalidatePath("/polls");
    return { success: true };
  } catch {
    return { error: "Failed to delete comment" };
  }
}
