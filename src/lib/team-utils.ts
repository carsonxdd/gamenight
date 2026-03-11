// Team tag utilities for displaying [TAG] next to player names

export interface TeamTagEntry {
  tag: string;
  game: string;
  teamId: string;
  teamName: string;
}

// Map from userId to their team tag entries
export type TeamTagMap = Record<string, TeamTagEntry[]>;

/**
 * Format a player name with their team tag for a specific game context.
 * Returns "[TAG] Name" if they have a team for that game, otherwise just "Name".
 */
export function formatWithTag(
  name: string,
  userId: string,
  tagMap: TeamTagMap,
  gameContext?: string
): string {
  const entries = tagMap[userId];
  if (!entries || entries.length === 0) return name;

  if (gameContext) {
    const match = entries.find((e) => e.game === gameContext);
    if (match) return `[${match.tag}] ${name}`;
    return name;
  }

  // No game context — use first team tag (e.g., member list)
  return `[${entries[0].tag}] ${name}`;
}

/**
 * Get all team tags for a user (for displaying multiple badges).
 */
export function getTagsForUser(userId: string, tagMap: TeamTagMap): TeamTagEntry[] {
  return tagMap[userId] || [];
}
