// Bracket generation utilities

export interface BracketEntrant {
  id: string;
  displayName: string;
  seed: number | null;
  rankValue?: number; // numeric rank for seeding comparisons
}

export interface GeneratedMatch {
  round: number;
  matchNumber: number;
  bracketSide?: "winners" | "losers";
  entrant1Index?: number; // index into seeded entrants array
  entrant2Index?: number;
  status: "pending" | "bye";
}

/**
 * Get the next power of 2 >= n
 */
export function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/**
 * Calculate total rounds needed for single elimination
 */
export function calcRounds(slotCount: number): number {
  return Math.ceil(Math.log2(slotCount));
}

/**
 * Seed entrants based on seeding mode.
 * Returns a new array with seed values assigned.
 */
export function seedEntrants(
  entrants: BracketEntrant[],
  mode: "random" | "ranked" | "random_constrained"
): BracketEntrant[] {
  const copy = [...entrants];

  if (mode === "random") {
    // Fisher-Yates shuffle
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.map((e, i) => ({ ...e, seed: i + 1 }));
  }

  if (mode === "ranked") {
    // Sort by rankValue descending (highest rank = seed 1)
    copy.sort((a, b) => (b.rankValue ?? 0) - (a.rankValue ?? 0));
    return copy.map((e, i) => ({ ...e, seed: i + 1 }));
  }

  // random_constrained: rank-seed but add randomness within tiers
  // Top quarter are "top seeds" and won't face each other in round 1
  copy.sort((a, b) => (b.rankValue ?? 0) - (a.rankValue ?? 0));
  const seeded = copy.map((e, i) => ({ ...e, seed: i + 1 }));

  // Shuffle within halves to add variety but keep top vs bottom structure
  const half = Math.ceil(seeded.length / 2);
  const topHalf = seeded.slice(0, half);
  const bottomHalf = seeded.slice(half);
  shuffleArray(topHalf);
  shuffleArray(bottomHalf);

  // Interleave: top seed faces bottom seed
  const result: BracketEntrant[] = [];
  for (let i = 0; i < Math.max(topHalf.length, bottomHalf.length); i++) {
    if (topHalf[i]) result.push(topHalf[i]);
    if (bottomHalf[i]) result.push(bottomHalf[i]);
  }

  return result.map((e, i) => ({ ...e, seed: i + 1 }));
}

function shuffleArray<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/**
 * Generate single elimination bracket matches.
 * Returns matches for round 1 only (later rounds are created as winners advance).
 */
export function generateSingleElimMatches(entrantCount: number): GeneratedMatch[] {
  const bracketSize = nextPowerOf2(entrantCount);
  const matches: GeneratedMatch[] = [];

  const round1MatchCount = bracketSize / 2;

  for (let i = 0; i < round1MatchCount; i++) {
    const e1Index = i * 2;
    const e2Index = i * 2 + 1;
    const isBye = e2Index >= entrantCount;

    matches.push({
      round: 1,
      matchNumber: i + 1,
      entrant1Index: e1Index < entrantCount ? e1Index : undefined,
      entrant2Index: !isBye ? e2Index : undefined,
      status: isBye ? "bye" : "pending",
    });
  }

  // Pre-create empty matches for later rounds
  let matchesInRound = round1MatchCount / 2;
  let round = 2;
  while (matchesInRound >= 1) {
    for (let i = 0; i < matchesInRound; i++) {
      matches.push({
        round,
        matchNumber: i + 1,
        status: "pending",
      });
    }
    matchesInRound /= 2;
    round++;
  }

  return matches;
}

/**
 * Generate round robin matches (every entrant plays every other).
 */
export function generateRoundRobinMatches(entrantCount: number): GeneratedMatch[] {
  const matches: GeneratedMatch[] = [];
  let matchNum = 1;

  // Use circle method for round robin scheduling
  const n = entrantCount % 2 === 0 ? entrantCount : entrantCount + 1; // add phantom if odd
  const rounds = n - 1;

  for (let round = 1; round <= rounds; round++) {
    const roundMatches = n / 2;
    for (let match = 0; match < roundMatches; match++) {
      let home: number, away: number;
      if (match === 0) {
        home = 0;
        away = n - round;
      } else {
        home = (n - round + match) % (n - 1);
        away = (n - round - match + n - 1) % (n - 1);
      }

      // Skip matches involving the phantom player
      if (home >= entrantCount || away >= entrantCount) continue;

      matches.push({
        round,
        matchNumber: matchNum++,
        entrant1Index: home,
        entrant2Index: away,
        status: "pending",
      });
    }
  }

  return matches;
}

/**
 * Generate double elimination bracket matches.
 * Winners bracket + losers bracket + grand finals.
 */
export function generateDoubleElimMatches(entrantCount: number): GeneratedMatch[] {
  const bracketSize = nextPowerOf2(entrantCount);
  const matches: GeneratedMatch[] = [];

  // --- Winners bracket (same as single elim) ---
  const round1MatchCount = bracketSize / 2;

  for (let i = 0; i < round1MatchCount; i++) {
    const e1Index = i * 2;
    const e2Index = i * 2 + 1;
    const isBye = e2Index >= entrantCount;

    matches.push({
      round: 1,
      matchNumber: i + 1,
      bracketSide: "winners",
      entrant1Index: e1Index < entrantCount ? e1Index : undefined,
      entrant2Index: !isBye ? e2Index : undefined,
      status: isBye ? "bye" : "pending",
    });
  }

  // Pre-create winners bracket rounds
  let matchesInRound = round1MatchCount / 2;
  let wRound = 2;
  const winnersRounds = calcRounds(bracketSize);
  while (wRound <= winnersRounds) {
    for (let i = 0; i < matchesInRound; i++) {
      matches.push({
        round: wRound,
        matchNumber: i + 1,
        bracketSide: "winners",
        status: "pending",
      });
    }
    matchesInRound = Math.max(1, matchesInRound / 2);
    wRound++;
  }

  // --- Losers bracket ---
  // Losers bracket has roughly 2*(winnersRounds-1) rounds
  // Each pair of losers rounds: first round drops in losers from winners, second round plays within losers
  const losersRoundCount = (winnersRounds - 1) * 2;
  let losersMatchCount = round1MatchCount / 2; // first losers round

  for (let lr = 1; lr <= losersRoundCount; lr++) {
    const isDropInRound = lr % 2 === 1; // odd rounds receive losers from winners bracket
    const matchCount = isDropInRound ? losersMatchCount : losersMatchCount;

    for (let i = 0; i < matchCount; i++) {
      matches.push({
        round: winnersRounds + lr, // offset losers rounds after winners
        matchNumber: i + 1,
        bracketSide: "losers",
        status: "pending",
      });
    }

    // After each pair of rounds, halve the match count
    if (!isDropInRound) {
      losersMatchCount = Math.max(1, losersMatchCount / 2);
    }
  }

  // --- Grand Finals ---
  matches.push({
    round: winnersRounds + losersRoundCount + 1,
    matchNumber: 1,
    bracketSide: "winners", // grand finals
    status: "pending",
  });

  return matches;
}

/**
 * Generate Swiss system matches for a given round.
 * Swiss pairs entrants with similar records.
 * Only generates round 1 initially — subsequent rounds are generated after results.
 */
export function generateSwissRound1Matches(entrantCount: number): GeneratedMatch[] {
  const matches: GeneratedMatch[] = [];
  const pairCount = Math.floor(entrantCount / 2);

  for (let i = 0; i < pairCount; i++) {
    matches.push({
      round: 1,
      matchNumber: i + 1,
      entrant1Index: i * 2,
      entrant2Index: i * 2 + 1,
      status: "pending",
    });
  }

  return matches;
}

/**
 * Generate constellation bracket matches.
 * Primary bracket is single elim. Losers from each round drop into
 * a consolation bracket where they continue playing for placement.
 */
export function generateConstellationMatches(entrantCount: number): GeneratedMatch[] {
  // Primary bracket = single elim
  const primaryMatches = generateSingleElimMatches(entrantCount);

  // Mark all primary matches as winners side
  for (const m of primaryMatches) {
    m.bracketSide = "winners";
  }

  // Consolation brackets: losers from round N play each other
  const bracketSize = nextPowerOf2(entrantCount);
  const totalRounds = calcRounds(bracketSize);
  const allMatches = [...primaryMatches];

  // For each winners round (except the final), create a consolation round
  let consolationMatchNum = 1;
  for (let r = 1; r < totalRounds; r++) {
    const losersFromRound = primaryMatches.filter(
      (m) => m.round === r && m.bracketSide === "winners"
    ).length;
    const consolationMatches = Math.floor(losersFromRound / 2);

    for (let i = 0; i < consolationMatches; i++) {
      allMatches.push({
        round: totalRounds + r, // offset after primary bracket
        matchNumber: consolationMatchNum++,
        bracketSide: "losers",
        status: "pending",
      });
    }
  }

  return allMatches;
}

/**
 * Generate FFA (free-for-all) round structure.
 * Creates round placeholders — scoring is point-based, not match-based.
 * Each "match" represents one entrant's score entry for that round.
 */
export function generateFFARounds(entrantCount: number, roundCount: number = 3): GeneratedMatch[] {
  const matches: GeneratedMatch[] = [];

  for (let round = 1; round <= roundCount; round++) {
    // One "match" entry per entrant per round for score tracking
    for (let i = 0; i < entrantCount; i++) {
      matches.push({
        round,
        matchNumber: i + 1,
        entrant1Index: i,
        status: "pending",
      });
    }
  }

  return matches;
}

/**
 * Get the display label for a round in the bracket.
 */
export function getRoundLabel(round: number, totalRounds: number, bracketType: string, bracketSide?: string | null): string {
  if (bracketType === "round_robin" || bracketType === "swiss" || bracketType === "ffa") {
    return `Round ${round}`;
  }

  if (bracketType === "double_elim" && bracketSide === "losers") {
    return `Losers R${round}`;
  }

  if (bracketType === "constellation" && bracketSide === "losers") {
    return `Consolation ${round}`;
  }

  if (round === totalRounds) return "Finals";
  if (round === totalRounds - 1) return "Semifinals";
  if (round === totalRounds - 2) return "Quarterfinals";
  return `Round ${round}`;
}

/**
 * Calculate prize pool from buy-in and slots.
 */
export function calculatePrizePool(buyIn: number | null | undefined, slots: number): number | null {
  if (!buyIn || buyIn <= 0) return null;
  return buyIn * slots;
}

/**
 * Generate a Discord-friendly text representation of a tournament bracket.
 */
export function generateDiscordText(tournament: {
  title: string;
  bracketType: string;
  bestOf: number;
  format: string;
  entrants: { displayName: string; seed: number | null }[];
  matches: {
    round: number;
    matchNumber: number;
    entrant1?: { displayName: string } | null;
    entrant2?: { displayName: string } | null;
    winner?: { displayName: string } | null;
    score1?: number | null;
    score2?: number | null;
    status: string;
  }[];
}): string {
  const bracketLabel =
    tournament.bracketType === "single_elim" ? "Single Elimination"
    : tournament.bracketType === "double_elim" ? "Double Elimination"
    : tournament.bracketType === "round_robin" ? "Round Robin"
    : tournament.bracketType === "swiss" ? "Swiss"
    : tournament.bracketType === "constellation" ? "Constellation"
    : "Free-for-All";

  const lines: string[] = [
    `** ${tournament.title} **`,
    `${bracketLabel} | Best of ${tournament.bestOf} | ${tournament.format === "team" ? "Teams" : "Solo"}`,
    "",
  ];

  // Group matches by round
  const rounds = new Map<number, typeof tournament.matches>();
  for (const m of tournament.matches) {
    if (!rounds.has(m.round)) rounds.set(m.round, []);
    rounds.get(m.round)!.push(m);
  }

  for (const [round, roundMatches] of rounds) {
    lines.push(`--- Round ${round} ---`);
    for (const m of roundMatches) {
      const e1 = m.entrant1?.displayName ?? "TBD";
      const e2 = m.entrant2?.displayName ?? "TBD";
      if (m.status === "completed" && m.score1 != null && m.score2 != null) {
        const winMarker1 = m.winner?.displayName === m.entrant1?.displayName ? " (W)" : "";
        const winMarker2 = m.winner?.displayName === m.entrant2?.displayName ? " (W)" : "";
        lines.push(`  ${e1}${winMarker1} ${m.score1} - ${m.score2} ${e2}${winMarker2}`);
      } else if (m.status === "bye") {
        lines.push(`  ${e1} — BYE`);
      } else {
        lines.push(`  ${e1} vs ${e2}`);
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}
