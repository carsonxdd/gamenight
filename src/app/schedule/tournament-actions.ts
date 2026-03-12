"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { TOURNAMENT_LIMITS } from "@/lib/tournament-constants";
import { getSiteSettings } from "@/app/admin/settings-actions";
import {
  seedEntrants,
  generateSingleElimMatches,
  generateDoubleElimMatches,
  generateRoundRobinMatches,
  generateSwissRound1Matches,
  generateConstellationMatches,
  generateFFARounds,
  type BracketEntrant,
} from "@/lib/bracket-utils";

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// Helper: fetch team tags for a set of user IDs for a specific game
async function getTeamTagsForGame(userIds: string[], game: string): Promise<Record<string, string>> {
  if (userIds.length === 0) return {};
  const memberships = await prisma.teamMember.findMany({
    where: {
      userId: { in: userIds },
      team: { game, isActive: true },
    },
    select: { userId: true, team: { select: { tag: true } } },
  });
  const tagMap: Record<string, string> = {};
  for (const m of memberships) {
    tagMap[m.userId] = m.team.tag;
  }
  return tagMap;
}

// Helper: format display name with team tag
function displayNameWithTag(name: string, tag?: string): string {
  return tag ? `[${tag}] ${name}` : name;
}

// ─── Create Tournament ───────────────────────────────────────────────

export async function createTournament(data: {
  title: string;
  description?: string;
  game: string;
  bracketType: string;
  format: string;
  teamSize?: number;
  bestOf: number;
  maxSlots: number;
  seedingMode: string;
  captainMode?: string;
  buyIn?: number;
  isMultiSession: boolean;
  sessions?: { label: string; date: string }[];
  participantIds?: string[];
  templateId?: string;
  saveAsTemplate?: boolean;
  templateName?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const isAdminOrMod =
    session.user.isAdmin || session.user.isModerator || session.user.isOwner;

  const settings = await getSiteSettings();

  // Check allowMemberTournaments setting
  if (!isAdminOrMod && !settings.allowMemberTournaments) {
    return { error: "Only admins can create tournaments" };
  }

  // Validation
  const title = data.title?.trim();
  if (!title || title.length > TOURNAMENT_LIMITS.TITLE_MAX) {
    return { error: `Title is required and must be under ${TOURNAMENT_LIMITS.TITLE_MAX} characters` };
  }
  if (data.description && data.description.length > TOURNAMENT_LIMITS.DESCRIPTION_MAX) {
    return { error: `Description must be under ${TOURNAMENT_LIMITS.DESCRIPTION_MAX} characters` };
  }
  const maxSlotsCap = settings.maxTournamentSize || TOURNAMENT_LIMITS.MAX_SLOTS;
  if (data.maxSlots < TOURNAMENT_LIMITS.MIN_SLOTS || data.maxSlots > maxSlotsCap) {
    return { error: `Slots must be between ${TOURNAMENT_LIMITS.MIN_SLOTS} and ${maxSlotsCap}` };
  }

  // Strip buy-in if disabled
  if (!settings.enableBuyIns) {
    data.buyIn = undefined;
  }

  // Rate limit for non-admins
  if (!isAdminOrMod) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentCount = await prisma.tournament.count({
      where: {
        createdById: session.user.id,
        createdAt: { gte: weekAgo },
      },
    });
    if (recentCount >= TOURNAMENT_LIMITS.MAX_TOURNAMENTS_PER_WEEK) {
      return { error: `Maximum ${TOURNAMENT_LIMITS.MAX_TOURNAMENTS_PER_WEEK} tournaments per week` };
    }
  }

  try {
    const tournament = await prisma.tournament.create({
      data: {
        title,
        description: data.description?.trim() || null,
        game: data.game,
        bracketType: data.bracketType,
        format: data.format,
        teamSize: data.format === "team" ? data.teamSize : null,
        bestOf: data.bestOf,
        maxSlots: data.maxSlots,
        seedingMode: data.seedingMode,
        captainMode: data.format === "team" ? data.captainMode : null,
        buyIn: data.buyIn || null,
        isMultiSession: data.isMultiSession,
        createdById: session.user.id,
        status: "draft",
      },
    });

    // Create sessions if multi-session
    if (data.isMultiSession && data.sessions && data.sessions.length > 0) {
      await prisma.tournamentSession.createMany({
        data: data.sessions.map((s, i) => ({
          tournamentId: tournament.id,
          label: s.label,
          date: parseLocalDate(s.date),
          orderIndex: i,
        })),
      });
    }

    // Add participants as entrants (solo format)
    if (data.participantIds && data.participantIds.length > 0 && data.format === "solo") {
      const users = await prisma.user.findMany({
        where: { id: { in: data.participantIds } },
        select: { id: true, gamertag: true, name: true },
      });

      const tagMap = await getTeamTagsForGame(data.participantIds, data.game);

      await prisma.tournamentEntrant.createMany({
        data: users.map((u) => ({
          tournamentId: tournament.id,
          type: "solo",
          userId: u.id,
          displayName: displayNameWithTag(u.gamertag || u.name, tagMap[u.id]),
        })),
      });
    }

    // Save template if requested
    if (data.saveAsTemplate && data.templateName) {
      await prisma.tournamentTemplate.create({
        data: {
          name: data.templateName.trim(),
          bracketType: data.bracketType,
          format: data.format,
          teamSize: data.format === "team" ? data.teamSize : null,
          bestOf: data.bestOf,
          seedingMode: data.seedingMode,
          captainMode: data.format === "team" ? data.captainMode : null,
          createdById: session.user.id,
        },
      });
    }

    revalidatePath("/schedule");
    return { success: true, tournamentId: tournament.id };
  } catch {
    return { error: "Failed to create tournament" };
  }
}

// ─── Update Tournament Status ────────────────────────────────────────

export async function updateTournamentStatus(tournamentId: string, status: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { createdById: true, status: true },
  });
  if (!tournament) return { error: "Tournament not found" };

  const isAdminOrMod =
    session.user.isAdmin || session.user.isModerator || session.user.isOwner;
  if (tournament.createdById !== session.user.id && !isAdminOrMod) {
    return { error: "Not authorized" };
  }

  // Validate status transitions
  const validTransitions: Record<string, string[]> = {
    draft: ["open", "archived"],
    open: ["in_progress", "archived"],
    in_progress: ["completed"],
    completed: ["archived"],
  };
  if (!validTransitions[tournament.status]?.includes(status)) {
    return { error: `Cannot transition from ${tournament.status} to ${status}` };
  }

  try {
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status },
    });

    revalidatePath("/schedule");
    return { success: true };
  } catch {
    return { error: "Failed to update tournament status" };
  }
}

// ─── Generate Bracket ────────────────────────────────────────────────

export async function generateBracket(tournamentId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      entrants: true,
    },
  });
  if (!tournament) return { error: "Tournament not found" };

  const isAdminOrMod =
    session.user.isAdmin || session.user.isModerator || session.user.isOwner;
  if (tournament.createdById !== session.user.id && !isAdminOrMod) {
    return { error: "Not authorized" };
  }

  if (tournament.entrants.length < 2) {
    return { error: "Need at least 2 entrants to generate a bracket" };
  }

  // Get rank data for seeding
  const userIds = tournament.entrants
    .filter((e) => e.userId)
    .map((e) => e.userId!);
  const ranks = await prisma.userGameRank.findMany({
    where: { userId: { in: userIds }, gameName: tournament.game },
  });
  const rankMap = new Map(ranks.map((r) => [r.userId, r.rank]));

  // Convert to BracketEntrant format with rank values
  const bracketEntrants: BracketEntrant[] = tournament.entrants.map((e) => ({
    id: e.id,
    displayName: e.displayName,
    seed: e.seed,
    rankValue: e.userId ? rankToNumeric(rankMap.get(e.userId)) : 0,
  }));

  // Seed entrants
  const seeded = seedEntrants(
    bracketEntrants,
    tournament.seedingMode as "random" | "ranked" | "random_constrained"
  );

  // Generate matches based on bracket type
  let generatedMatches;
  switch (tournament.bracketType) {
    case "round_robin":
      generatedMatches = generateRoundRobinMatches(seeded.length);
      break;
    case "double_elim":
      generatedMatches = generateDoubleElimMatches(seeded.length);
      break;
    case "swiss":
      generatedMatches = generateSwissRound1Matches(seeded.length);
      break;
    case "constellation":
      generatedMatches = generateConstellationMatches(seeded.length);
      break;
    case "ffa":
      generatedMatches = generateFFARounds(seeded.length);
      break;
    default:
      generatedMatches = generateSingleElimMatches(seeded.length);
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Delete existing matches
      await tx.tournamentMatch.deleteMany({
        where: { tournamentId },
      });

      // Update entrant seeds
      for (const s of seeded) {
        await tx.tournamentEntrant.update({
          where: { id: s.id },
          data: { seed: s.seed },
        });
      }

      // Create matches
      for (const m of generatedMatches) {
        const entrant1 = m.entrant1Index != null ? seeded[m.entrant1Index] : null;
        const entrant2 = m.entrant2Index != null ? seeded[m.entrant2Index] : null;

        await tx.tournamentMatch.create({
          data: {
            tournamentId,
            round: m.round,
            matchNumber: m.matchNumber,
            bracketSide: m.bracketSide || null,
            entrant1Id: entrant1?.id || null,
            entrant2Id: entrant2?.id || null,
            status: m.status,
            // Auto-advance byes
            winnerEntrantId: m.status === "bye" && entrant1 ? entrant1.id : null,
          },
        });
      }

      // Update tournament status to in_progress
      await tx.tournament.update({
        where: { id: tournamentId },
        data: { status: "in_progress" },
      });
    });

    // After transaction, advance bye winners in round 1
    await advanceByeWinners(tournamentId);

    revalidatePath("/schedule");
    return { success: true };
  } catch {
    return { error: "Failed to generate bracket" };
  }
}

// ─── Report Match Result ─────────────────────────────────────────────

export async function reportMatchResult(
  matchId: string,
  data: { winnerId: string; score1: number; score2: number }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    include: {
      tournament: { select: { createdById: true, status: true } },
      entrant1: { select: { id: true, userId: true } },
      entrant2: { select: { id: true, userId: true } },
    },
  });
  if (!match) return { error: "Match not found" };
  if (match.tournament.status !== "in_progress") {
    return { error: "Tournament is not in progress" };
  }
  if (match.status === "completed") {
    return { error: "Match already completed" };
  }

  const isAdminOrMod =
    session.user.isAdmin || session.user.isModerator || session.user.isOwner;
  const isCreator = match.tournament.createdById === session.user.id;
  const isParticipant =
    match.entrant1?.userId === session.user.id ||
    match.entrant2?.userId === session.user.id;

  if (!isAdminOrMod && !isCreator && !isParticipant) {
    return { error: "Not authorized to report this match" };
  }

  // Validate winnerId is one of the entrants
  if (data.winnerId !== match.entrant1Id && data.winnerId !== match.entrant2Id) {
    return { error: "Invalid winner" };
  }

  try {
    if (isAdminOrMod || isCreator) {
      // Admin/host can directly confirm
      await prisma.tournamentMatch.update({
        where: { id: matchId },
        data: {
          winnerEntrantId: data.winnerId,
          score1: data.score1,
          score2: data.score2,
          status: "completed",
          reportedById: session.user.id,
          confirmedById: session.user.id,
        },
      });

      // Score predictions for this match
      await scorePredictions(matchId, data.winnerId);

      // Advance winner to next round
      await advanceWinner(matchId);
    } else {
      // Participant reports — needs confirmation
      await prisma.tournamentMatch.update({
        where: { id: matchId },
        data: {
          winnerEntrantId: data.winnerId,
          score1: data.score1,
          score2: data.score2,
          status: "in_progress", // awaiting confirmation
          reportedById: session.user.id,
        },
      });
    }

    revalidatePath("/schedule");
    return { success: true };
  } catch {
    return { error: "Failed to report result" };
  }
}

// ─── Confirm Match Result ────────────────────────────────────────────

export async function confirmMatchResult(matchId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    include: {
      tournament: { select: { createdById: true } },
      entrant1: { select: { userId: true } },
      entrant2: { select: { userId: true } },
    },
  });
  if (!match) return { error: "Match not found" };
  if (match.status !== "in_progress" || !match.reportedById) {
    return { error: "No result to confirm" };
  }

  const isAdminOrMod =
    session.user.isAdmin || session.user.isModerator || session.user.isOwner;
  const isCreator = match.tournament.createdById === session.user.id;

  // Must be opponent or admin/host
  const isOpponent =
    (match.entrant1?.userId === session.user.id &&
      match.reportedById !== session.user.id) ||
    (match.entrant2?.userId === session.user.id &&
      match.reportedById !== session.user.id);

  if (!isAdminOrMod && !isCreator && !isOpponent) {
    return { error: "Only the opponent or an admin can confirm" };
  }

  try {
    const updatedMatch = await prisma.tournamentMatch.update({
      where: { id: matchId },
      data: {
        status: "completed",
        confirmedById: session.user.id,
      },
    });

    // Score predictions
    if (updatedMatch.winnerEntrantId) {
      await scorePredictions(matchId, updatedMatch.winnerEntrantId);
    }

    await advanceWinner(matchId);

    revalidatePath("/schedule");
    return { success: true };
  } catch {
    return { error: "Failed to confirm result" };
  }
}

// ─── Join Tournament ─────────────────────────────────────────────────

export async function joinTournament(tournamentId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { entrants: true },
  });
  if (!tournament) return { error: "Tournament not found" };
  if (tournament.status !== "open") {
    return { error: "Tournament is not accepting signups" };
  }
  if (tournament.format !== "solo") {
    return { error: "Team tournaments require team assignment" };
  }

  // Check if already entered
  const existing = tournament.entrants.find((e) => e.userId === session.user.id);
  if (existing) return { error: "Already entered" };

  // Check slot limit
  if (tournament.entrants.length >= tournament.maxSlots) {
    return { error: "Tournament is full" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { gamertag: true, name: true },
  });

  const tagMap = await getTeamTagsForGame([session.user.id], tournament.game);
  const tag = tagMap[session.user.id];

  try {
    await prisma.tournamentEntrant.create({
      data: {
        tournamentId,
        type: "solo",
        userId: session.user.id,
        displayName: displayNameWithTag(user?.gamertag || user?.name || "Unknown", tag),
      },
    });

    revalidatePath("/schedule");
    return { success: true };
  } catch {
    return { error: "Failed to join tournament" };
  }
}

// ─── Leave Tournament ────────────────────────────────────────────────

export async function leaveTournament(tournamentId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { status: true },
  });
  if (!tournament) return { error: "Tournament not found" };
  if (tournament.status !== "open" && tournament.status !== "draft") {
    return { error: "Cannot leave a tournament that has started" };
  }

  try {
    await prisma.tournamentEntrant.deleteMany({
      where: {
        tournamentId,
        userId: session.user.id,
      },
    });

    revalidatePath("/schedule");
    return { success: true };
  } catch {
    return { error: "Failed to leave tournament" };
  }
}

// ─── Add Comment ─────────────────────────────────────────────────────

export async function addTournamentComment(tournamentId: string, text: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const trimmed = text.trim();
  if (!trimmed || trimmed.length > TOURNAMENT_LIMITS.COMMENT_MAX) {
    return { error: `Comment must be 1-${TOURNAMENT_LIMITS.COMMENT_MAX} characters` };
  }

  try {
    await prisma.tournamentComment.create({
      data: {
        tournamentId,
        userId: session.user.id,
        text: trimmed,
      },
    });

    revalidatePath("/schedule");
    return { success: true };
  } catch {
    return { error: "Failed to add comment" };
  }
}

// ─── Delete Tournament ───────────────────────────────────────────────

export async function deleteTournament(tournamentId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { createdById: true },
  });
  if (!tournament) return { error: "Tournament not found" };

  const isAdminOrMod =
    session.user.isAdmin || session.user.isModerator || session.user.isOwner;
  if (tournament.createdById !== session.user.id && !isAdminOrMod) {
    return { error: "Not authorized" };
  }

  try {
    await prisma.tournament.delete({ where: { id: tournamentId } });
    revalidatePath("/schedule");
    return { success: true };
  } catch {
    return { error: "Failed to delete tournament" };
  }
}

// ─── Fetch Templates ─────────────────────────────────────────────────

export async function fetchTemplates() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  return prisma.tournamentTemplate.findMany({
    where: { createdById: session.user.id },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Generate Next Swiss Round ───────────────────────────────────────

export async function generateNextSwissRound(tournamentId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      entrants: true,
      matches: {
        orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
      },
    },
  });
  if (!tournament) return { error: "Tournament not found" };

  const isAdminOrMod =
    session.user.isAdmin || session.user.isModerator || session.user.isOwner;
  if (tournament.createdById !== session.user.id && !isAdminOrMod) {
    return { error: "Not authorized" };
  }

  if (tournament.bracketType !== "swiss") {
    return { error: "Not a Swiss tournament" };
  }

  // Check all current round matches are completed
  const currentRound = Math.max(...tournament.matches.map((m) => m.round), 0);
  const pendingInRound = tournament.matches.filter(
    (m) => m.round === currentRound && m.status !== "completed" && m.status !== "bye"
  );
  if (pendingInRound.length > 0) {
    return { error: "Complete all matches in the current round first" };
  }

  // Build standings: W-L record per entrant
  const records = new Map<string, { wins: number; losses: number; opponents: Set<string> }>();
  for (const e of tournament.entrants) {
    records.set(e.id, { wins: 0, losses: 0, opponents: new Set() });
  }

  for (const m of tournament.matches) {
    if (m.status !== "completed" || !m.winnerEntrantId) continue;
    if (m.entrant1Id && m.entrant2Id) {
      const loserId = m.winnerEntrantId === m.entrant1Id ? m.entrant2Id : m.entrant1Id;
      const wr = records.get(m.winnerEntrantId);
      const lr = records.get(loserId);
      if (wr) { wr.wins++; wr.opponents.add(loserId); }
      if (lr) { lr.losses++; lr.opponents.add(m.winnerEntrantId); }
    }
  }

  // Sort entrants by wins descending, then losses ascending
  const sorted = tournament.entrants
    .map((e) => ({ id: e.id, record: records.get(e.id)! }))
    .sort((a, b) => b.record.wins - a.record.wins || a.record.losses - b.record.losses);

  // Pair entrants with similar records, avoiding rematches
  const nextRound = currentRound + 1;
  const paired = new Set<string>();
  const newMatches: { entrant1Id: string; entrant2Id: string }[] = [];

  for (let i = 0; i < sorted.length; i++) {
    if (paired.has(sorted[i].id)) continue;

    for (let j = i + 1; j < sorted.length; j++) {
      if (paired.has(sorted[j].id)) continue;
      // Prefer opponents they haven't faced
      if (!sorted[i].record.opponents.has(sorted[j].id)) {
        newMatches.push({ entrant1Id: sorted[i].id, entrant2Id: sorted[j].id });
        paired.add(sorted[i].id);
        paired.add(sorted[j].id);
        break;
      }
    }

    // If no unpaired opponent without rematch, pair with closest unpaired
    if (!paired.has(sorted[i].id)) {
      for (let j = i + 1; j < sorted.length; j++) {
        if (!paired.has(sorted[j].id)) {
          newMatches.push({ entrant1Id: sorted[i].id, entrant2Id: sorted[j].id });
          paired.add(sorted[i].id);
          paired.add(sorted[j].id);
          break;
        }
      }
    }
  }

  if (newMatches.length === 0) {
    return { error: "No more pairings possible" };
  }

  try {
    await prisma.tournamentMatch.createMany({
      data: newMatches.map((m, i) => ({
        tournamentId,
        round: nextRound,
        matchNumber: i + 1,
        entrant1Id: m.entrant1Id,
        entrant2Id: m.entrant2Id,
        status: "pending",
      })),
    });

    revalidatePath("/schedule");
    return { success: true, round: nextRound };
  } catch {
    return { error: "Failed to generate next round" };
  }
}

// ─── Report FFA Score ────────────────────────────────────────────────

export async function reportFFAScore(
  matchId: string,
  score: number
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    include: {
      tournament: { select: { createdById: true, status: true } },
      entrant1: { select: { userId: true } },
    },
  });
  if (!match) return { error: "Match not found" };
  if (match.tournament.status !== "in_progress") {
    return { error: "Tournament is not in progress" };
  }

  const isAdminOrMod =
    session.user.isAdmin || session.user.isModerator || session.user.isOwner;
  const isCreator = match.tournament.createdById === session.user.id;

  if (!isAdminOrMod && !isCreator) {
    return { error: "Only the tournament creator or admin can report FFA scores" };
  }

  try {
    await prisma.tournamentMatch.update({
      where: { id: matchId },
      data: {
        score1: score,
        status: "completed",
        reportedById: session.user.id,
        confirmedById: session.user.id,
      },
    });

    revalidatePath("/schedule");
    return { success: true };
  } catch {
    return { error: "Failed to report score" };
  }
}

// ─── Submit Predictions (Pick'ems) ───────────────────────────────────

export async function submitPredictions(
  tournamentId: string,
  predictions: { matchId: string; predictedWinnerId: string }[]
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { status: true },
  });
  if (!tournament) return { error: "Tournament not found" };

  // Predictions must be locked before tournament starts
  if (tournament.status === "in_progress" || tournament.status === "completed") {
    return { error: "Predictions are locked — tournament has already started" };
  }
  if (tournament.status !== "open") {
    return { error: "Tournament is not accepting predictions" };
  }

  if (predictions.length === 0) {
    return { error: "No predictions to submit" };
  }

  try {
    // Upsert predictions
    for (const p of predictions) {
      await prisma.tournamentPrediction.upsert({
        where: {
          matchId_userId: {
            matchId: p.matchId,
            userId: session.user.id,
          },
        },
        update: {
          predictedWinnerId: p.predictedWinnerId,
        },
        create: {
          tournamentId,
          userId: session.user.id,
          matchId: p.matchId,
          predictedWinnerId: p.predictedWinnerId,
        },
      });
    }

    revalidatePath("/schedule");
    return { success: true };
  } catch {
    return { error: "Failed to submit predictions" };
  }
}

// ─── Score Predictions (called when match completes) ─────────────────

async function scorePredictions(matchId: string, winnerEntrantId: string) {
  await prisma.tournamentPrediction.updateMany({
    where: { matchId, predictedWinnerId: winnerEntrantId },
    data: { correct: true },
  });
  await prisma.tournamentPrediction.updateMany({
    where: {
      matchId,
      predictedWinnerId: { not: winnerEntrantId },
    },
    data: { correct: false },
  });
}

// ─── Add Players to Team Tournament ──────────────────────────────────

export async function addPlayersToTeamTournament(
  tournamentId: string,
  playerIds: string[]
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { entrants: true },
  });
  if (!tournament) return { error: "Tournament not found" };

  const isAdminOrMod =
    session.user.isAdmin || session.user.isModerator || session.user.isOwner;
  if (tournament.createdById !== session.user.id && !isAdminOrMod) {
    return { error: "Not authorized" };
  }

  if (tournament.format !== "team") {
    return { error: "Not a team tournament" };
  }

  if (!["draft", "open"].includes(tournament.status)) {
    return { error: "Tournament is not accepting players" };
  }

  // Filter out already-added players
  const existingUserIds = new Set(
    tournament.entrants.filter((e) => e.userId).map((e) => e.userId!)
  );
  const newPlayerIds = playerIds.filter((id) => !existingUserIds.has(id));

  if (newPlayerIds.length === 0) {
    return { error: "All selected players are already added" };
  }

  const users = await prisma.user.findMany({
    where: { id: { in: newPlayerIds } },
    select: { id: true, gamertag: true, name: true },
  });

  const tagMap = await getTeamTagsForGame(newPlayerIds, tournament.game);

  try {
    // For team tournaments, entrants are individual players initially
    // They get assigned to teams during the draft
    await prisma.tournamentEntrant.createMany({
      data: users.map((u) => ({
        tournamentId,
        type: "solo", // will be converted to team entrants after draft
        userId: u.id,
        displayName: displayNameWithTag(u.gamertag || u.name, tagMap[u.id]),
      })),
    });

    revalidatePath("/schedule");
    return { success: true };
  } catch {
    return { error: "Failed to add players" };
  }
}

// ─── Start Draft ─────────────────────────────────────────────────────

export async function startDraft(
  tournamentId: string,
  captainIds?: string[]
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      entrants: { include: { user: { select: { id: true, gamertag: true, name: true } } } },
    },
  });
  if (!tournament) return { error: "Tournament not found" };

  const isAdminOrMod =
    session.user.isAdmin || session.user.isModerator || session.user.isOwner;
  if (tournament.createdById !== session.user.id && !isAdminOrMod) {
    return { error: "Not authorized" };
  }

  if (tournament.format !== "team") {
    return { error: "Not a team tournament" };
  }

  const numTeams = tournament.maxSlots; // maxSlots = number of teams for team tournaments
  const minPlayers = numTeams * 2; // at least 2 per team to start

  const playerEntrants = tournament.entrants.filter((e) => e.userId);
  if (playerEntrants.length < minPlayers) {
    return { error: `Need at least ${minPlayers} players for ${numTeams} teams` };
  }

  // Select captains based on mode
  let selectedCaptainIds: string[];
  const captainMode = tournament.captainMode || "random";

  if (captainIds && captainIds.length === numTeams) {
    // Manual override
    selectedCaptainIds = captainIds;
  } else if (captainMode === "manual" && captainIds) {
    selectedCaptainIds = captainIds;
  } else if (captainMode === "ranked") {
    // Get ranks for the game
    const userIds = playerEntrants.map((e) => e.userId!);
    const ranks = await prisma.userGameRank.findMany({
      where: { userId: { in: userIds }, gameName: tournament.game },
    });
    const rankMap = new Map(ranks.map((r) => [r.userId, rankToNumeric(r.rank)]));

    // Sort by rank descending, take top N as captains
    const sorted = [...playerEntrants].sort(
      (a, b) => (rankMap.get(b.userId!) || 0) - (rankMap.get(a.userId!) || 0)
    );
    selectedCaptainIds = sorted.slice(0, numTeams).map((e) => e.userId!);
  } else {
    // Random
    const shuffled = [...playerEntrants].sort(() => Math.random() - 0.5);
    selectedCaptainIds = shuffled.slice(0, numTeams).map((e) => e.userId!);
  }

  if (selectedCaptainIds.length < numTeams) {
    return { error: `Need ${numTeams} captains but only ${selectedCaptainIds.length} selected` };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Create teams with captains
      for (let i = 0; i < selectedCaptainIds.length; i++) {
        const captainId = selectedCaptainIds[i];
        const team = await tx.tournamentTeam.create({
          data: {
            tournamentId,
            name: `Team ${i + 1}`,
            captainId,
          },
        });

        // Add captain as first team member
        await tx.tournamentTeamMember.create({
          data: {
            teamId: team.id,
            userId: captainId,
          },
        });
      }

      // Build snake draft order: 1,2,3,...,N,N,...,3,2,1,1,2,3,...
      const draftOrder: string[] = [];
      const totalPicks = playerEntrants.length - numTeams; // captains already assigned
      const roundCount = Math.ceil(totalPicks / numTeams);

      for (let round = 0; round < roundCount; round++) {
        const order = round % 2 === 0
          ? [...selectedCaptainIds]
          : [...selectedCaptainIds].reverse();
        for (const cid of order) {
          if (draftOrder.length < totalPicks) {
            draftOrder.push(cid);
          }
        }
      }

      // Update tournament with draft state
      await tx.tournament.update({
        where: { id: tournamentId },
        data: {
          draftStatus: "in_progress",
          draftOrder: JSON.stringify(draftOrder),
          currentPickIndex: 0,
        },
      });
    });

    revalidatePath("/schedule");
    return { success: true };
  } catch {
    return { error: "Failed to start draft" };
  }
}

// ─── Make Draft Pick ─────────────────────────────────────────────────

export async function makeDraftPick(
  tournamentId: string,
  pickedUserId: string
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      teams: { include: { members: true } },
      entrants: true,
    },
  });
  if (!tournament) return { error: "Tournament not found" };

  if (tournament.draftStatus !== "in_progress") {
    return { error: "Draft is not in progress" };
  }

  const draftOrder: string[] = JSON.parse(tournament.draftOrder || "[]");
  const pickIndex = tournament.currentPickIndex || 0;

  if (pickIndex >= draftOrder.length) {
    return { error: "Draft is complete" };
  }

  const currentCaptainId = draftOrder[pickIndex];
  const isAdminOrMod =
    session.user.isAdmin || session.user.isModerator || session.user.isOwner;
  const isCreator = tournament.createdById === session.user.id;

  // Only the current captain (or admin/creator) can pick
  if (session.user.id !== currentCaptainId && !isAdminOrMod && !isCreator) {
    return { error: "It's not your turn to pick" };
  }

  // Check the picked player is available (not already on a team)
  const allTeamMembers = new Set(
    tournament.teams.flatMap((t) => t.members.map((m) => m.userId))
  );
  if (allTeamMembers.has(pickedUserId)) {
    return { error: "Player is already on a team" };
  }

  // Verify the player is in the tournament
  const playerEntrant = tournament.entrants.find((e) => e.userId === pickedUserId);
  if (!playerEntrant) {
    return { error: "Player is not in this tournament" };
  }

  // Find the captain's team
  const captainTeam = tournament.teams.find((t) => t.captainId === currentCaptainId);
  if (!captainTeam) {
    return { error: "Captain team not found" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Add player to team
      await tx.tournamentTeamMember.create({
        data: {
          teamId: captainTeam.id,
          userId: pickedUserId,
        },
      });

      const newPickIndex = pickIndex + 1;
      const isDraftComplete = newPickIndex >= draftOrder.length;

      // Update draft state
      await tx.tournament.update({
        where: { id: tournamentId },
        data: {
          currentPickIndex: newPickIndex,
          draftStatus: isDraftComplete ? "completed" : "in_progress",
        },
      });
    });

    // If draft is complete, create team entrants for the bracket
    const newPickIndex = pickIndex + 1;
    if (newPickIndex >= draftOrder.length) {
      await finalizeDraft(tournamentId);
    }

    revalidatePath("/schedule");
    return { success: true };
  } catch {
    return { error: "Failed to make pick" };
  }
}

// ─── Finalize Draft (create team entrants) ───────────────────────────

async function finalizeDraft(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      teams: {
        include: { members: { include: { user: true } } },
      },
    },
  });
  if (!tournament) return;

  // Remove individual player entrants
  await prisma.tournamentEntrant.deleteMany({
    where: { tournamentId },
  });

  // Create team entrants
  for (const team of tournament.teams) {
    await prisma.tournamentEntrant.create({
      data: {
        tournamentId,
        type: "team",
        teamId: team.id,
        displayName: team.name,
      },
    });
  }
}

// ─── Auto-complete Draft ─────────────────────────────────────────────

export async function autoCompleteDraft(tournamentId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      teams: { include: { members: true } },
      entrants: true,
    },
  });
  if (!tournament) return { error: "Tournament not found" };

  const isAdminOrMod =
    session.user.isAdmin || session.user.isModerator || session.user.isOwner;
  if (tournament.createdById !== session.user.id && !isAdminOrMod) {
    return { error: "Not authorized" };
  }

  if (tournament.draftStatus !== "in_progress") {
    return { error: "Draft is not in progress" };
  }

  const draftOrder: string[] = JSON.parse(tournament.draftOrder || "[]");
  let pickIndex = tournament.currentPickIndex || 0;

  // Get all undrafted players
  const allTeamMembers = new Set(
    tournament.teams.flatMap((t) => t.members.map((m) => m.userId))
  );
  const undraftedPlayers = tournament.entrants
    .filter((e) => e.userId && !allTeamMembers.has(e.userId))
    .map((e) => e.userId!);

  // Shuffle undrafted players
  for (let i = undraftedPlayers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [undraftedPlayers[i], undraftedPlayers[j]] = [undraftedPlayers[j], undraftedPlayers[i]];
  }

  try {
    let playerIndex = 0;
    while (pickIndex < draftOrder.length && playerIndex < undraftedPlayers.length) {
      const captainId = draftOrder[pickIndex];
      const captainTeam = tournament.teams.find((t) => t.captainId === captainId);
      if (captainTeam) {
        await prisma.tournamentTeamMember.create({
          data: {
            teamId: captainTeam.id,
            userId: undraftedPlayers[playerIndex],
          },
        });
        playerIndex++;
      }
      pickIndex++;
    }

    await prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        currentPickIndex: pickIndex,
        draftStatus: "completed",
      },
    });

    await finalizeDraft(tournamentId);

    revalidatePath("/schedule");
    return { success: true };
  } catch {
    return { error: "Failed to auto-complete draft" };
  }
}

// ─── Rename Team ─────────────────────────────────────────────────────

export async function renameTeam(teamId: string, name: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const team = await prisma.tournamentTeam.findUnique({
    where: { id: teamId },
    include: { tournament: { select: { createdById: true } } },
  });
  if (!team) return { error: "Team not found" };

  const isAdminOrMod =
    session.user.isAdmin || session.user.isModerator || session.user.isOwner;
  const isCaptain = team.captainId === session.user.id;
  const isCreator = team.tournament.createdById === session.user.id;

  if (!isCaptain && !isCreator && !isAdminOrMod) {
    return { error: "Only the captain can rename the team" };
  }

  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 30) {
    return { error: "Team name must be 1-30 characters" };
  }

  try {
    await prisma.tournamentTeam.update({
      where: { id: teamId },
      data: { name: trimmed },
    });

    // Also update the entrant display name if it exists
    await prisma.tournamentEntrant.updateMany({
      where: { teamId },
      data: { displayName: trimmed },
    });

    revalidatePath("/schedule");
    return { success: true };
  } catch {
    return { error: "Failed to rename team" };
  }
}

// ─── Get Draft State ─────────────────────────────────────────────────

export async function getDraftState(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: {
      draftStatus: true,
      draftOrder: true,
      currentPickIndex: true,
      captainMode: true,
      teamSize: true,
      maxSlots: true,
      game: true,
      createdById: true,
      teams: {
        include: {
          captain: { select: { id: true, name: true, gamertag: true } },
          members: {
            include: {
              user: { select: { id: true, name: true, gamertag: true, avatar: true } },
            },
          },
        },
      },
      entrants: {
        where: { type: "solo" },
        include: {
          user: { select: { id: true, name: true, gamertag: true, avatar: true } },
        },
      },
    },
  });

  if (!tournament) return null;

  const draftOrder: string[] = JSON.parse(tournament.draftOrder || "[]");
  const pickIndex = tournament.currentPickIndex || 0;
  const currentCaptainId = pickIndex < draftOrder.length ? draftOrder[pickIndex] : null;

  // Build available players (not on any team)
  const allTeamMembers = new Set(
    tournament.teams.flatMap((t) => t.members.map((m) => m.userId))
  );
  const availablePlayers = tournament.entrants
    .filter((e) => e.userId && !allTeamMembers.has(e.userId))
    .map((e) => ({
      userId: e.userId!,
      name: e.user?.name || "Unknown",
      gamertag: e.user?.gamertag || null,
      avatar: e.user?.avatar || null,
    }));

  return {
    draftStatus: tournament.draftStatus,
    currentCaptainId,
    currentPickIndex: pickIndex,
    totalPicks: draftOrder.length,
    draftOrder,
    teams: tournament.teams,
    availablePlayers,
    teamSize: tournament.teamSize || 5,
    createdById: tournament.createdById,
  };
}

// ─── Delete Template ─────────────────────────────────────────────────

export async function deleteTemplate(templateId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    await prisma.tournamentTemplate.deleteMany({
      where: { id: templateId, createdById: session.user.id },
    });
    revalidatePath("/schedule");
    return { success: true };
  } catch {
    return { error: "Failed to delete template" };
  }
}

// ─── Helper: advance bye winners to next round ──────────────────────

async function advanceByeWinners(tournamentId: string) {
  const byeMatches = await prisma.tournamentMatch.findMany({
    where: { tournamentId, status: "bye", winnerEntrantId: { not: null } },
  });

  for (const match of byeMatches) {
    await advanceWinnerToNextRound(tournamentId, match.round, match.matchNumber, match.winnerEntrantId!);
  }
}

// ─── Helper: advance match winner ────────────────────────────────────

async function advanceWinner(matchId: string) {
  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    select: {
      tournamentId: true,
      round: true,
      matchNumber: true,
      bracketSide: true,
      winnerEntrantId: true,
      entrant1Id: true,
      entrant2Id: true,
      tournament: { select: { bracketType: true } },
    },
  });
  if (!match || !match.winnerEntrantId) return;

  const bracketType = match.tournament.bracketType;

  if (bracketType === "round_robin" || bracketType === "ffa" || bracketType === "swiss") {
    await checkTournamentComplete(match.tournamentId);
    return;
  }

  // For double elim: advance winner in their bracket side, send loser to losers bracket
  if (bracketType === "double_elim" && match.bracketSide === "winners") {
    // Advance winner in winners bracket
    await advanceWinnerToNextRound(
      match.tournamentId,
      match.round,
      match.matchNumber,
      match.winnerEntrantId
    );

    // Send loser to losers bracket
    const loserId = match.winnerEntrantId === match.entrant1Id
      ? match.entrant2Id
      : match.entrant1Id;
    if (loserId) {
      await sendToLosersBracket(match.tournamentId, match.round, match.matchNumber, loserId);
    }
    return;
  }

  if (bracketType === "double_elim" && match.bracketSide === "losers") {
    // Advance within losers bracket
    await advanceInLosersBracket(match.tournamentId, match.round, match.matchNumber, match.winnerEntrantId);
    return;
  }

  // For constellation: winner advances in winners, loser goes to consolation
  if (bracketType === "constellation" && match.bracketSide === "winners") {
    await advanceWinnerToNextRound(
      match.tournamentId,
      match.round,
      match.matchNumber,
      match.winnerEntrantId
    );

    const loserId = match.winnerEntrantId === match.entrant1Id
      ? match.entrant2Id
      : match.entrant1Id;
    if (loserId) {
      await sendToConsolationBracket(match.tournamentId, match.round, loserId);
    }
    return;
  }

  // Default: single elim advancement
  await advanceWinnerToNextRound(
    match.tournamentId,
    match.round,
    match.matchNumber,
    match.winnerEntrantId
  );
}

async function advanceWinnerToNextRound(
  tournamentId: string,
  round: number,
  matchNumber: number,
  winnerEntrantId: string
) {
  const nextRound = round + 1;
  const nextMatchNumber = Math.ceil(matchNumber / 2);
  const isFirstInPair = matchNumber % 2 === 1;

  const nextMatch = await prisma.tournamentMatch.findFirst({
    where: { tournamentId, round: nextRound, matchNumber: nextMatchNumber },
  });

  if (nextMatch) {
    await prisma.tournamentMatch.update({
      where: { id: nextMatch.id },
      data: isFirstInPair
        ? { entrant1Id: winnerEntrantId }
        : { entrant2Id: winnerEntrantId },
    });
  } else {
    // This was the final match — tournament complete
    await checkTournamentComplete(tournamentId);
  }
}

async function sendToLosersBracket(
  tournamentId: string,
  winnersRound: number,
  matchNumber: number,
  loserEntrantId: string
) {
  // Find the corresponding losers bracket match to place the loser into
  // Losers from winners round R go to losers "drop-in" rounds
  const losersMatches = await prisma.tournamentMatch.findMany({
    where: {
      tournamentId,
      bracketSide: "losers",
      OR: [
        { entrant1Id: null },
        { entrant2Id: null },
      ],
    },
    orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
  });

  // Place in first available losers slot
  for (const lm of losersMatches) {
    if (!lm.entrant1Id) {
      await prisma.tournamentMatch.update({
        where: { id: lm.id },
        data: { entrant1Id: loserEntrantId },
      });
      return;
    }
    if (!lm.entrant2Id) {
      await prisma.tournamentMatch.update({
        where: { id: lm.id },
        data: { entrant2Id: loserEntrantId },
      });
      return;
    }
  }
}

async function advanceInLosersBracket(
  tournamentId: string,
  round: number,
  matchNumber: number,
  winnerEntrantId: string
) {
  // Find the next losers match
  const nextMatch = await prisma.tournamentMatch.findFirst({
    where: {
      tournamentId,
      bracketSide: "losers",
      round: { gt: round },
      OR: [
        { entrant1Id: null },
        { entrant2Id: null },
      ],
    },
    orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
  });

  if (nextMatch) {
    if (!nextMatch.entrant1Id) {
      await prisma.tournamentMatch.update({
        where: { id: nextMatch.id },
        data: { entrant1Id: winnerEntrantId },
      });
    } else if (!nextMatch.entrant2Id) {
      await prisma.tournamentMatch.update({
        where: { id: nextMatch.id },
        data: { entrant2Id: winnerEntrantId },
      });
    }
  } else {
    // Losers bracket final winner goes to grand finals
    const grandFinal = await prisma.tournamentMatch.findFirst({
      where: {
        tournamentId,
        bracketSide: "winners",
        entrant2Id: null,
      },
      orderBy: { round: "desc" },
    });

    if (grandFinal) {
      await prisma.tournamentMatch.update({
        where: { id: grandFinal.id },
        data: { entrant2Id: winnerEntrantId },
      });
    } else {
      await checkTournamentComplete(tournamentId);
    }
  }
}

async function sendToConsolationBracket(
  tournamentId: string,
  winnersRound: number,
  loserEntrantId: string
) {
  // Find consolation matches (losers side) with an open slot
  const consolationMatches = await prisma.tournamentMatch.findMany({
    where: {
      tournamentId,
      bracketSide: "losers",
      OR: [
        { entrant1Id: null },
        { entrant2Id: null },
      ],
    },
    orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
  });

  for (const cm of consolationMatches) {
    if (!cm.entrant1Id) {
      await prisma.tournamentMatch.update({
        where: { id: cm.id },
        data: { entrant1Id: loserEntrantId },
      });
      return;
    }
    if (!cm.entrant2Id) {
      await prisma.tournamentMatch.update({
        where: { id: cm.id },
        data: { entrant2Id: loserEntrantId },
      });
      return;
    }
  }
}

async function checkTournamentComplete(tournamentId: string) {
  const pendingMatches = await prisma.tournamentMatch.count({
    where: {
      tournamentId,
      status: { in: ["pending", "in_progress"] },
    },
  });

  if (pendingMatches === 0) {
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: "completed" },
    });
  }
}

// ─── Helper: convert rank string to numeric value ────────────────────

// ─── Register Persistent Team ─────────────────────────────────────────

export async function registerPersistentTeam(
  tournamentId: string,
  persistentTeamId: string
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Not authenticated" };

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { entrants: true, teams: true },
  });
  if (!tournament) return { error: "Tournament not found" };
  if (tournament.format !== "team") return { error: "Not a team tournament" };
  if (!["draft", "open"].includes(tournament.status)) {
    return { error: "Tournament is not accepting registrations" };
  }

  const persistentTeam = await prisma.team.findUnique({
    where: { id: persistentTeamId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, gamertag: true } } },
      },
    },
  });
  if (!persistentTeam || !persistentTeam.isActive) return { error: "Team not found" };

  // Only captain or admin can register a team
  const isAdminOrMod = session.user.isAdmin || session.user.isModerator || session.user.isOwner;
  if (persistentTeam.captainId !== session.user.id && !isAdminOrMod) {
    return { error: "Only the team captain can register for tournaments" };
  }

  // Check game matches
  if (persistentTeam.game !== tournament.game) {
    return { error: `This team is for ${persistentTeam.game}, but the tournament is for ${tournament.game}` };
  }

  // Check team size matches tournament team size
  if (tournament.teamSize && persistentTeam.members.length < tournament.teamSize) {
    return { error: `Team needs at least ${tournament.teamSize} members (currently ${persistentTeam.members.length})` };
  }

  // Check if team already registered
  const alreadyRegistered = tournament.teams.some((t) => t.persistentTeamId === persistentTeamId);
  if (alreadyRegistered) return { error: "Team is already registered" };

  // Check slot limit
  const currentTeamCount = tournament.teams.length;
  if (currentTeamCount >= tournament.maxSlots) return { error: "Tournament is full" };

  // Check if any team members are already in another team in this tournament
  const memberUserIds = persistentTeam.members.map((m) => m.userId);
  const existingEntrants = tournament.entrants.filter(
    (e) => e.userId && memberUserIds.includes(e.userId)
  );
  if (existingEntrants.length > 0) {
    return { error: "One or more team members are already in this tournament" };
  }

  const captain = persistentTeam.members.find((m) => m.role === "captain");

  try {
    // Snapshot: create TournamentTeam linked to persistent team
    const tournamentTeam = await prisma.tournamentTeam.create({
      data: {
        tournamentId,
        name: `[${persistentTeam.tag}] ${persistentTeam.name}`,
        captainId: captain?.userId || persistentTeam.captainId,
        persistentTeamId,
        members: {
          create: persistentTeam.members.map((m) => ({
            userId: m.userId,
          })),
        },
      },
    });

    // Create team entrant
    await prisma.tournamentEntrant.create({
      data: {
        tournamentId,
        type: "team",
        teamId: tournamentTeam.id,
        displayName: `[${persistentTeam.tag}] ${persistentTeam.name}`,
      },
    });

    revalidatePath("/schedule");
    revalidatePath(`/teams/${persistentTeamId}`);
    return { success: true };
  } catch {
    return { error: "Failed to register team" };
  }
}

// ─── Get Open Tournaments for a Game ────────────────────────────────

export async function getOpenTournamentsForGame(game: string) {
  const tournaments = await prisma.tournament.findMany({
    where: {
      game,
      format: "team",
      status: { in: ["draft", "open"] },
    },
    select: {
      id: true,
      title: true,
      status: true,
      maxSlots: true,
      teamSize: true,
      bracketType: true,
      _count: { select: { teams: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return tournaments.map((t) => ({
    ...t,
    currentTeamCount: t._count.teams,
  }));
}

// ─── Helper: convert rank string to numeric value ────────────────────

function rankToNumeric(rank: string | undefined): number {
  if (!rank) return 0;

  // Simple heuristic: map rank tiers to numeric values
  const tierValues: Record<string, number> = {
    // Low tiers
    iron: 100, tin: 100, herald: 100, combatant: 100, beginner: 100,
    bronze: 200,
    silver: 300,
    gold: 400, casual: 400,
    platinum: 500, intermediate: 500, archon: 500,
    diamond: 600, legend: 600, advanced: 600,
    // High tiers
    master: 700, ancient: 700, champion: 700, emerald: 700, expert: 700,
    grandmaster: 800, divine: 800, onyx: 800, "grand champ": 800,
    challenger: 900, immortal: 900, radiant: 900, ssl: 900, gladiator: 900,
    "global elite": 1000, "one above all": 1000, eternity: 950, celestial: 850,
  };

  const lower = rank.toLowerCase();
  for (const [tier, value] of Object.entries(tierValues)) {
    if (lower.includes(tier)) {
      // Add sub-rank value (e.g., "Gold 3" > "Gold 1")
      const numMatch = lower.match(/(\d+)/);
      const subValue = numMatch ? parseInt(numMatch[1]) : 0;
      return value + subValue;
    }
  }

  return 0;
}
